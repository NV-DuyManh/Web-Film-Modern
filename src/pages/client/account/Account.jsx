import React, { useContext, useState, useEffect, useRef } from 'react';
import {
    FaHeart, FaList, FaHistory, FaBell, FaVideo, FaUser,
    FaCamera, FaEdit, FaEnvelope, FaMapMarkerAlt, FaBirthdayCake,
    FaLock, FaEye, FaEyeSlash, FaPhoneAlt, FaSave, FaTimes, FaKey, FaCheck, FaShieldAlt
} from 'react-icons/fa';
import { AuthContext } from '../../../contexts/AuthProvider';
import Coder from '../../../assets/Coder.png';
import { updateDocument } from '../../../services/firebaseService';
import Swal from 'sweetalert2';
import NoelBackground from '../../../components/admin/noelBackground/NoelBackground';
import { uploadImageToCloudinary } from '../../../config/cloudiaryConfig';
import { SubscriptionContext } from '../../../contexts/SubscriptionProvider';
import { PlanContext } from '../../../contexts/PlanProvider';
import { getObjectById } from '../../../services/firebaseReponse';

const Account = () => {
    const { isLogin } = useContext(AuthContext);
    const subscriptions = useContext(SubscriptionContext) || [];
    const plans = useContext(PlanContext) || [];

    const getExpiryDate = (p) => {
        if (!p || !p.expiryDate) return new Date(0);
        if (typeof p.expiryDate.toDate === 'function') return p.expiryDate.toDate();
        if (p.expiryDate.seconds) return new Date(p.expiryDate.seconds * 1000);
        return new Date(p.expiryDate);
    };

    const currentPlanInfo = React.useMemo(() => {
        if (!isLogin) return { name: 'FREE', level: 0, theme: 'slate' };
        if (isLogin.role === 'Admin') return { name: 'ADMIN', level: 99, theme: 'red' };

        const userSubs = subscriptions.filter(p => p.userId === isLogin.id && getExpiryDate(p) > new Date());
        if (userSubs.length === 0) return { name: 'FREE', level: 0, theme: 'slate' };

        const highestSub = userSubs.reduce((max, item) => {
            const currentPlan = getObjectById(plans, item.planID);
            const maxPlan = getObjectById(plans, max.planID);
            return (currentPlan?.level || 0) > (maxPlan?.level || 0) ? item : max;
        }, userSubs[0]);

        const highestPlan = getObjectById(plans, highestSub.planID);
        if (!highestPlan) return { name: 'VIP', level: 1, theme: 'cyan' };

        const sortedPlans = [...plans].sort((a, b) => Number(a.level) - Number(b.level));
        const index = sortedPlans.findIndex(p => p.id === highestPlan.id);
        const themeNames = ['slate', 'cyan', 'yellow', 'rose'];
        const theme = themeNames[index] || 'yellow';

        return {
            name: highestPlan.name,
            level: highestPlan.level,
            theme: theme,
        };
    }, [isLogin, subscriptions, plans]);
    const fileInputRef = useRef(null);
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('Tài Khoản');
    const [avatarPreview, setAvatarPreview] = useState(null);

    // Profile Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        phoneNumber: '',
        address: '',
        dateOfBirth: ''
    });

    // Password Changing State
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (isLogin) {
            setFormData({
                displayName: isLogin.displayName || '',
                email: isLogin.email || '',
                phoneNumber: isLogin.phoneNumber || '',
                address: isLogin.address || '',
                dateOfBirth: isLogin.dateOfBirth || ''
            });
            // Update preview if isLogin changes
            if (avatarPreview && isLogin.imgUrl !== avatarPreview) {
                setAvatarPreview(null);
            }
        }
    }, [isLogin]);

    const sidebarItems = [
        { icon: FaUser, label: 'Tài Khoản' },
        { icon: FaHeart, label: 'Yêu Thích' },
        { icon: FaList, label: 'Danh Sách' },
        { icon: FaHistory, label: 'Xem Tiếp' },
        { icon: FaBell, label: 'Thông Báo' },
        { icon: FaVideo, label: 'Phim Đang Thuê' },
    ];

    const stats = [
        { label: 'ĐÃ XEM', value: 0 },
        { label: 'ĐÁNH GIÁ', value: 0 },
        { label: 'WATCHLIST', value: 0 },
        { label: 'THEO DÕI', value: 0 },
    ];

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !isLogin) return;

        const reader = new FileReader();
        reader.onload = async () => {
            // Lập tức hiển thị ảnh preview mượt mà lẹ phết
            setAvatarPreview(reader.result);

            try {
                // Tải ngầm lên Cloudinary
                const uploadedUrl = await uploadImageToCloudinary(file, "Users");
                await updateDocument("Users", {
                    id: isLogin.id,
                    imgUrl: uploadedUrl
                });
            } catch (error) {
                console.error("Lỗi upload ảnh:", error);
            }
        };
        reader.readAsDataURL(file);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSaveProfile = async () => {
        if (!isLogin) return;
        try {
            await updateDocument("Users", {
                id: isLogin.id,
                ...formData
            });
            setIsEditing(false);
            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: 'Cập nhật thông tin thành công!',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#22d3ee'
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể cập nhật thông tin!',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#22d3ee'
            });
        }
    };

    const handleSavePassword = async () => {
        if (!isLogin) return;
        if (passwordData.currentPassword !== isLogin.password) {
            return Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Mật khẩu hiện tại không đúng!',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#22d3ee'
            });
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Mật khẩu mới không khớp!',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#22d3ee'
            });
        }
        if (passwordData.newPassword.length < 6) {
            return Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Mật khẩu phải từ 6 ký tự trở lên!',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#22d3ee'
            });
        }

        try {
            await updateDocument("Users", {
                id: isLogin.id,
                password: passwordData.newPassword
            });
            setIsChangingPassword(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: 'Đổi mật khẩu thành công!',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#22d3ee'
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể đổi mật khẩu!',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#22d3ee'
            });
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-transparent pt-24 pb-10 px-4 md:px-6 relative overflow-hidden flex flex-col w-full">
            <div className="fixed inset-0 z-0 pointer-events-none noel-wrapper">
                <style>{`
                    .noel-wrapper .noel-bg { z-index: 0 !important; }
                `}</style>
                <NoelBackground />
            </div>

            <div className="w-full flex flex-col md:flex-row gap-4 relative z-10 flex-1">

                {/* SIDEBAR - Chia từng lớp giống Admin */}
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-3 md:min-h-[calc(100vh-120px)]">

                    {/* Header Block */}
                    <div className="p-5 bg-[#0a192f]/30 backdrop-blur-md rounded-2xl border border-cyan-500/30 shadow-[0_4px_15px_rgba(0,0,0,0.3)] mb-2">
                        <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Tài khoản</h3>
                        <h2 className="text-white text-lg font-black tracking-wide">Quản lý tài khoản</h2>
                    </div>

                    {/* Menu Items Blocks */}
                    <div className="flex flex-col gap-3">
                        {sidebarItems.map((item, index) => {
                            const isActive = activeTab === item.label;
                            return (
                                <button
                                    key={index}
                                    onClick={() => setActiveTab(item.label)}
                                    className={`flex items-center gap-4 w-full px-5 py-4 rounded-xl transition-all duration-300 group shadow-lg border ${isActive
                                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[inset_4px_0_0_0_#22d3ee,0_0_15px_rgba(34,211,238,0.2)]'
                                            : 'bg-[#1e293b]/80 border-transparent text-slate-300 hover:bg-[#334155]/80 hover:text-cyan-300 hover:border-cyan-500/30'
                                        }`}
                                >
                                    <item.icon className={`text-xl transition-transform duration-300 group-hover:scale-110 ${isActive ? "drop-shadow-[0_0_5px_#22d3ee]" : ""}`} />
                                    <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="flex-1 flex flex-col h-full min-h-[calc(100vh-120px)] p-0 md:p-2">

                        {activeTab === 'Tài Khoản' ? (
                            <div className="flex flex-col gap-4 overflow-auto custom-scrollbar h-full pr-2">
                                {/* Top Profile Card */}
                                <div className="bg-[#1e293b]/80 rounded-2xl border border-slate-600/50 p-6 flex flex-col xl:flex-row gap-4 items-center xl:items-start justify-between relative shadow-lg">

                                    <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start shrink-0">
                                        <div className="relative w-28 h-28 shrink-0 group">
                                            <div className="w-full h-full rounded-full border-2 border-yellow-500 p-1 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                                                <img
                                                    src={avatarPreview || isLogin?.imgUrl || Coder}
                                                    alt="avatar"
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                ref={fileInputRef}
                                                className="hidden"
                                                onChange={handleAvatarChange}
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="absolute bottom-0 right-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-[#0f172a] border-2 border-[#161821] hover:scale-110 hover:shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-all duration-300 cursor-pointer"
                                            >
                                                <FaCamera className="text-sm" />
                                            </button>
                                        </div>

                                        <div className="flex flex-col items-center sm:items-start mt-2">
                                            <h1 className="text-2xl font-black text-white mb-1 tracking-wider drop-shadow-md">{isLogin?.displayName || 'Thành viên'}</h1>
                                            <p className="text-yellow-500 text-sm mb-3 font-medium">{isLogin?.email || 'Chưa cập nhật email'}</p>

                                            <div className="flex items-center gap-3">
                                                <span className={`px-4 py-1.5 bg-transparent text-${currentPlanInfo.theme}-500 text-xs font-bold rounded-full border border-${currentPlanInfo.theme}-500/50 uppercase tracking-wider`}>
                                                    {currentPlanInfo.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Edit Profile Buttons */}
                                    <div className="mt-4 xl:mt-2">
                                        {!isEditing ? (
                                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-transparent border border-yellow-500/50 text-yellow-500 text-sm font-bold hover:bg-yellow-500/10 transition-all duration-300 cursor-pointer">
                                                <FaEdit /> Chỉnh sửa
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => {
                                                    setIsEditing(false);
                                                    setFormData({
                                                        displayName: isLogin?.displayName || '',
                                                        email: isLogin?.email || '',
                                                        phoneNumber: isLogin?.phoneNumber || '',
                                                        address: isLogin?.address || '',
                                                        dateOfBirth: isLogin?.dateOfBirth || ''
                                                    });
                                                }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500 hover:text-white transition-all duration-300 cursor-pointer">
                                                    <FaTimes /> Hủy
                                                </button>
                                                <button onClick={handleSaveProfile} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 border border-yellow-500 text-[#0f172a] text-sm font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:bg-yellow-400 hover:scale-105 transition-all duration-300 cursor-pointer">
                                                    <FaSave /> Lưu
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Stats Block */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                                    {stats.map((stat, index) => (
                                        <div key={index} className="bg-[#1e293b]/60 border border-slate-700/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-[#1e293b]/80 hover:border-yellow-500/50 transition-all duration-300 shadow-md group">
                                            <span className="text-4xl font-black text-yellow-500 group-hover:scale-110 transition-transform duration-300">{stat.value}</span>
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{stat.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Personal Info Form */}
                                <div className="bg-[#1e293b]/80 rounded-2xl border border-slate-600/50 p-6 shadow-lg mt-4">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-cyan-500/20">
                                        <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]"></span>
                                            Thông tin cá nhân
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        {/* Full Name */}
                                        <div className="flex flex-col gap-2 group">
                                            <label className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                                                <FaUser className="text-yellow-500" /> Họ và tên
                                            </label>
                                            <input
                                                type="text"
                                                name="displayName"
                                                value={formData.displayName}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className={`bg-[#0b0f19] border ${isEditing ? 'border-yellow-500' : 'border-slate-500'} rounded-xl px-4 py-2.5 text-slate-200 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-[#0f172a] transition-all`}
                                            />
                                        </div>

                                        {/* Email */}
                                        <div className="flex flex-col gap-2 group">
                                            <label className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                                                <FaEnvelope className="text-yellow-500" /> Email
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                placeholder={isEditing ? "Nhập email của bạn" : "Chưa cập nhật..."}
                                                className={`bg-[#0b0f19] border ${isEditing ? 'border-yellow-500' : 'border-slate-500'} rounded-xl px-4 py-2.5 text-slate-200 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-[#0f172a] transition-all`}
                                            />
                                        </div>

                                        {/* Phone */}
                                        <div className="flex flex-col gap-2 group">
                                            <label className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                                                <FaPhoneAlt className="text-yellow-500" /> Số điện thoại
                                            </label>
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                placeholder={isEditing ? "Nhập số điện thoại" : "Chưa cập nhật..."}
                                                className={`bg-[#0b0f19] border ${isEditing ? 'border-yellow-500' : 'border-slate-500'} rounded-xl px-4 py-2.5 text-slate-200 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-[#0f172a] transition-all`}
                                            />
                                        </div>

                                        {/* Address */}
                                        <div className="flex flex-col gap-2 group">
                                            <label className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                                                <FaMapMarkerAlt className="text-yellow-500" /> Địa chỉ
                                            </label>
                                            <input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                placeholder={isEditing ? "Nhập địa chỉ" : "Chưa cập nhật..."}
                                                className={`bg-[#0b0f19] border ${isEditing ? 'border-yellow-500' : 'border-slate-500'} rounded-xl px-4 py-2.5 text-slate-200 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-[#0f172a] transition-all`}
                                            />
                                        </div>

                                        {/* DOB */}
                                        <div className="flex flex-col gap-2 group">
                                            <label className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                                                <FaBirthdayCake className="text-yellow-500" /> Ngày sinh
                                            </label>
                                            <input
                                                type="date"
                                                name="dateOfBirth"
                                                value={formData.dateOfBirth}
                                                onChange={handleChange}
                                                disabled={!isEditing}
                                                className={`bg-[#0b0f19] border ${isEditing ? 'border-yellow-500' : 'border-slate-500'} rounded-xl px-4 py-2.5 text-slate-200 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-[#0f172a] transition-all css-color-scheme-dark`}
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                    </div>

                                    {/* PASSWORD SECTION INJECTED */}
                                    <div className="mt-8 border-t border-cyan-500/20 pt-6">
                                        <div className="flex flex-col gap-2 w-full">
                                            <label className="text-xs font-bold text-yellow-500 flex items-center gap-2 uppercase tracking-wide">
                                                <FaLock /> Mật khẩu
                                            </label>
                                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                                <div className="relative flex-1 w-full">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        defaultValue="12345678"
                                                        disabled
                                                        className="w-full bg-[#0b0f19] cursor-not-allowed border border-slate-500 rounded-xl pl-4 pr-10 py-2 text-slate-200 text-2xl font-bold tracking-[0.3em] focus:outline-none transition-all"
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
                                        </div>

                                        {/* Expandable Password Change Panel */}
                                        <div className={`transition-all duration-300 overflow-hidden ${isChangingPassword ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}>
                                            <div className="bg-[#1a1c23]/80 border border-slate-600/30 rounded-2xl p-5 flex flex-col gap-4">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-xs font-bold text-slate-400">Mật khẩu cũ</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            name="currentPassword"
                                                            value={passwordData.currentPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Nhập mật khẩu cũ..."
                                                            className="w-full bg-[#0b0f19] border border-slate-500 focus:border-yellow-500 rounded-xl pl-4 pr-10 py-2.5 text-white text-sm font-medium focus:outline-none focus:bg-[#0f172a] focus:shadow-[0_0_10px_rgba(234,179,8,0.2)] transition-all"
                                                        />
                                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-yellow-500 transition-colors cursor-pointer">
                                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-xs font-bold text-slate-400">Mật khẩu mới</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            name="newPassword"
                                                            value={passwordData.newPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Nhập mật khẩu mới..."
                                                            className="w-full bg-[#0b0f19] border border-slate-500 focus:border-yellow-500 rounded-xl pl-4 pr-10 py-2.5 text-white text-sm font-medium focus:outline-none focus:bg-[#0f172a] focus:shadow-[0_0_10px_rgba(234,179,8,0.2)] transition-all"
                                                        />
                                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-yellow-500 transition-colors cursor-pointer">
                                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <label className="text-xs font-bold text-slate-400">Xác nhận mật khẩu</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            name="confirmPassword"
                                                            value={passwordData.confirmPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Xác nhận mật khẩu..."
                                                            className="w-full bg-[#0b0f19] border border-slate-500 focus:border-yellow-500 rounded-xl pl-4 pr-10 py-2.5 text-white text-sm font-medium focus:outline-none focus:bg-[#0f172a] focus:shadow-[0_0_10px_rgba(234,179,8,0.2)] transition-all"
                                                        />
                                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-yellow-500 transition-colors cursor-pointer">
                                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-end gap-3 mt-2">
                                                    <button onClick={() => {
                                                        setIsChangingPassword(false);
                                                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                                    }} className="px-6 py-2.5 rounded-xl bg-[#2a2d35] border border-slate-600/50 text-slate-300 text-sm font-bold hover:bg-slate-700 hover:text-white transition-all cursor-pointer flex items-center gap-2">
                                                        <FaTimes /> Huỷ
                                                    </button>
                                                    <button onClick={handleSavePassword} className="px-6 py-2.5 rounded-xl bg-yellow-500 border border-yellow-500 text-[#0f172a] text-sm font-bold shadow-[0_0_10px_rgba(234,179,8,0.3)] hover:bg-yellow-400 hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2">
                                                        <FaCheck /> Xác nhận
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center min-h-[500px]">
                                <p className="text-slate-400 text-lg flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                                    Chức năng <strong className="text-cyan-400">{activeTab}</strong> đang được phát triển...
                                </p>
                            </div>
                        )}
                    </div>
                </div>
        </div>
    );
};

export default Account;
 
