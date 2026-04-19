import React from 'react';
import { CiSearch } from 'react-icons/ci';
import { FaUserCircle } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { IoIosNotifications } from 'react-icons/io';
import { MdEmail } from 'react-icons/md';

function HeaderAdmin() {
    return (
        <>
            <div className='p-4 bg-blue-400/20'>
                <div className='flex justify-between items-center text-gray-200  ml-4 mr-4'>
                    <h1 className='text-3xl font-bold tracking-wide glow-text'>
                        Welcome
                    </h1>

                    <div className="flex items-center gap-6 text-2xl">
                        {/* Search - Neon Cyan */}
                        <button className="transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:scale-110 hover:text-cyan-400 hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                            <FiSearch />
                        </button>

                        {/* Notifications - Neon Yellow */}
                        <button className="transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:scale-110 hover:text-yellow-400 hover:drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
                            <IoIosNotifications />
                        </button>

                        {/* Email - Neon Purple (hoặc Pink) */}
                        <button className=" transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:scale-110 hover:text-purple-400 hover:drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]">
                            <MdEmail />
                        </button>

                        {/* User - Neon Green */}
                        <button className="text-green-500 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:scale-110 hover:text-green-400 hover:drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]">
                            <FaUserCircle />
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
}

export default HeaderAdmin;