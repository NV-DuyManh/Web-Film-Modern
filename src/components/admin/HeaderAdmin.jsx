import React, { useState, useContext } from 'react';
import { FaUserCircle, FaSignOutAlt, FaUser, FaCog, FaCrown } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { IoIosNotifications } from 'react-icons/io';
import { MdEmail } from 'react-icons/md';
import { AuthContext } from '../../contexts/AuthProvider';

function HeaderAdmin() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { isLogin, handleLogout } = useContext(AuthContext);

    return (
        <div>
            <div className='p-4 bg-blue-400/20'>
                <div className='flex justify-between items-center text-gray-200 mx-4'>
                    <h1 className='text-3xl font-bold tracking-wide glow-text2'>
                        Welcome
                    </h1>

                    <div className="flex items-center gap-8 text-2xl">
                        <button className="text-cyan-400 cursor-pointer drop-shadow-[0_0_4px_rgba(34,211,238,0.6)] transition-all duration-300 hover:-translate-y-1 hover:scale-125 hover:text-cyan-300 hover:drop-shadow-[0_0_15px_rgba(34,211,238,1)]">
                            <FiSearch />
                        </button>

                        <button className="text-yellow-400 cursor-pointer drop-shadow-[0_0_4px_rgba(250,204,21,0.6)] transition-all duration-300 hover:-translate-y-1 hover:scale-125 hover:text-yellow-300 hover:drop-shadow-[0_0_15px_rgba(250,204,21,1)]">
                            <IoIosNotifications />
                        </button>

                        <button className="text-purple-400 cursor-pointer drop-shadow-[0_0_4px_rgba(192,132,252,0.6)] transition-all duration-300 hover:-translate-y-1 hover:scale-125 hover:text-purple-300 hover:drop-shadow-[0_0_15px_rgba(192,132,252,1)]">
                            <MdEmail />
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-center text-green-400 cursor-pointer drop-shadow-[0_0_4px_rgba(74,222,128,0.6)] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:text-green-300 hover:drop-shadow-[0_0_15px_rgba(74,222,128,1)]"
                            >
                                {isLogin?.avatarUrl ? (
                                    <img src={isLogin.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover border-2 border-green-400" />
                                ) : (
                                    <FaUserCircle />
                                )}
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-6 w-64 rounded-xl border border-slate-700 bg-[#0f172a] shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden transform opacity-100 scale-100 transition-all duration-300">
                                    <div className="flex items-center gap-3 p-4 border-b border-slate-700/50 bg-slate-800/30">
                                        {isLogin?.avatarUrl ? (
                                            <img src={isLogin.avatarUrl} alt="avatar" className="w-11 h-11 rounded-full border border-cyan-500 object-cover shadow-[0_0_10px_rgba(34,211,238,0.3)]" />
                                        ) : (
                                            <FaUserCircle className="text-4xl text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                        )}
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[15px] font-bold text-white truncate tracking-wide">{isLogin?.name || 'Admin'}</span>
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
                                        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200">
                                            <FaCrown className="text-pink-400 text-lg" /> Gói đăng ký
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