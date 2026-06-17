import React from 'react';
import SlideBanner from '../slide/SlideBanner';
import CategoriesFilm from '../categoriesFilm/CategoriesFilm';
import SlideFilmCountry from '../slide/SlideFilmCountry';
import Cinema from '../cinema/Cinema';

function Home(props) {
    return (
        <div>
            <SlideBanner />
            <CategoriesFilm />
            <SlideFilmCountry  />
            <Cinema/>
        </div>
    );
}

export default Home;