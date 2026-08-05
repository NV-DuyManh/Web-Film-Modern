import React, { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { LISTACCOUNT } from '../../../utils/Constants';
import { FaUser } from 'react-icons/fa';
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
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-3 md:min-h-[calc(100vh-120px)]">
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
