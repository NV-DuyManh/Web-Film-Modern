import { useEffect, useRef, useState } from 'react';
import { IoArrowBack, IoArrowForward, IoCheckmark, IoCheckmarkCircleOutline, IoAlertCircleOutline, IoMailOutline, IoShieldCheckmarkOutline, IoTimeOutline, IoReloadOutline } from 'react-icons/io5';
import HalloweenField from './HalloweenField';
import { passwordRecoveryRequest } from '../../../services/passwordRecoveryService';
import './PasswordRecovery.css';

function RecoveryNotice({ kind = 'info', title, children }) {
    const Icon = kind === 'error' || kind === 'warning' ? IoAlertCircleOutline : IoMailOutline;
    return <div className={`mfilm-recovery-notice is-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
        <Icon className="recovery-notice-icon" size={21} aria-hidden="true" />
        <div><strong>{title}</strong><p>{children}</p></div>
    </div>;
}

function messageFor(error) {
    if (error.status === 429) return 'Bạn thao tác quá nhanh hoặc đã thử nhiều lần. Vui lòng đợi rồi thử lại.';
    if (error.message === 'INVALID_EMAIL') return 'Vui lòng nhập email hợp lệ.';
    if (error.message === 'INVALID_CODE') return 'Mã không đúng, đã hết hạn hoặc đã nhập sai 5 lần. Hãy kiểm tra mã mới nhất hoặc gửi lại mã.';
    if (error.message === 'INVALID_RESET') return 'Phiên xác thực đã hết hạn hoặc đã được sử dụng. Vui lòng nhận mã mới.';
    if (error.message === 'INVALID_PASSWORD') return 'Mật khẩu cần từ 8 đến 256 ký tự.';
    return 'Chưa thể gửi mã hoặc đổi mật khẩu lúc này. Vui lòng thử lại sau.';
}

export default function PasswordRecoveryForm({ initialEmail = '', onBack }) {
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState(initialEmail);
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [challenge, setChallenge] = useState(null);
    const [grant, setGrant] = useState('');
    const [busy, setBusy] = useState(false);
    const [available, setAvailable] = useState(null);
    const [error, setError] = useState('');
    const [retryAt, setRetryAt] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const controller = useRef(null);
    const heading = useRef(null);
    useEffect(() => {
        const status = new AbortController();
        passwordRecoveryRequest('status', {}, status.signal).then(data => setAvailable(data.available))
            .catch(e => { if (e.name !== 'AbortError') setAvailable(false); });
        return () => { status.abort(); controller.current?.abort(); };
    }, []);
    useEffect(() => { heading.current?.focus(); }, [step]);
    useEffect(() => {
        if (step !== 'code' || !retryAt) return;
        const tick = () => setSeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
        tick();
        const timer = window.setInterval(tick, 1000);
        return () => window.clearInterval(timer);
    }, [step, retryAt]);
    const call = async (action, values) => {
        controller.current?.abort();
        controller.current = new AbortController();
        return passwordRecoveryRequest(action, values, controller.current.signal);
    };
    const send = async () => {
        const normalized = email.trim().toLowerCase();
        if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
            setError('Vui lòng nhập email hợp lệ.'); return;
        }
        const next = await call('request', { email: normalized });
        setEmail(normalized); setChallenge(next); setCode(''); setGrant('');
        setRetryAt(Date.now() + next.retryAfter * 1000); setSeconds(next.retryAfter); setStep('code');
    };
    const perform = async action => {
        if (busy) return;
        setBusy(true); setError('');
        try { await action(); }
        catch (e) {
            if (e.name !== 'AbortError') {
                setError(messageFor(e));
                if (e.message === 'INVALID_RESET') { setGrant(''); setPassword(''); setConfirmPassword(''); setStep('email'); }
            }
        } finally { setBusy(false); }
    };
    const submit = event => {
        event.preventDefault();
        perform(async () => {
            if (step === 'email') { await send(); return; }
            if (step === 'code') {
                if (!/^\d{6}$/.test(code)) { setError('Vui lòng nhập đủ 6 chữ số trong email.'); return; }
                const result = await call('verify', { email, challengeId: challenge.challengeId, code });
                setGrant(result.resetToken); setCode(''); setStep('password'); return;
            }
            if (step === 'password') {
                if (password.length < 8 || password.length > 256) { setError('Mật khẩu cần từ 8 đến 256 ký tự.'); return; }
                if (password !== confirmPassword) { setError('Hai mật khẩu chưa khớp nhau.'); return; }
                await call('reset', { email, challengeId: challenge.challengeId, resetToken: grant, newPassword: password });
                setPassword(''); setConfirmPassword(''); setGrant(''); setChallenge(null); setStep('done');
            }
        });
    };
    const titles = { email: 'Quên mật khẩu', code: 'Nhập mã xác thực', password: 'Đặt mật khẩu mới', done: 'Đổi mật khẩu thành công' };
    const stepIndex = ['email', 'code', 'password'].indexOf(step);
    return <div className={`mfilm-recovery ${step === 'done' ? 'is-complete' : ''}`}>
        {step === 'done' && <div className="recovery-success-mark" aria-hidden="true"><IoCheckmark size={39} /></div>}
        <p className="mfilm-auth-eyebrow">{step === 'done' ? 'XÁC THỰC HOÀN TẤT' : 'KHÔI PHỤC TÀI KHOẢN'}</p>
        <h1 ref={heading} tabIndex={-1} id="mfilm-login-title">{step === 'done' ? <>Đổi mật khẩu<br />thành công</> : titles[step]}</h1>
        {step !== 'done' && <ol className="mfilm-recovery-steps" aria-label="Các bước khôi phục">
            {['Email', 'Xác thực', 'Mật khẩu mới'].map((label, index) => <li key={label} className={index < stepIndex ? 'is-finished' : ''} aria-current={index === stepIndex ? 'step' : undefined}><span>{index < stepIndex ? <IoCheckmark aria-hidden="true" /> : index + 1}</span>{label}</li>)}
        </ol>}
        {step === 'email' && <p className="mfilm-auth-intro">Nhập email đã đăng ký MFilm để nhận mã xác thực gồm 6 số.</p>}
        {step === 'code' && <>
            <RecoveryNotice title="Kiểm tra hộp thư của bạn">Nếu email này có tài khoản dùng mật khẩu, mã xác thực sẽ được gửi đến:</RecoveryNotice>
            <div className="recovery-email-address"><IoMailOutline aria-hidden="true" /><span>{email}</span><button type="button" className="text-action" disabled={busy} onClick={() => { setStep('email'); setCode(''); setError(''); }}>Đổi email</button></div>
        </>}
        {step === 'password' && <p className="mfilm-auth-intro">Email đã được xác thực. Chọn mật khẩu mới có ít nhất 8 ký tự để tiếp tục sử dụng MFilm.</p>}
        {step === 'done' ? <div className="mfilm-recovery-success" role="status">
            <p>Đăng nhập lại bằng mật khẩu mới để tiếp tục xem phim và truy cập thư viện của bạn.</p>
            <div className="recovery-complete-account"><IoMailOutline size={20} aria-hidden="true" /><span>{email}</span><IoCheckmarkCircleOutline size={19} aria-hidden="true" /></div>
            <button className="submit" type="button" onClick={() => onBack(email)}>Đăng nhập ngay <IoArrowForward size={18} /></button>
        </div> : <form noValidate onSubmit={submit} aria-busy={busy}>
            {step === 'email' && <HalloweenField label="Email" name="recoveryEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" maxLength={254} disabled={busy} />}
            {step === 'code' && <>
                <HalloweenField label="Mã xác thực gồm 6 số" name="code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="000000" disabled={busy} />
                <p className="recovery-code-hint"><IoTimeOutline aria-hidden="true" /> Mã có hiệu lực trong 5 phút</p>
            </>}
            {step === 'password' && <>
                <HalloweenField label="Mật khẩu mới" name="newPassword" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" maxLength={256} disabled={busy} />
                <HalloweenField label="Nhập lại mật khẩu mới" name="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" maxLength={256} disabled={busy} />
            </>}
            {available === false && <RecoveryNotice kind="warning" title="Chưa thể gửi mã lúc này">Vui lòng thử lại sau. Nếu đã dùng Google trước đó, bạn vẫn có thể đăng nhập bằng Google.</RecoveryNotice>}
            {available === null && <p className="mfilm-auth-note" role="status">Đang kiểm tra dịch vụ gửi mã...</p>}
            {error && <RecoveryNotice kind="error" title="Chưa thể tiếp tục">{error}</RecoveryNotice>}
            <button className="submit" type="submit" disabled={busy || available !== true}>{busy ? <IoReloadOutline className="recovery-spinner" aria-hidden="true" size={18} /> : null}{busy ? 'Đang xử lý...' : step === 'email' ? 'Gửi mã xác thực' : step === 'code' ? 'Xác thực mã' : 'Lưu mật khẩu mới'} {!busy && <IoArrowForward size={17} />}</button>
            {step === 'code' && <div className="mfilm-recovery-resend">
                <span>Chưa nhận được mã?</span><button type="button" className="text-action" disabled={busy || seconds > 0} onClick={() => perform(send)}>{seconds > 0 ? `Gửi lại sau ${seconds}s` : 'Gửi lại mã'}</button>
            </div>}
            {step === 'email' && <p className="recovery-security-note"><IoShieldCheckmarkOutline aria-hidden="true" /> Mã xác thực chỉ dùng một lần và có hiệu lực 5 phút.</p>}
            {step === 'code' && <p className="recovery-security-note">Bạn nhớ kiểm tra cả mục thư rác nhé.</p>}
        </form>}
        {step !== 'done' && <button type="button" className="text-action mfilm-recovery-back" disabled={busy} onClick={() => onBack(email)}><IoArrowBack /> Về đăng nhập</button>}
    </div>;
}
