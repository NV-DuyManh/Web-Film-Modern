import React, { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const Home = lazy(() => import('../pages/client/home/Home'));
const Topic = lazy(() => import('../pages/client/topic/Topic'));
const Category = lazy(() => import('../pages/client/category/Category'));
const SingleMovies = lazy(() => import('../pages/client/singleMovies/SingleMovies'));
const Series = lazy(() => import('../pages/client/series/Series'));
const Country = lazy(() => import('../pages/client/country/Country'));
const Actors = lazy(() => import('../pages/client/actors/Actors'));
const Showtimes = lazy(() => import('../pages/client/showtimes/Showtimes'));
const PlayFilm = lazy(() => import('../pages/client/watch/PlayFilm'));
const DetailFilm = lazy(() => import('../pages/client/watch/DetailFilm'));

const LoadingFallback = () => (
    <div className="flex justify-center items-center h-[60vh] w-full bg-[#111827]">
        <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-[#facc15] border-r-[#facc15] rounded-full animate-spin drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
            <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-l-red-500 border-b-red-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse] drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
        </div>
    </div>
);
function ClientRouters(props) {
    const clientRouter = [
        {
            path: "/",
            element: <Home />
        },
        {
            path: "/topic",
            element: <Topic />
        },
        {
            path: "/singleMovies",
            element: <SingleMovies />
        },
        {
            path: "/series",
            element: <Series />
        },
        {
            path: "/actors",
            element: <Actors />
        },
        {
            path: "/showtimes",
            element: <Showtimes />
        },
        {
            path: "/play/:id",
            element: <PlayFilm />
        },
        {
            path: "/detaifilm/:id",
            element: <DetailFilm />
        },
    ]
    return (
        <div>
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    {clientRouter.map((p, index) => (
                        <Route key={index} path={p.path} element={p.element} />
                    ))}
                </Routes>
            </Suspense>
        </div>
    );
}

export default ClientRouters;
