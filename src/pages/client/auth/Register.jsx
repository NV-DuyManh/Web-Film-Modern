import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, TextField, InputAdornment, IconButton } from '@mui/material';
import { IoClose, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { FcGoogle } from 'react-icons/fc';
import Swal from 'sweetalert2';
import Logo2 from '../../../assets/Logo2.png';
import { addDocument, updateDocument } from '../../../services/firebaseService';
import { UserContext } from '../../../contexts/UserProvider';
import { AuthContext } from '../../../contexts/AuthProvider';
import { ROLES } from '../../../utils/Constants';
import { signInWithPopup } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, googleProvider, db } from '../../../config/firebaseConfig';

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
            Swal.fire({
                icon: 'success',
                title: 'Đăng ký thành công!',
                text: `Chào mừng ${newUser.name || 'bạn'} gia nhập MFILM!`,
                timer: 1800,
                showConfirmButton: false,
                background: '#0f172a',
                color: '#fff',
                customClass: {
                    popup: 'border border-slate-700 shadow-2xl rounded-2xl'
                }
            });
        } catch (error) {
            console.error("Register error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Đăng ký thất bại',
                text: error.message || 'Vui lòng thử lại.',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#eab308'
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
                console.warn("Popup error, checking auth.currentUser fallback:", popupError);
                if (auth.currentUser?.email) {
                    user = auth.currentUser;
                } else {
                    await new Promise(r => setTimeout(r, 600));
                    if (auth.currentUser?.email) {
                        user = auth.currentUser;
                    } else {
                        throw popupError;
                    }
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

            loginByUser(loggedInCustomer);
            handleCloseRegister();

            Swal.fire({
                icon: 'success',
                title: 'Đăng nhập thành công!',
                text: `Chào mừng ${loggedInCustomer.name || 'bạn'} đến với MFILM!`,
                timer: 1800,
                showConfirmButton: false,
                background: '#0f172a',
                color: '#fff',
                customClass: {
                    popup: 'border border-slate-700 shadow-2xl rounded-2xl'
                }
            });
        } catch (error) {
            console.error("Google sign-in error:", error);
            if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                Swal.fire({
                    icon: 'error',
                    title: 'Đăng nhập thất bại',
                    text: error.message || 'Vui lòng thử lại.',
                    background: '#0f172a',
                    color: '#fff',
                    confirmButtonColor: '#eab308'
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
