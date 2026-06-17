import React from 'react';
import { FaChevronRight } from 'react-icons/fa';

function Cinema(props) {
    return (
        <div className='pl-10  bg-[#212330] w-full  text-white p-5'>
            <div className=' flex justify-start items-center gap-4'>
                <h1 className='font-bold text-2xl '>   Mãn Nhãn với Phim Chiếu Rạp</h1>
                <FaChevronRight className='border w-7 h-7 bg-[#212330] text-white border-white p-1 rounded-full' />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 p-10">
                <h1>vfd</h1>
                <h1>vfd</h1>
                <h1>vfd</h1>
            </div>
        </div>
    );
}

export default Cinema;