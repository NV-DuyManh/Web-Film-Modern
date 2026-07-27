import React, { useState, useContext } from 'react';
import { FaCheckCircle, FaStar, FaCrown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { PlanContext } from '../../../contexts/PlanProvider';
import { FeatureContext } from '../../../contexts/FeatureProvider';

function Pay(props) {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState('rental');
    const plans = useContext(PlanContext) || [];
    const features = useContext(FeatureContext) || [];
    
    const sortedPlans = [...plans].sort((a, b) => Number(a.level) - Number(b.level));
    const topPlans = sortedPlans.slice(-2); // Get the 2 highest level plans

    return (
        <div className="min-h-screen bg-[#0f1322] pt-24 pb-20 px-4 flex justify-center">
            <div className="w-full max-w-3xl">
                <h1 className="text-3xl md:text-4xl font-black text-white text-center mb-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    Phương thức thanh toán
                </h1>

                <div className="mb-10">
                    <div className="flex items-center justify-center mb-6">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                        <p className="px-4 text-cyan-400 font-semibold text-sm uppercase tracking-wider drop-shadow-[0_0_5px_rgba(34,211,238,0.4)] inline">
                            Bạn đang chọn thuê
                        </p>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                    </div>

                    <div 
                        onClick={() => setSelectedPlan('rental')}
                        className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-300 border-2 overflow-hidden bg-slate-900/60 backdrop-blur-md group ${selectedPlan === 'rental' ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'border-white/10 hover:border-white/30'}`}
                    >
                        {selectedPlan === 'rental' && (
                            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/20 blur-3xl rounded-full"></div>
                        )}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center relative z-10 gap-4">
                            <div>
                                <h3 className={`text-xl font-bold transition-colors ${selectedPlan === 'rental' ? 'text-cyan-400' : 'text-slate-200'}`}>Gặp Lại Chị Bầu</h3>
                                <p className="text-slate-400 text-sm mt-1">Thuê phim lẻ trong 48 giờ.</p>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4">
                                <p className={`text-2xl font-black ${selectedPlan === 'rental' ? 'text-white' : 'text-slate-300'} inline`}>
                                    20.000<p className="text-lg underline underline-offset-2 ml-0.5 inline">đ</p>
                                </p>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedPlan === 'rental' ? 'border-cyan-400' : 'border-slate-500'}`}>
                                    {selectedPlan === 'rental' && <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-10">
                    <div className="flex items-center justify-center mb-6">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                        <p className="px-4 text-yellow-400 font-semibold text-sm uppercase tracking-wider drop-shadow-[0_0_5px_rgba(250,204,21,0.4)] inline">
                            Tiết kiệm hơn với Combo
                        </p>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {topPlans.map((plan, index) => {
                            const isPremium = index === 0;
                            const theme = isPremium 
                                ? { textColor: 'text-yellow-400', borderColor: 'border-yellow-400', shadowColor: 'shadow-[0_0_25px_rgba(250,204,21,0.15)]', glowColor: 'bg-yellow-400/10', dotShadow: 'shadow-[0_0_8px_rgba(250,204,21,0.8)]', dotBg: 'bg-yellow-400', badgeBg: 'bg-yellow-500', icon: <FaStar />, badgeText: 'Lựa chọn tốt nhất' }
                                : { textColor: 'text-rose-400', borderColor: 'border-rose-400', shadowColor: 'shadow-[0_0_25px_rgba(244,63,94,0.15)]', glowColor: 'bg-rose-400/10', dotShadow: 'shadow-[0_0_8px_rgba(244,63,94,0.8)]', dotBg: 'bg-rose-400', badgeBg: 'bg-rose-500', icon: <FaCrown />, badgeText: 'Premium VIP' };

                            const planFeatures = features.filter(f => f.planID === plan.id && f.available);

                            return (
                                <div 
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={`relative rounded-3xl p-6 cursor-pointer transition-all duration-300 border-2 overflow-hidden bg-slate-900/60 backdrop-blur-md flex flex-col h-full group ${selectedPlan === plan.id ? `${theme.borderColor} ${theme.shadowColor} scale-[1.02]` : 'border-white/10 hover:border-white/30 hover:bg-slate-800/60'}`}
                                >
                                    {selectedPlan === plan.id && (
                                        <div className={`absolute -top-10 -right-10 w-40 h-40 ${theme.glowColor} blur-3xl rounded-full`}></div>
                                    )}
                                    <div className={`absolute top-0 right-0 ${theme.badgeBg} text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl shadow-lg flex items-center gap-1`}>
                                        {theme.icon} {theme.badgeText}
                                    </div>
                                    <div className="flex justify-between items-start mb-4 mt-2 relative z-10">
                                        <h3 className={`text-2xl font-black tracking-wide ${selectedPlan === plan.id ? theme.textColor : 'text-slate-200'}`}>{plan.name}</h3>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedPlan === plan.id ? theme.borderColor : 'border-slate-500'}`}>
                                            {selectedPlan === plan.id && <div className={`w-3 h-3 ${theme.dotBg} rounded-full ${theme.dotShadow}`}></div>}
                                        </div>
                                    </div>
                                    <div className="mb-4 relative z-10">
                                        <p className={`text-3xl font-black ${selectedPlan === plan.id ? 'text-white' : 'text-slate-300'} inline`}>
                                            {Number(plan.price).toLocaleString('vi-VN')}<p className="text-xl underline underline-offset-2 ml-0.5 inline">đ</p>
                                        </p>
                                        <p className="text-slate-400 text-sm ml-2 inline">/ tháng</p>
                                    </div>
                                    <ul className="space-y-3.5 text-sm flex-1 relative z-10 mt-2">
                                        {planFeatures.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <FaCheckCircle className="mt-1 shrink-0 text-yellow-500 text-[15px]" />
                                                <p className="text-white font-medium text-[15px] leading-tight">{feature.description}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col items-center mt-12 space-y-4">
                    <button 
                        onClick={() => {
                            if (selectedPlan === 'rental') {
                                navigate('/payMovie/123');
                            } else {
                                navigate('/payVip');
                            }
                        }}
                        className="w-full md:w-2/3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white font-bold text-lg py-4 rounded-full shadow-[0_4px_15px_rgba(245,158,11,0.4)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.6)] hover:-translate-y-1 transition-all duration-300">
                        Tiếp tục thanh toán
                    </button>
                    <button 
                        onClick={() => navigate('/')}
                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors hover:underline underline-offset-4"
                    >
                        Xem kho phim và thanh toán sau
                    </button>

                    <div className="mt-12 flex flex-wrap gap-4 justify-center border-t border-slate-700/50 pt-8 w-full max-w-lg">
                        <p className="w-full text-center text-xs text-slate-500 mb-2 uppercase tracking-widest inline">Dev Menu (Click để xem nhanh)</p>
                        <button onClick={() => navigate('/upgrade')} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-yellow-400 text-sm font-bold shadow-lg transition-colors border border-yellow-500/30">
                            👑 Xem Màn hình Nâng Cấp VIP
                        </button>
                        <button onClick={() => navigate('/payVip')} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-blue-400 text-sm font-bold shadow-lg transition-colors border border-blue-500/30">
                            💳 Xem Thanh toán VIP
                        </button>
                        <button onClick={() => navigate('/payMovie/1')} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-rose-400 text-sm font-bold shadow-lg transition-colors border border-rose-500/30">
                            🎬 Xem Thanh toán Phim Lẻ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Pay;