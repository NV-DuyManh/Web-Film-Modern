import React from 'react';
import CategoriesFilm from '../categoriesFilm/CategoriesFilm';
import Cinema from './cinema/Cinema';
import Banner from './banner/Banner';
import FilmCountry from './filmCountry/FilmCountry';
import TopFilm from './topFilm/TopFilm';

function Home(props) {
    return (
        <div>
            <Banner />
            <CategoriesFilm />
            <FilmCountry />
            <TopFilm/>
            <Cinema />
        </div>
    );
}

export default Home;