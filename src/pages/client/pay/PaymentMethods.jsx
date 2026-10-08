// Original payment branding is decorative; checkout below uses PayPal.
export default function PaymentMethods() {
    return (<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                            <div aria-disabled="true" className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-yellow-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition hover:shadow-[0_0_15px_rgba(250,204,21,0.2)] group">
                                <p className="text-xs text-slate-300 group-hover:text-white font-medium inline">Thẻ tín dụng</p>
                                <div className="flex gap-1">
                                    <div className="w-8 h-5 bg-white rounded flex items-center justify-center text-[8px] text-blue-800 font-black italic">VISA</div>
                                    <div className="w-8 h-5 bg-white rounded flex items-center justify-center text-[8px] text-red-600 font-black italic">MC</div>
                                </div>
                            </div>
                            <div aria-disabled="true" className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-pink-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition hover:shadow-[0_0_15px_rgba(244,114,182,0.2)] group">
                                <p className="text-xs text-slate-300 group-hover:text-white font-medium inline">Ví MoMo</p>
                                <div className="text-pink-400 font-black tracking-wide bg-white/10 px-2 py-0.5 rounded">MoMo</div>
                            </div>
                            <div aria-disabled="true" className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-blue-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition hover:shadow-[0_0_15px_rgba(96,165,250,0.2)] group">
                                <p className="text-xs text-slate-300 group-hover:text-white font-medium inline">Ví ZaloPay</p>
                                <div className="text-blue-400 font-black text-sm tracking-wide">Zalo<p className="text-green-400 inline">Pay</p></div>
                            </div>
                            <div aria-disabled="true" className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-orange-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition hover:shadow-[0_0_15px_rgba(251,146,60,0.2)] group">
                                <p className="text-xs text-slate-300 group-hover:text-white font-medium inline">Ví ShopeePay</p>
                                <div className="w-6 h-6 bg-orange-500 rounded text-white flex items-center justify-center text-xs font-black shadow-md">S</div>
                            </div>
                            <div aria-disabled="true" className="h-20 bg-slate-800/80 border-2 border-transparent hover:border-red-400 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-2 transition hover:shadow-[0_0_15px_rgba(248,113,113,0.2)] group">
                                <p className="text-xs text-slate-300 group-hover:text-white font-medium inline">VNPAY</p>
                                <div className="text-red-500 font-black text-sm tracking-widest">VN<p className="text-blue-500 inline">PAY</p></div>
                            </div>
                        </div>);
}
