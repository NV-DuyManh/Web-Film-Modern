import { adminAlert } from '../../../../services/adminOperations';
import { routeSegment } from '../../../../utils/nameRoutes';
import React, { useState, useContext, useEffect, useMemo } from 'react';
import useAdminMovies, { findAdminMovie } from '../../../../hooks/useAdminMovies';
import MovieFilters from '../../../../components/admin/MovieFilters';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { CategoryContext } from '../../../../contexts/CategoryProvider';
import { notifyAdmin } from '../../../../services/adminOperations';
import { useSearchParams } from 'react-router-dom';
import Search from '../../../../components/admin/search/Search';
import TableMovies from './TableMovies';
import ModalMovies from './ModalMovies';
import ModalViewMovie from './ModalViewMovie';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { addDocument, updateDocument, deleteDocument } from '../../../../services/firebaseService';
import { uploadImageToCloudinary } from '../../../../config/cloudinaryConfig';
import { slugify } from '../../../../utils/appUtils';
import LOGO_POSTER from "../../../../assets/Logo6.png";
import LOGO_BANNER from "../../../../assets/Logo5.png";

const innerMovie = {
    name: "", otherName: "", description: "", imgUrl: LOGO_POSTER, bannerUrl: LOGO_BANNER,
    releaseYear: "", duration: "", endEpisode: "", ageRating: "", status: "",
    hasSub: false, hasDub: false, hasVoice: false,
    episodeSub: "", episodeDub: "", episodeVoice: "",
    listCategory: [], countriesID: "", listAuthor: [], planID: "", rent: "",
    listActor: [], listCharacter: [], categoryTypeID: ""
};

const EMPTY_PLANS = [];

function MoviesList() {
    const plans = useContext(PlanContext) || EMPTY_PLANS;
    const categories = useContext(CategoryContext) || [];
    const [filters, setFilters] = useState({});
    const [size, setSize] = useState(20);
    const [revision, setRevision] = useState(0);
    const [movie, setMovie] = useState(innerMovie);
    const [movieView, setMovieView] = useState(null);
    const [error, setError] = useState({});
    const [openForm, setOpenForm] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [search, setSearch] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const freePlanIDs = useMemo(() => plans.filter(plan => Number(plan.level) === 0).map(plan => plan.id), [plans]);
    const cursor = useAdminMovies(search, filters, freePlanIDs, size, revision);
    const movies = cursor.rows;
    useEffect(() => {
        const refresh = event => { if (event.detail?.collectionName === 'Movies') setRevision(value => value + 1); };
        window.addEventListener('mfilm-admin-data-change', refresh);
        return () => window.removeEventListener('mfilm-admin-data-change', refresh);
    }, []);

    useEffect(() => {
        const value = searchParams.get('viewMovie');
        if (!value) { setOpenView(false); return; }
        let active = true;
        const current = movies.find(item => item.id === value || decodeURIComponent(routeSegment(item)) === value);
        const load = current ? Promise.resolve(current) : findAdminMovie(value);
        load.then(item => { if (active && item) { setMovieView(item); setOpenView(true); } else if (active) notifyAdmin('Không tìm thấy phim này.', 'warning'); }).catch(error => { if (active) notifyAdmin(error.message, 'error'); });
        return () => { active = false; };
        // Avoid refetching the detail just because the table page changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const onChangeSearch = (e) => setSearch(e.target.value);

    const onChangeInput = (e) => {
        setMovie(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    };

    const onCheckboxChange = (e) => {
        setMovie(prev => ({ ...prev, [e.target.name]: e.target.checked }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    };

    const handleClickOpenAdd = () => {
        setMovie(innerMovie);
        setError({});
        setOpenForm(true);
    };

    const handleEdit = (row) => {
        const editRow = { ...row };
        if ((!editRow.listAuthor || editRow.listAuthor.length === 0) && editRow.author) {
            editRow.listAuthor = [editRow.author];
        }
        setMovie(editRow);
        setError({});
        setOpenForm(true);
    };

    const handleViewMovie = (row) => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set("viewMovie", decodeURIComponent(routeSegment(row)));
        setSearchParams(currentParams);
    };

    const handleCloseView = () => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.delete("viewMovie");
        setSearchParams(currentParams);
    };

    const handleDeletePrompt = (row) => {
        setMovie(row);
        setOpenDelete(true);
    };

    const validation = () => {
        const newError = {};
        newError.name = movie.name ? "" : "Vui lòng nhập tên phim";
        newError.description = movie.description ? "" : "Vui lòng nhập mô tả";
        newError.releaseYear = movie.releaseYear !== "" ? "" : "Vui lòng nhập năm phát hành";
        newError.ageRating = movie.ageRating ? "" : "Vui lòng chọn độ tuổi";
        newError.status = movie.status ? "" : "Vui lòng chọn trạng thái";
        newError.countriesID = movie.countriesID ? "" : "Vui lòng chọn quốc gia";
        newError.duration = movie.duration !== "" ? "" : "Vui lòng nhập thời lượng";
        newError.endEpisode = movie.endEpisode !== "" ? "" : "Vui lòng nhập tổng số tập";
        if (movie.hasSub && movie.episodeSub === "") newError.episodeSub = "Vui lòng nhập số tập phụ đề";
        if (movie.hasDub && movie.episodeDub === "") newError.episodeDub = "Vui lòng nhập số tập lồng tiếng";
        if (movie.hasVoice && movie.episodeVoice === "") newError.episodeVoice = "Vui lòng nhập số tập thuyết minh";
        newError.planID = movie.planID ? "" : "Vui lòng chọn gói";
        newError.rent = movie.rent !== "" ? "" : "Vui lòng nhập giá thuê";
        newError.listCategory = movie.listCategory?.length > 0 ? "" : "Vui lòng chọn thể loại";
        newError.categoryTypeID = movie.categoryTypeID ? "" : "Vui lòng chọn loại phim";
        setError(newError);
        return Object.values(newError).some(e => e !== "");
    };

    const addOrUpdateMovie = async () => {
        if (validation()) return;
        setLoading(true);
        setProgress(20);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 80) {
                    clearInterval(progressInterval);
                    return 80;
                }
                return prev + Math.floor(Math.random() * 8) + 2;
            });
        }, 500);

        try {
            let submitData = { ...movie };
            const sourceName = submitData.otherName || submitData.name;
            submitData.slug = slugify(sourceName);

            const isLocalAsset = (url) => url && !url.startsWith("http") && !url.startsWith("data:");

            if (submitData.imgFile) {
                submitData.imgUrl = await uploadImageToCloudinary(submitData.imgFile, "Movies");
                delete submitData.imgFile;
            } else if (!submitData.imgUrl || isLocalAsset(submitData.imgUrl)) {
                submitData.imgUrl = LOGO_POSTER;
            }

            if (submitData.bannerFile) {
                submitData.bannerUrl = await uploadImageToCloudinary(submitData.bannerFile, "Banners");
                delete submitData.bannerFile;
            } else if (!submitData.bannerUrl || isLocalAsset(submitData.bannerUrl)) {
                submitData.bannerUrl = LOGO_BANNER;
            }

            submitData.releaseYear = Number(submitData.releaseYear);
            submitData.duration = Number(submitData.duration);
            submitData.endEpisode = submitData.endEpisode === '?' ? '?' : Number(submitData.endEpisode);
            submitData.rent = Number(submitData.rent);
            submitData.episodeSub = submitData.hasSub ? Number(submitData.episodeSub) : 0;
            submitData.episodeDub = submitData.hasDub ? Number(submitData.episodeDub) : 0;
            submitData.episodeVoice = submitData.hasVoice ? Number(submitData.episodeVoice) : 0;

            if (!movie.id) {
                submitData.createdAt = new Date().toISOString();
                await addDocument("Movies", submitData);
            } else {
                submitData.updatedAt = new Date().toISOString();
                await updateDocument("Movies", submitData);
            }

            clearInterval(progressInterval);
            setProgress(100);

            setTimeout(() => {
                setOpenForm(false);
                setLoading(false);
                setProgress(0);
            }, 500);

        } catch (err) {
            clearInterval(progressInterval);
            adminAlert("Có lỗi xảy ra, vui lòng thử lại!");
            setLoading(false);
            setProgress(0);
        }
    };

    const handleDeleted = async () => {
        await deleteDocument("Movies", movie);
        setOpenDelete(false);
    };

    return (
        <div>
            <Search name="List Movies" tuKhoa="Search Movie by Name" onChangeSearch={onChangeSearch} handleClickOpen={handleClickOpenAdd} />
            <MovieFilters filters={filters} setFilters={setFilters} plans={plans} categories={categories} size={size} setSize={setSize} />
            <TableMovies movies={movies} search={JSON.stringify({ search, filters })} cursor={cursor} size={size} handleEdit={handleEdit} handleDelete={handleDeletePrompt} handleView={handleViewMovie} />

            <ModalMovies
                open={openForm} handleClose={() => setOpenForm(false)}
                movie={movie} setMovie={setMovie}
                onChangeInput={onChangeInput} onCheckboxChange={onCheckboxChange}
                addOrUpdateMovie={addOrUpdateMovie}
                loading={loading} progress={progress}
                error={error} setError={setError}
            />

            <ModalViewMovie
                open={openView}
                handleClose={handleCloseView}
                movie={movieView}
                onEdit={() => {
                    handleCloseView();
                    handleEdit(movieView);
                }}
            />

            <ModalDelete
                handleClose={() => setOpenDelete(false)} open={openDelete} handleDeleted={handleDeleted}
                titleDelete={"CHUYỂN PHIM VÀO THÙNG RÁC"} contentDelete={`Chuyển mục đã chọn vào thùng rác? Bạn có thể khôi phục trong mục Vận hành.`}
            />
        </div>
    );
}

export default MoviesList;
