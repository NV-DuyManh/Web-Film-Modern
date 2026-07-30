import React, { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import LoadingScreen from '../components/client/loadingScreen/LoadingScreen';

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
const Pay = lazy(() => import('../pages/client/pay/Pay'));
const UpgradeVIP = lazy(() => import('../pages/client/pay/UpgradeVIP'));
const PayVIP = lazy(() => import('../pages/client/pay/PayVIP'));
const PayMovie = lazy(() => import('../pages/client/pay/PayMovie'));
const Profile = lazy(() => import('../pages/client/profile/Profile'));

const LoadingFallback = () => <LoadingScreen />;
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
            path: "/detailFilm/:id",
            element: <DetailFilm />
        },
        {
            path: "/pay/:id",
            element: <Pay />
        },
        {
            path: "/upgrade",
            element: <UpgradeVIP />
        },
        {
            path: "/payVip",
            element: <PayVIP />
        },
        {
            path: "/payMovie/:id",
            element: <PayMovie />
        },
        {
            path: "/account",
            element: <Profile />
        },
        {
            path: "/account/:tab",
            element: <Profile />
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
