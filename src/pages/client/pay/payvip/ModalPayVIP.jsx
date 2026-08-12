import React from 'react';

function ModalPayVIP({ show, packageInfo, theme, getBadgeStyle, onClose }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/70"
                style={{ animation: 'modalFadeIn 0.4s ease-out forwards' }}
            ></div>
            
            <div 
                className="relative w-full max-w-md p-0.5 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.25)]"
                style={{ animation: 'modalSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            >
                <div 
                    className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_300deg,#06b6d4_360deg)]"
                    style={{ animation: 'spinGradient 4s linear infinite', transformOrigin: 'center center' }}
                ></div>
                <div 
                    className="absolute inset-[-50%] bg-[conic-gradient(from_180deg,transparent_0_300deg,#3b82f6_360deg)]"
                    style={{ animation: 'spinGradient 4s linear infinite', transformOrigin: 'center center' }}
                ></div>

                <div className="relative bg-[#0b101e] rounded-[2.5rem] p-8 overflow-hidden h-full">
                    <div className="absolute -top-20 -left-20 w-56 h-56 bg-cyan-500/20 blur-[60px] rounded-full pointer-events-none"></div>
                    <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-blue-600/20 blur-[60px] rounded-full pointer-events-none"></div>
                    
                    <div className="absolute top-12 left-10 w-2 h-2 bg-cyan-300 rounded-full shadow-[0_0_10px_#67e8f9]" style={{ animation: 'floatUp1 3s ease-in-out infinite' }}></div>
                    <div className="absolute bottom-32 right-12 w-3 h-3 bg-purple-400 rounded-full shadow-[0_0_12px_#c084fc]" style={{ animation: 'floatUp2 4s ease-in-out infinite 1s' }}></div>
                    <div className="absolute top-24 right-16 w-1.5 h-1.5 bg-blue-300 rounded-full shadow-[0_0_8px_#93c5fd]" style={{ animation: 'floatUp1 3.5s ease-in-out infinite 0.5s' }}></div>

                    <div className="absolute inset-0 border border-white/5 rounded-[2.5rem] pointer-events-none shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]"></div>

                    <div className="relative z-10 flex flex-col items-center text-center mt-2">
                        <div 
                            className="w-24 h-24 mb-6 rounded-full bg-linear-to-br from-cyan-400 to-blue-600 flex items-center justify-center border-4 border-[#0b101e] relative"
                            style={{ animation: 'checkmarkBounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both, pulseGlow 2s infinite 1s' }}
                        >
                            <div className="absolute inset-0 rounded-full border border-white/30"></div>
                            <div className="absolute inset-[-10px] rounded-full border border-cyan-400/30 animate-ping opacity-50"></div>
                            <svg className="w-12 h-12 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h3 className="text-3xl font-black mb-3">
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-300 via-blue-400 to-purple-400 drop-shadow-lg">
                                Thanh toán thành công!
                            </span>
                        </h3>
                        
                        <p className="text-slate-300 text-[15px] mb-8 leading-relaxed px-2">
                            Chúc mừng bạn đã đăng ký gói <span className={`font-bold px-2 py-0.5 rounded-md border ${getBadgeStyle(theme)}`}>{packageInfo.name}</span>.<br/>
                            Tận hưởng trải nghiệm xem phim không giới hạn ngay bây giờ!
                        </p>

                        <button 
                            type="button"
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl font-black text-[17px] text-white tracking-wide bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_8px_25px_rgba(6,182,212,0.5)] hover:shadow-[0_15px_35px_rgba(6,182,212,0.7)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] group overflow-hidden relative border border-cyan-400/50 cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-r from-cyan-400/20 to-blue-500/20 mix-blend-overlay"></div>
                            <span className="relative z-10">BẮT ĐẦU TRẢI NGHIỆM</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalPayVIP;
