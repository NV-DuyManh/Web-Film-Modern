import React, { useState, useContext, useEffect } from 'react';
import Search from '../../../../components/admin/Search';
import TableMovies from './TableMovies';
import ModalMovies from './ModalMovies';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { addDocument, updateDocument, deleteDocument } from '../../../../services/firebaseService';
import { uploadImageToCloudinary } from '../../../../config/cloudiaryConfig';

const innerMovie = { 
    name: "", otherName: "", description: "", imgUrl: "", bannerUrl: "", 
    releaseYear: "", duration: "", endEpisode: "", ageRating: "", status: "", 
    hasSub: false, hasDub: false, hasVoice: false, 
    episodeSub: "", episodeDub: "", episodeVoice: "", 
    list_Category: [], countriesID: "", author: "", planID: "", rent: "", 
    list_Actor: [], list_Character: [], category_Type_Id: "" 
};

function MoviesList() {
    const movies = useContext(MovieContext);
    const [movie, setMovie] = useState(innerMovie);
    const [error, setError] = useState({});
    const [openForm, setOpenForm] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [search, setSearch] = useState("");

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
        setMovie(row);
        setError({});
        setOpenForm(true);
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
        newError.list_Category = movie.list_Category?.length > 0 ? "" : "Please select category";
        newError.author = movie.author ? "" : "Please select director";
        newError.category_Type_Id = movie.category_Type_Id ? "" : "Please select category type";
        setError(newError);
        return Object.values(newError).some(e => e !== "");
    };

    const addOrUpdateMovie = async () => {
        if (validation()) return;
        setLoading(true);
        setProgress(10);
        
        try {
            let submitData = { ...movie };
            
            setProgress(30);

            if (submitData.imgFile) {
                submitData.imgUrl = await uploadImageToCloudinary(submitData.imgFile, "Movies");
                delete submitData.imgFile;
            } else if (!submitData.imgUrl || submitData.imgUrl.includes("Logo5.png") || submitData.imgUrl.includes("Logo.png")) {
                submitData.imgUrl = "";
            }

            setProgress(50);

            if (submitData.bannerFile) {
                submitData.bannerUrl = await uploadImageToCloudinary(submitData.bannerFile, "Banners");
                delete submitData.bannerFile;
            } else if (!submitData.bannerUrl || submitData.bannerUrl.includes("Logo5.png") || submitData.bannerUrl.includes("Logo.png")) {
                submitData.bannerUrl = "";
            }

            setProgress(70);

            submitData.releaseYear = Number(submitData.releaseYear) || new Date().getFullYear();
            submitData.duration = Number(submitData.duration) || 0;
            submitData.endEpisode = Number(submitData.endEpisode) || 0;
            submitData.rent = Number(submitData.rent) || 0;
            submitData.episodeSub = submitData.hasSub ? (Number(submitData.episodeSub) || 0) : 0;
            submitData.episodeDub = submitData.hasDub ? (Number(submitData.episodeDub) || 0) : 0;
            submitData.episodeVoice = submitData.hasVoice ? (Number(submitData.episodeVoice) || 0) : 0;

            setProgress(85);

            if (!movie.id) {
                submitData.createdAt = new Date().toISOString();
                await addDocument("Movies", submitData);
            } else {
                submitData.updatedAt = new Date().toISOString();
                await updateDocument("Movies", submitData);
            }

            setProgress(100);
            
            setTimeout(() => {
                setOpenForm(false);
                setLoading(false);
                setProgress(0);
            }, 500);

        } catch (err) {
            console.error(err);
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
            <TableMovies movies={movies} search={search} handleEdit={handleEdit} handleDelete={handleDeletePrompt} />
            <ModalMovies open={openForm} handleClose={() => !loading && setOpenForm(false)} movie={movie} onChangeInput={onChangeInput} onCheckboxChange={onCheckboxChange} addOrUpdateMovie={addOrUpdateMovie} loading={loading} progress={progress} setMovie={setMovie} error={error} setError={setError} />
            <ModalDelete open={openDelete} handleClose={() => setOpenDelete(false)} handleDeleted={handleDeleted} titleDelete="DELETE MOVIE" contentDelete={`Are you sure you want to delete "${movie?.name}"?`} />
        </div>
    );
}

export default MoviesList;