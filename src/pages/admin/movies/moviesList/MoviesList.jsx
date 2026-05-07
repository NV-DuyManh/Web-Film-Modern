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
    name: "", description: "", imgUrl: LOGO, trailerUrl: "", duration: 0,
    views: 0, rating: 0, endEpisode: 1, category_Type_Id: "", productionYear: new Date().getFullYear(),
    list_Category: "", list_Actor: "", list_Character: "", planID: "", rent: 0, status: "Coming Soon"
};

function MoviesList() {
    const movies = useContext(MovieContext); // Lấy data từ Context tổng
    const [movie, setMovie] = useState(innerMovie);
    const [openForm, setOpenForm] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const onChangeSearch = (e) => setSearch(e.target.value);
    const onChangeInput = (e) => setMovie({ ...movie, [e.target.name]: e.target.value });

    const handleClickOpenAdd = () => { setMovie(innerMovie); setOpenForm(true); };
    const handleEdit = (row) => { setMovie(row); setOpenForm(true); };
    const handleView = (row) => { setMovie(row); setOpenView(true); };
    const handleDeletePrompt = (row) => { setMovie(row); setOpenDelete(true); };

    const addOrUpdateMovie = async () => {
        if (!movie.name) return;
        setLoading(true);
        let submitData = { ...movie };
        
        // Logic upload ảnh nếu có file mới (giả sử bạn chọn file qua handleImageChange)
        if (submitData.imgFile) {
            submitData.imgUrl = await uploadImageToCloudinary(submitData.imgFile, "Movies");
            delete submitData.imgFile;
        }

        !movie.id ? await addDocument("Movies", submitData) : await updateDocument("Movies", submitData);
        setOpenForm(false);
        setLoading(false);
    };

    const handleDeleted = async () => {
        await deleteDocument("Movies", movie);
        setOpenDelete(false);
    };

    return (
        <div>
            <Search name="List Movies" tuKhoa="Search Movie..." onChangeSearch={onChangeSearch} handleClickOpen={handleClickOpenAdd} />
            
            <TableMovies 
                movies={movies} 
                search={search} 
                handleView={handleView} 
                handleEdit={handleEdit} 
                handleDelete={handleDeletePrompt} 
            />

            <ModalMovies 
                open={openForm} 
                handleClose={() => setOpenForm(false)} 
                movie={movie} 
                onChangeInput={onChangeInput} 
                addOrUpdateMovie={addOrUpdateMovie} 
                loading={loading} 
                setMovie={setMovie}
            />

            <ModalViewMovie open={openView} handleClose={() => setOpenView(false)} movie={movie} />

            <ModalDelete 
                open={openDelete} 
                handleClose={() => setOpenDelete(false)} 
                handleDeleted={handleDeleted} 
                titleDelete="DELETE MOVIE" 
                contentDelete="Are you sure you want to delete this movie?" 
            />
        </div>
    );
}

export default MoviesList;