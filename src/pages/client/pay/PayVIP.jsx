import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../../contexts/AuthProvider';
import { PlanContext } from '../../../contexts/PlanProvider';
import { PackageContext } from '../../../contexts/PackageProvider';
import { FaCreditCard } from 'react-icons/fa';
import { useSearchParams, useNavigate } from 'react-router-dom';

function PayVIP(props) {
    const { isLogin } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const planId = searchParams.get('id');
    const plans = useContext(PlanContext) || [];
    const packages = useContext(PackageContext) || [];
    
    const selectedPlanData = plans.find(p => p.id === planId) || plans[0] || {};
    
    const packageInfo = {
        name: selectedPlanData.name || 'Gói Cao cấp',
        basePrice: selectedPlanData.price ? Number(selectedPlanData.price) : 79000
    };

    const planPackages = packages.filter(p => p.planID === selectedPlanData.id).sort((a, b) => Number(a.time) - Number(b.time));
    
    const durations = planPackages.length > 0 ? planPackages.map((p, idx) => ({
        id: p.id,
        months: Number(p.time),
        discount: Number(p.discount) || 0,
        tag: idx === 0 ? 'Phổ Biến' : ''
    })) : [
        { id: '1', months: 1, discount: 15, tag: 'Phổ Biến' },
        { id: '2', months: 2, discount: 20 },
        { id: '6', months: 6, discount: 25 },
    ];

    const [selectedDuration, setSelectedDuration] = useState(durations[0]?.id || '1');

    useEffect(() => {
        if (durations.length > 0 && !durations.find(d => d.id === selectedDuration)) {
            setSelectedDuration(durations[0].id);
        }
    }, [durations, selectedDuration]);

    const calculatePrice = (months, discount) => {
        const originalPrice = packageInfo.basePrice * months;
        const discountedPrice = originalPrice * (1 - discount / 100);
        return {
            original: originalPrice.toLocaleString('vi-VN'),
            final: discountedPrice.toLocaleString('vi-VN')
        };
    };

    const currentDuration = durations.find(d => d.id === selectedDuration) || durations[0];
    const priceData = calculatePrice(currentDuration?.months || 1, currentDuration?.discount || 0);

    const today = new Date();
    const effectiveDateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const renewDate = new Date();
    if (currentDuration) {
        renewDate.setMonth(renewDate.getMonth() + currentDuration.months);
    }
    const renewDateStr = renewDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div className="min-h-screen bg-[#0f1322] pt-28 pb-20 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        Phương thức thanh toán
                    </h1>
                    <p className="text-slate-300 text-sm">Hủy bất cứ lúc nào</p>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto mt-3 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <h2 className="text-xl font-black text-white mb-6 tracking-wide flex items-center gap-2">
                            <p className="w-2 h-6 bg-cyan-400 rounded-full inline-block inline"></p>
                            THỜI HẠN GÓI CAO CẤP
                        </h2>
                        
                        <div className="space-y-4 mb-8">
                            {durations.map(dur => {
                                const price = calculatePrice(dur.months, dur.discount);
                                const isSelected = selectedDuration === dur.id;
                                return (
                                    <label 
                                        key={dur.id} 
                                        onClick={() => setSelectedDuration(dur.id)}
                                        className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border-2 transition-all duration-300 ${
                                            isSelected 
                                            ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.15)] scale-[1.02]' 
                                            : 'border-white/5 bg-slate-800/40 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-cyan-400' : 'border-slate-500'}`}>
                                                {isSelected && <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-black text-lg ${isSelected ? 'text-cyan-400' : 'text-white'} inline`}>{dur.months} tháng</p>
                                                    {dur.tag && (
                                                        <p className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] px-2 py-0.5 rounded font-bold shadow-md inline">{dur.tag}</p>
                                                    )}
                                                </div>
                                                <p className="text-slate-300 text-sm inline">Tiết kiệm {dur.discount}%</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-black text-lg ${isSelected ? 'text-white' : 'text-slate-200'}`}>{price.final}đ</div>
                                            <div className="text-slate-400 text-sm line-through">{price.original}đ</div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>

                        <div className="flex justify-between items-end mb-6 border-b border-slate-700/50 pb-2">
                            <h2 className="text-lg font-black text-white tracking-wide">THÔNG TIN THANH TOÁN</h2>
                            <button onClick={() => navigate('/upgrade')} className="text-cyan-400 text-sm font-semibold hover:underline">Thay đổi gói</button>
                        </div>

                        <div className="flex items-start gap-5 bg-slate-800/60 p-5 rounded-2xl border border-white/5">
                            <div className="w-16 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                                <FaCreditCard className="text-3xl text-white drop-shadow-md" />
                            </div>
                            <div className="flex-1 space-y-2.5">
                                <div className="flex justify-between text-sm">
                                    <p className="text-slate-300 inline">Tài khoản</p>
                                    <p className="text-white font-bold inline">{isLogin?.fullName || isLogin?.email || 'Khách'}</p>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <p className="text-slate-300 inline">Tên gói</p>
                                    <p className="text-cyan-400 font-bold inline">{packageInfo.name}</p>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <p className="text-slate-300 inline">Thời hạn *</p>
                                    <p className="text-white font-bold inline">{currentDuration?.months || 1} tháng</p>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <p className="text-slate-300 inline">Ngày hiệu lực</p>
                                    <p className="text-white font-bold inline">{effectiveDateStr}</p>
                                </div>
                                <div className="flex justify-between text-sm border-b border-slate-700/50 pb-2.5">
                                    <p className="text-slate-300 inline">Tự động gia hạn</p>
                                    <p className="text-white font-bold inline">{renewDateStr}</p>
                                </div>
                                
                                <div className="flex justify-between text-sm pt-1">
                                    <p className="text-slate-300 inline">Đơn giá</p>
                                    <p className="text-white font-bold inline">{packageInfo.basePrice.toLocaleString('vi-VN')}đ</p>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <p className="text-slate-300 inline">Khuyến mãi</p>
                                    <p className="text-green-400 font-bold inline">-{currentDuration?.discount || 0}%</p>
                                </div>
                                
                                <div className="border-t border-slate-600 pt-3 mt-3 flex justify-between items-center">
                                    <p className="text-white font-black text-lg inline">Tổng cộng</p>
                                    <p className="text-cyan-400 font-black text-xl inline">{priceData.final}đ</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-slate-400 text-xs mt-4 mb-2">
                            * Thuê bao tự động gia hạn hàng tháng trừ khi bạn hủy thuê bao ít nhất 24 giờ trước khi hết hạn.
                        </p>
                        <button className="text-cyan-400 text-sm hover:underline font-bold">Áp dụng mã ưu đãi</button>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <h2 className="text-xl font-black text-white mb-6 tracking-wide flex items-center gap-2">
                            <p className="w-2 h-6 bg-yellow-400 rounded-full inline-block inline"></p>
                            CHỌN PHƯƠNG THỨC
                        </h2>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                            <div className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-yellow-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(250,204,21,0.2)] group">
                                <p className="text-xs text-slate-300 group-hover:text-white font-medium inline">Thẻ tín dụng</p>
                                <div className="flex gap-1">
                                    <div className="w-8 h-5 bg-white rounded flex items-center justify-center text-[8px] text-blue-800 font-black italic">VISA</div>
                                    <div className="w-8 h-5 bg-white rounded flex items-center justify-center text-[8px] text-red-600 font-black italic">MC</div>
                                </div>
                            </div>
                            <div className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-pink-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(244,114,182,0.2)] group">
                                <p className="text-xs text-slate-300 group-hover:text-white font-medium inline">Ví MoMo</p>
                                <div className="text-pink-400 font-black tracking-wide bg-white/10 px-2 py-0.5 rounded">MoMo</div>
                            </div>
                            <div className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-blue-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(96,165,250,0.2)] group">
                                <p className="text-xs text-slate-300 group-hover:text-white font-medium inline">Ví ZaloPay</p>
                                <div className="text-blue-400 font-black text-sm tracking-wide">Zalo<p className="text-green-400 inline">Pay</p></div>
                            </div>
                            <div className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-orange-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(251,146,60,0.2)] group">
                                <p className="text-xs text-slate-300 group-hover:text-white font-medium inline">Ví ShopeePay</p>
                                <div className="w-6 h-6 bg-orange-500 rounded text-white flex items-center justify-center text-xs font-black shadow-md">S</div>
                            </div>
                            <div className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-red-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(248,113,113,0.2)] group">
                                <p className="text-xs text-slate-300 group-hover:text-white font-medium inline">VNPAY</p>
                                <div className="text-red-500 font-black text-sm tracking-widest">VN<p className="text-blue-500 inline">PAY</p></div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button className="w-full h-14 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 rounded-xl flex items-center justify-center transition-all shadow-[0_4px_15px_rgba(251,191,36,0.3)] hover:-translate-y-1">
                                <p className="text-[#003087] font-black italic text-2xl drop-shadow-sm inline">PayPal</p>
                            </button>
                            
                            <button className="w-full h-14 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl flex items-center justify-center gap-3 transition-colors">
                                <FaCreditCard className="text-white text-xl" />
                                <p className="text-white font-bold inline">Thẻ ghi nợ hoặc tín dụng</p>
                            </button>
                            
                            <div className="text-center pt-2">
                                <p className="text-slate-400 text-xs italic inline">Thanh toán an toàn được hỗ trợ bởi </p>
                                <p className="text-blue-400 text-sm font-bold italic inline">PayPal</p>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-700/50">
                                <button className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl flex items-center justify-center transition-all shadow-[0_4px_15px_rgba(6,182,212,0.4)] hover:-translate-y-1">
                                    <p className="text-white font-black text-lg tracking-wide inline">THANH TOÁN NGAY</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PayVIP;
