// src/pages/admin/movies/moviesList/ModalMovies.jsx
import React, { useContext, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, styled, Slide, MenuItem } from '@mui/material';
import { FaCloudUploadAlt, FaSpinner, FaTimesCircle } from 'react-icons/fa';
import { TbCategoryFilled } from 'react-icons/tb';
import ModalChoose from '../../../../components/admin/ModalChoose';
import { ActorContext } from '../../../../contexts/ActorProvider';
import { CategoryTypeContext } from '../../../../contexts/CategoryTypeProvider';
import { AuthorContext } from '../../../../contexts/AuthorProvider';
import { CharacterContext } from '../../../../contexts/CharacterProvider';
import { PlanContext } from '../../../../contexts/PlanProvider'; // Import thêm PlanContext
import { COUNTRIES } from '../../../../utils/Contants';

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);
const VisuallyHiddenInput = styled('input')({ clip: 'rect(0 0 0 0)', height: 1, position: 'absolute', width: 1 });
const menuProps = {
    PaperProps: { sx: { bgcolor: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)' } }
};

export default function ModalMovies({ open, handleClose, movie, onChangeInput, addOrUpdateMovie, loading, setMovie, error }) {
    const [openChoose, setOpenChoose] = useState(false);
    const [dataChoose, setDataChoose] = useState([]);

    const actors = useContext(ActorContext);
    const categoryTypes = useContext(CategoryTypeContext);
    const authorsList = useContext(AuthorContext);
    const characters = useContext(CharacterContext);
    const plansList = useContext(PlanContext); // Sử dụng PlanContext
    const [type, setType] = useState("");

    const handleClickOpenChoose = (type) => {
        if (type === "actors") setDataChoose(actors);
        else if (type === "authors") setDataChoose(authorsList);
        else if (type === "characters") setDataChoose(characters);
        else if (type === "categoryTypes") setDataChoose(categoryTypes);

        setType(type);
        setOpenChoose(true);
    };

    const handleCloseChoose = () => {
        setOpenChoose(false);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setMovie({ ...movie, imgUrl: reader.result, imgFile: file });
            reader.readAsDataURL(file);
        }
    };

    const handleNumberChange = (e) => {
        const onlyNums = e.target.value.replace(/[^0-9]/g, '');
        onChangeInput({ target: { name: e.target.name, value: onlyNums } });
    };

    const handleClickChoose = (id) => {
        if (type === "actors") {
            setMovie(pre => ({ ...pre, list_Actor: toggleById(pre.list_Actor, id) }));
        } else if (type === "authors") {
            setMovie(pre => ({ ...pre, authors: toggleById(pre.authors, id) }));
        } else if (type === "characters") {
            setMovie(pre => ({ ...pre, list_Character: toggleById(pre.list_Character, id) }));
        } else if (type === "categoryTypes") {
            setMovie(pre => ({ ...pre, category_Type_Id: toggleById(pre.category_Type_Id, id) }));
        }
    };

    const toggleById = (list, id) => {
        if (!Array.isArray(list)) list = [];
        return list.includes(id) ? list.filter(e => e !== id) : [...list, id];
    };

    const handleRemoveItem = (itemType, id) => {
        if (itemType === "actors") {
            setMovie(pre => ({ ...pre, list_Actor: (pre.list_Actor || []).filter(e => e !== id) }));
        } else if (itemType === "authors") {
            setMovie(pre => ({ ...pre, authors: (pre.authors || []).filter(e => e !== id) }));
        } else if (itemType === "characters") {
            setMovie(pre => ({ ...pre, list_Character: (pre.list_Character || []).filter(e => e !== id) }));
        } else if (itemType === "categoryTypes") {
            setMovie(pre => ({ ...pre, category_Type_Id: (pre.category_Type_Id || []).filter(e => e !== id) }));
        }
    };

    const getSelectedItems = () => {
        if (type === "actors") return movie.list_Actor || [];
        if (type === "authors") return movie.authors || [];
        if (type === "characters") return movie.list_Character || [];
        if (type === "categoryTypes") return movie.category_Type_Id || [];
        return [];
    };

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ className: "modal-inner" }}
            BackdropProps={{ className: "modal-backdrop-x" }}
        >
            <DialogTitle className="modal-header-x">{movie.id ? "UPDATE MOVIE" : "ADD NEW MOVIE"}</DialogTitle>
            <DialogContent className="modal-body-x grid grid-cols-12 gap-8 h-[75vh] overflow-y-auto custom-scrollbar p-8 pt-10">

                <div className="col-span-12 lg:col-span-7 space-y-8 mt-5">
                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 space-y-4">
                        <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest">Task 1: General Info</p>
                        <TextField
                            className="modal-input-x"
                            name="name"
                            onChange={onChangeInput}
                            fullWidth
                            label="Movie Name"
                            value={movie.name}
                            error={!!error.name}
                            helperText={error.name}
                        />
                        <TextField
                            className="modal-input-x"
                            name="description"
                            onChange={onChangeInput}
                            fullWidth
                            multiline
                            rows={3}
                            label="Description"
                            value={movie.description}
                            error={!!error.description}
                            helperText={error.description}
                        />
                        <TextField
                            select
                            className="modal-input-x"
                            name="countriesID"
                            onChange={onChangeInput}
                            fullWidth
                            label="Country"
                            value={movie.countriesID}
                            error={!!error.countriesID}
                            helperText={error.countriesID}
                            SelectProps={{ MenuProps: menuProps }}
                        >
                            {COUNTRIES?.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </TextField>
                    </div>

                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 space-y-4">
                        <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">Task 2: Specification</p>
                        <div className="grid grid-cols-2 gap-4">
                            <TextField
                                className="modal-input-x"
                                name="duration"
                                onChange={handleNumberChange}
                                label="Duration"
                                value={movie.duration}
                                error={!!error.duration}
                                helperText={error.duration}
                            />
                            <TextField
                                className="modal-input-x"
                                name="endEpisode"
                                onChange={handleNumberChange}
                                label="End Episodes"
                                value={movie.endEpisode}
                                error={!!error.endEpisode}
                                helperText={error.endEpisode}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <TextField
                                className="modal-input-x"
                                name="rent"
                                onChange={handleNumberChange}
                                label="Rent Price"
                                value={movie.rent}
                                error={!!error.rent}
                                helperText={error.rent}
                            />
                            <TextField
                                select
                                className="modal-input-x"
                                name="planID"
                                onChange={onChangeInput}
                                label="Plan"
                                value={movie.planID}
                                error={!!error.planID}
                                helperText={error.planID}
                                SelectProps={{ MenuProps: menuProps }}
                            >

                                {plansList?.map(plan => (
                                    <MenuItem key={plan.id} value={plan.id}>
                                        {plan.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-5 space-y-8 mt-5">
                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 space-y-4">
                        <p className="text-green-400 text-xs font-bold uppercase tracking-widest">Task 3: Classifications & Crew</p>

                        <div className='flex items-center text-white gap-2'>
                            <label className="font-medium">Category Types</label>
                            <TbCategoryFilled onClick={() => handleClickOpenChoose("categoryTypes")} className='cursor-pointer text-2xl text-cyan-400 hover:scale-110 transition-transform' />
                        </div>
                        <div className='text-white flex gap-2 flex-wrap min-h-7.5'>
                            {movie.category_Type_Id?.map((item) => {
                                const categoryType = categoryTypes?.find(e => e.id === item);
                                return categoryType ? (
                                    <div key={item} className="relative inline-block mt-2 mr-1">
                                        <span className="px-3 py-1.5 bg-gray-300 text-gray-800 border border-gray-400 rounded-lg text-sm font-bold shadow-sm">
                                            {categoryType.name}
                                        </span>
                                        <FaTimesCircle
                                            onClick={() => handleRemoveItem("categoryTypes", item)}
                                            className="absolute -top-2 -right-2 text-red-500 bg-white rounded-full text-[16px] cursor-pointer hover:scale-110 hover:text-red-600 transition-transform shadow-md"
                                        />
                                    </div>
                                ) : null;
                            })}
                        </div>

                        <div className='flex items-center text-white gap-2 mt-4'>
                            <label className="font-medium">Authors</label>
                            <TbCategoryFilled onClick={() => handleClickOpenChoose("authors")} className='cursor-pointer text-2xl text-yellow-400 hover:scale-110 transition-transform' />
                        </div>
                        <div className='text-white flex gap-2 flex-wrap min-h-10'>
                            {movie.authors?.map((item) => {
                                const author = authorsList?.find(e => e.id === item);
                                return author ? (
                                    <div key={item} className="relative inline-block mt-1 mr-1">
                                        <img className='w-11 h-11 rounded-full object-cover shadow-[0_0_10px_rgba(250,204,21,0.5)] border border-yellow-500/30' src={author.imgUrl} alt={author.name} title={author.name} />
                                        <FaTimesCircle
                                            onClick={() => handleRemoveItem("authors", item)}
                                            className="absolute -top-0.5 -right-0.5 text-red-500 bg-white rounded-full text-[16px] cursor-pointer hover:scale-110 hover:text-red-600 transition-transform shadow-md"
                                        />
                                    </div>
                                ) : null;
                            })}
                        </div>

                        <div className='flex items-center text-white gap-2 mt-4'>
                            <label className="font-medium">Actors</label>
                            <TbCategoryFilled onClick={() => handleClickOpenChoose("actors")} className='cursor-pointer text-2xl text-pink-400 hover:scale-110 transition-transform' />
                        </div>
                        <div className='text-white flex gap-2 flex-wrap min-h-10'>
                            {movie.list_Actor?.map((item) => {
                                const actor = actors?.find(e => e.id === item);
                                return actor ? (
                                    <div key={item} className="relative inline-block mt-1 mr-1">
                                        <img className='w-11 h-11 rounded-full object-cover shadow-[0_0_10px_rgba(236,72,153,0.5)] border border-pink-500/30' src={actor.imgUrl} alt={actor.name} title={actor.name} />
                                        <FaTimesCircle
                                            onClick={() => handleRemoveItem("actors", item)}
                                            className="absolute -top-0.5 -right-0.5 text-red-500 bg-white rounded-full text-[16px] cursor-pointer hover:scale-110 hover:text-red-600 transition-transform shadow-md"
                                        />
                                    </div>
                                ) : null;
                            })}
                        </div>

                        <div className='flex items-center text-white gap-2 mt-4'>
                            <label className="font-medium">Characters</label>
                            <TbCategoryFilled onClick={() => handleClickOpenChoose("characters")} className='cursor-pointer text-2xl text-green-400 hover:scale-110 transition-transform' />
                        </div>
                        <div className='text-white flex gap-2 flex-wrap min-h-10'>
                            {movie.list_Character?.map((item) => {
                                const character = characters?.find(e => e.id === item);
                                return character ? (
                                    <div key={item} className="relative inline-block mt-1 mr-1">
                                        <img className='w-11 h-11 rounded-full object-cover shadow-[0_0_10px_rgba(74,222,128,0.5)] border border-green-500/30' src={character.imgUrl} alt={character.name} title={character.name} />
                                        <FaTimesCircle
                                            onClick={() => handleRemoveItem("characters", item)}
                                            className="absolute -top-0.5 -right-0.5 text-red-500 bg-white rounded-full text-[16px] cursor-pointer hover:scale-110 hover:text-red-600 transition-transform shadow-md"
                                        />
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </div>

                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 flex flex-col items-center">
                        <p className="text-pink-400 text-xs font-bold uppercase tracking-widest text-center mb-4">Movie Poster</p>
                        <div className="relative w-48 aspect-2/3 rounded-2xl overflow-hidden border-2 border-dashed border-slate-600 group bg-slate-900/50 flex items-center justify-center transition-all hover:border-pink-400">
                            <img src={movie.imgUrl} className="w-full h-full object-cover group-hover:opacity-20 transition-all" alt="Poster" />
                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all">
                                <FaCloudUploadAlt className="text-5xl text-pink-400 mb-2" />
                                <span className="text-white text-sm font-bold">Upload</span>
                                <VisuallyHiddenInput type="file" onChange={handleImageChange} accept="image/*" />
                            </label>
                        </div>
                    </div>
                </div>
            </DialogContent>
            <DialogActions className="modal-actions-x p-6">
                <Button onClick={handleClose} className="btn-cancel-x">Cancel</Button>
                <Button onClick={addOrUpdateMovie} disabled={loading} className="btn-submit-x">
                    {loading ? <FaSpinner className="spin" /> : "Save Movie"}
                </Button>
            </DialogActions>
            <ModalChoose
                handleClickChoose={handleClickChoose}
                type={type}
                dataChoose={dataChoose}
                handleCloseChoose={handleCloseChoose}
                openChoose={openChoose}
                selectedItems={getSelectedItems()}
            />
        </Dialog>
    );
}