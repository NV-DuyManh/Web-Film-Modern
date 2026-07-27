import React, { useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthProvider';
import { FaCreditCard } from 'react-icons/fa';

function PayMovie(props) {
    const { isLogin } = useContext(AuthContext);
    
    const movieData = {
        name: 'Gặp Lại Chị Bầu',
        resolution: 'HD',
        duration: '120 phút',
        price: '20.000 VNĐ',
        discount: '0đ',
        total: '20.000 VNĐ',
    };

    return (
        <div className="min-h-screen bg-[#0f1322] pt-28 pb-20 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        Thanh toán phim lẻ
                    </h1>
                    <p className="text-slate-300 text-sm">Thưởng thức siêu phẩm điện ảnh ngay tại nhà</p>
                    <div className="w-16 h-1 bg-gradient-to-r from-rose-500 to-pink-500 mx-auto mt-3 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                    
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <h2 className="text-xl font-black text-white mb-8 tracking-wide flex items-center gap-2 uppercase">
                            <span className="w-2 h-6 bg-rose-500 rounded-full inline-block"></span>
                            Thông tin thanh toán
                        </h2>
                        
                        <div className="flex flex-col sm:flex-row gap-6 mb-8">
                            <div className="w-full sm:w-1/3 aspect-[3/4] sm:aspect-[3/4] rounded-xl overflow-hidden shrink-0 border-2 border-slate-700 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-rose-900 to-slate-900 group-hover:scale-105 transition-transform duration-500"></div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/40">
                                    <div className="font-black text-white text-xl uppercase text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight">
                                        {movieData.name}
                                    </div>
                                    <div className="text-rose-400 text-xs font-bold mt-2 uppercase tracking-widest border border-rose-500/50 px-2 py-1 rounded bg-black/50 backdrop-blur-sm">Poster</div>
                                </div>
                            </div>
                            
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between text-sm border-b border-slate-700/50 pb-2">
                                    <span className="text-slate-300 font-medium">Tài khoản:</span>
                                    <span className="text-white font-bold">{isLogin?.fullName || isLogin?.email || 'Khách'}</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-slate-700/50 pb-2">
                                    <span className="text-slate-300 font-medium">Phim:</span>
                                    <span className="text-rose-400 font-black">{movieData.name}</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-slate-700/50 pb-2">
                                    <span className="text-slate-300 font-medium">Độ phân giải:</span>
                                    <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">{movieData.resolution}</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-slate-700/50 pb-2">
                                    <span className="text-slate-300 font-medium">Thời hạn:</span>
                                    <span className="text-white font-bold">{movieData.duration}</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-slate-700/50 pb-2">
                                    <span className="text-slate-300 font-medium">Đơn giá:</span>
                                    <span className="text-white font-bold">{movieData.price}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-300 font-medium">Khuyến mãi:</span>
                                    <span className="text-green-400 font-bold">-{movieData.discount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-700 pt-6 flex justify-between items-center mb-6">
                            <span className="text-white font-black text-lg uppercase tracking-wide">Tổng cộng</span>
                            <span className="text-rose-400 font-black text-2xl drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]">{movieData.total}</span>
                        </div>

                        <p className="text-slate-400 text-xs mb-6">
                            * Lưu ý: Thời gian thuê phim là 30 ngày sau khi thuê và còn 48 giờ khi bắt đầu xem phim.
                        </p>

                        <button className="text-rose-400 text-sm hover:underline font-bold">Áp dụng mã ưu đãi</button>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <h2 className="text-xl font-black text-white mb-6 tracking-wide flex items-center gap-2 uppercase">
                            <span className="w-2 h-6 bg-yellow-400 rounded-full inline-block"></span>
                            Chọn phương thức
                        </h2>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                            <div className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-yellow-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(250,204,21,0.2)] group">
                                <span className="text-xs text-slate-300 group-hover:text-white font-medium">Thẻ tín dụng</span>
                                <div className="flex gap-1">
                                    <div className="w-8 h-5 bg-white rounded flex items-center justify-center text-[8px] text-blue-800 font-black italic">VISA</div>
                                    <div className="w-8 h-5 bg-white rounded flex items-center justify-center text-[8px] text-red-600 font-black italic">MC</div>
                                </div>
                            </div>
                            <div className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-pink-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(244,114,182,0.2)] group">
                                <span className="text-xs text-slate-300 group-hover:text-white font-medium">Ví MoMo</span>
                                <div className="text-pink-400 font-black tracking-wide bg-white/10 px-2 py-0.5 rounded">MoMo</div>
                            </div>
                            <div className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-blue-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(96,165,250,0.2)] group">
                                <span className="text-xs text-slate-300 group-hover:text-white font-medium">Ví ZaloPay</span>
                                <div className="text-blue-400 font-black text-sm tracking-wide">Zalo<span className="text-green-400">Pay</span></div>
                            </div>
                            <div className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-orange-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(251,146,60,0.2)] group">
                                <span className="text-xs text-slate-300 group-hover:text-white font-medium">Ví ShopeePay</span>
                                <div className="w-6 h-6 bg-orange-500 rounded text-white flex items-center justify-center text-xs font-black shadow-md">S</div>
                            </div>
                            <div className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-red-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(248,113,113,0.2)] group">
                                <span className="text-xs text-slate-300 group-hover:text-white font-medium">VNPAY</span>
                                <div className="text-red-500 font-black text-sm tracking-widest">VN<span className="text-blue-500">PAY</span></div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button className="w-full h-14 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 rounded-xl flex items-center justify-center transition-all shadow-[0_4px_15px_rgba(251,191,36,0.3)] hover:-translate-y-1">
                                <span className="text-[#003087] font-black italic text-2xl drop-shadow-sm">PayPal</span>
                            </button>
                            
                            <button className="w-full h-14 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl flex items-center justify-center gap-3 transition-colors">
                                <FaCreditCard className="text-white text-xl" />
                                <span className="text-white font-bold">Thẻ ghi nợ hoặc tín dụng</span>
                            </button>
                            
                            <div className="text-center pt-2">
                                <span className="text-slate-400 text-xs italic">Thanh toán an toàn được hỗ trợ bởi </span>
                                <span className="text-blue-400 text-sm font-bold italic">PayPal</span>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-700/50">
                                <button className="w-full h-14 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 rounded-xl flex items-center justify-center transition-all shadow-[0_4px_15px_rgba(225,29,72,0.4)] hover:-translate-y-1">
                                    <span className="text-white font-black text-lg tracking-wide">THANH TOÁN NGAY</span>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default PayMovie;
