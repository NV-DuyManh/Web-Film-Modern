import React from 'react';
import { BsSearch } from 'react-icons/bs';
import { IoIosAddCircle, IoIosAddCircleOutline, IoMdAddCircle } from 'react-icons/io';

function Search() {

    return (
        <div>
            <style>{`
                .glow-text {
                    background: linear-gradient(90deg, #60a5fa, #a78bfa, #38bdf8, #22d3ee, #818cf8, #60a5fa);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: textMove 4s linear infinite;
                }

                @keyframes textMove {
                    0% { background-position: 0% center; }
                    100% { background-position: 200% center; }
                }
            `}</style>

            <div className='flex items-center justify-between p-4 bg-black text-white'>

                <h1 className='font-bold text-3xl glow-text p-1'>
                    List Categories
                </h1>

                <div className='relative w-7/12   '>
                    <input
                        type="text"
                        placeholder='Search categories...'
                        className='w-full pl-4 pr-10 py-2 rounded-lg bg-zinc-900  border border-zinc-700 text-sm  placeholder-gray-400 focus:outline-none focus:border-gray-400 '/>
                    <BsSearch className='absolute hover:text-green-600 hover:scale-110 duration-200 right-3 top-1/2 -translate-y-1/2 text-2xl cursor-pointer' />
                </div>

                <button className='p-2 rounded-2xl  hover:bg-green-500 cursor-pointer hover:text-red-700 hover:scale-125 duration-300 bg-amber-400 text-blue-500'>
                    <IoMdAddCircle className='text-xl' />
                </button>

            </div>
        </div>

    );
}

export default Search;