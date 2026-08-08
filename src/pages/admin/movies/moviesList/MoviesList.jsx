import React, { useState, useContext, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Search from '../../../../components/admin/search/Search';
import TableMovies from './TableMovies';
import ModalMovies from './ModalMovies';
import ModalViewMovie from './ModalViewMovie';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { addDocument, updateDocument, deleteDocument } from '../../../../services/firebaseService';
import { uploadImageToCloudinary } from '../../../../config/cloudinaryConfig';
import { slugify } from '../../../../utils/slugify';
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

function MoviesList() {
    const movies = useContext(MovieContext);
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

    useEffect(() => {
        const viewMovieId = searchParams.get("viewMovie");
        if (viewMovieId && movies.length > 0) {
            const mv = movies.find(m => m.slug === viewMovieId || m.id === viewMovieId || m.otherName === viewMovieId);
            if (mv) {
                setMovieView(mv);
                setOpenView(true);
            }
        } else {
            setOpenView(false);
        }
    }, [searchParams, movies]);


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
        currentParams.set("viewMovie", row.slug || row.otherName || row.id);
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
        newError.name = movie.name ? "" : "Please enter movie name";
        newError.description = movie.description ? "" : "Please enter description";
        newError.releaseYear = movie.releaseYear !== "" ? "" : "Please enter release year";
        newError.ageRating = movie.ageRating ? "" : "Please select age rating";
        newError.status = movie.status ? "" : "Please select status";
        newError.countriesID = movie.countriesID ? "" : "Please select country";
        newError.duration = movie.duration !== "" ? "" : "Please enter duration";
        newError.endEpisode = movie.endEpisode !== "" ? "" : "Please enter end episode";
        if (movie.hasSub && movie.episodeSub === "") newError.episodeSub = "Please enter Sub episode count";
        if (movie.hasDub && movie.episodeDub === "") newError.episodeDub = "Please enter Dub episode count";
        if (movie.hasVoice && movie.episodeVoice === "") newError.episodeVoice = "Please enter Voice episode count";
        newError.planID = movie.planID ? "" : "Please select plan";
        newError.rent = movie.rent !== "" ? "" : "Please enter rent";
        newError.listCategory = movie.listCategory?.length > 0 ? "" : "Please select category";
        newError.listAuthor = movie.listAuthor?.length > 0 ? "" : "Please select director(s)";
        newError.categoryTypeID = movie.categoryTypeID ? "" : "Please select category type";
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
            submitData.endEpisode = Number(submitData.endEpisode);
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
            alert("Có lỗi xảy ra, vui lòng thử lại!");
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
            <TableMovies movies={movies} search={search} handleEdit={handleEdit} handleDelete={handleDeletePrompt} handleView={handleViewMovie} />
            
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
                titleDelete={"DELETE MOVIE"} contentDelete={`Are you sure you want to delete ${movie?.name}?`} 
            />
        </div>
    );
}

export default MoviesList;
