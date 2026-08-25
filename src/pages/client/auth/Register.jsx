import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, TextField, InputAdornment, IconButton } from '@mui/material';
import { IoClose, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { FcGoogle } from 'react-icons/fc';
import Swal from 'sweetalert2';
import Logo2 from '../../../assets/Logo2.png';
import Logo5 from '../../../assets/Logo5.png';
import { addDocument, updateDocument } from '../../../services/firebaseService';
import { UserContext } from '../../../contexts/UserProvider';
import { AuthContext } from '../../../contexts/AuthProvider';
import { ROLES } from '../../../utils/Constants';
import { signInWithPopup } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, googleProvider, db } from '../../../config/firebaseConfig';

const showAuthSuccessToast = (customer, message = 'Đăng ký thành công') => {
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

function Register({ openRegister, handleCloseRegister, handleOpenLogin }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
            setShowPassword(false);
            setShowConfirmPassword(false);
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
        if (users.some(e => e.email == formData.email)) newErrors.email = 'Email đã được sử dụng';
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
            const { confirmPassword, ...submitData } = formData;
            const newUser = await addDocument("Users", submitData);
            handleCloseRegister();
            loginByUser(newUser);
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
            loginByUser(loggedInCustomer);
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
        <Dialog
            open={openRegister}
            onClose={handleCloseRegister}
            maxWidth="md"
            fullWidth
            disableScrollLock={true}
            sx={{
                '& .MuiDialog-paper': { backgroundColor: '#0f172a', backgroundImage: 'none' },
                '& .MuiDialogContent-root': { backgroundColor: '#0f172a', padding: 0 }
            }}
            PaperProps={{
                className: "rounded-2xl overflow-hidden bg-slate-900 text-white border border-slate-800 shadow-2xl"
            }}
        >
            <DialogContent className="p-0 flex flex-col md:flex-row overflow-hidden">
                <div className="hidden md:flex w-1/2 bg-slate-950 border-r border-slate-900 flex-col items-center p-10 relative overflow-hidden text-center">
                    <div className="drop-shadow-[0_0_25px_rgba(255,255,255,0.05)] relative z-10">
                        <img src={Logo2} alt="MFILM" className="h-28 w-auto object-contain" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-center space-y-4 relative z-10">
                        <p className="text-[13px] font-bold tracking-widest px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)] inline">
                            PHIM HAY ĐỈNH CAO
                        </p>
                        <h2 className="text-3xl font-black leading-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]">
                            Gia nhập<br />thế giới <p className="text-yellow-400 inline">MFILM</p>
                        </h2>
                    </div>
                </div>

                <div className="w-full md:w-1/2 pt-12 pb-8 px-8 relative bg-slate-900 flex flex-col justify-center">
                    <button onClick={handleCloseRegister} className="absolute cursor-pointer right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition duration-300 hover:scale-110 hover:bg-red-600 active:scale-95">
                        <IoClose size={22} />
                    </button>

                    <h2 className="text-2xl font-bold mb-3 text-white">Đăng ký tài khoản</h2>
                    <p className="text-sm mb-8 text-slate-400">
                        Đã có tài khoản?{' '}
                        <button onClick={handleOpenLogin} className="font-semibold cursor-pointer text-yellow-400 hover:underline transition-colors">
                            Đăng nhập
                        </button>
                    </p>

                    <div className="space-y-4" onKeyDown={(e) => e.key === 'Enter' && addRegister()}>
                        <TextField
                            className="modal-input-x" fullWidth variant="outlined" type="text"
                            label="Tên hiển thị" name="name"
                            value={formData.name} onChange={handleChange}
                            error={!!errors.name} helperText={errors.name}
                        />

                        <TextField
                            className="modal-input-x" fullWidth variant="outlined" type="email"
                            label="Email" name="email"
                            value={formData.email} onChange={handleChange}
                            error={!!errors.email} helperText={errors.email}
                        />

                        <TextField
                            className="modal-input-x" fullWidth variant="outlined"
                            label="Mật khẩu" name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password} onChange={handleChange}
                            error={!!errors.password} helperText={errors.password}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#94a3b8' }}>
                                            {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <TextField
                            className="modal-input-x" fullWidth variant="outlined"
                            label="Nhập lại mật khẩu" name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword} onChange={handleChange}
                            error={!!errors.confirmPassword} helperText={errors.confirmPassword}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" sx={{ color: '#94a3b8' }}>
                                            {showConfirmPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </div>

                    <button 
                        onClick={addRegister} 
                        disabled={loading}
                        className="w-full cursor-pointer font-bold py-3 mt-6 rounded-xl text-sm tracking-wide bg-yellow-400 hover:bg-yellow-500 text-black transition shadow-[0_4px_14px_rgba(250,204,21,0.2)] disabled:opacity-60"
                    >
                        {loading ? "Đang tạo tài khoản..." : "Đăng ký ngay"}
                    </button>

                    <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
                        <div className="h-px flex-1 bg-slate-700" />
                        <p className='text-white'>Hoặc</p>
                        <div className="h-px flex-1 bg-slate-700" />
                    </div>

                    <button 
                        onClick={signInWithGoogle}
                        disabled={loadingGoogle}
                        className="flex cursor-pointer items-center justify-center gap-3 w-full font-semibold py-3 rounded-xl text-sm text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loadingGoogle ? (
                            <span className="flex items-center gap-2">
                                <span className="inline-block w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></span>
                                Đang xử lý đăng nhập...
                            </span>
                        ) : (
                            <>
                                <FcGoogle size={18} /> Đăng ký với Google
                            </>
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default Register;
