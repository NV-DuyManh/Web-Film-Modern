import React, { useState } from 'react';
import { FaUser } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { HiMenuAlt3 } from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';
import { LISTCLIENT } from '../../utils/Contants';
import { Link, useLocation } from 'react-router-dom';
import Logo2 from '../../assets/Logo2.png';
import LogIn from '../../pages/client/auth/LogIn';

function HeaderClient() {
    const [openMenu, setOpenMenu] = useState(false);
    const [open, setOpen] = React.useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const location = useLocation();


    return (
        <header className="fixed top-0 left-0 z-100 w-full border-b border-white/10 bg-black/70 text-white backdrop-blur-xl">
            <div className="flex w-full items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 min-[1150px]:gap-4 min-[1150px]:px-8">
                <Link to="/" className="flex shrink-0 items-center">
                    <img src={Logo2} alt="MFILM" className="h-10.5 w-auto object-contain sm:h-13 md:h-15"
                    />
                </Link>

                <div className="relative min-w-0 flex-1 min-[1150px]:max-w-75 xl:max-w-95">
                    <input
                        className="w-full min-w-0 rounded-full border border-white/15 bg-white/10 px-4 py-2 pr-10 text-sm text-white outline-none transition-all duration-300 placeholder:text-gray-400 hover:border-yellow-400/60 focus:border-yellow-400 focus:bg-white/15 focus:shadow-[0_0_18px_rgba(250,204,21,0.25)] sm:px-5 sm:py-2.5 sm:pr-11"
                        type="text"
                        placeholder="Tìm kiếm..."
                        onFocus={() => setIsSearching(true)}
                        onBlur={() => setIsSearching(false)}
                    />
                    <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-300 sm:right-4 sm:text-xl" />
                </div>

                <nav className="hidden shrink-0 items-center gap-1 min-[1150px]:flex">
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
                </nav>

                <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
                    <button
                        onClick={handleOpen}
                        className={`flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white px-4 py-2.5 text-sm font-bold text-black transition-all duration-300 hover:bg-yellow-400 hover:shadow-[0_0_18px_rgba(250,204,21,0.35)] min-[1150px]:flex xl:px-5 ${isSearching
                                ? "max-md:hidden pointer-events-none"
                                : ""
                            }`}
                    >
                        <FaUser />
                        Thành viên
                    </button>
                    <button
                        onClick={() => setOpenMenu(!openMenu)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl text-white transition-all duration-300 hover:border-yellow-400 hover:text-yellow-300 sm:h-11 sm:w-11 min-[1150px]:hidden"
                    >
                        {openMenu ? <IoClose /> : <HiMenuAlt3 />}
                    </button>
                </div>
            </div>

            <div
                className={`overflow-hidden border-t border-white/10 bg-black/80 backdrop-blur-xl transition-all duration-300 min-[1150px]:hidden ${openMenu ? "max-h-105 opacity-100" : "max-h-0 opacity-0"
                    }`}
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
            <LogIn open={open} handleClose={handleClose} />
        </header>
    );

}

export default HeaderClient;