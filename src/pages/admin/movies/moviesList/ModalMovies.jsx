// src/pages/admin/movies/moviesList/ModalMovies.jsx
import React, { useContext, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, styled, Slide, MenuItem } from '@mui/material';
import { FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';
import { TbCategoryFilled } from 'react-icons/tb';
import ModalChoose from '../../../../components/admin/ModalChoose';
import { ActorContext } from '../../../../contexts/ActorProvider';
import { CategoryTypeContext } from '../../../../contexts/CategoryTypeProvider';
import { AuthorContext } from '../../../../contexts/AuthorProvider';
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
    const [type, setType] = useState("");

    const handleClickOpenChoose = (type) => {
        if (type === "actors") {
            setDataChoose(actors);
        }
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
        }
    };

    const toggleById = (list, id) => {
        return list.includes(id) ? list.filter(e => e !== id) : [...list, id];
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
                                select
                                className="modal-input-x"
                                name="category_Type_Id"
                                onChange={onChangeInput}
                                label="Category Type"
                                value={movie.category_Type_Id}
                                error={!!error.category_Type_Id}
                                helperText={error.category_Type_Id}
                                SelectProps={{ MenuProps: menuProps }}
                            >
                                {categoryTypes?.map(ct => <MenuItem key={ct.id} value={ct.id}>{ct.name}</MenuItem>)}
                            </TextField>
                            <TextField
                                select
                                className="modal-input-x"
                                name="authors"
                                onChange={onChangeInput}
                                label="Authors"
                                value={movie.authors}
                                error={!!error.authors}
                                helperText={error.authors}
                                SelectProps={{ MenuProps: menuProps }}
                            >
                                {authorsList?.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                            </TextField>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-5 space-y-8 mt-5">
                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 space-y-4">
                        <p className="text-green-400 text-xs font-bold uppercase tracking-widest">Task 3: Cast & Billing</p>
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
                                <MenuItem value="Free">Free</MenuItem>
                                <MenuItem value="VIP">VIP</MenuItem>
                                <MenuItem value="Premium">Premium</MenuItem>
                            </TextField>
                        </div>
                        <div className='flex items-center text-white gap-2 mt-4'>
                            <label>Actor</label>
                            <TbCategoryFilled onClick={() => handleClickOpenChoose("actors")} className='cursor-pointer text-2xl' />
                        </div>
                        <div className='text-white flex gap-2 flex-wrap'>
                            {movie.list_Actor?.map((item) => {
                                const actor = actors?.find(e => e.id === item);
                                return actor ? <img key={item} className='w-10 h-10 rounded-full object-cover' src={actor.imgUrl} alt={actor.name} title={actor.name} /> : null;
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
            <ModalChoose handleClickChoose={handleClickChoose} type={type} dataChoose={dataChoose} handleCloseChoose={handleCloseChoose} openChoose={openChoose} />
        </Dialog>
    );
}