import React, { useState } from 'react';
import { AiOutlineMenuFold, AiOutlineMenuUnfold } from 'react-icons/ai';
import { BiCategoryAlt } from 'react-icons/bi';
import { FaCaretSquareDown, FaCaretSquareUp } from 'react-icons/fa';
import { FaChromecast, FaLocationDot, FaUsers, FaUserSecret } from 'react-icons/fa6';
import { GrUserManager } from 'react-icons/gr';
import { IoMdCloseCircleOutline } from 'react-icons/io';
import { MdCategory, MdDashboard, MdLocalMovies, MdOutlineAttachMoney, MdOutlinePriceChange, MdPreview } from 'react-icons/md';
import Logo from "./Image/Logo.png";
function MenuAdmin(props) {
    const [Dashboard, setDashboard] = useState(false);
    const [Categories, setCategories] = useState(false);
    const [Movies, setMovies] = useState(false);
    const [User, setUser] = useState(false);
    const [CastAndCrew, setCastAndCrew] = useState(false);
    const [Plant, setPlant] = useState(false);
    const [Review, setReview] = useState(false);
    const [Menu, setmMenu] = useState(false);
    return (
        <div className="flex flex-col p-3 bg-black text-white h-screen">
            <div className="flex justify-between items-center gap-2 h-15">
                {!Menu ? <div className='flex justify-center items-center gap-1'>
                    <h1 className='text-blue-500 text-2xl font-bold'>FIMO</h1>
                    <h1 className='text-pink-500 text-2xl font-bold'>Admin</h1>
                </div> : <img src={Logo} alt="" className="w-20 h-15" />}
                <button onClick={() => setmMenu(!Menu)} className='text-green-500 text-3xl  cursor-pointer ' >{!Menu ? <AiOutlineMenuFold /> : <AiOutlineMenuUnfold />}</button>

            </div>

            <ul className='flex flex-col gap-3 mt-3'>
                <li className='flex flex-col gap-2  '>
                    <div className='flex items-center justify-between gap-2 p-2 rounded-md bg-gray-800'>
                        {Menu ? <MdDashboard className='text-3xl' /> : <div className="flex items-center gap-2"> <MdDashboard /> <p>Dashboard</p></div>}

                        <button onClick={() => setDashboard(!Dashboard)}
                            className='hover:scale-150 duration-300 hover:text-yellow-400  cursor-pointer'>
                            {Dashboard ? <FaCaretSquareUp /> : <FaCaretSquareDown />}
                        </button>
                    </div>
                    {Dashboard ? (
                        <div className='flex flex-col gap-2 items-end'>
                            <div className='p-2 rounded-md bg-gray-800 w-[85%]'>
                                Revenue
                            </div> <div className='p-2 rounded-md bg-gray-800 w-[85%]'>
                                View
                            </div> <div className='p-2 rounded-md bg-gray-800 w-[85%]'>
                                Film
                            </div>
                        </div>
                    ) : null}
                </li>

                <li className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between gap-2 p-2 rounded-md bg-gray-800'    >
                        {Menu ? <MdCategory className='text-3xl' /> : <div className="flex items-center gap-2">
                            <MdCategory />
                            <p>Categories</p>
                        </div>}

                        <button onClick={() => setCategories(!Categories)}
                            className='hover:scale-150 duration-300 hover:text-yellow-400  cursor-pointer'>
                            {Categories ? <FaCaretSquareUp /> : <FaCaretSquareDown />}
                        </button>
                    </div>
                    {Categories ? (
                        <div className='flex flex-col gap-2 items-end'>
                            <div className='p-2 rounded-md bg-gray-800 w-[85%]'>
                                Categories
                            </div>
                            <div className='p-2 rounded-md bg-gray-800 w-[85%]'>
                                Category Types
                            </div>
                        </div>
                    ) : null}
                </li>

                <li className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between gap-2 p-2 rounded-md bg-gray-800 '>
                        {Menu ? <MdLocalMovies className='text-3xl' /> : <div className="flex items-center gap-2 rounded-md bg-gray-800 ">
                            <MdLocalMovies />
                            <p>Movies Manage</p>
                        </div>}
                        <button onClick={() => setMovies(!Movies)}
                            className='hover:scale-150 duration-300 hover:text-yellow-400  cursor-pointer'>
                            {Movies ? <FaCaretSquareUp /> : <FaCaretSquareDown />}
                        </button>
                    </div>
                    {Movies ? (<div className='flex flex-col gap-2  items-end'>
                        <li className='p-2 rounded-md bg-gray-800 w-[85%]'>
                            Episodes
                        </li>
                        <li className='p-2 rounded-md bg-gray-800 w-[85%]'>
                            ShowTimes
                        </li>
                    </div>) : null}
                </li>

                <li className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between gap-2 p-2 rounded-md bg-gray-800 '>
                        {Menu ? <FaUsers className='text-3xl' /> : <div className="flex items-center gap-2 rounded-md bg-gray-800 ">
                            <FaUsers />
                            <p>Users Manage</p>
                        </div>}

                        <button onClick={() => setUser(!User)}
                            className='hover:scale-150 duration-300 hover:text-yellow-400  cursor-pointer'>
                            {User ? <FaCaretSquareUp /> : <FaCaretSquareDown />}
                        </button>
                    </div>
                    {User ? (<div className='flex flex-col gap-2  items-end'>
                        <li className='p-2 rounded-md bg-gray-800 w-[85%]'>
                            Users
                        </li>
                        <li className='p-2 rounded-md bg-gray-800 w-[85%]'>
                            Watch History
                        </li>
                        <li className='p-2 rounded-md bg-gray-800 w-[85%]'>
                            Favorites
                        </li>
                    </div>) : null}
                </li>

                <li className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between gap-2 p-2 rounded-md bg-gray-800 '>
                        {Menu ? <FaUserSecret className='text-3xl' /> : <div className="flex items-center gap-2 rounded-md bg-gray-800 ">
                            <FaUserSecret />
                            <p>Cast & Crew</p>
                        </div>}

                        <button onClick={() => setCastAndCrew(!CastAndCrew)}
                            className='hover:scale-150 duration-300 hover:text-yellow-400  cursor-pointer'>
                            {CastAndCrew ? <FaCaretSquareUp /> : <FaCaretSquareDown />}
                        </button>
                    </div>
                    {CastAndCrew ? (<div className='flex flex-col gap-2  items-end'>
                        <li className='p-2 rounded-md bg-gray-800 w-[85%]'>
                            Actors
                        </li>
                        <li className='p-2 rounded-md bg-gray-800 w-[85%]'>
                            Authors
                        </li>
                        <li className='p-2 rounded-md bg-gray-800 w-[85%]'>
                            Characters
                        </li>
                    </div>) : null}
                </li>

                <li className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between gap-2 p-2 rounded-md bg-gray-800 '>
                        {Menu ? <MdOutlinePriceChange className='text-3xl' /> : <div className="flex items-center gap-2 rounded-md bg-gray-800 ">
                            <MdOutlinePriceChange />
                            <p>Plans & Pricing</p>
                        </div>}

                        <button onClick={() => setPlant(!Plant)}
                            className='hover:scale-150 duration-300 hover:text-yellow-400  cursor-pointer'>
                            {Plant ? <FaCaretSquareUp /> : <FaCaretSquareDown />}
                        </button>
                    </div>
                    {Plant ? (<div className='flex flex-col gap-2  items-end'>
                        <li className='p-2 rounded-md bg-gray-800 w-[85%]'>
                            Plans
                        </li>
                        <li className='p-2 rounded-md bg-gray-800 w-[85%]'>
                            Features
                        </li>
                        <li className='p-2 rounded-md bg-gray-800 w-[85%]'>
                            Packages
                        </li>
                    </div>) : null}
                </li>

                <li className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between gap-2 p-2 rounded-md bg-gray-800 '>
                        {Menu ? <MdPreview className='text-3xl' /> : <div className="flex items-center gap-2 rounded-md bg-gray-800 ">
                            <MdPreview />
                            <p>Reviews Manage</p>
                        </div>}

                        <button onClick={() => setReview(!Review)}
                            className='hover:scale-150 duration-300 hover:text-yellow-400  cursor-pointer'>
                            {Review ? <FaCaretSquareUp /> : <FaCaretSquareDown />}
                        </button>
                    </div>
                    {Review ? (<div className='flex flex-col gap-2  items-end'>
                        <li className='p-2 rounded-md bg-gray-800 w-[85%]'>
                            Reviews
                        </li>
                        <li className='p-2 rounded-md bg-gray-800 w-[85%]'>
                            Comments
                        </li>
                    </div>) : null}
                </li>

            </ul>
        </div>



    );
}

export default MenuAdmin;