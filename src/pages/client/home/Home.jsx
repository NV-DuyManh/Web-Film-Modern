import React, { lazy } from 'react';
import Banner from './banner/Banner';
import CategoriesFilm from './categoriesFilm/CategoriesFilm';
import FilmNew from './filmNew/FilmNew';
import SEO from '../../../components/SEO';
import LazySection from '../../../components/LazySection';

const FilmCountry = lazy(() => import('./filmCountry/FilmCountry'));
const TopFilm = lazy(() => import('./topFilm/TopFilm'));
const Cinema = lazy(() => import('./cinema/Cinema'));
const Comment = lazy(() => import('./comment/Comment'));
const FilmComing = lazy(() => import('./filmComing/FilmComing'));
const Anime = lazy(() => import('./anime/Anime'));
const FilmHongKong = lazy(() => import('./filmHongKong/FilmHongKong'));

function Home(props) {
    return (
        <div>
            <SEO 
                title="MFILM - Xem Phim Online Miễn Phí"
                description="MFILM - Trang xem phim online chất lượng cao, cập nhật phim mới nhanh nhất 2026. Phim lẻ, phim bộ, phim chiếu rạp, anime, phim Hàn Quốc, Trung Quốc, Nhật Bản vietsub."
                url="/"
            />
            <Banner />
            <CategoriesFilm />
            <FilmNew />
            <LazySection minHeight="900px">
                <div className="bg-[#111827] px-6 md:px-10 py-3">
                    <div className="rounded-xl border border-white/10 shadow-[0_0_30px_rgba(96,165,250,0.06)]">
                        <div className="rounded-xl bg-[#182233] py-2 overflow-hidden divide-y divide-white/5">
                            <FilmCountry title={<>Phim Nhật <br className="hidden md:block" />Bản mới</>} countryName="Japan" titleClass="glow-text-1" />
                            <FilmCountry title={<>Phim Trung <br className="hidden md:block" />Quốc mới</>} countryName="China" titleClass="glow-text-2" />
                            <FilmCountry title={<>Phim Hàn <br className="hidden md:block" />Quốc mới</>} countryName="South Korea" titleClass="glow-text-3" />
                        </div>
                    </div>
                </div>
            </LazySection>
            <LazySection minHeight="450px"><TopFilm /></LazySection>
            <LazySection minHeight="450px"><Cinema /></LazySection>
            <LazySection minHeight="300px"><Comment /></LazySection>
            <LazySection minHeight="450px"><FilmComing /></LazySection>
            <LazySection minHeight="450px"><Anime /></LazySection>
            <LazySection minHeight="450px"><FilmHongKong /></LazySection>
        </div>
    );
}

export default Home;
