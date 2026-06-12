import React from 'react';
import SlideBanner from '../slide/SlideBanner';
import CategoriesFilm from '../categoriesFilm/CategoriesFilm';

function Home(props) {
    return (
        <div>
            <SlideBanner />
            <CategoriesFilm/>
        </div>
    );
}

export default Home;