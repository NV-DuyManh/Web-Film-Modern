import React from 'react';

function ModalPayMovie({ show, movieName, onClose, onGoHome }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
                style={{ animation: 'modalFadeIn 0.4s ease-out forwards' }}
                onClick={onGoHome}
            ></div>
            
            <div 
                className="relative w-full max-w-md p-[1px] rounded-[2.5rem] overflow-hidden shadow-[0_0_30px_rgba(244,63,94,0.15)]"
                style={{ animation: 'modalSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            >
                <div className="absolute inset-0 opacity-40">
                    <div 
                        className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_300deg,#f43f5e_360deg)]"
                        style={{ animation: 'spinGradient 6s linear infinite', transformOrigin: 'center center' }}
                    ></div>
                    <div 
                        className="absolute inset-[-50%] bg-[conic-gradient(from_180deg,transparent_0_300deg,#ec4899_360deg)]"
                        style={{ animation: 'spinGradient 6s linear infinite', transformOrigin: 'center center' }}
                    ></div>
                </div>

                <div className="relative bg-[#0b101e] rounded-[2.5rem] p-8 overflow-hidden h-full">
                    <div className="absolute -top-20 -left-20 w-56 h-56 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                    <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-pink-600/10 blur-[80px] rounded-full pointer-events-none"></div>
                    
                    <div className="absolute top-12 left-10 w-1.5 h-1.5 bg-rose-300 rounded-full opacity-50 shadow-[0_0_5px_#fda4af]" style={{ animation: 'floatUp1 4s ease-in-out infinite' }}></div>
                    <div className="absolute bottom-32 right-12 w-2 h-2 bg-fuchsia-400 rounded-full opacity-40 shadow-[0_0_5px_#e879f9]" style={{ animation: 'floatUp2 5s ease-in-out infinite 1s' }}></div>
                    <div className="absolute top-24 right-16 w-1 h-1 bg-pink-300 rounded-full opacity-30 shadow-[0_0_5px_#f9a8d4]" style={{ animation: 'floatUp1 4.5s ease-in-out infinite 0.5s' }}></div>

                    <div className="absolute inset-0 border-[1px] border-white/5 rounded-[2.5rem] pointer-events-none shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]"></div>

                    <div className="relative z-10 flex flex-col items-center text-center mt-2">
                        <div 
                            className="w-24 h-24 mb-6 rounded-full bg-linear-to-br from-rose-400 to-pink-600 flex items-center justify-center border-4 border-[#0b101e] relative"
                            style={{ animation: 'checkmarkBounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both, pulseGlow 2s infinite 1s' }}
                        >
                            <div className="absolute inset-0 rounded-full border border-white/20"></div>
                            <div className="absolute inset-[-10px] rounded-full border border-rose-400/20 animate-ping opacity-30"></div>
                            <svg className="w-12 h-12 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h3 className="text-3xl font-black mb-3">
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-400 via-pink-400 to-fuchsia-400 drop-shadow-lg">
                                Thuê phim thành công!
                            </span>
                        </h3>
                        
                        <p className="text-slate-300 text-[15px] mb-8 leading-relaxed px-2">
                            Chúc mừng bạn đã thuê thành công bộ phim <br/>
                            <span className="font-bold text-lg text-rose-400 mt-2 block">{movieName}</span><br/>
                            Nhấn <strong className="text-white">Xem ngay</strong> để bắt đầu thưởng thức.
                        </p>

                        <div className="w-full flex flex-col sm:flex-row gap-3">
                            <button 
                                type="button"
                                onClick={onGoHome}
                                className="w-full sm:w-1/2 py-3.5 rounded-2xl font-bold text-[14px] text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 shadow-lg backdrop-blur-md transition-all duration-300 active:scale-[0.98] order-2 sm:order-1 cursor-pointer"
                            >
                                VỀ TRANG CHI TIẾT
                            </button>
                            
                            <button 
                                type="button"
                                onClick={onClose}
                                className="w-full sm:w-1/2 py-3.5 rounded-2xl font-black text-[15px] text-white tracking-wide bg-linear-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 shadow-[0_8px_20px_rgba(244,63,94,0.4)] hover:shadow-[0_12px_25px_rgba(244,63,94,0.6)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] group overflow-hidden relative border border-rose-400/50 order-1 sm:order-2 cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-r from-rose-400/20 to-pink-500/20 mix-blend-overlay"></div>
                                <span className="relative z-10">XEM NGAY</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalPayMovie;
