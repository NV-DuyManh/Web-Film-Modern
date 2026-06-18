import React from 'react';
import CategoriesFilm from '../categoriesFilm/CategoriesFilm';
import Cinema from './cinema/Cinema';
import Banner from './banner/Banner';
import FilmCountry from './filmCountry/FilmCountry';

function Home(props) {
    return (
        <div>
            <Banner />
            <CategoriesFilm />
            <FilmCountry />
            <Cinema />
        </div>
    );
}

export default Home;