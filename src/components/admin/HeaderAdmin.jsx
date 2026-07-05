import React, { useState, useContext } from 'react';
import { FaUserCircle, FaSignOutAlt, FaUser, FaCog, FaCrown } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { IoIosNotifications } from 'react-icons/io';
import { MdEmail } from 'react-icons/md';
import { AuthContext } from '../../contexts/AuthProvider';

function HeaderAdmin() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { isLogin, handleLogout } = useContext(AuthContext);
    const dropdownRef = React.useRef(null);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div>
            <div className='p-4 bg-blue-400/20'>
                <div className='flex justify-between items-center text-gray-200 mx-4'>
                    <h1 className='text-3xl font-bold tracking-wide flex items-center gap-3'>
                        <span className="glow-text2">{getGreeting()},</span>
                        <span className="glow-text">{isLogin?.name || 'Admin'}</span> 
                        <span className="animate-bounce ml-1 inline-block">👋</span>
                    </h1>

                    <div className="flex items-center gap-8 text-2xl">
                        <button className="text-cyan-400 cursor-pointer drop-shadow-[0_0_4px_rgba(34,211,238,0.6)] transition-all duration-300 hover:-translate-y-1 hover:scale-125 hover:text-cyan-300 hover:drop-shadow-[0_0_15px_rgba(34,211,238,1)]">
                            <FiSearch />
                        </button>

                        <button className="relative text-yellow-400 cursor-pointer drop-shadow-[0_0_4px_rgba(250,204,21,0.6)] transition-all duration-300 hover:-translate-y-1 hover:scale-125 hover:text-yellow-300 hover:drop-shadow-[0_0_15px_rgba(250,204,21,1)] group">
                            <IoIosNotifications className="animate-bell" />
                            <span className="absolute top-0 right-0.5 flex h-2.5 w-2.5 -mt-0.5 -mr-0.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-slate-900 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
                            </span>
                        </button>

                        <button className="relative text-purple-400 cursor-pointer drop-shadow-[0_0_4px_rgba(192,132,252,0.6)] transition-all duration-300 hover:-translate-y-1 hover:scale-125 hover:text-purple-300 hover:drop-shadow-[0_0_15px_rgba(192,132,252,1)] group">
                            <MdEmail className="animate-envelope" />
                            <span className="absolute top-0 right-0 flex h-2.5 w-2.5 -mt-0.5 -mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" style={{ animationDuration: '2s' }}></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 border border-slate-900 shadow-[0_0_5px_rgba(6,182,212,0.8)]"></span>
                            </span>
                        </button>

                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="relative flex items-center justify-center text-green-400 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-110 group"
                            >
                                <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 blur-sm group-hover:opacity-60 group-hover:animate-pulse transition-opacity duration-300"></div>
                                
                                {isLogin?.imgUrl ? (
                                    <img src={isLogin.imgUrl} alt="avatar" className="relative z-10 w-9 h-9 rounded-full object-cover border-2 border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.6)]" />
                                ) : (
                                    <FaUserCircle className="relative z-10 text-[32px] drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                                )}

                                <span className="absolute bottom-0 right-0 z-20 w-3 h-3 bg-[#22c55e] border-2 border-[#1e293b] rounded-full shadow-[0_0_5px_rgba(34,197,94,1)]"></span>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-6 w-64 rounded-xl border border-slate-700 bg-[#0f172a] shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden transform opacity-100 scale-100 transition-all duration-300">
                                    <div className="flex items-center gap-3 p-4 border-b border-slate-700/50 bg-slate-800/30">
                                        {isLogin?.imgUrl ? (
                                            <img src={isLogin.imgUrl} alt="avatar" className="w-11 h-11 rounded-full border border-cyan-500 object-cover shadow-[0_0_10px_rgba(34,211,238,0.3)]" />
                                        ) : (
                                            <FaUserCircle className="text-4xl text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                        )}
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[15px] font-bold text-white truncate tracking-wide">{isLogin?.displayName || 'Admin'}</span>
                                            <span className="text-[12px] text-cyan-400 truncate">{isLogin?.email || 'admin@mfilm.com'}</span>
                                        </div>
                                    </div>

                                    <div className="p-2">
                                        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200">
                                            <FaUser className="text-cyan-400 text-lg" /> Hồ sơ của tôi
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200">
                                            <FaCog className="text-yellow-400 text-lg" /> Cài đặt
                                        </button>


                                        <div className="h-1 bg-slate-700/50 my-1 mx-2"></div>

                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                                        >
                                            <FaSignOutAlt className="text-lg" /> Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HeaderAdmin;
