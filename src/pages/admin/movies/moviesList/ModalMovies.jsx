import React, { useContext, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, styled, Slide, Autocomplete, Checkbox, FormControlLabel } from '@mui/material';
import { FaCloudUploadAlt, FaSpinner, FaTimesCircle } from 'react-icons/fa';
import { TbCategoryFilled } from 'react-icons/tb';
import ModalChoose from '../../../../components/admin/ModalChoose';
import { ActorContext } from '../../../../contexts/ActorProvider';
import { CategoriesContext } from '../../../../contexts/CategoryProvider';
import { AuthorContext } from '../../../../contexts/AuthorProvider';
import { CharacterContext } from '../../../../contexts/CharacterProvider';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { COUNTRIES } from '../../../../utils/Contants';
import { CategoryTypeContext } from '../../../../contexts/CategoryTypeProvider';
import Logo5 from "../../../../assets/Logo5.png";

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);
const VisuallyHiddenInput = styled('input')({ clip: 'rect(0 0 0 0)', height: 1, position: 'absolute', width: 1 });

const STATUS_OPTIONS = [
    { id: "Sắp chiếu", name: "Sắp chiếu" },
    { id: "Đang chiếu", name: "Đang chiếu" },
    { id: "Hoàn thành", name: "Hoàn thành" }
];

const AGE_RATING_OPTIONS = [
    { id: "P", name: "P" },
    { id: "K", name: "K" },
    { id: "T13", name: "T13" },
    { id: "T16", name: "T16" },
    { id: "T18", name: "T18" }
];

export default function ModalMovies({ open, handleClose, movie, onChangeInput, onCheckboxChange, addOrUpdateMovie, loading, setMovie, error, setError }) {
    const [openChoose, setOpenChoose] = useState(false);
    const [dataChoose, setDataChoose] = useState([]);

    const categoryTypes = useContext(CategoryTypeContext);
    const actors = useContext(ActorContext);
    const categories = useContext(CategoriesContext);
    const authorsList = useContext(AuthorContext);
    const characters = useContext(CharacterContext);
    const plansList = useContext(PlanContext);
    const [type, setType] = useState("");

    const posterPreview = movie.imgFile ? movie.imgUrl : movie.id ? movie.imgUrl || Logo5 : Logo5;
    const bannerPreview = movie.bannerFile ? movie.bannerUrl : movie.id ? movie.bannerUrl || Logo5 : Logo5;

    const handleClickOpenChoose = (type) => {
        if (type === "actors") setDataChoose(actors);
        else if (type === "authors") setDataChoose(authorsList);
        else if (type === "characters") setDataChoose(characters);
        else if (type === "categories") setDataChoose(categories);

        setType(type);
        setOpenChoose(true);
    };

    const handleCloseChoose = () => setOpenChoose(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setMovie(pre => ({ ...pre, imgUrl: reader.result, imgFile: file }));
            reader.readAsDataURL(file);
        }
    };

    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setMovie(pre => ({ ...pre, bannerUrl: reader.result, bannerFile: file }));
            reader.readAsDataURL(file);
        }
    };

    const handleNumberChange = (e) => {
        const onlyNums = e.target.value.replace(/[^0-9]/g, '');
        onChangeInput({ target: { name: e.target.name, value: onlyNums } });
    };

    const handleEndEpisodeChange = (e) => {
        let val = e.target.value;
        if (val.includes('?')) {
            val = '?'; 
        } else {
            val = val.replace(/[^0-9]/g, ''); 
        }
        onChangeInput({ target: { name: 'endEpisode', value: val } });
    };

    const handleSubDubChange = (e) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        const maxVal = parseInt(movie.endEpisode, 10);

        if (val !== "" && !isNaN(maxVal)) {
            if (parseInt(val, 10) > maxVal) {
                val = maxVal.toString(); 
            }
        }
        onChangeInput({ target: { name: e.target.name, value: val } });
    };

    const handleClickChoose = (id) => {
        switch (type) {
            case "actors": setMovie(pre => ({ ...pre, list_Actor: toggleById(pre.list_Actor, id) })); break;
            case "characters": setMovie(pre => ({ ...pre, list_Character: toggleById(pre.list_Character, id) })); break;
            case "categories": 
                setMovie(pre => ({ ...pre, list_Category: toggleById(pre.list_Category, id) })); 
                if (setError) setError(pre => ({ ...pre, list_Category: "" }));
                break;
            default: break;
        }
    };

    const toggleById = (list, id) => {
        if (!Array.isArray(list)) list = [];
        return list.includes(id) ? list.filter(e => e !== id) : [...list, id];
    };

    const handleRemoveItem = (itemType, id) => {
        switch (itemType) {
            case "actors": setMovie(pre => ({ ...pre, list_Actor: (pre.list_Actor || []).filter(e => e !== id) })); break;
            case "characters": setMovie(pre => ({ ...pre, list_Character: (pre.list_Character || []).filter(e => e !== id) })); break;
            case "categories": setMovie(pre => ({ ...pre, list_Category: (pre.list_Category || []).filter(e => e !== id) })); break;
            default: break;
        }
    };

    const getSelectedItems = () => {
        switch (type) {
            case "actors": return movie.list_Actor || [];
            case "characters": return movie.list_Character || [];
            case "categories": return movie.list_Category || [];
            default: return [];
        }
    };

    return (
        <Dialog
            open={open} TransitionComponent={Transition} keepMounted onClose={handleClose}
            maxWidth="lg" fullWidth
            PaperProps={{ className: "modal-inner" }}
            BackdropProps={{ className: "modal-backdrop-x" }}
        >
            <DialogTitle className="modal-header-x">{movie.id ? "UPDATE MOVIE" : "ADD NEW MOVIE"}</DialogTitle>
            <DialogContent className="modal-body-x grid grid-cols-12 gap-8 h-[75vh] overflow-y-auto custom-scrollbar p-8 pt-10">

                <div className="col-span-12 lg:col-span-7 space-y-8 mt-5">
                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 space-y-4">
                        <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest">Task 1: General Info</p>
                        <div className="grid grid-cols-2 gap-4">
                            <TextField className="modal-input-x" name="name" onChange={onChangeInput} fullWidth label="Movie Name" value={movie.name} error={!!error.name} helperText={error.name} />
                            <TextField className="modal-input-x" name="otherName" onChange={onChangeInput} fullWidth label="Other/Original Name" value={movie.otherName} error={!!error.otherName} helperText={error.otherName} />
                        </div>
                        <TextField className="modal-input-x" name="description" onChange={onChangeInput} fullWidth multiline rows={3} label="Description" value={movie.description} error={!!error.description} helperText={error.description} />
                        <div className="grid grid-cols-2 gap-4">
                            <Autocomplete
                                options={COUNTRIES || []} value={movie.countriesID || null}
                                classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                                onChange={(e, newValue) => onChangeInput({ target: { name: "countriesID", value: newValue || "" } })}
                                renderInput={(params) => <TextField {...params} label="Country" error={!!error.countriesID} helperText={error.countriesID} className="modal-input-x" />}
                            />
                            <TextField className="modal-input-x" name="releaseYear" onChange={handleNumberChange} label="Release Year" value={movie.releaseYear} error={!!error.releaseYear} helperText={error.releaseYear} />
                        </div>
                    </div>

                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 space-y-4">
                        <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">Task 2: Specification</p>
                        <div className="grid grid-cols-3 gap-4">
                            <Autocomplete
                                options={STATUS_OPTIONS} getOptionLabel={(opt) => opt?.name || ""} value={STATUS_OPTIONS.find(s => s.id === movie.status) || null}
                                classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                                onChange={(e, val) => onChangeInput({ target: { name: "status", value: val?.id || "" } })}
                                renderInput={(params) => <TextField {...params} label="Status" error={!!error.status} helperText={error.status} className="modal-input-x" />}
                            />
                            <Autocomplete
                                options={AGE_RATING_OPTIONS} getOptionLabel={(opt) => opt?.name || ""} value={AGE_RATING_OPTIONS.find(a => a.id === movie.ageRating) || null}
                                classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                                onChange={(e, val) => onChangeInput({ target: { name: "ageRating", value: val?.id || "" } })}
                                renderInput={(params) => <TextField {...params} label="Age Rating" error={!!error.ageRating} helperText={error.ageRating} className="modal-input-x" />}
                            />
                            <TextField className="modal-input-x" name="rent" onChange={handleNumberChange} label="Rent Price" value={movie.rent} error={!!error.rent} helperText={error.rent} />
                        </div>

                        <div className="border border-white/10 rounded-xl p-4 bg-slate-900/30">
                            <div className="grid grid-cols-2 gap-4">
                                <TextField className="modal-input-x" name="duration" onChange={handleNumberChange} label="Duration (Mins)" value={movie.duration} error={!!error.duration} helperText={error.duration} />
                                <TextField className="modal-input-x" name="endEpisode" onChange={handleEndEpisodeChange} label="Total Episodes (Max)" value={movie.endEpisode} error={!!error.endEpisode} helperText={error.endEpisode} />
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-6 mb-2">
                                <div className="flex justify-center items-center pl-2">
                                    <FormControlLabel
                                        control={<Checkbox checked={movie.hasSub || false} onChange={onCheckboxChange} name="hasSub" sx={{ color: '#06b6d4', '&.Mui-checked': { color: '#22d3ee' }, padding: '4px' }} />}
                                        label={<span className="text-gray-300 text-sm font-semibold ml-1">Subtitled</span>}
                                        sx={{ margin: 0 }}
                                    />
                                </div>
                                <div className="flex justify-center items-center pl-2">
                                    <FormControlLabel
                                        control={<Checkbox checked={movie.hasDub || false} onChange={onCheckboxChange} name="hasDub" sx={{ color: '#ec4899', '&.Mui-checked': { color: '#f472b6' }, padding: '4px' }} />}
                                        label={<span className="text-gray-300 text-sm font-semibold ml-1">Dubbed</span>}
                                        sx={{ margin: 0 }}
                                    />
                                </div>
                                <div className="flex justify-center items-center pl-2">
                                    <FormControlLabel
                                        control={<Checkbox checked={movie.hasVoice || false} onChange={onCheckboxChange} name="hasVoice" sx={{ color: '#f97316', '&.Mui-checked': { color: '#fb923c' }, padding: '4px' }} />}
                                        label={<span className="text-gray-300 text-sm font-semibold ml-1">Voiceover</span>}
                                        sx={{ margin: 0 }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    {movie.hasSub && (
                                        <TextField className="modal-input-x mt-2!" name="episodeSub" onChange={handleSubDubChange} label="Sub Episodes" value={movie.episodeSub} error={!!error.episodeSub} helperText={error.episodeSub} />
                                    )}
                                </div>
                                <div>
                                    {movie.hasDub && (
                                        <TextField className="modal-input-x mt-2!" name="episodeDub" onChange={handleSubDubChange} label="Dub Episodes" value={movie.episodeDub} error={!!error.episodeDub} helperText={error.episodeDub} />
                                    )}
                                </div>
                                <div>
                                    {movie.hasVoice && (
                                        <TextField className="modal-input-x mt-2!" name="episodeVoice" onChange={handleSubDubChange} label="Voice Episodes" value={movie.episodeVoice} error={!!error.episodeVoice} helperText={error.episodeVoice} />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-2">
                            <Autocomplete options={plansList || []} getOptionLabel={(opt) => opt?.name || ""} value={plansList?.find(p => p.id === movie.planID) || null} classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }} onChange={(e, val) => onChangeInput({ target: { name: "planID", value: val?.id || "" } })} renderInput={(params) => <TextField {...params} label="Plan" error={!!error.planID} helperText={error.planID} className="modal-input-x" />} />
                            <Autocomplete options={categoryTypes || []} getOptionLabel={(opt) => opt?.name || ""} value={categoryTypes?.find(c => c.id === movie.category_Type_Id) || null} classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }} onChange={(e, val) => onChangeInput({ target: { name: "category_Type_Id", value: val?.id || "" } })} renderInput={(params) => <TextField {...params} label="Category Type" error={!!error.category_Type_Id} helperText={error.category_Type_Id} className="modal-input-x" />} />
                            <Autocomplete options={authorsList || []} getOptionLabel={(opt) => opt?.name || ""} value={authorsList?.find(a => a.id === movie.author) || null} classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }} onChange={(e, val) => onChangeInput({ target: { name: "author", value: val?.id || "" } })} renderInput={(params) => <TextField {...params} label="Director" error={!!error.author} helperText={error.author} className="modal-input-x" />} />
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-5 space-y-6 mt-5">
                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 space-y-4">
                        <p className="text-green-400 text-xs font-bold uppercase tracking-widest">Task 3: Classifications</p>

                        <div className='flex items-center text-white gap-2'>
                            <label className="font-medium">Categories</label>
                            <TbCategoryFilled onClick={() => handleClickOpenChoose("categories")} className='cursor-pointer text-2xl text-cyan-400 hover:scale-110 transition-transform' />
                            {error.list_Category && <span className="text-red-500 text-xs italic">{error.list_Category}</span>}
                        </div>
                        <div className='text-white flex gap-2 flex-wrap'>
                            {movie.list_Category?.map((item) => {
                                const category = categories?.find(e => e.id === item);
                                return category ? (
                                    <div key={item} className="relative inline-block mt-2 mr-1">
                                        <span className="px-3 py-1.5 bg-gray-300 text-gray-800 border border-gray-400 rounded-lg text-sm font-bold shadow-sm">{category.name}</span>
                                        <FaTimesCircle onClick={() => handleRemoveItem("categories", item)} className="absolute -top-2 -right-2 text-red-500 bg-white rounded-full text-[16px] cursor-pointer hover:scale-110" />
                                    </div>
                                ) : null;
                            })}
                        </div>

                        <div className='flex items-center text-white gap-2'>
                            <label className="font-medium">Actors</label>
                            <TbCategoryFilled onClick={() => handleClickOpenChoose("actors")} className='cursor-pointer text-2xl text-pink-400 hover:scale-110 transition-transform' />
                        </div>
                        <div className='text-white flex gap-2 flex-wrap'>
                            {movie.list_Actor?.map((item) => {
                                const actor = actors?.find(e => e.id === item);
                                return actor ? (
                                    <div key={item} className="relative inline-block mt-1 mr-1">
                                        <img className='w-11 h-11 rounded-full object-cover shadow-[0_0_10px_rgba(236,72,153,0.5)] border border-pink-500/30' src={actor.imgUrl} alt={actor.name} title={actor.name} />
                                        <FaTimesCircle onClick={() => handleRemoveItem("actors", item)} className="absolute -top-0.5 -right-0.5 text-red-500 bg-white rounded-full text-[16px] cursor-pointer hover:scale-110" />
                                    </div>
                                ) : null;
                            })}
                        </div>

                        <div className='flex items-center text-white gap-2 mt-4'>
                            <label className="font-medium">Characters</label>
                            <TbCategoryFilled onClick={() => handleClickOpenChoose("characters")} className='cursor-pointer text-2xl text-green-400 hover:scale-110 transition-transform' />
                        </div>
                        <div className='text-white flex gap-2 flex-wrap'>
                            {movie.list_Character?.map((item) => {
                                const character = characters?.find(e => e.id === item);
                                return character ? (
                                    <div key={item} className="relative inline-block mt-1 mr-1">
                                        <img className='w-11 h-11 rounded-full object-cover shadow-[0_0_10px_rgba(74,222,128,0.5)] border border-green-500/30' src={character.imgUrl} alt={character.name} title={character.name} />
                                        <FaTimesCircle onClick={() => handleRemoveItem("characters", item)} className="absolute -top-0.5 -right-0.5 text-red-500 bg-white rounded-full text-[16px] cursor-pointer hover:scale-110" />
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </div>

                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 flex flex-col gap-5">
                        <p className="text-pink-400 text-xs font-bold uppercase tracking-widest text-center">Task 4: Media Uploads</p>

                        <div className="flex gap-4">
                            <div className="flex flex-col items-center w-1/3">
                                <p className="text-white text-[11px] mb-2 font-bold opacity-70">Poster</p>
                                <div className="relative w-full aspect-2/3 rounded-xl overflow-hidden border-2 border-dashed border-slate-600 group bg-slate-900/50 flex items-center justify-center transition-all hover:border-pink-400">
                                    <img src={posterPreview} className="w-full h-full object-cover group-hover:opacity-20 transition-all" alt="Poster" />
                                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all">
                                        <FaCloudUploadAlt className="text-3xl text-pink-400 mb-1" />
                                        <span className="text-white text-xs font-bold">Upload</span>
                                        <VisuallyHiddenInput type="file" onChange={handleImageChange} accept="image/*" />
                                    </label>
                                </div>
                            </div>
                            <div className="flex flex-col items-center w-2/3">
                                <p className="text-white text-[11px] mb-2 font-bold opacity-70">Banner</p>
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-dashed border-slate-600 group bg-slate-900/50 flex items-center justify-center transition-all hover:border-yellow-400">
                                    <img src={bannerPreview} className="w-full h-full object-cover group-hover:opacity-20 transition-all" alt="Banner" />
                                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all">
                                        <FaCloudUploadAlt className="text-4xl text-yellow-400 mb-1" />
                                        <span className="text-white text-xs font-bold">Upload</span>
                                        <VisuallyHiddenInput type="file" onChange={handleBannerChange} accept="image/*" />
                                    </label>
                                </div>
                            </div>
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
                handleClickChoose={handleClickChoose} type={type} dataChoose={dataChoose}
                handleCloseChoose={handleCloseChoose} openChoose={openChoose} selectedItems={getSelectedItems()}
            />
        </Dialog>
    );
}