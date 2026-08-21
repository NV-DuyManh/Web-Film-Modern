import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import PageLoadingSpinner from '../components/common/PageLoadingSpinner';
import lazyRetry from '../utils/lazyRetry';

const Home = lazyRetry(() => import('../pages/client/home/Home'));
const Topic = lazyRetry(() => import('../pages/client/topic/Topic'));
const TopicDetail = lazyRetry(() => import('../pages/client/topic/TopicDetail'));
const Category = lazyRetry(() => import('../pages/client/category/Category'));
const CategoryPage = lazyRetry(() => import('../pages/client/category/CategoryPage'));
const SingleMovies = lazyRetry(() => import('../pages/client/singleMovies/SingleMovies'));
const Series = lazyRetry(() => import('../pages/client/series/Series'));
const Country = lazyRetry(() => import('../pages/client/country/Country'));
const CountryPage = lazyRetry(() => import('../pages/client/country/CountryPage'));
const Actors = lazyRetry(() => import('../pages/client/actors/Actors'));
const Showtimes = lazyRetry(() => import('../pages/client/showtimes/Showtimes'));
const PlayFilm = lazyRetry(() => import('../pages/client/watch/playfilm/PlayFilm'));
const DetailFilm = lazyRetry(() => import('../pages/client/watch/detailFilm/DetailFilm'));
const Pay = lazyRetry(() => import('../pages/client/pay/Pay'));
const UpgradeVIP = lazyRetry(() => import('../pages/client/pay/UpgradeVIP'));
const PayVIP = lazyRetry(() => import('../pages/client/pay/payvip/PayVIP'));
const PayMovie = lazyRetry(() => import('../pages/client/pay/paymovie/PayMovie'));
const MenuAccount = lazyRetry(() => import('../components/client/menuAccount/MenuAccount'));

const FilmNewPage = lazyRetry(() => import('../pages/client/home/filmNew/FilmNewPage'));
const CinemaPage = lazyRetry(() => import('../pages/client/home/cinema/CinemaPage'));
const FilmComingPage = lazyRetry(() => import('../pages/client/home/filmComing/FilmComingPage'));
const FilmHongKongPage = lazyRetry(() => import('../pages/client/home/filmHongKong/FilmHongKongPage'));
const AnimePage = lazyRetry(() => import('../pages/client/home/anime/AnimePage'));

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
            path: "/topic/:id",
            element: <TopicDetail />
        },
        {
            path: "/category/:name",
            element: <CategoryPage />
        },
        {
            path: "/country/:name",
            element: <CountryPage />
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
            path: "/xem-phim/:slug",
            element: <PlayFilm />
        },
        {
            path: "/phim/:slug",
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
            path: "/upgrade-vip",
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
            element: <MenuAccount />
        },
        {
            path: "/account/:tab",
            element: <MenuAccount />
        },
        {
            path: "/film-new",
            element: <FilmNewPage />
        },
        {
            path: "/cinema-movies",
            element: <CinemaPage />
        },
        {
            path: "/film-coming",
            element: <FilmComingPage />
        },
        {
            path: "/film-hongkong",
            element: <FilmHongKongPage />
        },
        {
            path: "/anime",
            element: <AnimePage />
        },
    ]
    return (
        <div>
            <Suspense fallback={<PageLoadingSpinner />}>
                <Routes>
                    {clientRouter.map((p, index) => (
                        <Route key={index} path={p.path} element={<ErrorBoundary>{p.element}</ErrorBoundary>} />
                    ))}
                </Routes>
            </Suspense>
        </div>
    );
}

export default ClientRouters;
