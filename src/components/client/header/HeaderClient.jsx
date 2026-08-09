import React, { useContext, useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useSubscriptions } from '../../../hooks/useCollections';
import { FaUser, FaRegHeart, FaList, FaHistory, FaSignOutAlt, FaWallet, FaCrown, FaChevronDown, FaFilm } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { HiMenuAlt3 } from 'react-icons/hi';
import { IoClose, IoCloseCircle } from 'react-icons/io5';
import SearchHeader from './SearchHeader';
import { LISTCLIENT } from '../../../utils/Constants';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo2 from '../../../assets/Logo2.png';

const LogIn = lazy(() => import('../../../pages/client/auth/LogIn'));
const Register = lazy(() => import('../../../pages/client/auth/Register'));
import { AuthContext } from '../../../contexts/AuthProvider';
import { PlanContext } from '../../../contexts/PlanProvider';
import { getObjectById } from '../../../services/firebaseResponse';


import { IoMdArrowDropdown } from 'react-icons/io';
import Category from '../../../pages/client/category/Category';
import Country from '../../../pages/client/country/Country';
import './HeaderClient.css';
import { WingedFrame } from './AvatarFrames';
import { getUserPlanInfo, getThemeBadgeStyle } from '../../../utils/appUtils';
function HeaderClient() {
    const [openMenu, setOpenMenu] = useState(false);
    const [openCate, setOpenCate] = useState(false);
    const [openCountry, setOpenCountry] = useState(false);
    const [openLogin, setOpenLogin] = useState(false);
    const [openRegister, setOpenRegister] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchContainerRef = useRef(null);
    const { isLogin, handleLogout, globalAvatarPreview } = useContext(AuthContext);
    const subscriptions = useSubscriptions() || [];
    const plans = useContext(PlanContext) || [];

    const currentPlanInfo = React.useMemo(() => {
        return getUserPlanInfo(isLogin, subscriptions, plans);
    }, [isLogin, subscriptions, plans]);

    const displayTheme = isLogin?.selectedFrame || currentPlanInfo.theme;

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const cateRef = useRef(null);
    const countryRef = useRef(null);
    const menuRef = useRef(null);
    const hamburgerRef = useRef(null);

    const handleOpenLogin = () => { handleCloseRegister(); setOpenLogin(true); }
    const handleOpenRegister = () => { handleCloseLogin(); setOpenRegister(true); };
    const handleCloseLogin = () => setOpenLogin(false);
    const handleCloseRegister = () => setOpenRegister(false);
    const location = useLocation();

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (cateRef.current && !cateRef.current.contains(event.target)) {
                setOpenCate(false);
            }
            if (countryRef.current && !countryRef.current.contains(event.target)) {
                setOpenCountry(false);
            }
            if (menuRef.current && !menuRef.current.contains(event.target) && hamburgerRef.current && !hamburgerRef.current.contains(event.target)) {
                setOpenMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside, true);
        document.addEventListener("touchstart", handleClickOutside, true);
        document.addEventListener("pointerdown", handleClickOutside, true);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside, true);
            document.removeEventListener("touchstart", handleClickOutside, true);
            document.removeEventListener("pointerdown", handleClickOutside, true);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const openLoginHandler = () => handleOpenLogin();
        window.addEventListener('openLoginModal', openLoginHandler);
        return () => window.removeEventListener('openLoginModal', openLoginHandler);
    }, []);

    return (
        <div className="fixed top-0 left-0 z-9999 w-full text-white">
            <div className={`absolute inset-0 -z-10 transition-[background-color,backdrop-filter,box-shadow] duration-300 ${isScrolled ? "bg-[#0b1221]/40 backdrop-blur-2xl border-b border-white/10 shadow-lg" : "bg-linear-to-b from-black/80 via-black/20 to-transparent border-none shadow-none"}`}></div>

            <div
                className={`relative flex w-full items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 min-[1200px]:gap-4 min-[1200px]:px-8 transition-all duration-500`}
            >
                <button
                    ref={hamburgerRef}
                    onClick={() => setOpenMenu(!openMenu)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl text-white transition-all duration-300 hover:border-cyan-400 hover:text-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.8)] hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] sm:h-11 sm:w-11 min-[1200px]:hidden"
                >
                    {openMenu ? <IoClose /> : <HiMenuAlt3 />}
                </button>

                <a href="/" className="flex shrink-0 items-center max-md:hidden cursor-pointer">
                    <img src={Logo2} alt="MFILM" width="150" height="60" className="h-10.5 w-auto object-contain sm:h-13 md:h-15" />
                </a>

                <div ref={searchContainerRef} className="relative min-w-0 flex-1 md:max-w-87.5 lg:max-w-112.5 min-[1200px]:max-w-87.5 xl:max-w-112.5 transition-[max-width] duration-500 ease-out md:mx-auto group">
                    <input
                        className="peer w-full min-w-0 rounded-full bg-transparent px-5 py-2.5 pr-12 text-sm font-medium text-white outline-none transition-all duration-300 placeholder:text-slate-300 border border-[#00f2fe]/50 shadow-[0_0_10px_rgba(0,242,254,0.3),inset_0_0_5px_rgba(0,242,254,0.1)] hover:border-green-500/70 hover:shadow-[0_0_15px_rgba(34,197,94,0.5),inset_0_0_5px_rgba(34,197,94,0.2)] focus:border-[#ff00ff]/80 focus:shadow-[0_0_20px_rgba(255,0,255,0.6),inset_0_0_8px_rgba(255,0,255,0.2)] sm:px-5 sm:py-2.5 sm:pr-12"
                        type="text" placeholder="Tìm kiếm phim..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearching(true)}
                        onBlur={(e) => {
                            if (searchContainerRef.current && !searchContainerRef.current.contains(e.relatedTarget)) {
                                setIsSearching(false);
                            }
                        }}
              
                    />
                    {searchQuery ? (
                        <button onClick={() => { setSearchQuery(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer z-10">
                            <IoCloseCircle />
                        </button>
                    ) : (
                        <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-all duration-300 peer-focus:scale-110 peer-focus:text-[#ff00ff] peer-focus:drop-shadow-[0_0_12px_rgba(255,0,255,0.8)]" />
                    )}
                    <SearchHeader
                        searchQuery={searchQuery}
                        isOpen={isSearching}
                        onClose={() => { setSearchQuery(''); setIsSearching(false); }}
                    />
                </div>

                <div ref={menuRef} className={`shrink-0 items-center gap-1.5 max-[1199px]:absolute max-[1199px]:grid max-[1199px]:grid-cols-2 max-[1199px]:gap-1 min-[1200px]:flex max-[1199px]:bg-[#0a192f]/98 max-[1199px]:backdrop-blur-2xl max-[1199px]:w-[calc(100%-24px)] max-[1199px]:max-w-150 max-[1199px]:left-3 sm:max-[1199px]:left-6 md:max-[1199px]:left-12 lg:max-[1199px]:left-24 max-[1199px]:right-auto bottom-0 max-[1199px]:translate-y-full max-[1199px]:px-4 max-[1199px]:py-4 max-[1199px]:border max-[1199px]:border-white/10 max-[1199px]:rounded-2xl max-[1199px]:shadow-[0_15px_40px_rgba(0,0,0,0.8)] max-[1199px]:mt-2 max-[1199px]:overflow-visible ${openMenu ? "max-[1199px]:grid min-[1200px]:flex" : "max-[1199px]:hidden"} `}>

                    {LISTCLIENT.map((item, index) => (
                        <div key={index} ref={(el) => {
                                if (item.path === "/category") cateRef.current = el;
                                if (item.path === "/country") countryRef.current = el;
                            }}
                            className={`relative flex flex-col min-[1200px]:block max-[1199px]:w-full transition-all duration-300 ${(item.path === "/category" && openCate) || (item.path === "/country" && openCountry) ? "z-60" : "z-10"}`}
                        >
                            <Link to={item.path}
                                onClick={(e) => {
                                    if (item.path === "/category") {
                                        e.preventDefault();
                                        setOpenCate(!openCate);
                                        setOpenCountry(false);
                                    } else if (item.path === "/country") {
                                        e.preventDefault();
                                        setOpenCountry(!openCountry);
                                        setOpenCate(false);
                                    } else {
                                        setOpenCate(false);
                                        setOpenCountry(false);
                                    }
                                }}
                                className={`cursor-pointer flex items-center transition-all duration-300
                                    max-[1199px]:w-full max-[1199px]:justify-between max-[1199px]:px-4 max-[1199px]:py-2.5 max-[1199px]:rounded-lg max-[1199px]:text-[13px]
                                    min-[1200px]:justify-center min-[1200px]:rounded-full min-[1200px]:px-3 min-[1200px]:py-2 min-[1200px]:text-sm xl:px-4 font-bold outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1221]
                                    ${(location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path + "/")))
                                        ? "max-[1199px]:bg-cyan-600/10 max-[1199px]:text-cyan-400 max-[1199px]:shadow-[inset_4px_0_0_0_#22d3ee] min-[1200px]:bg-yellow-400 min-[1200px]:text-black min-[1200px]:shadow-[0_0_18px_rgba(250,204,21,0.5)]"
                                        : "text-slate-200 max-[1199px]:hover:bg-slate-700/80 max-[1199px]:hover:text-cyan-400 min-[1200px]:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] min-[1200px]:hover:text-yellow-400"
                                    }`}>
                                <div className="flex items-center gap-1.5">
                                    {item.title}
                                    {(item.path === "/category" || item.path === "/country") && <IoMdArrowDropdown className="text-lg opacity-80" />}
                                </div>
                            </Link>

                            {item.path === "/category" && <Category openCate={openCate} setOpenCate={setOpenCate} isRightCol={index % 2 === 1} />}
                            {item.path === "/country" && <Country openCountry={openCountry} setOpenCountry={setOpenCountry} isRightCol={index % 2 === 1} />}
                        </div>
                    ))}
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">



                    <div className="relative z-50" ref={dropdownRef}>
                        {!isLogin ? (
                            <button
                                onClick={handleOpenLogin}
                                className={`btn-shine-effect cursor-pointer flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-full bg-linear-to-r from-yellow-400 via-yellow-300 to-amber-500 px-3 py-2 sm:px-4 sm:py-2.5 text-[12px] sm:text-sm font-bold text-black shadow-[0_4px_15px_rgba(250,204,21,0.4)] transition-all duration-300 bg-size-[200%_auto] hover:bg-position-[right_center] hover:shadow-[0_0_25px_rgba(250,204,21,0.6)] xl:px-5 ${isSearching
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
                                    className="relative flex items-center justify-center p-1 cursor-pointer"
                                >
                                    <WingedFrame theme={displayTheme} size={42}>
                                        <img src={globalAvatarPreview || isLogin?.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                    </WingedFrame>
                                </button>

                                <div className={`absolute right-0 top-full mt-4 w-80 rounded-2xl bg-black/80 border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(34,211,238,0.15)] overflow-hidden transition-all duration-300 origin-top-right ${isDropdownOpen ? "scale-100 opacity-100 visible" : "scale-95 opacity-0 invisible"}`}>

                                    <div className="flex items-center gap-4 p-5 border-b border-slate-700/80 bg-linear-to-r from-blue-900/10 to-transparent">
                                        <div className="shrink-0">
                                            <WingedFrame theme={displayTheme} size={48}>
                                                <img src={globalAvatarPreview || isLogin?.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                            </WingedFrame>
                                        </div>

                                        <div className="flex flex-col overflow-hidden">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="text-[16px] font-bold text-white truncate tracking-wide max-w-30">
                                                    {isLogin?.name || 'Nguyễn Văn A'}
                                                </p>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md shrink-0 ${getThemeBadgeStyle(currentPlanInfo.theme)}`}>
                                                    {currentPlanInfo.name}
                                                </span>
                                            </div>
                                            <p className="text-[13px] text-slate-400 truncate w-full">
                                                {isLogin?.email || 'user@example.com'}
                                            </p>
                                        </div>

                                    </div>


                                    <div className="px-4 py-4 border-b border-slate-700/80">
                                        <button onClick={() => { navigate('/upgrade'); setIsDropdownOpen(false); }} className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 text-[14px] font-bold text-green-900 bg-linear-to-r from-green-400 to-emerald-400 rounded-xl hover:from-green-300 hover:to-emerald-300 transition-all duration-300 shadow-[0_0_15px_rgba(52,211,153,0.4)] hover:shadow-[0_0_20px_rgba(52,211,153,0.6)] hover:-translate-y-0.5">
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

                                    <div className="px-3 flex flex-col  ">
                                        <button onClick={() => { navigate('/account/account'); setIsDropdownOpen(false); }} className="w-full mt-2 flex items-center gap-4 px-4 py-3 text-[14px] font-semibold text-gray-200 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all duration-300 hover:translate-x-1">
                                            <FaUser className="text-purple-400 text-lg drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" /> Tài khoản
                                        </button>

                                        <button onClick={() => { navigate('/account/favorites'); setIsDropdownOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3 text-[14px] font-semibold text-gray-200 hover:text-pink-400 hover:bg-pink-500/10 rounded-xl transition-all duration-300 hover:translate-x-1">
                                            <FaRegHeart className="text-pink-400 text-lg drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]" /> Yêu thích
                                        </button>

                                        <button onClick={() => { navigate('/account/list'); setIsDropdownOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3 text-[14px] font-semibold text-gray-200 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all duration-300 hover:translate-x-1">
                                            <FaList className="text-cyan-400 text-lg drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" /> Danh sách
                                        </button>

                                        <button onClick={() => { navigate('/account/rentMovies'); setIsDropdownOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3 text-[14px] font-semibold text-gray-200 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-xl transition-all duration-300 hover:translate-x-1">
                                            <FaFilm className="text-yellow-400 text-lg drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" /> Phim đang thuê
                                        </button>


                                        <div className="h-px bg-slate-700/80 my-1 mx-2"></div>

                                        <button
                                            onClick={() => { handleLogout(); setIsDropdownOpen(false); }}
                                            className="w-full flex items-center gap-4 px-4 py-3 text-[14px] font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded-xl transition-all duration-300 hover:translate-x-1"
                                        >
                                            <FaSignOutAlt className="text-lg drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]" /> Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>


            {(openLogin || openRegister) && (
                <Suspense fallback={null}>
                    {openLogin && <LogIn openLogin={openLogin} handleCloseLogin={handleCloseLogin} handleOpenRegister={handleOpenRegister} />}
                    {openRegister && <Register openRegister={openRegister} handleCloseRegister={handleCloseRegister} handleOpenLogin={handleOpenLogin} />}
                </Suspense>
            )}
        </div>
    );
}

export default HeaderClient;
