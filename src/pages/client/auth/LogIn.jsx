import React, { useState, useEffect, useContext } from 'react';
import { IoArrowForward } from 'react-icons/io5';
import HalloweenAuthDialog from './HalloweenAuthDialog';
import HalloweenField from './HalloweenField';
import PasswordRecoveryForm from './PasswordRecoveryForm';
import { FcGoogle } from 'react-icons/fc';
import Swal from 'sweetalert2';
import { SECURE_ACCOUNTS_ENABLED, accountSession } from '../../../services/accountService';
import Logo5 from '../../../assets/Logo5.png';
import { UserContext } from '../../../contexts/UserProvider';
import { AuthContext } from '../../../contexts/AuthProvider';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, googleProvider, db } from '../../../config/firebaseConfig';
import { ROLES } from '../../../utils/Constants';
import { addDocument, updateDocument } from '../../../services/firebaseService';

const showAuthSuccessToast = (customer, message = 'Đăng nhập thành công') => {
    const avatar = customer.avatarUrl || customer.imgUrl || Logo5;
    const name = customer.name || customer.displayName || 'Người dùng';
    
    Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: 'transparent',
        html: `
            <div style="display: flex; align-items: center; gap: 14px; text-align: left;">
                <div style="position: relative; flex-shrink: 0;">
                    <img src="${avatar}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #eab308; box-shadow: 0 0 15px rgba(234,179,8,0.4);" />
                    <span style="position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; background-color: #10b981; border-radius: 50%; border: 2px solid #0f172a;"></span>
                </div>
                <div style="display: flex; flex-direction: column; overflow: hidden; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 10px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: #eab308; background: rgba(234, 179, 8, 0.15); padding: 2px 8px; border-radius: 9999px; border: 1px solid rgba(234, 179, 8, 0.3);">
                            ${message}
                        </span>
                    </div>
                    <span style="font-size: 14px; font-weight: 700; color: #ffffff; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 190px;">
                        ${name}
                    </span>
                    <span style="font-size: 11px; color: #94a3b8;">
                        Chào mừng bạn đến với MFILM!
                    </span>
                </div>
            </div>
        `,
        customClass: {
            popup: 'swal2-toast-mfilm'
        },
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
};

function LogIn({ openLogin, handleCloseLogin, handleOpenRegister }) {
    const users = useContext(UserContext);
    const { loginByUser } = useContext(AuthContext);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [recovering, setRecovering] = useState(false);

    useEffect(() => {
        if (!openLogin) {
            setFormData({
                email: '',
                password: ''
            });
            setErrors({});
            setSubmitting(false);
            setRecovering(false);
            setLoadingGoogle(false);
        }
    }, [openLogin]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validation = () => {
        let newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return true;
        }

        return false;
    };

    const handleLogin = async () => {
        if (validation()) return;

        if (SECURE_ACCOUNTS_ENABLED) {
            try {
                const session = await accountSession('login', formData);
                loginByUser(session.user, session.firebaseUser);
                handleCloseLogin();
                showAuthSuccessToast(session.user);
            } catch (error) { setErrors({ email: error.status === 401 ? 'Tài khoản hoặc mật khẩu không chính xác' : 'Chưa thể đăng nhập, vui lòng thử lại.' }); }
            return;
        }
        const userLogin = users.find((e) => e.email?.trim().toLowerCase() === formData.email.trim().toLowerCase() && e.password === formData.password);
        
        if (userLogin) {
            // Establish verified Firebase Auth session so the user gets personalized
            // recommendations via Bearer token (auth.currentUser will be set).
            // Silently provision if the Firebase Auth account does not exist yet.
            let fbUser = null;
            try {
                const cred = await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
                fbUser = cred.user;
            } catch (fbErr) {
                if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/invalid-email') {
                    // Auto-provision Firebase Auth account using existing Firestore credentials
                    try {
                        const newCred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
                        fbUser = newCred.user;
                    } catch {
                        // Firebase Auth provision failed — login still works via Firestore session
                    }
                }
            }
            const activeFbUser = fbUser || auth.currentUser;
            if (activeFbUser) {
                try {
                    await activeFbUser.getIdToken();
                } catch {
                    // Non-fatal
                }
            }
            if (activeFbUser?.uid && userLogin?.id) {
                userLogin.firebaseUid = activeFbUser.uid;
                updateDocument('Users', { id: userLogin.id, firebaseUid: activeFbUser.uid }).catch(() => {});
            }
            loginByUser(userLogin, activeFbUser);
            handleCloseLogin();
            showAuthSuccessToast(userLogin, 'Đăng nhập thành công');
        } else {
            setErrors({ email: 'Tài khoản hoặc mật khẩu không chính xác' });
        }
    };

    const signInWithGoogle = async () => {
        if (loadingGoogle) return;
        setLoadingGoogle(true);
        try {
            let user = null;
            try {
                const result = await signInWithPopup(auth, googleProvider);
                user = result?.user;
            } catch (popupError) {
                console.warn("Popup closed or handshake error, checking currentUser fallback:", popupError);
                if (auth.currentUser?.email) {
                    user = auth.currentUser;
                } else {
                    throw popupError;
                }
            }

            if (!user || !user.email) {
                throw new Error("Không thể lấy thông tin tài khoản Google.");
            }

            if (SECURE_ACCOUNTS_ENABLED) {
                const session = await accountSession('google', { token: await user.getIdToken() });
                loginByUser(session.user, session.firebaseUser);
                handleCloseLogin();
                showAuthSuccessToast(session.user);
                return;
            }
            const targetEmail = user.email.toLowerCase().trim();

            // 1. Kiểm tra trong UserContext
            let existingCustomer = users?.find(c => c.email?.toLowerCase().trim() === targetEmail);

            // 2. Nếu trong context chưa thấy, truy vấn trực tiếp Firestore
            if (!existingCustomer) {
                const q = query(collection(db, "Users"), where("email", "==", targetEmail));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    existingCustomer = { id: snap.docs[0].id, ...snap.docs[0].data() };
                }
            }

            let loggedInCustomer;
            if (!existingCustomer) {
                const newCustomer = {
                    name: user.displayName || targetEmail.split('@')[0] || 'Người dùng',
                    avatarUrl: user.photoURL || '',
                    imgUrl: user.photoURL || '',
                    role: ROLES.USER,
                    email: targetEmail
                };
                const userNew = await addDocument('Users', newCustomer);
                loggedInCustomer = userNew;
            } else {
                if (!existingCustomer.avatarUrl && user.photoURL) {
                    existingCustomer.avatarUrl = user.photoURL;
                    updateDocument('Users', { id: existingCustomer.id, avatarUrl: user.photoURL }).catch(() => {});
                }
                loggedInCustomer = existingCustomer;
            }

            if (user?.uid && loggedInCustomer?.id) {
                loggedInCustomer.firebaseUid = user.uid;
                updateDocument('Users', { id: loggedInCustomer.id, firebaseUid: user.uid }).catch(() => {});
            }

            // Đăng nhập và đóng modal ngay lập tức không delay
            loginByUser(loggedInCustomer, user);
            handleCloseLogin();
            showAuthSuccessToast(loggedInCustomer, 'Đăng nhập thành công');

        } catch (error) {
            console.error("Google sign-in error:", error);
            if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3500,
                    timerProgressBar: true,
                    background: 'rgba(15, 23, 42, 0.95)',
                    color: '#fff',
                    html: `
                        <div style="display: flex; align-items: center; gap: 10px; text-align: left;">
                            <span style="color: #ef4444; font-size: 20px;">⚠️</span>
                            <div>
                                <h4 style="font-size: 13px; font-weight: 700; color: #ef4444; margin: 0;">Đăng nhập thất bại</h4>
                                <p style="font-size: 11px; color: #94a3b8; margin: 2px 0 0;">${error.message || 'Vui lòng thử lại.'}</p>
                            </div>
                        </div>
                    `,
                    customClass: { popup: 'swal2-toast-mfilm' }
                });
            }
        } finally {
            setLoadingGoogle(false);
        }
    };

    return (
        <HalloweenAuthDialog open={openLogin} onClose={handleCloseLogin}>
            {recovering ? <PasswordRecoveryForm initialEmail={formData.email} onBack={email => {
                setFormData({ email, password: '' }); setErrors({}); setRecovering(false);
            }} /> : <>
            <p className="mfilm-auth-eyebrow">CHÀO MỪNG TRỞ LẠI</p>
            <h1 id="mfilm-login-title">Đăng nhập</h1>
            <p className="mfilm-auth-intro">Chưa có tài khoản? <button type="button" className="text-action" onClick={handleOpenRegister}>Đăng ký ngay</button></p>
            <form method="post" noValidate onSubmit={async event => {
                event.preventDefault();
                if (submitting || loadingGoogle) return;
                setSubmitting(true);
                try { await handleLogin(); } finally { setSubmitting(false); }
            }}>
                <HalloweenField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} autoComplete="username" owl />
                <HalloweenField label="Mật khẩu" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} autoComplete="current-password" />
                <button type="button" className="text-action forgot" disabled={submitting || loadingGoogle} onClick={() => setRecovering(true)}>Quên mật khẩu?</button>
                <button type="submit" className="submit" disabled={submitting || loadingGoogle}>{submitting ? 'Đang đăng nhập...' : 'Đăng nhập'} <IoArrowForward size={17} /></button>
                <div className="mfilm-auth-divider">hoặc tiếp tục với</div>
                <button type="button" className="mfilm-auth-google" onClick={signInWithGoogle} disabled={loadingGoogle || submitting}>
                    <FcGoogle size={20} /> {loadingGoogle ? 'Đang xử lý đăng nhập...' : 'Đăng nhập với Google'}
                </button>
            </form>
            <p className="mfilm-auth-note">Lưu phim yêu thích · Đồng bộ xem tiếp · Khám phá theo gu</p>
            </>}
        </HalloweenAuthDialog>
    );
}

export default LogIn;
