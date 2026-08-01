import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaCrown } from 'react-icons/fa';
import { AuthContext } from '../../../contexts/AuthProvider';
import { PlanContext } from '../../../contexts/PlanProvider';
import { FeatureContext } from '../../../contexts/FeatureProvider';
import Logo5 from '../../../assets/Logo5.png';
import { SubscriptionContext } from '../../../contexts/SubscriptionProvider';
import { getObjectById } from '../../../services/firebaseReponse';

import { WingedFrame } from '../../../components/client/header/AvatarFrames';

function UpgradeVIP(props) {
    const navigate = useNavigate();
    const { isLogin } = useContext(AuthContext);
    const [selectedPlan, setSelectedPlan] = useState('');
    const plans = useContext(PlanContext);
    const features = useContext(FeatureContext);
    const subscriptions = useContext(SubscriptionContext)

    const themeNames = ['blue', 'cyan', 'yellow', 'rose'];

    const sortedPlans = [...plans].sort((a, b) => Number(a.level) - Number(b.level));

    const displayPlans = sortedPlans.map((plan, index) => {
        const theme = themeNames[index] || themeNames[themeNames.length - 1];
        const planFeatures = features.filter(f => f.planID === plan.id && f.available).map(f => f.description);

        return {
            ...plan,
            rawPrice: Number(plan.price),
            formattedPrice: Number(plan.price).toLocaleString('vi-VN'),
            features: planFeatures,
            themeClass: `vip-theme-${theme}`,
            themeName: theme,
            best: index === 2
        };
    });

    const [autoSelectedForLevel, setAutoSelectedForLevel] = useState(null);

    const levelUser = useMemo(() => {
        if (!isLogin || !subscriptions || !plans) return 0;
        const allPlan = subscriptions.filter(p => {
            if (p.userId != isLogin.id) return false;
            if (!p.expiryDate) return false;
            const expiry = typeof p.expiryDate.toDate === 'function'
                ? p.expiryDate.toDate()
                : (p.expiryDate.seconds ? new Date(p.expiryDate.seconds * 1000) : new Date(p.expiryDate));
            return expiry > new Date();
        });
        const levelMax = allPlan.reduce((max, item) => {
            const plan = getObjectById(plans, item.planID);
            return plan && plan.level > max ? plan.level : max;
        }, 0);
        return levelMax;
    }, [subscriptions, isLogin, plans]);

    useEffect(() => {
        if (displayPlans.length > 0 && autoSelectedForLevel !== levelUser) {
            const currentPlan = displayPlans.find(p => p.level == levelUser);
            const defaultPlan = currentPlan || displayPlans.find(p => p.best) || displayPlans[0];
            setSelectedPlan(defaultPlan.id);
            setAutoSelectedForLevel(levelUser);
        }
    }, [displayPlans, levelUser, autoSelectedForLevel]);
    console.log(levelUser);

    const currentPlanName = useMemo(() => {
        if (!plans || plans.length === 0) return "Miễn phí";
        const p = plans.find(plan => plan.level == levelUser);
        return p ? p.name : "Miễn phí";
    }, [levelUser, plans]);

    return (
        <div className="min-h-screen bg-[#0f1322] pt-24 pb-20 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        Tài Khoản VIP
                    </h1>
                    <p className="text-slate-300 text-sm">Nâng tầm trải nghiệm giải trí của bạn với các đặc quyền không giới hạn</p>
                </div>

                <div className="flex flex-col items-center mb-12">
                    <div className="relative flex items-center gap-4 bg-[#0a0f1d]/80 backdrop-blur-xl py-3 px-6 rounded-full border border-cyan-500/30 shadow-[0_0_25px_rgba(34,211,238,0.15)] hover:shadow-[0_0_35px_rgba(34,211,238,0.3)] hover:border-cyan-400/50 hover:-translate-y-1 transition-all duration-500 overflow-hidden group cursor-pointer">
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

                        <div className="relative">
                            <img
                                src={isLogin?.imgUrl}
                                alt="Avatar"
                                className="w-14 h-14 rounded-full object-cover border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 rounded-full border border-cyan-300/30 animate-ping opacity-20" />
                        </div>

                        <div className="relative z-10 pr-2">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-black bg-linear-to-r from-white via-cyan-100 to-slate-300 bg-clip-text text-transparent drop-shadow-sm tracking-wide">
                                    {isLogin?.fullName || isLogin?.email || 'Khách'}
                                </h3>
                                <FaCrown className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] text-sm animate-pulse" />
                            </div>
                            <div className="flex items-center gap-3 text-[13px]">
                                <div className="text-slate-400 flex items-center gap-1.5">
                                    Gói hiện tại:
                                    <span className={`font-bold ${levelUser > 0 ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.6)]' : 'text-slate-300'}`}>
                                        {currentPlanName}
                                    </span>
                                </div>
                                <div className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.5)]"></div>
                                <div className="text-slate-400 flex items-center gap-1.5">
                                    Số dư:
                                    <span className="text-yellow-400 font-black drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] tracking-wide">
                                        {isLogin?.balance ? isLogin.balance.toLocaleString('vi-VN') : '0'}₫
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center mb-8">
                    <div className="h-px flex-1 bg-linear-to-r from-transparent via-slate-600 to-transparent"></div>
                    <p className="px-4 text-white font-bold text-lg uppercase tracking-widest drop-shadow-md inline">
                        Chọn gói phù hợp
                    </p>
                    <div className="h-px flex-1 bg-linear-to-r from-transparent via-slate-600 to-transparent"></div>
                </div>









                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {displayPlans.map((plan) => {
                        const canBuy = plan.rawPrice > 0 && plan.level >= levelUser;
                        const isSelected = selectedPlan === plan.id;

                        return (
                            <div
                                key={plan.id}
                                onClick={() => canBuy && setSelectedPlan(plan.id)}
                                className={`vip-card ${plan.themeClass} ${isSelected ? 'selected' : ''} relative rounded-3xl p-6 transition-all duration-300 overflow-hidden bg-slate-900/70 backdrop-blur-md flex flex-col group ${isSelected
                                        ? `border-2 scale-105 z-10`
                                        : 'border-2 border-white/10'
                                    } ${canBuy
                                        ? 'cursor-pointer hover:border-white/30 hover:bg-slate-800/70'
                                        : 'cursor-not-allowed hover:bg-slate-900/70'
                                    }`}
                            >
                                {isSelected && (
                                    <div className="vip-glow-bg absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full"></div>
                                )}

                                {plan.best && (
                                    <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-black px-3 py-1 rounded-bl-xl rounded-tr-2xl shadow-lg">
                                        PHỔ BIẾN
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <h3 className={`vip-text text-xl font-black tracking-wide ${isSelected ? 'selected' : 'text-slate-200'}`}>{plan.name}</h3>
                                    {plan.rawPrice === 0 ? (
                                        <></>
                                    ) : (
                                        <div className={`vip-border-dot w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'selected' : 'border-slate-500'}`}>
                                            {isSelected && <div className="vip-dot-inner w-2.5 h-2.5 rounded-full shadow-md"></div>}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-center items-center mb-6 mt-2 relative z-10">
                                    <WingedFrame theme={plan.themeName} size={56}>
                                        <img src={isLogin?.imgUrl || Logo5} alt="avatar preview" className="w-full h-full object-cover" />
                                    </WingedFrame>
                                </div>

                                <div className="mb-6 relative z-10 border-b border-slate-700/50 pb-4 flex justify-center items-baseline gap-1">
                                    <div className={`text-2xl font-bold tracking-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                        {plan.formattedPrice}
                                        <span className="text-lg font-semibold ml-0.5">đ</span>
                                    </div>
                                    <span className="text-slate-400 text-sm font-medium">/tháng</span>
                                </div>

                                <ul className="space-y-3.5 flex-1 relative z-10">
                                    {plan.features.map((feat) => (
                                        <li className="flex items-start gap-3">
                                            <FaCheckCircle className="mt-1 shrink-0 text-yellow-500 text-[15px]" />
                                            <p className="text-white font-medium text-[15px] leading-tight">{feat}</p>
                                        </li>
                                    ))}

                                </ul>
                                {
                                    levelUser == plan.level && (
                                        <div className="w-full mt-5 flex justify-center items-center gap-2 bg-linear-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm py-3 rounded-full shadow-[0_4px_15px_rgba(16,185,129,0.4)] cursor-default ring-2 ring-emerald-400/50">
                                            <FaCheckCircle className="text-white text-[16px]" />
                                            <span>Gói hiện tại</span>
                                        </div>
                                    )
                                }

                            </div>
                        )
                    })}
                </div>

                <div className="flex flex-col items-center space-y-4">
                    <button
                        onClick={() => navigate(`/payVip?id=${selectedPlan}`)}
                        className="w-full md:w-2/3 max-w-md bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-full shadow-[0_4px_15px_rgba(79,70,229,0.4)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.6)] hover:-translate-y-1 transition-all duration-300"
                    >
                        Tiếp tục thanh toán
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors hover:underline underline-offset-4"
                    >
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UpgradeVIP;
