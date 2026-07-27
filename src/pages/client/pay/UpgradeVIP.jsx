import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaCrown } from 'react-icons/fa';
import { AuthContext } from '../../../contexts/AuthProvider';
import Logo5 from '../../../assets/Logo5.png';

function UpgradeVIP(props) {
    const navigate = useNavigate();
    const { isLogin } = useContext(AuthContext);
    const [selectedPlan, setSelectedPlan] = useState('sieu-viet');

    const plans = [
        {
            id: 'co-ban',
            name: 'Cơ bản',
            price: '39.000',
            features: [
                'Không quảng cáo',
                'Xem kho phim chuẩn'
            ],
            theme: 'blue',
            color: 'text-blue-400',
            borderColor: 'border-blue-400',
            glowColor: 'shadow-[0_0_15px_rgba(96,165,250,0.15)]',
            bgGlow: 'bg-blue-400/10'
        },
        {
            id: 'cao-cap',
            name: 'Cao cấp',
            price: '79.000',
            features: [
                'Không quảng cáo',
                'Hỗ trợ đa nền tảng',
                'Hơn 10.000 giờ phim'
            ],
            theme: 'cyan',
            color: 'text-cyan-400',
            borderColor: 'border-cyan-400',
            glowColor: 'shadow-[0_0_15px_rgba(34,211,238,0.15)]',
            bgGlow: 'bg-cyan-400/10'
        },
        {
            id: 'sieu-viet',
            name: 'Siêu Việt',
            price: '129.000',
            features: [
                'Hỗ trợ đa nền tảng',
                'Kho phim chiếu rạp độc quyền',
                'Toàn bộ đặc quyền Cao Cấp'
            ],
            theme: 'yellow',
            color: 'text-yellow-400',
            borderColor: 'border-yellow-400',
            glowColor: 'shadow-[0_0_25px_rgba(250,204,21,0.25)]',
            bgGlow: 'bg-yellow-400/10',
            best: true
        },
        {
            id: 'vip',
            name: 'Premium VIP',
            price: '199.000',
            features: [
                'Xem 4K HDR & Âm thanh 5.1',
                'Tải xuống xem offline',
                'Xem không giới hạn mọi nền tảng'
            ],
            theme: 'rose',
            color: 'text-rose-400',
            borderColor: 'border-rose-400',
            glowColor: 'shadow-[0_0_20px_rgba(244,63,94,0.2)]',
            bgGlow: 'bg-rose-400/10'
        }
    ];

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
                                <span className="text-slate-400">Gói hiện tại: <span className="text-white font-semibold">Miễn phí</span></span>
                                <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                                <span className="text-slate-400">Số dư: <span className="text-yellow-400 font-bold">0₫</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center mb-8">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                    <span className="px-4 text-white font-bold text-lg uppercase tracking-widest drop-shadow-md">
                        Chọn gói phù hợp
                    </span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {plans.map((plan) => {
                        const isSelected = selectedPlan === plan.id;
                        return (
                            <div 
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`relative rounded-3xl p-6 cursor-pointer transition-all duration-300 overflow-hidden bg-slate-900/70 backdrop-blur-md flex flex-col group ${
                                    isSelected 
                                    ? `border-2 scale-105 z-10 ${plan.borderColor} ${plan.glowColor}` 
                                    : 'border-2 border-white/10 hover:border-white/30 hover:bg-slate-800/70'
                                }`}
                            >
                                {isSelected && (
                                    <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full ${plan.bgGlow}`}></div>
                                )}
                                
                                {plan.best && (
                                    <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl rounded-tr-2xl shadow-lg">
                                        PHỔ BIẾN
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <h3 className={`text-xl font-black tracking-wide ${isSelected ? plan.color : 'text-slate-200'}`}>{plan.name}</h3>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? plan.borderColor : 'border-slate-500'}`}>
                                        {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${plan.bgGlow.replace('/10', '')} shadow-md`}></div>}
                                    </div>
                                </div>
                                
                                <div className="mb-6 relative z-10 border-b border-slate-700/50 pb-4">
                                    <span className={`text-3xl font-black ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                        {plan.price}<span className="text-xl underline underline-offset-2 ml-0.5">đ</span>
                                    </span>
                                    <span className="text-slate-400 text-xs ml-1">/tháng</span>
                                </div>
                                
                                <ul className="space-y-3 flex-1 relative z-10">
                                    {plan.features.map((feat, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                                            <FaCheckCircle className={`mt-0.5 shrink-0 ${isSelected ? plan.color : 'text-slate-500'}`} />
                                            <span className={isSelected ? 'text-white' : 'text-slate-300'}>{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    })}
                </div>

                <div className="flex flex-col items-center space-y-4">
                    <button 
                        onClick={() => navigate('/payVip')}
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
