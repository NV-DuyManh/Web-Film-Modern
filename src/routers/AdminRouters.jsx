import React from 'react';
import DashBoard from '../pages/admin/dashBoard/DashBoard';
import Categories from '../pages/admin/metaData/categories/Categories';
import CategoriesType from '../pages/admin/metaData/categoryType/CategoriesType';
import MoviesList from '../pages/admin/movies/moviesList/MoviesList';
import Episodes from '../pages/admin/movies/episodes/Episodes';
import ShowTimes from '../pages/admin/movies/showTimes/ShowTimes';
import Users from '../pages/admin/community/users/Users';
import Reviews from '../pages/admin/community/reviews/Reviews';
import Comments from '../pages/admin/community/comments/Comments';
import Actors from '../pages/admin/cast/actors/Actors';
import Authors from '../pages/admin/cast/authors/Authors';
import Characters from '../pages/admin/cast/characters/Characters';
import Plans from '../pages/admin/billing/plans/Plans';
import Features from '../pages/admin/billing/features/Features';
import Packages from '../pages/admin/billing/packages/Packages';
import RentMovies from '../pages/admin/vip/rentMovies/RentMovies';
import Subscriptions from '../pages/admin/vip/subscriptions/Subscriptions';
import { Route, Routes } from 'react-router-dom';

function AdminRouters(props) {
    const adminRouter = [
        {
            path: "/",
            element: <DashBoard />
        },
        {
            path: "/metadata/categories",
            element: <Categories />
        },
        {
            path: "/metadata/categoriesType",
            element: <CategoriesType />
        },
        {
            path: "/movies/moviesList",
            element: <MoviesList />
        },
        {
            path: "/movies/episodes",
            element: <Episodes />
        },
        {
            path: "/movies/showTimes",
            element: <ShowTimes />
        },
        {
            path: "/community/users",
            element: <Users />
        },
        {
            path: "/community/reviews",
            element: <Reviews />
        },
        {
            path: "/community/comments",
            element: <Comments />
        },
        {
            path: "/cast/actors",
            element: <Actors />
        },
        {
            path: "/cast/authors",
            element: <Authors />
        },
        {
            path: "/cast/characters",
            element: <Characters />
        },
        {
            path: "/billing/plans",
            element: <Plans />
        },
        {
            path: "/billing/features",
            element: <Features />
        },
        {
            path: "/billing/packages",
            element: <Packages />
        },
        {
            path: "/vip/rentMovies",
            element: <RentMovies />
        },
        {
            path: "/vip/subscriptions",
            element: <Subscriptions/>
        }
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