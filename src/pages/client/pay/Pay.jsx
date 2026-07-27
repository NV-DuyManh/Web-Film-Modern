import React, { useState } from 'react';
import { FaCheckCircle, FaStar, FaCrown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function Pay(props) {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState('rental');

    return (
        <div className="min-h-screen bg-[#0f1322] pt-24 pb-20 px-4 flex justify-center">
            <div className="w-full max-w-3xl">
                <h1 className="text-3xl md:text-4xl font-black text-white text-center mb-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    Phương thức thanh toán
                </h1>

                <div className="mb-10">
                    <div className="flex items-center justify-center mb-6">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                        <span className="px-4 text-cyan-400 font-semibold text-sm uppercase tracking-wider drop-shadow-[0_0_5px_rgba(34,211,238,0.4)]">
                            Bạn đang chọn thuê
                        </span>
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
                                <span className={`text-2xl font-black ${selectedPlan === 'rental' ? 'text-white' : 'text-slate-300'}`}>
                                    20.000<span className="text-lg underline underline-offset-2 ml-0.5">đ</span>
                                </span>
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
                        <span className="px-4 text-yellow-400 font-semibold text-sm uppercase tracking-wider drop-shadow-[0_0_5px_rgba(250,204,21,0.4)]">
                            Tiết kiệm hơn với Combo
                        </span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div 
                            onClick={() => setSelectedPlan('sieu-viet')}
                            className={`relative rounded-3xl p-6 cursor-pointer transition-all duration-300 border-2 overflow-hidden bg-slate-900/60 backdrop-blur-md flex flex-col h-full group ${selectedPlan === 'sieu-viet' ? 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.15)] scale-[1.02]' : 'border-white/10 hover:border-white/30 hover:bg-slate-800/60'}`}
                        >
                            {selectedPlan === 'sieu-viet' && (
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/10 blur-3xl rounded-full"></div>
                            )}
                            <div className="absolute top-0 right-0 bg-yellow-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl shadow-lg flex items-center gap-1">
                                <FaStar /> Lựa chọn tốt nhất
                            </div>
                            <div className="flex justify-between items-start mb-4 mt-2 relative z-10">
                                <h3 className={`text-2xl font-black tracking-wide ${selectedPlan === 'sieu-viet' ? 'text-yellow-400' : 'text-slate-200'}`}>Siêu Việt</h3>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedPlan === 'sieu-viet' ? 'border-yellow-400' : 'border-slate-500'}`}>
                                    {selectedPlan === 'sieu-viet' && <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>}
                                </div>
                            </div>
                            <div className="mb-4 relative z-10">
                                <span className={`text-3xl font-black ${selectedPlan === 'sieu-viet' ? 'text-white' : 'text-slate-300'}`}>
                                    200.000<span className="text-xl underline underline-offset-2 ml-0.5">đ</span>
                                </span>
                                <span className="text-slate-400 text-sm ml-2">/ tháng</span>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-300 flex-1 relative z-10">
                                <li className="flex items-start gap-2">
                                    <FaCheckCircle className="text-green-400 mt-0.5 shrink-0" />
                                    <span>Thời hạn 1 tháng, gia hạn tự động.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <FaCheckCircle className="text-green-400 mt-0.5 shrink-0" />
                                    <span>Đã bao gồm phim bạn đang chọn thuê.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <FaCheckCircle className="text-green-400 mt-0.5 shrink-0" />
                                    <span>Xem phim không giới hạn với hơn 10.000 giờ nội dung đặc sắc.</span>
                                </li>
                            </ul>
                        </div>

                        <div 
                            onClick={() => setSelectedPlan('galaxy-vip')}
                            className={`relative rounded-3xl p-6 cursor-pointer transition-all duration-300 border-2 overflow-hidden bg-slate-900/60 backdrop-blur-md flex flex-col h-full group ${selectedPlan === 'galaxy-vip' ? 'border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.15)] scale-[1.02]' : 'border-white/10 hover:border-white/30 hover:bg-slate-800/60'}`}
                        >
                            {selectedPlan === 'galaxy-vip' && (
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-400/10 blur-3xl rounded-full"></div>
                            )}
                            <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl shadow-lg flex items-center gap-1">
                                <FaCrown /> Premium VIP
                            </div>
                            <div className="flex justify-between items-start mb-4 mt-2 relative z-10">
                                <h3 className={`text-2xl font-black tracking-wide ${selectedPlan === 'galaxy-vip' ? 'text-rose-400' : 'text-slate-200'}`}>Galaxy VIP</h3>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedPlan === 'galaxy-vip' ? 'border-rose-400' : 'border-slate-500'}`}>
                                    {selectedPlan === 'galaxy-vip' && <div className="w-3 h-3 bg-rose-400 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>}
                                </div>
                            </div>
                            <div className="mb-4 relative z-10">
                                <span className={`text-3xl font-black ${selectedPlan === 'galaxy-vip' ? 'text-white' : 'text-slate-300'}`}>
                                    300.000<span className="text-xl underline underline-offset-2 ml-0.5">đ</span>
                                </span>
                                <span className="text-slate-400 text-sm ml-2">/ tháng</span>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-300 flex-1 relative z-10">
                                <li className="flex items-start gap-2">
                                    <FaCheckCircle className="text-green-400 mt-0.5 shrink-0" />
                                    <span>Chất lượng 4K HDR & Âm thanh vòm vòm 5.1.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <FaCheckCircle className="text-green-400 mt-0.5 shrink-0" />
                                    <span>Đã bao gồm tất cả đặc quyền Siêu Việt.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <FaCheckCircle className="text-green-400 mt-0.5 shrink-0" />
                                    <span>Tải xuống xem offline không giới hạn.</span>
                                </li>
                            </ul>
                        </div>
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
                        <span className="w-full text-center text-xs text-slate-500 mb-2 uppercase tracking-widest">Dev Menu (Click để xem nhanh)</span>
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