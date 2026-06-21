import React, { useContext, useState, useRef, useEffect } from 'react';
import { FaUser, FaRegHeart, FaList, FaHistory, FaSignOutAlt, FaWallet, FaCrown, FaChevronDown } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { HiMenuAlt3 } from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';
import { LISTCLIENT } from '../../utils/Contants';
import { Link, useLocation } from 'react-router-dom';
import Logo2 from '../../assets/Logo2.png';
import LogIn from '../../pages/client/auth/LogIn';
import Register from '../../pages/client/auth/Register';
import { AuthContext } from '../../contexts/AuthProvider';

function HeaderClient() {
    const [openMenu, setOpenMenu] = useState(false);
    const [openLogin, setOpenLogin] = useState(false);
    const [openRegister, setOpenRegister] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const { isLogin, handleLogout } = useContext(AuthContext);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleOpenLogin = () => { handleCloseRegister(); setOpenLogin(true); }
    const handleOpenRegister = () => { handleCloseLogin(); setOpenRegister(true); };
    const handleCloseLogin = () => setOpenLogin(false);
    const handleCloseRegister = () => setOpenRegister(false);
    const location = useLocation();

    // Xử lý click ra ngoài để đóng menu
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="fixed top-0 left-0 z-100 w-full border-b border-white/10 bg-black/90 text-white backdrop-blur-xl">
            <div className="flex w-full items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 min-[1150px]:gap-4 min-[1150px]:px-8">
                <Link to="/" className="flex shrink-0 items-center">
                    <img src={Logo2} alt="MFILM" className="h-10.5 w-auto object-contain sm:h-13 md:h-15" />
                </Link>

                <div className="relative min-w-0 flex-1 min-[1150px]:max-w-75 xl:max-w-95">
                    <input
                        className="w-full min-w-0 rounded-full border border-white/15 bg-white/10 px-4 py-2 pr-10 text-sm text-white outline-none transition-all duration-300 placeholder:text-gray-400 hover:border-yellow-400/60 focus:border-yellow-400 focus:bg-white/15 focus:shadow-[0_0_18px_rgba(250,204,21,0.25)] sm:px-5 sm:py-2.5 sm:pr-11"
                        type="text" placeholder="Tìm kiếm..." onFocus={() => setIsSearching(true)} onBlur={() => setIsSearching(false)}
                    />
                    <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-300 sm:right-4 sm:text-xl" />
                </div>

                <div className="hidden shrink-0 items-center gap-1 min-[1150px]:flex">
                    {LISTCLIENT.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            className={`rounded-full px-3 py-2 text-sm font-semibold transition-all duration-300 xl:px-4 ${location.pathname === item.path
                                ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.35)]"
                                : "text-gray-200 hover:bg-white/10 hover:text-yellow-300"
                                }`}
                        >
                            {item.title}
                        </Link>
                    ))}
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
                    <div className="relative z-50" ref={dropdownRef}>
                        {!isLogin ? (
                            <button
                                onClick={handleOpenLogin}
                                className={`flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white px-4 py-2.5 text-sm font-bold text-black transition-all duration-300 hover:bg-yellow-400 hover:shadow-[0_0_18px_rgba(250,204,21,0.35)] min-[1150px]:flex xl:px-5 ${isSearching
                                    ? "max-md:hidden pointer-events-none"
                                    : ""
                                    }`}
                            >
                                <FaUser />
                                Thành viên
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 cursor-pointer transition-all duration-300 hover:-translate-y-1 group"
                                >
                                    <div className="relative">
                                        {isLogin?.avatarUrl ? (
                                            <img
                                                src={isLogin.avatarUrl}
                                                alt="avatar"
                                                className="h-10 w-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-cyan-400 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                            />
                                        ) : (
                                            <img
                                                src="https://i.pravatar.cc/150?img=3"
                                                alt="avatar"
                                                className="h-10 w-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-cyan-400 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                            />
                                        )}
                                    </div>
                                    <FaChevronDown className={`text-sm text-cyan-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
                                </button>

                                {/* Dropdown Menu (Hiệu ứng Admin) */}
                                <div className={`absolute right-0 top-full mt-4 w-80 rounded-2xl bg-[#0a192f]/95 backdrop-blur-xl border border-slate-700/80 shadow-[0_15px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(34,211,238,0.15)] overflow-hidden transition-all duration-300 origin-top-right ${isDropdownOpen ? "scale-100 opacity-100 visible" : "scale-95 opacity-0 invisible"}`}>

                                    {/* User Info */}
                                    <div className="flex items-center gap-4 p-5 border-b border-slate-700/80 bg-linear-to-r from-blue-900/10 to-transparent">
                                        <img
                                            src={isLogin?.avatarUrl || "https://i.pravatar.cc/150?img=3"}
                                            alt="avatar"
                                            className="w-12 h-12 rounded-full object-cover ring-2 ring-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.4)] shrink-0"
                                        />

                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-[16px] font-bold text-white truncate tracking-wide">
                                                {isLogin?.name || 'Nguyễn Văn A'}
                                            </p>
                                        </div>

                                    </div>


                                    <div className="px-4 py-4 border-b border-slate-700/80">
                                        <button className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 text-[14px] font-bold text-green-900 bg-linear-to-r from-green-400 to-emerald-400 rounded-xl hover:from-green-300 hover:to-emerald-300 transition-all duration-300 shadow-[0_0_15px_rgba(52,211,153,0.4)] hover:shadow-[0_0_20px_rgba(52,211,153,0.6)] hover:-translate-y-0.5">
                                            <FaCrown className="text-lg" /> Nâng cấp gói
                                        </button>

                                        <div className="flex justify-between items-center px-1">
                                            <div className="flex items-center gap-2 text-[14px] text-gray-300 font-medium">
                                                <FaWallet className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] text-lg" /> Số dư
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <p className="font-bold text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)] text-[15px]">0 R</p>
                                                <button className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-[13px] font-bold transition-all border border-white/20 hover:border-yellow-400 hover:text-yellow-400">
                                                    + Nạp
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nav Items */}
                                    <div className="p-3 flex flex-col gap-1.5">
                                        <button className="w-full flex items-center gap-4 px-4 py-3 text-[14px] font-semibold text-gray-200 hover:text-pink-400 hover:bg-pink-500/10 rounded-xl transition-all duration-300 hover:translate-x-1">
                                            <FaRegHeart className="text-pink-400 text-lg drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]" /> Yêu thích
                                        </button>

                                        <button className="w-full flex items-center gap-4 px-4 py-3 text-[14px] font-semibold text-gray-200 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all duration-300 hover:translate-x-1">
                                            <FaList className="text-cyan-400 text-lg drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" /> Danh sách
                                        </button>

                                        <button className="w-full flex items-center gap-4 px-4 py-3 text-[14px] font-semibold text-gray-200 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-xl transition-all duration-300 hover:translate-x-1">
                                            <FaHistory className="text-yellow-400 text-lg drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" /> Xem tiếp
                                        </button>

                                        <button className="w-full flex items-center gap-4 px-4 py-3 text-[14px] font-semibold text-gray-200 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all duration-300 hover:translate-x-1">
                                            <FaUser className="text-purple-400 text-lg drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" /> Tài khoản
                                        </button>

                                        <div className="h-px bg-slate-700/80 my-1 mx-2"></div>

                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-4 px-4 py-3 text-[14px] font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-xl transition-all duration-300 hover:translate-x-1"
                                        >
                                            <FaSignOutAlt className="text-lg drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]" /> Thoát
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setOpenMenu(!openMenu)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl text-white transition-all duration-300 hover:border-yellow-400 hover:text-yellow-300 sm:h-11 sm:w-11 min-[1150px]:hidden"
                    >
                        {openMenu ? <IoClose /> : <HiMenuAlt3 />}
                    </button>
                </div>
            </div>

            <div
                className={`overflow-hidden border-t border-white/10 bg-black/80 backdrop-blur-xl transition-all duration-300 min-[1150px]:hidden ${openMenu ? "max-h-105 opacity-100" : "max-h-0 opacity-0"}`}
            >
                <div className="flex flex-col gap-2 px-4 py-4">
                    {LISTCLIENT.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            onClick={() => setOpenMenu(false)}
                            className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${location.pathname === item.path
                                ? "bg-yellow-400 text-black"
                                : "bg-white/5 text-gray-200 hover:bg-white/10 hover:text-yellow-300"
                                }`}
                        >
                            {item.title}
                        </Link>
                    ))}
                </div>
            </div>
            <LogIn openLogin={openLogin} handleCloseLogin={handleCloseLogin} handleOpenRegister={handleOpenRegister} />
            <Register openRegister={openRegister} handleCloseRegister={handleCloseRegister} handleOpenLogin={handleOpenLogin} />
        </div>
    );
}

export default HeaderClient;