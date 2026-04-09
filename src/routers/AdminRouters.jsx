// import React from 'react';
// import Main from '../components/main/Main';
// import Products from '../components/products/Products';
// import Categories from '../components/categories/Categories';
// import Todolist from '../components/todolist/Todolist';
// import { Route, Routes } from 'react-router-dom';

// function ClientRouters(props) {
//     const routers = [
//         {
//             path: "/",
//             element : <Main/>
//         },
//         {
//             path : "/products",
//             element : <Products/>
//         },{
//             path : "/categories",
//             element : <Categories/>
//         },
//         {
//             path : "/todolist",
//             element : <Todolist/>
//         }
//     ]
//     return (
//             <Routes>
//                 {routers.map((p,index) => (
//                     <Route path={p.path}  element={p.element} />
//                 ))}
//             </Routes>
//     );
// }

// export default ClientRouters;

import React from 'react';
import DashBoard from '../pages/admin/dashBoard/DashBoard';
import MetaData from '../pages/admin/metaData/MetaData';
import Movies from '../pages/admin/movies/Movies';
import Users from '../pages/admin/users/Users';
import Cast from '../pages/admin/cast/Cast';
import Plans from '../pages/admin/plans/Plans';

function AdminRouters(props) {
    const adminRouter = [
        {
            path: "/",
            element: <DashBoard />
        },
        {
            path: "/metaData",
            element: <MetaData />
        },
        {
            path: "/movies",
            element: <Movies />
        },
        {
            path: "/users",
            element: <Users />
        },
        {
            path: "/cast",
            element: <Cast />
        },
        {
            path: "/plans",
            element: <Plans />
        },
        {
            path: "/vip",
            element: <Vip />
        },
    ]
    return (
        <Routes>
            {adminRouter.map((p, index) => (
                <Route path={p.path} element={p.element} />
            ))}
        </Routes>
    );
}

export default AdminRouters;