import React, { useContext, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LISTACCOUNT } from '../../../utils/Contants';
import {
    FaUser, FaCamera, FaEdit, FaEnvelope, FaMapMarkerAlt, FaBirthdayCake,
    FaLock, FaEye, FaEyeSlash, FaPhoneAlt, FaSave, FaTimes, FaKey, FaCheck, FaShieldAlt, FaCrown
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
import { WingedFrame } from '../../../components/client/header/AvatarFrames';

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
        if (!isLogin) return { name: 'FREE', level: 0, theme: 'blue' };
        if (isLogin.role === 'Admin') return { name: 'ADMIN', level: 99, theme: 'red' };

        const userSubs = subscriptions.filter(p => p.userId === isLogin.id && getExpiryDate(p) > new Date());
        if (userSubs.length === 0) return { name: 'FREE', level: 0, theme: 'blue' };

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

    const AVAILABLE_FRAMES = React.useMemo(() => {
        const sortedPlans = [...plans].sort((a, b) => Number(a.level) - Number(b.level));
        const themes = ['blue', 'cyan', 'yellow', 'rose', 'purple', 'emerald'];
        
        return sortedPlans.map((plan, index) => ({
            id: themes[index] || 'slate',
            label: plan.name,
            minLevel: plan.level
        }));
    }, [plans]);

    const currentSelectedTheme = isLogin?.selectedFrame || currentPlanInfo.theme;

    const [showFrameModal, setShowFrameModal] = useState(false);
    const fileInputRef = useRef(null);
    const [showPassword, setShowPassword] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const { tab } = useParams();
    const navigate = useNavigate();

    const activeItem = LISTACCOUNT.find(item => item.path === `/account/${tab}`) || LISTACCOUNT[0];
    const activeTab = activeItem.name;

    useEffect(() => {
        if (!tab) {
            navigate('/account/account', { replace: true });
        }
    }, [tab, navigate]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        phoneNumber: '',
        address: '',
        dateOfBirth: ''
    });
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
            if (avatarPreview && isLogin.imgUrl !== avatarPreview) {
                setAvatarPreview(null);
            }
        }
    }, [isLogin]);



    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !isLogin) return;

        const reader = new FileReader();
        reader.onload = async () => {
            setAvatarPreview(reader.result);

            try {
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

    const handleSelectFrame = async (frameId) => {
        if (!isLogin) return;
        try {
            await updateDocument("Users", {
                id: isLogin.id,
                selectedFrame: frameId
            });
            // Do not auto-close modal
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể đổi khung ảnh!',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#22d3ee'
            });
        }
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
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-3 md:min-h-[calc(100vh-120px)]">
                    <div className="p-5 bg-gradient-to-r from-yellow-500/20 via-[#1e293b]/80 to-[#1e293b]/50 backdrop-blur-md rounded-xl border-l-4 border-yellow-500 border-y border-r border-white/5 shadow-lg mb-4 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-yellow-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                        <h2 className="text-white text-lg font-black tracking-wide flex items-center gap-3 relative z-10">
                            <FaUser className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                            Quản lý tài khoản
                        </h2>
                    </div>
                    <div className="flex flex-col gap-3">
                        {LISTACCOUNT.map((item, index) => {
                            const isActive = activeTab === item.name;
                            return (
                                <button
                                    key={index}
                                    onClick={() => navigate(item.path)}
                                    className={`flex items-center gap-4 w-full px-5 py-3 rounded-lg transition-all duration-300 group border ${isActive
                                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[inset_4px_0_0_0_#22d3ee,0_0_15px_rgba(34,211,238,0.1)]'
                                        : 'border-transparent bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-cyan-400 hover:border-cyan-500/30'
                                        }`}
                                >
                                    <div className={`text-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${isActive ? "drop-shadow-[0_0_5px_#22d3ee]" : ""}`}>
                                        {item.icon}
                                    </div>
                                    <span className="font-semibold text-sm tracking-wide">{item.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="flex-1 flex flex-col h-full min-h-[calc(100vh-120px)]">

                    {activeTab === 'Tài Khoản' ? (
                        <div className="flex flex-col gap-4 overflow-auto custom-scrollbar h-full pr-2">
                            <div className="bg-[#1e293b]/60 rounded-2xl border border-yellow-500/50 p-6 flex flex-col xl:flex-row gap-4 items-center justify-between relative shadow-[0_0_15px_rgba(234,179,8,0.15)]">

                                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center shrink-0">
                                    <div className="relative shrink-0 group flex items-center justify-center my-4 sm:my-2">
                                        <div className="cursor-pointer" onClick={() => setShowFrameModal(true)}>
                                            <WingedFrame theme={currentSelectedTheme} size={96}>
                                                <img
                                                    src={avatarPreview || isLogin?.imgUrl || Coder}
                                                    alt="avatar"
                                                    className="w-full h-full object-cover"
                                                />
                                            </WingedFrame>
                                        </div>

                                        <input
                                            type="file"
                                            accept=".png, .jpg, .jpeg, .webp, .gif"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleAvatarChange}
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fileInputRef.current?.click();
                                            }}
                                            className="absolute -bottom-1 -right-1 w-[34px] h-[34px] bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-slate-900 border-2 border-[#1e293b] shadow-[0_4px_10px_rgba(0,0,0,0.4)] hover:scale-110 hover:rotate-12 hover:shadow-[0_0_15px_rgba(245,158,11,0.7)] active:scale-95 transition-all duration-300 cursor-pointer z-50"
                                        >
                                            <FaCamera className="text-[14px]" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center sm:items-start mt-1">
                                        <h1 className="text-3xl font-serif font-bold text-white mb-1 tracking-wide drop-shadow-md">
                                            {isLogin?.displayName || 'Thành viên'}
                                        </h1>
                                        <div className="text-yellow-400 text-[14px] font-medium tracking-wide mb-3 opacity-90">
                                            {isLogin?.email || 'Chưa cập nhật email'}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 xl:mt-0 self-center shrink-0">
                                    <div className={`px-6 py-2.5 bg-${currentPlanInfo.theme}-500/10 text-${currentPlanInfo.theme}-400 text-[15px] font-bold rounded-full border border-${currentPlanInfo.theme}-500/50 uppercase tracking-wider shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center gap-2.5`}>
                                        <FaCrown className="text-lg" />
                                        Hạng hiện tại: {currentPlanInfo.name === 'PRENIUM' ? 'PREMIUM' : currentPlanInfo.name}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                                <div className="bg-[#1e293b]/60 border border-cyan-500/70 rounded-2xl py-3 px-4 flex flex-col items-center justify-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                    <p className="text-3xl font-black text-cyan-400">1</p>
                                    <p className="text-[11px] font-bold text-slate-200 uppercase tracking-widest text-center">ĐÃ XEM</p>
                                </div>
                                <div className="bg-[#1e293b]/60 border border-emerald-500/70 rounded-2xl py-3 px-4 flex flex-col items-center justify-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                    <p className="text-3xl font-black text-emerald-400">2</p>
                                    <p className="text-[11px] font-bold text-slate-200 uppercase tracking-widest text-center">ĐÁNH GIÁ</p>
                                </div>
                                <div className="bg-[#1e293b]/60 border border-purple-500/70 rounded-2xl py-3 px-4 flex flex-col items-center justify-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                                    <p className="text-3xl font-black text-purple-400">3</p>
                                    <p className="text-[11px] font-bold text-slate-200 uppercase tracking-widest text-center">WATCHLIST</p>
                                </div>
                                <div className="bg-[#1e293b]/60 border border-rose-500/70 rounded-2xl py-3 px-4 flex flex-col items-center justify-center gap-1 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                                    <p className="text-3xl font-black text-rose-400">4</p>
                                    <p className="text-[11px] font-bold text-slate-200 uppercase tracking-widest text-center">THEO DÕI</p>
                                </div>
                            </div>
                            <div className="bg-[#1e293b]/60 rounded-2xl border border-yellow-500/50 p-6 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-cyan-500/20">
                                    <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]"></span>
                                        Thông tin cá nhân
                                    </h3>
                                    <div>
                                        {!isEditing ? (
                                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/60 text-yellow-500 text-xs font-bold shadow-[0_0_10px_rgba(234,179,8,0.15)] hover:bg-yellow-500 hover:text-[#0f172a] hover:shadow-[0_0_15px_rgba(234,179,8,0.4)] hover:scale-105 transition-all duration-300 cursor-pointer">
                                                <FaEdit className="text-sm" /> Chỉnh sửa
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
                                                }} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300 cursor-pointer">
                                                    <FaTimes /> Hủy
                                                </button>
                                                <button onClick={handleSaveProfile} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 border border-yellow-500 text-[#0f172a] text-xs font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:bg-yellow-400 hover:scale-105 transition-all duration-300 cursor-pointer">
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
                                            name="displayName"
                                            value={formData.displayName}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className={`bg-black/20 backdrop-blur-md border ${isEditing ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)]'} hover:bg-white/5 hover:border-yellow-400 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-yellow-500/5 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all`}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 group">
                                        <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                                            <FaEnvelope className="text-yellow-500" /> Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            placeholder={isEditing ? "Nhập email của bạn" : "Chưa cập nhật..."}
                                            className={`bg-black/20 backdrop-blur-md border ${isEditing ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)]'} hover:bg-white/5 hover:border-yellow-400 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-yellow-500/5 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all`}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 group">
                                        <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                                            <FaPhoneAlt className="text-yellow-500" /> Số điện thoại
                                        </label>
                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            placeholder={isEditing ? "Nhập số điện thoại" : "Chưa cập nhật..."}
                                            className={`bg-black/20 backdrop-blur-md border ${isEditing ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)]'} hover:bg-white/5 hover:border-yellow-400 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-yellow-500/5 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all`}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 group">
                                        <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                                            <FaMapMarkerAlt className="text-yellow-500" /> Địa chỉ
                                        </label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            placeholder={isEditing ? "Nhập địa chỉ" : "Chưa cập nhật..."}
                                            className={`bg-black/20 backdrop-blur-md border ${isEditing ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)]'} hover:bg-white/5 hover:border-yellow-400 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-yellow-500/5 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all`}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 group">
                                        <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                                            <FaBirthdayCake className="text-yellow-500" /> Ngày sinh
                                        </label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className={`bg-black/20 backdrop-blur-md border ${isEditing ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)]'} hover:bg-white/5 hover:border-yellow-400 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-yellow-400 focus:bg-yellow-500/5 focus:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all css-color-scheme-dark`}
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 w-full group">
                                        <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide group-focus-within:text-yellow-400 transition-colors">
                                            <FaLock className="text-yellow-500" /> Mật khẩu
                                        </label>
                                        <div className="flex flex-col xl:flex-row gap-2 items-start xl:items-center">
                                            <div className="relative flex-1 w-full">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={isLogin?.password || ''}
                                                    disabled
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
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            name="currentPassword"
                                                            value={passwordData.currentPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Nhập mật khẩu cũ..."
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
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            name="newPassword"
                                                            value={passwordData.newPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Nhập mật khẩu mới..."
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
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            name="confirmPassword"
                                                            value={passwordData.confirmPassword}
                                                            onChange={handlePasswordChange}
                                                            placeholder="Xác nhận mật khẩu..."
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
                                                    <button onClick={handleSavePassword} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 border border-yellow-500 text-[#0f172a] text-sm font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:bg-yellow-400 hover:scale-105 transition-all duration-300 cursor-pointer">
                                                        <FaSave className="text-lg" /> Xác nhận
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center min-h-[500px]">
                            <p className="text-slate-200 text-lg flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                                Chức năng <strong className="text-cyan-400">{activeTab}</strong> đang được phát triển...
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Chọn Khung */}
            {showFrameModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setShowFrameModal(false)}
                >
                    <div 
                        className="bg-[#1e293b] border border-cyan-500/30 rounded-2xl p-6 w-full max-w-2xl relative shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setShowFrameModal(false)}
                            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-slate-700/50 text-slate-400 hover:text-white hover:bg-rose-500 hover:rotate-90 hover:scale-110 hover:shadow-[0_0_15px_rgba(244,63,94,0.5)] transition-all duration-300"
                        >
                            <FaTimes className="text-lg" />
                        </button>
                        
                        <h2 className="text-2xl font-black text-white mb-6 text-center uppercase tracking-wider flex items-center justify-center gap-3">
                            <FaCrown className="text-yellow-500" />
                            Bộ sưu tập khung ảnh
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                            {AVAILABLE_FRAMES.map(frame => {
                                const isUnlocked = currentPlanInfo.level >= frame.minLevel;
                                const isSelected = currentSelectedTheme === frame.id;
                                
                                return (
                                    <div 
                                        key={frame.id}
                                        onClick={() => isUnlocked && handleSelectFrame(frame.id)}
                                        className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300 relative ${
                                            isUnlocked 
                                                ? 'cursor-pointer hover:bg-white/5 border ' + (isSelected ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'border-slate-700 hover:border-slate-500') 
                                                : 'opacity-50 grayscale cursor-not-allowed border border-slate-800 bg-black/20'
                                        }`}
                                    >
                                        {!isUnlocked && (
                                            <div className="absolute inset-0 flex items-center justify-center z-30 overflow-hidden rounded-xl pointer-events-none">
                                                <div className="absolute w-[150%] h-[14px] rotate-45" style={{ 
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='26' height='14' viewBox='0 0 26 14' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23cbd5e1'/%3E%3Cstop offset='100%25' stop-color='%23475569'/%3E%3C/linearGradient%3E%3ClinearGradient id='g2' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23f1f5f9'/%3E%3Cstop offset='100%25' stop-color='%2394a3b8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='1' y='1' width='18' height='12' rx='6' fill='transparent' stroke='url(%23g)' stroke-width='2.5'/%3E%3Crect x='16' y='3' width='9' height='8' rx='4' fill='url(%23g2)' stroke='%230f172a' stroke-width='1.5'/%3E%3C/svg%3E")`, 
                                                    backgroundRepeat: 'repeat-x', 
                                                    backgroundPosition: 'center',
                                                    filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.9))' 
                                                }}></div>
                                                
                                                <div className="absolute w-[150%] h-[14px] -rotate-45" style={{ 
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='26' height='14' viewBox='0 0 26 14' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23cbd5e1'/%3E%3Cstop offset='100%25' stop-color='%23475569'/%3E%3C/linearGradient%3E%3ClinearGradient id='g2' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23f1f5f9'/%3E%3Cstop offset='100%25' stop-color='%2394a3b8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='1' y='1' width='18' height='12' rx='6' fill='transparent' stroke='url(%23g)' stroke-width='2.5'/%3E%3Crect x='16' y='3' width='9' height='8' rx='4' fill='url(%23g2)' stroke='%230f172a' stroke-width='1.5'/%3E%3C/svg%3E")`, 
                                                    backgroundRepeat: 'repeat-x', 
                                                    backgroundPosition: 'center',
                                                    filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.9))' 
                                                }}></div>
                                                
                                                <div className="z-10 bg-gradient-to-b from-slate-700 to-slate-900 w-[42px] h-[42px] flex items-center justify-center rounded-full border-[3px] border-slate-400 shadow-[0_5px_15px_rgba(0,0,0,1),inset_0_2px_4px_rgba(255,255,255,0.4)] relative">
                                                    <div className="absolute top-[2px] w-[26px] h-3 rounded-full border-t-2 border-slate-300 opacity-60"></div>
                                                    <FaLock className="text-lg text-slate-300 drop-shadow-[0_2px_2px_black]" />
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="relative flex items-center justify-center pb-2">
                                            <WingedFrame theme={frame.id} size={64}>
                                                <img src={isLogin?.imgUrl || Coder} alt="avatar" className="w-full h-full object-cover" />
                                            </WingedFrame>
                                        </div>
                                        <p className={`text-xs font-bold text-center ${isSelected ? 'text-cyan-400' : 'text-slate-300'}`}>
                                            {frame.label}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Account;

