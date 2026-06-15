import React from 'react';
import SlideBanner from '../slide/SlideBanner';
import CategoriesFilm from '../categoriesFilm/CategoriesFilm';
import SlideFilmCountry from '../slide/SlideFilmCountry';

function Home(props) {
    return (
        <div>
            <SlideBanner />
            <CategoriesFilm />
            <SlideFilmCountry  />
        </div>
    );
}

export default Home;