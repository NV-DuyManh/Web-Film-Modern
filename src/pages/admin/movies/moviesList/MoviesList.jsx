import React, { useState, useContext, useMemo, useEffect } from 'react';
import Search from '../../../../components/admin/Search';
import TableMovies from './TableMovies';
import ModalMovies from './ModalMovies';
import ModalViewMovie from './ModalViewMovie';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { addDocument, updateDocument, deleteDocument } from '../../../../services/firebaseService';
import { uploadImageToCloudinary } from '../../../../config/cloudiaryConfig';
import LOGO from "../../../../assets/Logo.png";

const innerMovie = {
    name: "", description: "", imgUrl: LOGO, trailerUrl: "", duration: "",
    views: 0, rating: 5, endEpisode: "", category_Type_Id: "", productionYear: "",
    list_Category: "", list_Actor: "", list_Character: "", planID: "", rent: "", status: "Coming Soon"
};

const getBase64FromUrl = async (url) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
    });
};

function MoviesList() {
    const movies = useContext(MovieContext);
    const [movie, setMovie] = useState(innerMovie);
    const [error, setError] = useState(innerMovie);
    const [openForm, setOpenForm] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => setSearch(e.target.value);
    
    const onChangeInput = (e) => {
        setMovie({ ...movie, [e.target.name]: e.target.value });
    };

    const handleClickOpenAdd = () => { 
        setMovie(innerMovie); 
        setError(innerMovie);
        setOpenForm(true); 
    };
    
    const handleEdit = (row) => { 
        setMovie(row); 
        setError(innerMovie);
        setOpenForm(true); 
    };

    const handleView = (row) => { setMovie(row); setOpenView(true); };
    const handleDeletePrompt = (row) => { setMovie(row); setOpenDelete(true); };

    const validation = () => {
        const newError = {};
        newError.name = movie.name ? "" : "Please enter film name";
        newError.description = movie.description ? "" : "Please enter description";
        newError.productionYear = movie.productionYear !== "" ? "" : "Please enter production year";
        newError.duration = movie.duration !== "" ? "" : "Please enter duration";
        newError.endEpisode = movie.endEpisode !== "" ? "" : "Please enter end episode";
        newError.category_Type_Id = movie.category_Type_Id ? "" : "Please enter category type";
        newError.trailerUrl = movie.trailerUrl ? "" : "Please enter trailer Url";
        newError.list_Category = movie.list_Category ? "" : "Please enter your name";
        newError.list_Actor = movie.list_Actor ? "" : "Please enter actor";
        newError.list_Character = movie.list_Character ? "" : "Please enter your character";
        newError.rent = movie.rent !== "" ? "" : "Please enter rent";
        newError.planID = movie.planID ? "" : "Please enter your plan";
        
        setError(newError);
        return Object.values(newError).some(e => e !== "");
    };

    const addOrUpdateMovie = async () => {
        if (validation()) return; 
        
        setLoading(true);
        try {
            let submitData = { ...movie };

            if (submitData.imgUrl === LOGO) {
                submitData.imgUrl = await getBase64FromUrl(LOGO);
            }

            if (submitData.imgFile) {
                submitData.imgUrl = await uploadImageToCloudinary(submitData.imgFile, "Movies");
                delete submitData.imgFile;
            }

            submitData.duration = Number(submitData.duration) || 0;
            submitData.views = Number(submitData.views) || 0;
            submitData.rating = Number(submitData.rating) || 5;
            submitData.endEpisode = Number(submitData.endEpisode) || 0;
            submitData.productionYear = Number(submitData.productionYear) || 0;
            submitData.rent = Number(submitData.rent) || 0;

            if (!movie.id) {
                submitData.createdAt = new Date().toISOString();
                await addDocument("Movies", submitData);
            } else {
                await updateDocument("Movies", submitData);
            }

            setOpenForm(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleted = async () => {
        await deleteDocument("Movies", movie);
        setOpenDelete(false);
    };

    return (
        <div>
            <Search name="List Movies" tuKhoa="Search Movie by Name" onChangeSearch={onChangeSearch} handleClickOpen={handleClickOpenAdd} />
            <TableMovies movies={movies} search={search} handleView={handleView} handleEdit={handleEdit} handleDelete={handleDeletePrompt} />
            <ModalMovies 
                open={openForm} 
                handleClose={() => setOpenForm(false)} 
                movie={movie} 
                onChangeInput={onChangeInput} 
                addOrUpdateMovie={addOrUpdateMovie} 
                loading={loading} 
                setMovie={setMovie}
                error={error}
            />
            <ModalViewMovie open={openView} handleClose={() => setOpenView(false)} movie={movie} />
            <ModalDelete 
                open={openDelete} 
                handleClose={() => setOpenDelete(false)} 
                handleDeleted={handleDeleted} 
                titleDelete="DELETE MOVIE" 
                contentDelete={`Are you sure you want to delete "${movie?.name}"?`} 
            />
        </div>
    );
}

export default MoviesList;