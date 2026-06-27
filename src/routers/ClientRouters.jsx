import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from '../pages/client/home/Home';
import Topic from '../pages/client/topic/Topic';
import Category from '../pages/client/category/Category';
import SingleMovies from '../pages/client/singleMovies/SingleMovies';
import Series from '../pages/client/series/Series';
import Country from '../pages/client/country/Country';
import Actors from '../pages/client/actors/Actors';
import Showtimes from '../pages/client/showtimes/Showtimes';
import PlayFilm from '../pages/client/home/playFilm/PlayFilm';
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
            path: "/country",
            element: <Country />
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

    ]
    return (
        <div>
            <Routes>
                {clientRouter.map((p, index) => (
                    <Route key={index} path={p.path} element={p.element} />
                ))}
            </Routes>
        </div>
    );
}

export default ClientRouters;