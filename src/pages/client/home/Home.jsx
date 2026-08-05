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
import DetailFilm from "../watch/detailFilm/DetailFilm";
import Pay from '../pay/Pay';
import UpgradeVIP from '../pay/UpgradeVIP';
import PayVIP from '../pay/payvip/PayVIP';
import PayMovie from '../pay/paymovie/PayMovie';
function Home(props) {
    return (
        <div>
            <Banner />
            <CategoriesFilm />
            <FilmNew />
            <div className="bg-[#111827] px-6 md:px-10 py-3">
                <div className="rounded-xl border border-white/10 shadow-[0_0_30px_rgba(96,165,250,0.06)]">
                    <div className="rounded-xl bg-[#182233] py-2 overflow-hidden divide-y divide-white/5">
                        <FilmCountry title={<>Phim Nhật <br className="hidden md:block" />Bản mới</>} countryName="Japan" titleClass="glow-text-1" />
                        <FilmCountry title={<>Phim Trung <br className="hidden md:block" />Quốc mới</>} countryName="China" titleClass="glow-text-2" />
                        <FilmCountry title={<>Phim Hàn <br className="hidden md:block" />Quốc mới</>} countryName="South Korea" titleClass="glow-text-3" />
                    </div>
                </div>
            </div>
            <TopFilm />
            <Cinema />
            <Comment />
            <FilmComing />
            <Anime />
            <FilmHongKong />
        </div>
    );
}

export default Home;
