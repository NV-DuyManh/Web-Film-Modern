import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { LISTACCOUNT } from '../../../utils/Constants';
import { FaUser, FaChevronDown } from 'react-icons/fa';
import NoelBackground from '../../admin/noelBackground/NoelBackground';
import Profile from '../../../pages/client/account/profile/Profile';
import Favorites from '../../../pages/client/account/favorites/Favorites';
import ListFilm from '../../../pages/client/account/listFilm/ListFilm';
import ContinueFilm from '../../../pages/client/account/continueFilm/ContinueFilm';
import Notify from '../../../pages/client/account/notify/Notify';
import RentMovies from '../../../pages/client/account/rentMovies/RentMovies';
import Subscriptions from '../../../pages/client/account/subscriptions/Subscriptions';

function MenuAccount() {
    const { tab } = useParams();
    const navigate = useNavigate();

    const activeItem = LISTACCOUNT.find(item => item.path === `/account/${tab}`) || LISTACCOUNT[0];
    const activeTab = activeItem.name;

    useEffect(() => {
        if (!tab) {
            navigate('/account/account', { replace: true });
        }
    }, [tab, navigate]);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'Tài Khoản': return <Profile />;
            case 'Yêu Thích': return <Favorites />;
            case 'Danh Sách': return <ListFilm />;
            case 'Xem Tiếp': return <ContinueFilm />;
            case 'Thông Báo': return <Notify />;
            case 'Gói Đăng Ký': return <Subscriptions />;
            case 'Phim Đang Thuê': return <RentMovies />;
            default:
                return (
                    <div className="flex-1 flex items-center justify-center min-h-125">
                        <p className="text-slate-200 text-lg flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-transparent pt-24 pb-10 px-4 md:px-6 relative overflow-hidden flex flex-col w-full">
            <div className="fixed inset-0 z-0 pointer-events-none noel-wrapper">
                <style>{`
                    .noel-wrapper .noel-bg { z-index: 0 !important; }
                `}</style>
                <NoelBackground />
            </div>

            <div className="w-full flex flex-col md:flex-row gap-4 relative z-10 flex-1">
                {/* --- MOBILE DROPDOWN MENU --- */}
                <div ref={mobileMenuRef} className="md:hidden w-full relative mb-1 z-50">
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="w-full px-5 py-3.5 bg-slate-800/90 backdrop-blur-md border border-slate-600 rounded-xl flex items-center justify-between text-white font-bold shadow-lg"
                    >
                        <div className="flex items-center gap-3 text-cyan-400">
                            {activeItem.icon}
                            <span className="text-white">{activeItem.name}</span>
                        </div>
                        <FaChevronDown className={`text-slate-400 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isMobileMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-600 rounded-xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 flex flex-col animate-fade-in">
                            {LISTACCOUNT.map((item, index) => (
                                <Link
                                    key={index}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-4 w-full px-5 py-4 transition-all duration-300 border-b border-slate-700/50 last:border-b-0 ${activeTab === item.name
                                            ? 'bg-cyan-500/20 text-cyan-400'
                                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-cyan-400'
                                        }`}
                                >
                                    <div className="text-xl">
                                        {item.icon}
                                    </div>
                                    <span className="font-semibold">{item.name}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- DESKTOP VERTICAL MENU --- */}
                <div className="hidden md:flex w-64 shrink-0 flex-col gap-3 min-h-[calc(100vh-120px)]">
                    <div className="p-5 bg-linear-to-r from-yellow-500/20 via-[#1e293b]/80 to-[#1e293b]/50 backdrop-blur-md rounded-xl border-l-4 border-yellow/5 border-y border-r border-white/5 shadow-lg mb-4 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-yellow-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                        <h2 className="text-white text-lg font-black tracking-wide flex items-center gap-3 relative z-10">
                            <FaUser className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                            Quản lý tài khoản
                        </h2>
                    </div>
                    <div className="flex flex-col gap-3">
                        {LISTACCOUNT.map((item, index) => (
                            <Link
                                key={index}
                                to={item.path}
                                className={`flex items-center gap-4 w-full px-5 py-3 rounded-lg transition-all duration-300 group border ${activeTab === item.name
                                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[inset_4px_0_0_0_#22d3ee,0_0_15px_rgba(34,211,238,0.1)]'
                                        : 'border-transparent bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-cyan-400 hover:border-cyan-500/30'
                                    }`}
                            >
                                <div className={`text-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${activeTab === item.name ? "drop-shadow-[0_0_5px_#22d3ee]" : ""}`}>
                                    {item.icon}
                                </div>
                                <span className="font-semibold text-sm tracking-wide">{item.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col h-full min-h-[calc(100vh-120px)]">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

export default MenuAccount;
