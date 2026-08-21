import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import PageLoadingSpinner from '../components/common/PageLoadingSpinner';
import lazyRetry from '../utils/lazyRetry';

const DashBoard = lazyRetry(() => import('../pages/admin/dashBoard/DashBoard'));
const Categories = lazyRetry(() => import('../pages/admin/metaData/categories/Categories'));
const CategoriesType = lazyRetry(() => import('../pages/admin/metaData/categoryType/CategoriesType'));
const Topics = lazyRetry(() => import('../pages/admin/metaData/topics/Topics'));
const MoviesList = lazyRetry(() => import('../pages/admin/movies/moviesList/MoviesList'));
const Episodes = lazyRetry(() => import('../pages/admin/movies/episodes/Episodes'));
const ShowTimes = lazyRetry(() => import('../pages/admin/movies/showTimes/ShowTimes'));
const Users = lazyRetry(() => import('../pages/admin/community/users/Users'));
const Reviews = lazyRetry(() => import('../pages/admin/community/reviews/Reviews'));
const Comments = lazyRetry(() => import('../pages/admin/community/comments/Comments'));
const Actors = lazyRetry(() => import('../pages/admin/entity/actors/Actors'));
const Authors = lazyRetry(() => import('../pages/admin/entity/authors/Authors'));
const Characters = lazyRetry(() => import('../pages/admin/entity/characters/Characters'));
const Plans = lazyRetry(() => import('../pages/admin/vip/plans/Plans'));
const Features = lazyRetry(() => import('../pages/admin/vip/features/Features'));
const Packages = lazyRetry(() => import('../pages/admin/vip/packages/Packages'));
const RentMovies = lazyRetry(() => import('../pages/admin/bills/rentMovies/RentMovies'));
const Subscriptions = lazyRetry(() => import('../pages/admin/bills/subscriptions/Subscriptions'));
const MagicImport = lazyRetry(() => import('../pages/admin/magicImport/MagicImport'));
const ProfileAdmin = lazyRetry(() => import('../pages/admin/profile/ProfileAdmin'));

function AdminRouters(props) {
    const adminRouter = [
        {
            path: "/",
            element: <DashBoard />
        },
        {
            path: "/categories",
            element: <Categories />
        },
        {
            path: "/categoryTypes",
            element: <CategoriesType />
        },
        {
            path: "/topics",
            element: <Topics />
        },
        {
            path: "/movies",
            element: <MoviesList />
        },
        {
            path: "episodes",
            element: <Episodes />
        },
        {
            path: "/showTimes",
            element: <ShowTimes />
        },
        {
            path: "/users",
            element: <Users />
        },
        {
            path: "/reviews",
            element: <Reviews />
        },
        {
            path: "/comments",
            element: <Comments />
        },
        {
            path: "/actors",
            element: <Actors />
        },
        {
            path: "/authors",
            element: <Authors />
        },
        {
            path: "/characters",
            element: <Characters />
        },
        {
            path: "/plans",
            element: <Plans />
        },
        {
            path: "/features",
            element: <Features />
        },
        {
            path: "/packages",
            element: <Packages />
        },
        {
            path: "/rentMovies",
            element: <RentMovies />
        },
        {
            path: "/subscriptions",
            element: <Subscriptions />
        },
        {
            path: "/magicImport",
            element: <MagicImport />
        },
        {
            path: "/profile",
            element: <ProfileAdmin />
        }
    ]
    return (
        <Suspense fallback={<PageLoadingSpinner text="Đang tải trang quản trị..." />}>
            <Routes>
                {adminRouter.map((p, index) => (
                    <Route key={index} path={p.path} element={p.element} />
                ))}
            </Routes>
        </Suspense>
    );
}

export default AdminRouters;
