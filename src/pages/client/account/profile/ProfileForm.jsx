import React, { useState, useEffect } from 'react';
import { FaEdit, FaEnvelope, FaMapMarkerAlt, FaBirthdayCake, FaLock, FaEye, FaEyeSlash, FaPhoneAlt, FaSave, FaTimes, FaKey, FaCheck, FaShieldAlt, FaUser, FaVenusMars } from 'react-icons/fa';

const ProfileForm = ({ isLogin, onSaveProfile, onSavePassword }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', dateOfBirth: '', sexID: '' });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    useEffect(() => {
        if (isLogin) {
            setFormData({
                name: isLogin.name,
                email: isLogin.email,
                phone: isLogin.phone || isLogin.phoneNumber,
                address: isLogin.address,
                dateOfBirth: isLogin.dateOfBirth,
                sexID: isLogin.sexID
            });
        }
    }, [isLogin]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        if (isLogin) {
            setFormData({
                name: isLogin.name,
                email: isLogin.email,
                phoneNumber: isLogin.phoneNumber || isLogin.phone,
                address: isLogin.address,
                dateOfBirth: isLogin.dateOfBirth,
                sexID: isLogin.sexID
            });
        }
    };

    const submitProfile = async () => {
        const success = await onSaveProfile(formData);
        if (success) setIsEditing(false);
    };

    const submitPassword = async () => {
        const success = await onSavePassword(passwordData);
        if (success) {
            setIsChangingPassword(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }
    };

    return (
        <>
            <div className="bg-[#1e293b]/60 rounded-2xl border border-yellow-500/50 p-6 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-cyan-500/20">
                    <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2"> Thông tin cá nhân </h3>
                    <div>
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/60 text-yellow-500 text-xs font-bold shadow-[0_0_10px_rgba(234,179,8,0.15)] hover:bg-yellow-500 hover:text-[#0f172a] hover:shadow-[0_0_15px_rgba(234,179,8,0.4)] hover:scale-105 transition-all duration-300 cursor-pointer">
                                <FaEdit className="text-sm" /> Chỉnh sửa
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button onClick={handleCancelEdit} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300 cursor-pointer">
                                    <FaTimes /> Hủy
                                </button>
                                <button onClick={submitProfile} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 border border-yellow-500 text-[#0f172a] text-xs font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:bg-yellow-400 hover:scale-105 transition-all duration-300 cursor-pointer">
                                    <FaSave className="text-sm" /> Lưu
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="flex flex-col gap-2 group">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                            <FaUser className="text-yellow-500" /> Họ và tên
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={`bg-black/20 backdrop-blur-md border ${isEditing ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)]'} hover:bg-white/5 hover:border-yellow-400 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-yellow-500/5 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all`}
                        />
                    </div>
                    <div className="flex flex-col gap-2 group">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                            <FaEnvelope className="text-yellow-500" /> Email
                        </label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={!isEditing}
                            placeholder={isEditing ? "Nhập email của bạn" : "Chưa cập nhật..."}
                            className={`bg-black/20 backdrop-blur-md border ${isEditing ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)]'} hover:bg-white/5 hover:border-yellow-400 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-yellow-500/5 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all`}
                        />
                    </div>
                    <div className="flex flex-col gap-2 group">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                            <FaPhoneAlt className="text-yellow-500" /> Số điện thoại
                        </label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing}
                            placeholder={isEditing ? "Nhập số điện thoại" : "Chưa cập nhật..."}
                            className={`bg-black/20 backdrop-blur-md border ${isEditing ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)]'} hover:bg-white/5 hover:border-yellow-400 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-yellow-500/5 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all`}
                        />
                    </div>
                    <div className="flex flex-col gap-2 group">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                            <FaMapMarkerAlt className="text-yellow-500" /> Địa chỉ
                        </label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} disabled={!isEditing}
                            placeholder={isEditing ? "Nhập địa chỉ" : "Chưa cập nhật..."}
                            className={`bg-black/20 backdrop-blur-md border ${isEditing ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)]'} hover:bg-white/5 hover:border-yellow-400 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-yellow-500/5 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all`}
                        />
                    </div>
                    <div className="flex flex-col gap-2 group">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                            <FaBirthdayCake className="text-yellow-500" /> Ngày sinh
                        </label>
                        <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} disabled={!isEditing}
                            className={`bg-black/20 backdrop-blur-md border ${isEditing ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)]'} hover:bg-white/5 hover:border-yellow-400 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-yellow-500/5 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all css-color-scheme-dark`}
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                    <div className="flex flex-col gap-2 group">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                            <FaVenusMars className="text-yellow-500" /> Giới tính
                        </label>
                        <select name="sexID" value={formData.sexID} onChange={handleChange} disabled={!isEditing}
                            className={`bg-black/20 backdrop-blur-md border ${isEditing ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)]'} hover:bg-white/5 hover:border-yellow-400 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-yellow-500/5 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all [&>option]:bg-slate-800 [&>option]:text-white cursor-pointer disabled:cursor-not-allowed`}
                        >
                            <option value="">Chưa cập nhật...</option>
                            <option value="Male">Nam</option>
                            <option value="Female">Nữ</option>
                            <option value="Other">Khác</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2 w-full group">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                            <FaLock className="text-yellow-500" /> Mật khẩu
                        </label>
                        <div className="flex flex-col xl:flex-row gap-2 items-start xl:items-center">
                            <div className="relative flex-1 w-full">
                                <input type={showPassword ? "text" : "password"} value={isLogin?.password || ''} disabled
                                    className="w-full bg-black/20 backdrop-blur-md cursor-not-allowed border border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)] hover:bg-white/5 hover:border-yellow-400 rounded-xl pl-4 pr-10 py-1.5 text-white text-base font-bold tracking-widest focus:outline-none transition-all"
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            <button
                                onClick={() => setIsChangingPassword(!isChangingPassword)}
                                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border font-bold transition-all whitespace-nowrap cursor-pointer ${isChangingPassword ? 'bg-yellow-500 text-[#0f172a] border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-transparent text-yellow-500 border-yellow-500 hover:bg-yellow-500/10'}`}
                            >
                                <FaKey /> Đổi MK
                            </button>
                        </div>
                        <div className={`transition-all duration-300 overflow-hidden ${isChangingPassword ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}>
                            <div className="bg-black/30 border border-yellow-500/30 rounded-2xl p-6 flex flex-col gap-5 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                                <div className="flex flex-col gap-2 group/old">
                                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide group-focus-within/old:text-yellow-400 transition-colors">
                                        <FaKey className="text-yellow-500" /> Mật khẩu cũ
                                    </label>
                                    <div className="relative">
                                        <input type={showPassword ? "text" : "password"} name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} placeholder="Nhập mật khẩu cũ..."
                                            className="w-full bg-black/20 backdrop-blur-md border border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)] hover:bg-white/5 hover:border-yellow-400 rounded-xl pl-4 pr-10 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-yellow-500/5 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all"
                                        />
                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-yellow-500 transition-colors cursor-pointer">
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 group/new">
                                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide group-focus-within/new:text-yellow-400 transition-colors">
                                        <FaShieldAlt className="text-yellow-500" /> Mật khẩu mới
                                    </label>
                                    <div className="relative">
                                        <input type={showPassword ? "text" : "password"} name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} placeholder="Nhập mật khẩu mới..."
                                            className="w-full bg-black/20 backdrop-blur-md border border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)] hover:bg-white/5 hover:border-yellow-400 rounded-xl pl-4 pr-10 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-yellow-500/5 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all"
                                        />
                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-yellow-500 transition-colors cursor-pointer">
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 group/confirm">
                                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide group-focus-within/confirm:text-yellow-400 transition-colors">
                                        <FaCheck className="text-yellow-500" /> Xác nhận mật khẩu
                                    </label>
                                    <div className="relative">
                                        <input type={showPassword ? "text" : "password"} name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} placeholder="Xác nhận mật khẩu..."
                                            className="w-full bg-black/20 backdrop-blur-md border border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)] hover:bg-white/5 hover:border-yellow-400 rounded-xl pl-4 pr-10 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-yellow-500/5 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all"
                                        />
                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-yellow-500 transition-colors cursor-pointer">
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 mt-4">
                                    <button onClick={() => {
                                        setIsChangingPassword(false);
                                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                    }} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300 cursor-pointer">
                                        <FaTimes className="text-lg" /> Huỷ
                                    </button>
                                    <button onClick={submitPassword} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 border border-yellow-500 text-[#0f172a] text-sm font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:bg-yellow-400 hover:scale-105 transition-all duration-300 cursor-pointer">
                                        <FaSave className="text-lg" /> Xác nhận
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfileForm;
