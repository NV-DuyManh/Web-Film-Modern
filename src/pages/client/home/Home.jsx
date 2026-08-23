import React, { lazy } from 'react';
import Banner from './banner/Banner';
import CategoriesFilm from './categoriesFilm/CategoriesFilm';
import FilmNew from './filmNew/FilmNew';
import SEO from '../../../components/SEO';
import LazySection from '../../../components/LazySection';

// Retry wrapper for lazy imports — handles chunk 404 after deployment
const lazyRetry = (importFn, retries = 3) =>
    lazy(() =>
        importFn().catch((err) => {
            if (retries > 0) {
                return new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
                    lazyRetry(importFn, retries - 1)
                ).then(mod => ({ default: mod.default }));
            }
            // After all retries failed, reload the page to get fresh chunk URLs
            window.location.reload();
            throw err;
        })
    );

const FilmCountry = lazyRetry(() => import('./filmCountry/FilmCountry'));
const TopFilm = lazyRetry(() => import('./topFilm/TopFilm'));
const Cinema = lazyRetry(() => import('./cinema/Cinema'));
const Comment = lazyRetry(() => import('./comment/Comment'));
const FilmComing = lazyRetry(() => import('./filmComing/FilmComing'));
const Anime = lazyRetry(() => import('./anime/Anime'));
const FilmHongKong = lazyRetry(() => import('./filmHongKong/FilmHongKong'));


function Home(props) {
    return (
        <div>
            <h1 className="sr-only">MFILM - Phim online chất lượng cao</h1>
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
                            <FilmCountry title={<>Phim Nhật <br className="hidden md:block" />Bản mới</>} countryName="Nhật Bản" titleClass="glow-text-1" speed={35} index={0} />
                            <FilmCountry title={<>Phim Trung <br className="hidden md:block" />Quốc mới</>} countryName="Trung Quốc" titleClass="glow-text-2" speed={35} index={1} />
                            <FilmCountry title={<>Phim Hàn <br className="hidden md:block" />Quốc mới</>} countryName="Hàn Quốc" titleClass="glow-text-3" speed={35} index={2} />
                            <FilmCountry title={<>Phim Việt <br className="hidden md:block" />Nam mới</>} countryName="Việt Nam" titleClass="glow-text-4" speed={35} index={3} />
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
