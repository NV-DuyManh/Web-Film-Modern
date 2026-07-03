import React from 'react';
import CategoriesFilm from './categoriesFilm/CategoriesFilm';
import Cinema from './cinema/Cinema';
import Banner from './banner/Banner';
import FilmCountry from './filmCountry/FilmCountry';
import TopFilm from './topFilm/TopFilm';
import FilmNew from './filmNew/FilmNew';
import FilmComing from './filmComing/FilmComing';
import FilmHongKong from './filmHongKong/FilmHongKong';
import Anime from './anime/Anime';
import Comment from './comment/Comment';
import DetailFilm from '../watch/DetailFilm';
function Home(props) {
    return (
        <div>
            <Banner />
            <CategoriesFilm />
            <FilmNew/>
            <FilmCountry />
            <TopFilm/>
            <Cinema />
            <Comment/>
            <FilmComing/>
            <Anime/>
            <FilmHongKong/>
            <DetailFilm/>
        </div>
    );
}

export default Home;
