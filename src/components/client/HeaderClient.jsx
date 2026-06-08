import React, { useState } from 'react';
import { FaUser } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { HiMenuAlt3 } from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';
import { LISTCLIENT } from '../../utils/Contants';
import { Link, useLocation } from 'react-router-dom';

function HeaderClient() {
    const [openMenu, setOpenMenu] = useState(false);
    const location = useLocation();

    return (
        <header className="fixed top-0 left-0 z-100 w-full border-b border-white/10 bg-black/45 text-white backdrop-blur-xl">
            <div className="mx-auto flex max-w-375 items-center justify-between gap-4 px-4 py-3 lg:px-8">
                <Link to="/" className="flex shrink-0 items-center">
                    <img
                        src="https://rophim10.app/images/logo.svg"
                        alt="Logo"
                        className="h-9 w-auto object-contain md:h-10"
                    />
                </Link>

                <div className="hidden flex-1 items-center justify-center sm:flex">
                    <div className="relative w-full max-w-105">
                        <input
                            className="w-full rounded-full border border-white/15 bg-white/10 px-5 py-2.5 pr-11 text-sm text-white outline-none transition-all duration-300 placeholder:text-gray-400 hover:border-yellow-400/60 focus:border-yellow-400 focus:bg-white/15 focus:shadow-[0_0_18px_rgba(250,204,21,0.25)]"
                            type="text"
                            placeholder="Tìm kiếm phim, diễn viên..."
                        />
                        <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-gray-300" />
                    </div>
                </div>

                <nav className="hidden items-center gap-1 lg:flex">
                    {LISTCLIENT.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                                location.pathname === item.path
                                    ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.35)]"
                                    : "text-gray-200 hover:bg-white/10 hover:text-yellow-300"
                            }`}
                        >
                            {item.title}
                        </Link>
                    ))}
                </nav>

                <button className="hidden shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white px-5 py-2.5 text-sm font-bold text-black transition-all duration-300 hover:bg-yellow-400 hover:shadow-[0_0_18px_rgba(250,204,21,0.35)] lg:flex">
                    <FaUser />
                    Thành viên
                </button>

                <button
                    onClick={() => setOpenMenu(!openMenu)}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl text-white transition-all duration-300 hover:border-yellow-400 hover:text-yellow-300 lg:hidden"
                >
                    {openMenu ? <IoClose /> : <HiMenuAlt3 />}
                </button>
            </div>

            <div className="block border-t border-white/10 px-4 pb-3 sm:hidden">
                <div className="relative mt-3 w-full">
                    <input
                        className="w-full rounded-full border border-white/15 bg-white/10 px-5 py-2.5 pr-11 text-sm text-white outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-yellow-400 focus:bg-white/15"
                        type="text"
                        placeholder="Tìm kiếm phim, diễn viên..."
                    />
                    <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-gray-300" />
                </div>
            </div>

            <div
                className={`overflow-hidden border-t border-white/10 bg-black/80 backdrop-blur-xl transition-all duration-300 lg:hidden ${
                    openMenu ? "max-h-105 opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="flex flex-col gap-2 px-4 py-4">
                    {LISTCLIENT.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            onClick={() => setOpenMenu(false)}
                            className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                                location.pathname === item.path
                                    ? "bg-yellow-400 text-black"
                                    : "bg-white/5 text-gray-200 hover:bg-white/10 hover:text-yellow-300"
                            }`}
                        >
                            {item.title}
                        </Link>
                    ))}

                    <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black transition-all duration-300 hover:bg-yellow-400">
                        <FaUser />
                        Thành viên
                    </button>
                </div>
            </div>
        </header>
    );
}

export default HeaderClient;