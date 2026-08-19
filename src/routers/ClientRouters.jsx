import React, { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import LoadingScreen from '../components/client/loadingScreen/LoadingScreen';
import ErrorBoundary from '../components/ErrorBoundary';

const Home = lazy(() => import('../pages/client/home/Home'));
const Topic = lazy(() => import('../pages/client/topic/Topic'));
const TopicDetail = lazy(() => import('../pages/client/topic/TopicDetail'));
const Category = lazy(() => import('../pages/client/category/Category'));
const CategoryPage = lazy(() => import('../pages/client/category/CategoryPage'));
const SingleMovies = lazy(() => import('../pages/client/singleMovies/SingleMovies'));
const Series = lazy(() => import('../pages/client/series/Series'));
const Country = lazy(() => import('../pages/client/country/Country'));
const CountryPage = lazy(() => import('../pages/client/country/CountryPage'));
const Actors = lazy(() => import('../pages/client/actors/Actors'));
const Showtimes = lazy(() => import('../pages/client/showtimes/Showtimes'));
const PlayFilm = lazy(() => import('../pages/client/watch/playfilm/PlayFilm'));
const DetailFilm = lazy(() => import('../pages/client/watch/detailFilm/DetailFilm'));
const Pay = lazy(() => import('../pages/client/pay/Pay'));
const UpgradeVIP = lazy(() => import('../pages/client/pay/UpgradeVIP'));
const PayVIP = lazy(() => import('../pages/client/pay/payvip/PayVIP'));
const PayMovie = lazy(() => import('../pages/client/pay/paymovie/PayMovie'));
const MenuAccount = lazy(() => import('../components/client/menuAccount/MenuAccount'));

const FilmNewPage = lazy(() => import('../pages/client/home/filmNew/FilmNewPage'));
const CinemaPage = lazy(() => import('../pages/client/home/cinema/CinemaPage'));
const FilmComingPage = lazy(() => import('../pages/client/home/filmComing/FilmComingPage'));
const FilmHongKongPage = lazy(() => import('../pages/client/home/filmHongKong/FilmHongKongPage'));
const AnimePage = lazy(() => import('../pages/client/home/anime/AnimePage'));

const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[60vh] bg-transparent">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
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
            <Suspense fallback={<LoadingFallback />}>
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
