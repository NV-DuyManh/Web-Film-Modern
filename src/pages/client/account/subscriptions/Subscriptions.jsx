import React, { useContext } from 'react';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { SubscriptionContext } from '../../../../contexts/SubscriptionProvider';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { getObjectById } from '../../../../services/firebaseResponse';
import { FaCrown, FaCalendarAlt, FaHistory, FaRegCreditCard } from 'react-icons/fa';
import { getThemeNameByIndex, getThemeColorStyle } from '../../../../utils/themeUtils';
function Subscriptions() {
    const { isLogin } = useContext(AuthContext);
    const subscriptions = useContext(SubscriptionContext);
    const plans = useContext(PlanContext);
    const userSubs = subscriptions.filter(s => s.userID === isLogin?.id);

    const groupedSubs = {};
    userSubs.forEach(sub => {
        if (!groupedSubs[sub.planID]) {
            groupedSubs[sub.planID] = [];
        }
        groupedSubs[sub.planID].push(sub);
    });

    const displaySubs = Object.values(groupedSubs).map(subsGroup => {
        let latestSub = subsGroup[0];
        let maxExpiry = new Date(0);
        let totalPrice = 0;

        for (const sub of subsGroup) {
            const exp = sub.expiryDate?.seconds ? new Date(sub.expiryDate.seconds * 1000) : new Date(sub.expiryDate);
            if (exp > maxExpiry) {
                maxExpiry = exp;
                latestSub = sub;
            }
            totalPrice += Number(sub.price) || 0;
        }

        const start = latestSub.startDate?.seconds ? new Date(latestSub.startDate.seconds * 1000) : new Date(latestSub.startDate);

        return {
            ...latestSub,
            startDate: start,
            expiryDate: maxExpiry,
            price: totalPrice.toFixed(2), 
            status: latestSub.status || 'Success'
        };
    }).sort((a, b) => b.expiryDate.getTime() - a.expiryDate.getTime());

    const sortedPlans = [...plans].sort((a, b) => Number(a.level) - Number(b.level));
    
    const getThemeByPlan = (planData) => {
        const index = sortedPlans.findIndex(p => p.id === planData?.id);
        return getThemeNameByIndex(index);
    };

    const getCardStyle = () => {
        return 'bg-gradient-to-b from-[#0f172a]/90 to-[#020617]/90 backdrop-blur-xl border border-cyan-500/30 shadow-[0_8px_30px_rgba(6,182,212,0.08)]';
    };

    const formatDate = (dateObj) => {
        if (!dateObj) return 'N/A';
        if (dateObj instanceof Date) return dateObj.toLocaleDateString('vi-VN');
        if (dateObj.toDate) return dateObj.toDate().toLocaleDateString('vi-VN');
        if (dateObj.seconds) return new Date(dateObj.seconds * 1000).toLocaleDateString('vi-VN');
        return new Date(dateObj).toLocaleDateString('vi-VN');
    };

    return (
        <div className="w-full flex flex-col gap-6 p-6 bg-[#1e293b]/60 rounded-2xl border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] min-h-full">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                        <FaCrown className="text-yellow-400 text-xl drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
                    </div>
                    Gói Đăng Ký Của Tôi
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 relative z-10">
                {displaySubs.length > 0 ? displaySubs.map((s) => {
                    const plan = getObjectById(plans, s.planID);
                    const theme = getThemeByPlan(plan);

                    return (
                        <div key={s.id} className={`rounded-2xl relative overflow-hidden flex flex-col ${getCardStyle()}`}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-400 to-transparent opacity-60"></div>
                            
                            <div className="p-6 flex flex-col items-center border-b border-white/5">
                                <div className={`inline-flex font-black px-6 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-lg tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.2)]`}>
                                    {plan?.name || 'Gói chưa xác định'}
                                </div>
                            </div>

                            <div className="p-6 space-y-4 flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-medium flex items-center gap-2 text-sm">
                                        <FaCalendarAlt className="text-slate-500 text-base" /> Ngày bắt đầu:
                                    </span>
                                    <span className="text-white font-semibold text-[15px] tracking-wide">{formatDate(s.startDate)}</span>
                                </div>
                                
                                <div className="w-full h-px bg-white/5"></div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-medium flex items-center gap-2 text-sm">
                                        <FaHistory className="text-slate-500 text-base" /> Ngày hết hạn:
                                    </span>
                                    <span className="text-white font-semibold text-[15px] tracking-wide">{formatDate(s.expiryDate)}</span>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-cyan-950/30 border-t border-cyan-500/10 flex items-center justify-between">
                                <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Tổng thanh toán</span>
                                <div className={`font-black text-xl tracking-wide flex items-center gap-1.5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]`}>
                                    <FaRegCreditCard className="text-lg opacity-80" /> 
                                    ${s.price}
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-black/20 rounded-2xl border border-white/5 border-dashed">
                        <FaCrown className="text-4xl text-slate-600 mb-3" />
                        <p className="text-lg">Bạn chưa có gói đăng ký nào.</p>
                        <p className="text-sm mt-1">Hãy nâng cấp tài khoản để trải nghiệm tốt hơn!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Subscriptions;