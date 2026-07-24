import React from 'react';
import Logo from '../../../assets/Icon.png'
import { FiSearch } from 'react-icons/fi';
import { FaChevronDown } from 'react-icons/fa';
function Pay(props) {
    return (
        <div>
            <div className='flex justify-between items-center px-5 py-2'>
                <div className='flex gap-2 items-center'>
                    <img className='w-10 h-10' src={Logo} alt="" />
                    <ul className='flex gap-5 '>
                        <li>Home</li>
                        <li>Movie Store</li>
                        <li>Rent Movies</li>
                        <li>Promotions</li>
                        <li>Contacts</li>
                    </ul>
                </div>
                <div className='flex gap-3 items-center'>
                    <button className='bg-amber-500 text-white px-2 py-1 rounded-2xl'>ĐĂNG KÝ GÓI </button>
                    <FiSearch className='size-6' />
                    <img className='w-5 h-5' src={Logo} alt="" />
                    <FaChevronDown />
                </div>
            </div>

        </div>
    );
}

export default Pay;