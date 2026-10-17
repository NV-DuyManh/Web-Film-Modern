import React, { useState, useEffect, useContext } from 'react';
import { IoArrowForward } from 'react-icons/io5';
import HalloweenAuthDialog from './HalloweenAuthDialog';
import HalloweenField from './HalloweenField';
import { FcGoogle } from 'react-icons/fc';
import Swal from 'sweetalert2';
import { SECURE_ACCOUNTS_ENABLED, accountSession } from '../../../services/accountService';
import Logo5 from '../../../assets/Logo5.png';
import { addDocument, updateDocument } from '../../../services/firebaseService';
import { UserContext } from '../../../contexts/UserProvider';
import { AuthContext } from '../../../contexts/AuthProvider';
import { ROLES } from '../../../utils/Constants';
import { signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, googleProvider, db } from '../../../config/firebaseConfig';

import useAuthSuccessToast from '../../../components/useAuthSuccessToast';

function Register({ openRegister, handleCloseRegister, handleOpenLogin }) {
    const showAuthSuccessToast = useAuthSuccessToast('Đăng ký thành công');
    const users = useContext(UserContext);
    const { loginByUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: '', role: ROLES.USER
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!openRegister) {
            setFormData({
                name: '', email: '', password: '', confirmPassword: '', role: ROLES.USER
            });
            setErrors({});
            setLoading(false);
            setLoadingGoogle(false);
        }
    }, [openRegister]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const validation = () => {
        let newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập tên hiển thị';
        if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email';
        if (!SECURE_ACCOUNTS_ENABLED && users.some(e => e.email == formData.email)) newErrors.email = 'Email đã được sử dụng';
        if (!formData.password) newErrors.password = 'Vui lòng nhập mật khẩu';
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu không khớp';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).some(e => e !== ""); // true co loi 
    };

    const addRegister = async () => {
        if (validation()) {
            return;
        }
        setLoading(true);
        try {
            if (SECURE_ACCOUNTS_ENABLED) {
                const session = await accountSession('register', formData);
                loginByUser(session.user, session.firebaseUser);
                handleCloseRegister();
                showAuthSuccessToast(session.user);
                return;
            }
            let fbCred;
            const submitData = { ...formData };
            delete submitData.confirmPassword;
            const newUser = await addDocument("Users", submitData);

            // Provision Firebase Auth account so the user gets a verified identity
            // for personalized recommendations from their first session.
            try {
                fbCred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
                // Store Firebase UID back to Firestore profile for future uid-based lookups
                if (fbCred?.user?.uid && newUser?.id) {
                    updateDocument('Users', { id: newUser.id, firebaseUid: fbCred.user.uid }).catch(() => {});
                }
            } catch {
                // Firebase Auth provision failed — registration still succeeds via Firestore
            }

            handleCloseRegister();
            loginByUser(newUser, fbCred?.user);
            showAuthSuccessToast(newUser, 'Đăng ký thành công');
        } catch (error) {
            console.error("Register error:", error);
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
                            <h4 style="font-size: 13px; font-weight: 700; color: #ef4444; margin: 0;">Đăng ký thất bại</h4>
                            <p style="font-size: 11px; color: #94a3b8; margin: 2px 0 0;">${error.message || 'Vui lòng thử lại.'}</p>
                        </div>
                    </div>
                `,
                customClass: { popup: 'swal2-toast-mfilm' }
            });
        } finally {
            setLoading(false);
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
                handleCloseRegister();
                showAuthSuccessToast(session.user);
                return;
            }
            const targetEmail = user.email.toLowerCase().trim();

            // 1. Kiểm tra trong UserContext trước
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

            // Đăng nhập và đóng modal ngay lập tức không delay
            loginByUser(loggedInCustomer, user);
            handleCloseRegister();
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
        <HalloweenAuthDialog open={openRegister} onClose={handleCloseRegister} mode="register">
            <p className="mfilm-auth-eyebrow">BẮT ĐẦU HÀNH TRÌNH ĐIỆN ẢNH</p>
            <h1 id="mfilm-register-title">Đăng ký tài khoản</h1>
            <p className="mfilm-auth-intro">Đã có tài khoản? <button type="button" className="text-action" onClick={handleOpenLogin}>Đăng nhập</button></p>
            <form method="post" noValidate onSubmit={event => { event.preventDefault(); if (!loading && !loadingGoogle) addRegister(); }}>
                <HalloweenField label="Tên hiển thị" name="name" value={formData.name} onChange={handleChange} error={errors.name} autoComplete="nickname" />
                <HalloweenField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} autoComplete="username" owl />
                <HalloweenField label="Mật khẩu" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} autoComplete="new-password" />
                <HalloweenField label="Nhập lại mật khẩu" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} autoComplete="new-password" />
                <button type="submit" className="submit" disabled={loading || loadingGoogle}>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'} <IoArrowForward size={17} /></button>
                <div className="mfilm-auth-divider">hoặc tiếp tục với</div>
                <button type="button" className="mfilm-auth-google" onClick={signInWithGoogle} disabled={loadingGoogle || loading}>
                    <FcGoogle size={20} /> {loadingGoogle ? 'Đang xử lý đăng nhập...' : 'Đăng ký với Google'}
                </button>
            </form>
            <p className="mfilm-auth-note">Một tài khoản cho mọi đêm phim của bạn.</p>
        </HalloweenAuthDialog>
    );
}

export default Register;
