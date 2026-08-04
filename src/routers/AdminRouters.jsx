import React, { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const DashBoard = lazy(() => import('../pages/admin/dashboard/DashBoard'));
const Categories = lazy(() => import('../pages/admin/metaData/categories/Categories'));
const CategoriesType = lazy(() => import('../pages/admin/metaData/categoryType/CategoriesType'));
const MoviesList = lazy(() => import('../pages/admin/movies/moviesList/MoviesList'));
const Episodes = lazy(() => import('../pages/admin/movies/episodes/Episodes'));
const ShowTimes = lazy(() => import('../pages/admin/movies/showTimes/ShowTimes'));
const Users = lazy(() => import('../pages/admin/community/users/Users'));
const Reviews = lazy(() => import('../pages/admin/community/reviews/Reviews'));
const Comments = lazy(() => import('../pages/admin/community/comments/Comments'));
const Actors = lazy(() => import('../pages/admin/entity/actors/Actors'));
const Authors = lazy(() => import('../pages/admin/entity/authors/Authors'));
const Characters = lazy(() => import('../pages/admin/entity/characters/Characters'));
const Plans = lazy(() => import('../pages/admin/vip/plans/Plans'));
const Features = lazy(() => import('../pages/admin/vip/features/Features'));
const Packages = lazy(() => import('../pages/admin/vip/packages/Packages'));
const RentMovies = lazy(() => import('../pages/admin/bills/rentMovies/RentMovies'));
const Subscriptions = lazy(() => import('../pages/admin/bills/subscriptions/Subscriptions'));
const MagicImport = lazy(() => import('../pages/admin/magicImport/MagicImport'));

const LoadingFallback = () => (
    <div className="flex justify-center items-center h-[80vh] w-full">
        <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-[#0ea5e9] border-r-[#0ea5e9] rounded-full animate-spin drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
            <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-l-purple-500 border-b-purple-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse] drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
        </div>
    </div>
);

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
        }
    ]
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                {adminRouter.map((p, index) => (
                    <Route key={index} path={p.path} element={p.element} />
                ))}
            </Routes>
        </Suspense>
    );
}

export default AdminRouters;
