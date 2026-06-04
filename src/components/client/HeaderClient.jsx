import React from 'react';
import { FaUser } from 'react-icons/fa';
import { LISTCLIENT } from '../../utils/Contants';
import { Link } from 'react-router-dom';

function HeaderClient(props) {
    return (
        <div className='flex fixed z-100 w-full  items-center justify-between p-4 bg-black/40 text-white'>
            <img src="https://rophim10.app/images/logo.svg" alt="" />
            <input className='border rounded-md w-90 p-3' type="text" name="" id="" placeholder='Tim kiem dien vien' />
            {
                LISTCLIENT.map((item, index) => (
                    <Link to={item.path}>{item.title}</Link>
                ))
            }
            <button className='flex justify-end border py-3 px-4 bg-gray-200 text-black rounded-3xl items-center gap-2'><FaUser />Thành viên</button>
        </div>
    );
}

export default HeaderClient;