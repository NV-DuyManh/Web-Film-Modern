import AdminFeedback from '../../../components/admin/AdminFeedback';
import React from 'react';
import MenuAdmin from '../../../components/admin/MenuAdmin';
import HeaderAdmin from '../../../components/admin/HeaderAdmin';
import Search from '../../../components/admin/search/Search';
import AdminRouters from '../../../routers/AdminRouters';

function HomeAdmin(props) {
    return (
        <div className='sm:flex max-w-480 mx-auto w-full'>
            <MenuAdmin />
            <AdminFeedback />
            <div className='flex-1 min-w-0 overflow-x-hidden'>
                <HeaderAdmin />
                <AdminRouters />
            </div>
        </div>
    );
}

export default HomeAdmin;
