import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, TextField, InputAdornment, IconButton } from '@mui/material';
import { IoClose, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { FcGoogle } from 'react-icons/fc';
import Logo2 from '../../../assets/Logo2.png';
import { UserContext } from '../../../contexts/UserProvider';
import { AuthContext } from '../../../contexts/AuthProvider';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../../config/firebaseConfig';
import { ROLES } from '../../../utils/Contants';
import { addDocument } from '../../../services/firebaseService';

export default function LogIn({ openLogin, handleCloseLogin, handleOpenRegister }) {
    const [showPassword, setShowPassword] = useState(false);
    const users = useContext(UserContext);
    const { loginByUser } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!openLogin) {
            setFormData({
                email: '',
                password: ''
            });
            setErrors({});
            setShowPassword(false);
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

    const handleLogin = () => {
        if (validation()) return;

        const userLogin = users.find((e) => e.email === formData.email.trim() && e.password === formData.password);
        
        if (userLogin) {
            loginByUser(userLogin);
            handleCloseLogin();
        } else {
            setErrors({ email: 'Tài khoản hoặc mật khẩu không chính xác' });
        }
    }

    // Google sign-in
    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const existingCustomer = users.find(c => c.email === user.email);
            let loggedInCustomer;

            if (!existingCustomer) {
                const newCustomer = {
                    displayName: user.displayName,
                    imgUrl: user.photoURL,
                    role: ROLES.USER,
                    email: user.email
                };
               const userNew =  await addDocument('Users', newCustomer);

                loggedInCustomer = userNew ;
            } else {
                loggedInCustomer = existingCustomer;
            }
             loginByUser(loggedInCustomer);
             handleCloseLogin();
        } catch (error) {
           alert('Đăng nhập thất bại. Vui lòng thử lại.');
        }
    };
    return (
        <Dialog
            open={openLogin}
            onClose={handleCloseLogin}
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
                <div className="hidden md:flex w-1/2 bg-slate-950 border-r border-slate-900 flex-col items-center p-10 relative overflow-hidden text-center ">
                    <div className="drop-shadow-[0_0_25px_rgba(255,255,255,0.05)] relative z-10">
                        <img src={Logo2} alt="MFILM" className="h-28 w-auto object-contain" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-center space-y-4 relative z-10">
                        <span className="text-[13px] font-bold tracking-widest px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                            PHIM HAY ĐỈNH CAO
                        </span>
                        <h2 className="text-3xl font-black leading-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]">
                            Chào mừng<br />đến với <span className="text-yellow-400">MFILM</span>
                        </h2>
                    </div>
                </div>

                <div className="w-full md:w-1/2 pt-12 pb-8 px-8 relative bg-slate-900 flex flex-col justify-center">
                    <button onClick={handleCloseLogin} className="absolute cursor-pointer right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-red-600 active:scale-95">
                        <IoClose size={22} />
                    </button>

                    <h2 className="text-2xl font-bold mb-3 text-white">Đăng nhập</h2>
                    <p className="text-sm mb-8 text-slate-400">
                        Chưa có tài khoản?{' '}
                        <button onClick={handleOpenRegister} className="font-semibold cursor-pointer text-yellow-400 hover:underline transition-colors">
                            Đăng ký ngay
                        </button>
                    </p>

                    <div className="space-y-5">
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
                    </div>

                    <div className="text-right mt-3">
                        <button className="text-xs cursor-pointer text-slate-400 hover:text-yellow-400 transition-colors">
                            Quên mật khẩu?
                        </button>
                    </div>

                    <button onClick={handleLogin} className="w-full cursor-pointer font-bold py-3 mt-6 rounded-xl text-sm tracking-wide bg-yellow-400 hover:bg-yellow-500 text-black transition-all shadow-[0_4px_14px_rgba(250,204,21,0.2)]">
                        Đăng nhập
                    </button>

                    <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
                        <div className="h-px flex-1 bg-slate-700" />
                        <p className='text-white'>Hoặc</p>
                        <div className="h-px flex-1 bg-slate-700" />
                    </div>

                    <button onClick={signInWithGoogle} className="flex cursor-pointer items-center justify-center gap-3 w-full font-semibold py-3 rounded-xl text-sm text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 transition-all">
                        <FcGoogle size={18} /> Đăng nhập với Google
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
