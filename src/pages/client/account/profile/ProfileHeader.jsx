import React, { useState, useRef } from 'react';
import { FaCamera, FaCrown, FaTimes, FaLock } from 'react-icons/fa';
import Coder from '../../../../assets/Coder.png';
import { WingedFrame } from '../../../../components/client/header/AvatarFrames';
import { AuthContext } from '../../../../contexts/AuthProvider';

function ProfileHeader({ isLogin, currentPlanInfo, currentSelectedTheme, AVAILABLE_FRAMES, onAvatarChange, onSelectFrame }) {
    const [showFrameModal, setShowFrameModal] = useState(false);
    const fileInputRef = useRef(null);
    const { globalAvatarPreview } = React.useContext(AuthContext);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onAvatarChange(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <>
            <div className="bg-[#1e293b]/60 rounded-2xl border border-yellow-500/50 p-6 flex flex-col xl:flex-row gap-4 items-center justify-between relative shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center shrink-0">
                    <div className="relative shrink-0 group flex items-center justify-center my-4 sm:my-2">
                        <div className="cursor-pointer" onClick={() => setShowFrameModal(true)}>
                            <WingedFrame theme={currentSelectedTheme} size={96}>
                                <img
                                    src={globalAvatarPreview || isLogin?.avatarUrl || Coder}
                                    alt="avatar"
                                    className="w-full h-full object-cover"
                                />
                            </WingedFrame>
                        </div>

                        <input
                            type="file"
                            accept=".png, .jpg, .jpeg, .webp, .gif"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                            className="absolute -bottom-1 -right-1 w-8.5 h-8.5 bg-linear-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-slate-900 border-2 border-[#1e293b] shadow-[0_4px_10px_rgba(0,0,0,0.4)] hover:scale-110 hover:rotate-12 hover:shadow-[0_0_15px_rgba(245,158,11,0.7)] active:scale-95 transition-all duration-300 cursor-pointer z-50"
                        >
                            <FaCamera className="text-[14px]" />
                        </button>
                    </div>

                    <div className="flex flex-col items-center sm:items-start mt-1">
                        <h1 className="text-3xl font-serif font-bold text-white mb-1 tracking-wide drop-shadow-md">
                            {isLogin?.name}
                        </h1>
                        <div className="text-yellow-400 text-[14px] font-medium tracking-wide mb-3 opacity-90">
                            {isLogin?.email}
                        </div>
                    </div>
                </div>

                <div className="mt-4 xl:mt-0 self-center shrink-0 group cursor-default">
                    {currentPlanInfo.name === 'ADMIN' ? (
                        <div className="relative px-7 py-3 rounded-full flex items-center gap-3 overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #4c1d95, #7c3aed, #9333ea)',
                                border: '2px solid #fbbf24',
                                boxShadow: '0 0 20px rgba(147, 51, 234, 0.5), 0 0 40px rgba(147, 51, 234, 0.2), inset 0 1px 0 rgba(255,255,255,0.15)'
                            }}>
                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent animate-avatar-shine"></div>
                            <FaCrown className="text-xl text-yellow-400 z-10 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                            <span className="z-10 text-[15px] font-black uppercase tracking-widest text-transparent bg-clip-text"
                                style={{ backgroundImage: 'linear-gradient(to right, #fef08a, #fbbf24, #f59e0b)' }}>
                                Hạng hiện tại: ADMIN
                            </span>
                        </div>
                    ) : (
                        <div className={`
                            relative px-6 py-2.5 rounded-full flex items-center gap-3 
                            bg-transparent
                            text-${currentPlanInfo.theme}-400 text-[15px] font-black uppercase tracking-widest
                            border border-${currentPlanInfo.theme}-400/50 hover:border-${currentPlanInfo.theme}-400
                            transition-colors duration-300
                        `}>
                            <div className={`absolute inset-0 rounded-full bg-${currentPlanInfo.theme}-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                            <FaCrown className="text-xl drop-shadow-[0_0_8px_currentColor] z-10" />
                            <span className="z-10 drop-shadow-[0_0_5px_currentColor]">
                                Hạng hiện tại: {currentPlanInfo.name === 'PRENIUM' ? 'PREMIUM' : currentPlanInfo.name}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <div className="bg-[#1e293b]/60 border border-cyan-500/70 rounded-2xl py-3 px-4 flex flex-col items-center justify-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    <p className="text-3xl font-black text-cyan-400">1</p>
                    <p className="text-[11px] font-bold text-slate-200 uppercase tracking-widest text-center">ĐÃ XEM</p>
                </div>
                <div className="bg-[#1e293b]/60 border border-emerald-500/70 rounded-2xl py-3 px-4 flex flex-col items-center justify-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <p className="text-3xl font-black text-emerald-400">2</p>
                    <p className="text-[11px] font-bold text-slate-200 uppercase tracking-widest text-center">ĐÁNH GIÁ</p>
                </div>
                <div className="bg-[#1e293b]/60 border border-purple-500/70 rounded-2xl py-3 px-4 flex flex-col items-center justify-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                    <p className="text-3xl font-black text-purple-400">3</p>
                    <p className="text-[11px] font-bold text-slate-200 uppercase tracking-widest text-center">WATCHLIST</p>
                </div>
                <div className="bg-[#1e293b]/60 border border-rose-500/70 rounded-2xl py-3 px-4 flex flex-col items-center justify-center gap-1 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                    <p className="text-3xl font-black text-rose-400">4</p>
                    <p className="text-[11px] font-bold text-slate-200 uppercase tracking-widest text-center">THEO DÕI</p>
                </div>
            </div>

            {showFrameModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setShowFrameModal(false)}
                >
                    <div
                        className="bg-[#1e293b] border border-cyan-500/30 rounded-2xl p-6 w-full max-w-2xl relative shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowFrameModal(false)}
                            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-slate-700/50 text-slate-400 hover:text-white hover:bg-rose-500 hover:rotate-90 hover:scale-110 hover:shadow-[0_0_15px_rgba(244,63,94,0.5)] transition-all duration-300"
                        >
                            <FaTimes className="text-lg" />
                        </button>

                        <h2 className="text-2xl font-black text-white mb-6 text-center uppercase tracking-wider flex items-center justify-center gap-3">
                            <FaCrown className="text-yellow-500" />
                            Bộ sưu tập khung ảnh
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                            {AVAILABLE_FRAMES.map(frame => {
                                const isUnlocked = currentPlanInfo.level >= frame.minLevel;
                                const isSelected = currentSelectedTheme === frame.id;

                                return (
                                    <div
                                        key={frame.id}
                                        onClick={() => {
                                            if (isUnlocked) {
                                                onSelectFrame(frame.id);
                                                setShowFrameModal(false);
                                            }
                                        }}
                                        className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300 relative ${isUnlocked
                                                ? 'cursor-pointer hover:bg-white/5 border ' + (isSelected ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'border-slate-700 hover:border-slate-500')
                                                : 'opacity-50 grayscale cursor-not-allowed border border-slate-800 bg-black/20'
                                            }`}
                                    >
                                        {!isUnlocked && (
                                            <div className="absolute inset-0 flex items-center justify-center z-30 overflow-hidden rounded-xl pointer-events-none">
                                                <div className="absolute w-[150%] h-3.5 rotate-45" style={{
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='26' height='14' viewBox='0 0 26 14' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23cbd5e1'/%3E%3Cstop offset='100%25' stop-color='%23475569'/%3E%3C/linearGradient%3E%3ClinearGradient id='g2' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23f1f5f9'/%3E%3Cstop offset='100%25' stop-color='%2394a3b8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='1' y='1' width='18' height='12' rx='6' fill='transparent' stroke='url(%23g)' stroke-width='2.5'/%3E%3Crect x='16' y='3' width='9' height='8' rx='4' fill='url(%23g2)' stroke='%230f172a' stroke-width='1.5'/%3E%3C/svg%3E")`,
                                                    backgroundRepeat: 'repeat-x',
                                                    backgroundPosition: 'center',
                                                    filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.9))'
                                                }}></div>

                                                <div className="absolute w-[150%] h-3.5 -rotate-45" style={{
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='26' height='14' viewBox='0 0 26 14' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23cbd5e1'/%3E%3Cstop offset='100%25' stop-color='%23475569'/%3E%3C/linearGradient%3E%3ClinearGradient id='g2' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23f1f5f9'/%3E%3Cstop offset='100%25' stop-color='%2394a3b8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='1' y='1' width='18' height='12' rx='6' fill='transparent' stroke='url(%23g)' stroke-width='2.5'/%3E%3Crect x='16' y='3' width='9' height='8' rx='4' fill='url(%23g2)' stroke='%230f172a' stroke-width='1.5'/%3E%3C/svg%3E")`,
                                                    backgroundRepeat: 'repeat-x',
                                                    backgroundPosition: 'center',
                                                    filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.9))'
                                                }}></div>

                                                <div className="z-10 bg-linear-to-b from-slate-700 to-slate-900 w-10.5 h-10.5 flex items-center justify-center rounded-full border-[3px] border-slate-400 shadow-[0_5px_15px_rgba(0,0,0,1),inset_0_2px_4px_rgba(255,255,255,0.4)] relative">
                                                    <div className="absolute top-0.5 w-6.5 h-3 rounded-full border-t-2 border-slate-300 opacity-60"></div>
                                                    <FaLock className="text-lg text-slate-300 drop-shadow-[0_2px_2px_black]" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="relative flex items-center justify-center pb-2">
                                            <WingedFrame theme={frame.id} size={64}>
                                                <img src={isLogin?.avatarUrl || Coder} alt="avatar" className="w-full h-full object-cover" />
                                            </WingedFrame>
                                        </div>
                                        <p className={`text-xs font-bold text-center ${isSelected ? 'text-cyan-400' : 'text-slate-300'}`}>
                                            {frame.label}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ProfileHeader;
