import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaCrown } from 'react-icons/fa';
import { AuthContext } from '../../../contexts/AuthProvider';
import { PlanContext } from '../../../contexts/PlanProvider';
import { FeatureContext } from '../../../contexts/FeatureProvider';
import Logo5 from '../../../assets/Logo5.png';

function UpgradeVIP(props) {
    const navigate = useNavigate();
    const { isLogin } = useContext(AuthContext);
    const [selectedPlan, setSelectedPlan] = useState('');
    const plans = useContext(PlanContext) || [];
    const features = useContext(FeatureContext) || [];

    const themeNames = ['blue', 'cyan', 'yellow', 'rose'];

    const sortedPlans = [...plans].sort((a, b) => Number(a.level) - Number(b.level));
    
    const displayPlans = sortedPlans.map((plan, index) => {
        const theme = themeNames[index] || themeNames[themeNames.length - 1];
        const planFeatures = features
            .filter(f => f.planID === plan.id && f.available)
            .map(f => f.description);

        return {
            ...plan,
            rawPrice: Number(plan.price),
            formattedPrice: Number(plan.price).toLocaleString('vi-VN'),
            features: planFeatures,
            themeClass: `vip-theme-${theme}`,
            best: index === 2
        };
    });

    useEffect(() => {
        if (displayPlans.length > 0 && !selectedPlan) {
            const bestPlan = displayPlans.find(p => p.best) || displayPlans[0];
            setSelectedPlan(bestPlan.id);
        }
    }, [displayPlans, selectedPlan]);

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
                    <div className="flex items-center gap-4 bg-slate-800/80 backdrop-blur-md py-3 px-6 rounded-full border border-slate-600 shadow-lg">
                        <img 
                            src={isLogin?.imgUrl || Logo5} 
                            alt="Avatar" 
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white">{isLogin?.fullName || isLogin?.email || 'Khách'}</h3>
                                <FaCrown className="text-slate-400" />
                            </div>
                            <div className="flex items-center gap-4 text-xs mt-0.5">
                                <p className="text-slate-400 inline">Gói hiện tại: <p className="text-white font-semibold inline">Miễn phí</p></p>
                                <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                                <p className="text-slate-400 inline">Số dư: <p className="text-yellow-400 font-bold inline">0₫</p></p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center mb-8">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                    <p className="px-4 text-white font-bold text-lg uppercase tracking-widest drop-shadow-md inline">
                        Chọn gói phù hợp
                    </p>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {displayPlans.map((plan) => {
                        const isSelected = selectedPlan === plan.id;
                        return (
                            <div 
                                key={plan.id}
                                onClick={() => plan.rawPrice > 0 && setSelectedPlan(plan.id)}
                                className={`vip-card ${plan.themeClass} ${isSelected ? 'selected' : ''} relative rounded-3xl p-6 transition-all duration-300 overflow-hidden bg-slate-900/70 backdrop-blur-md flex flex-col group ${
                                    isSelected 
                                    ? `border-2 scale-105 z-10` 
                                    : 'border-2 border-white/10'
                                } ${
                                    plan.rawPrice > 0 
                                    ? 'cursor-pointer hover:border-white/30 hover:bg-slate-800/70' 
                                    : 'cursor-default opacity-80 hover:bg-slate-900/70'
                                }`}
                            >
                                {isSelected && (
                                    <div className="vip-glow-bg absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full"></div>
                                )}
                                
                                {plan.best && (
                                    <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl rounded-tr-2xl shadow-lg">
                                        PHỔ BIẾN
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <h3 className={`vip-text text-xl font-black tracking-wide ${isSelected ? 'selected' : 'text-slate-200'}`}>{plan.name}</h3>
                                    {plan.rawPrice === 0 ? (
                                        <div className="bg-white/10 border border-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full backdrop-blur-md shadow-[0_4px_10px_rgba(0,0,0,0.3)] tracking-wider">
                                            GÓI HIỆN TẠI
                                        </div>
                                    ) : (
                                        <div className={`vip-border-dot w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'selected' : 'border-slate-500'}`}>
                                            {isSelected && <div className="vip-dot-inner w-2.5 h-2.5 rounded-full shadow-md"></div>}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mb-6 relative z-10 border-b border-slate-700/50 pb-4">
                                    <p className={`text-3xl font-black ${isSelected ? 'text-white' : 'text-slate-300'} inline`}>
                                        {plan.formattedPrice}<p className="text-xl underline underline-offset-2 ml-0.5 inline">đ</p>
                                    </p>
                                    <p className="text-slate-400 text-xs ml-1 inline">/tháng</p>
                                </div>
                                
                                <ul className="space-y-3.5 flex-1 relative z-10">
                                    {plan.features.map((feat, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <FaCheckCircle className="mt-1 shrink-0 text-yellow-500 text-[15px]" />
                                            <p className="text-white font-medium text-[15px] leading-tight">{feat}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    })}
                </div>

                <div className="flex flex-col items-center space-y-4">
                    <button 
                        onClick={() => navigate(`/payVip?id=${selectedPlan}`)}
                        className="w-full md:w-2/3 max-w-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg py-4 rounded-full shadow-[0_4px_15px_rgba(79,70,229,0.4)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.6)] hover:-translate-y-1 transition-all duration-300"
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
