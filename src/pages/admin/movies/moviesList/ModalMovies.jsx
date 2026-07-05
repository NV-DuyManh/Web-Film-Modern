import React, { useContext, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, styled, Slide, Autocomplete, Checkbox, FormControlLabel } from '@mui/material';
import { FaCloudUploadAlt, FaTimesCircle, FaLink, FaUsers, FaUserNinja, FaUserTie } from 'react-icons/fa';
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

export default function ModalMovies({ open, handleClose, movie, onChangeInput, onCheckboxChange, addOrUpdateMovie, loading, progress, setMovie, error, setError }) {
    const [openChoose, setOpenChoose] = useState(false);
    const [dataChoose, setDataChoose] = useState([]);

    const categoryTypes = useContext(CategoryTypeContext);
    const actors = useContext(ActorContext);
    const categories = useContext(CategoriesContext);
    const authorsList = useContext(AuthorContext);
    const characters = useContext(CharacterContext);
    const plansList = useContext(PlanContext);
    const [type, setType] = useState("");
    const [posterMode, setPosterMode] = useState("file");
    const [bannerMode, setBannerMode] = useState("file");

    const posterPreview = movie.imgFile ? movie.imgUrl : (movie.imgUrl || Logo5);
    const bannerPreview = movie.bannerFile ? movie.bannerUrl : (movie.bannerUrl || Logo5);

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

    const handlePosterUrlChange = (e) => {
        const url = e.target.value;
        setMovie(pre => ({ ...pre, imgUrl: url, imgFile: null }));
    };

    const handleBannerUrlChange = (e) => {
        const url = e.target.value;
        setMovie(pre => ({ ...pre, bannerUrl: url, bannerFile: null }));
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
            case "authors": setMovie(pre => ({ ...pre, list_Author: toggleById(pre.list_Author, id) })); break;
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
            case "authors": setMovie(pre => ({ ...pre, list_Author: (pre.list_Author || []).filter(e => e !== id) })); break;
            case "characters": setMovie(pre => ({ ...pre, list_Character: (pre.list_Character || []).filter(e => e !== id) })); break;
            case "categories": setMovie(pre => ({ ...pre, list_Category: (pre.list_Category || []).filter(e => e !== id) })); break;
            default: break;
        }
    };

    const getSelectedItems = () => {
        switch (type) {
            case "actors": return movie.list_Actor || [];
            case "authors": return movie.list_Author || [];
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
                            <TextField className="modal-input-x" name="name" onChange={onChangeInput} fullWidth label="Movie Name" value={movie.name} error={!!error?.name} helperText={error?.name} />
                            <TextField className="modal-input-x" name="otherName" onChange={onChangeInput} fullWidth label="Other/Original Name" value={movie.otherName} error={!!error?.otherName} helperText={error?.otherName} />
                        </div>
                        <TextField className="modal-input-x" name="description" onChange={onChangeInput} fullWidth multiline rows={3} label="Description" value={movie.description} error={!!error?.description} helperText={error?.description} />
                        <div className="grid grid-cols-2 gap-4">
                            <Autocomplete
                                options={COUNTRIES || []} value={movie.countriesID || null}
                                classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                                onChange={(e, newValue) => onChangeInput({ target: { name: "countriesID", value: newValue || "" } })}
                                renderInput={(params) => <TextField {...params} label="Country" error={!!error?.countriesID} helperText={error?.countriesID} className="modal-input-x" />}
                            />
                            <TextField className="modal-input-x" name="releaseYear" onChange={handleNumberChange} label="Release Year" value={movie.releaseYear} error={!!error?.releaseYear} helperText={error?.releaseYear} />
                        </div>
                    </div>

                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 space-y-4">
                        <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">Task 2: Specification</p>
                        <div className="grid grid-cols-3 gap-4">
                            <Autocomplete
                                options={STATUS_OPTIONS} getOptionLabel={(opt) => opt?.name || ""} value={STATUS_OPTIONS.find(s => s.id === movie.status) || null}
                                classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                                onChange={(e, val) => onChangeInput({ target: { name: "status", value: val?.id || "" } })}
                                renderInput={(params) => <TextField {...params} label="Status" error={!!error?.status} helperText={error?.status} className="modal-input-x" />}
                            />
                            <Autocomplete
                                options={AGE_RATING_OPTIONS} getOptionLabel={(opt) => opt?.name || ""} value={AGE_RATING_OPTIONS.find(a => a.id === movie.ageRating) || null}
                                classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                                onChange={(e, val) => onChangeInput({ target: { name: "ageRating", value: val?.id || "" } })}
                                renderInput={(params) => <TextField {...params} label="Age Rating" error={!!error?.ageRating} helperText={error?.ageRating} className="modal-input-x" />}
                            />
                            <TextField className="modal-input-x" name="rent" onChange={handleNumberChange} label="Rent Price" value={movie.rent} error={!!error?.rent} helperText={error?.rent} />
                        </div>

                        <div className="border border-white/10 rounded-xl p-4 bg-slate-900/30">
                            <div className="grid grid-cols-2 gap-4">
                                <TextField className="modal-input-x" name="duration" onChange={handleNumberChange} label="Duration (Mins)" value={movie.duration} error={!!error?.duration} helperText={error?.duration} />
                                <TextField className="modal-input-x" name="endEpisode" onChange={handleEndEpisodeChange} label="Total Episodes (Max)" value={movie.endEpisode} error={!!error?.endEpisode} helperText={error?.endEpisode} />
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
                                        <TextField className="modal-input-x mt-2!" name="episodeSub" onChange={handleSubDubChange} label="Sub Episodes" value={movie.episodeSub} error={!!error?.episodeSub} helperText={error?.episodeSub} />
                                    )}
                                </div>
                                <div>
                                    {movie.hasDub && (
                                        <TextField className="modal-input-x mt-2!" name="episodeDub" onChange={handleSubDubChange} label="Dub Episodes" value={movie.episodeDub} error={!!error?.episodeDub} helperText={error?.episodeDub} />
                                    )}
                                </div>
                                <div>
                                    {movie.hasVoice && (
                                        <TextField className="modal-input-x mt-2!" name="episodeVoice" onChange={handleSubDubChange} label="Voice Episodes" value={movie.episodeVoice} error={!!error?.episodeVoice} helperText={error?.episodeVoice} />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <Autocomplete options={plansList || []} getOptionLabel={(opt) => opt?.name || ""} value={plansList?.find(p => p.id === movie.planID) || null} classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }} onChange={(e, val) => onChangeInput({ target: { name: "planID", value: val?.id || "" } })} renderInput={(params) => <TextField {...params} label="Plan" error={!!error?.planID} helperText={error?.planID} className="modal-input-x" />} />
                            <Autocomplete options={categoryTypes || []} getOptionLabel={(opt) => opt?.name || ""} value={categoryTypes?.find(c => c.id === movie.category_Type_Id) || null} classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }} onChange={(e, val) => onChangeInput({ target: { name: "category_Type_Id", value: val?.id || "" } })} renderInput={(params) => <TextField {...params} label="Category Type" error={!!error?.category_Type_Id} helperText={error?.category_Type_Id} className="modal-input-x" />} />
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-5 space-y-6 mt-5">
                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 space-y-4">
                        <p className="text-green-400 text-xs font-bold uppercase tracking-widest">Task 3: Classifications</p>

                        <div className='flex items-center text-white gap-2'>
                            <label className="font-medium">Categories</label>
                            <TbCategoryFilled onClick={() => handleClickOpenChoose("categories")} className='cursor-pointer text-2xl text-cyan-400 hover:scale-110 transition-transform' />
                            {error?.list_Category && <span className="text-red-500 text-xs italic">{error.list_Category}</span>}
                        </div>
                        <div className='text-white flex gap-2 flex-wrap'>
                            {movie.list_Category?.map((item) => {
                                const category = categories?.find(e => e.id === item);
                                return category ? (
                                    <div key={item} className="relative inline-block mt-2 mr-1 group">
                                        <span className="px-3 py-1.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-lg text-[11px] font-bold tracking-wide uppercase shadow-[0_0_10px_rgba(6,182,212,0.15)] group-hover:bg-cyan-500 group-hover:text-white group-hover:border-cyan-400 group-hover:scale-105 group-hover:-translate-y-0.5 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-all duration-300 inline-block cursor-default">{category.name}</span>
                                        <FaTimesCircle onClick={() => handleRemoveItem("categories", item)} className="absolute -top-1.5 -right-1.5 text-rose-500 bg-white rounded-full text-[14px] cursor-pointer hover:text-white hover:bg-rose-500 hover:scale-125 hover:rotate-90 transition-all duration-300 z-10 shadow-sm" />
                                    </div>
                                ) : null;
                            })}
                        </div>

                        <div className='flex items-center text-white gap-2 mt-4'>
                            <label className="font-medium">Directors</label>
                            <FaUserTie onClick={() => handleClickOpenChoose("authors")} className='cursor-pointer text-2xl text-yellow-400 hover:scale-110 transition-transform' />
                            {error?.list_Author && <span className="text-red-500 text-xs italic">{error.list_Author}</span>}
                        </div>
                        <div className='text-white flex gap-2 flex-wrap'>
                            {movie.list_Author?.map((item) => {
                                const author = authorsList?.find(e => e.id === item);
                                return author ? (
                                    <div key={item} className="relative inline-block mt-1 mr-1 group cursor-pointer mb-2">
                                        <img className='w-11 h-11 rounded-full object-cover shadow-[0_0_10px_rgba(250,204,21,0.5)] border border-yellow-500/30 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(250,204,21,0.8)] transition-all duration-300' src={author.imgUrl || Logo5} alt={author.name} />
                                        <FaTimesCircle onClick={() => handleRemoveItem("authors", item)} className="absolute top-0 right-0 text-rose-500 bg-white rounded-full text-[14px] cursor-pointer hover:text-white hover:bg-rose-500 hover:scale-125 hover:rotate-90 transition-all duration-300 z-10 shadow-sm" />
                                        <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-yellow-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                            {author.name}
                                        </div>
                                    </div>
                                ) : null;
                            })}
                        </div>

                        <div className='flex items-center text-white gap-2 mt-4'>
                            <label className="font-medium">Actors</label>
                            <FaUsers onClick={() => handleClickOpenChoose("actors")} className='cursor-pointer text-2xl text-pink-400 hover:scale-110 transition-transform' />
                        </div>
                        <div className='text-white flex gap-2 flex-wrap'>
                            {movie.list_Actor?.map((item) => {
                                const actor = actors?.find(e => e.id === item);
                                return actor ? (
                                    <div key={item} className="relative inline-block mt-1 mr-1 group cursor-pointer mb-2">
                                        <img className='w-11 h-11 rounded-full object-cover shadow-[0_0_10px_rgba(236,72,153,0.5)] border border-pink-500/30 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.8)] transition-all duration-300' src={actor.imgUrl || Logo5} alt={actor.name} />
                                        <FaTimesCircle onClick={() => handleRemoveItem("actors", item)} className="absolute top-0 right-0 text-rose-500 bg-white rounded-full text-[14px] cursor-pointer hover:text-white hover:bg-rose-500 hover:scale-125 hover:rotate-90 transition-all duration-300 z-10 shadow-sm" />
                                        <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-pink-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                            {actor.name}
                                        </div>
                                    </div>
                                ) : null;
                            })}
                        </div>

                        <div className='flex items-center text-white gap-2 mt-4'>
                            <label className="font-medium">Characters</label>
                            <FaUserNinja onClick={() => handleClickOpenChoose("characters")} className='cursor-pointer text-2xl text-green-400 hover:scale-110 transition-transform' />
                        </div>
                        <div className='text-white flex gap-2 flex-wrap'>
                            {movie.list_Character?.map((item) => {
                                const character = characters?.find(e => e.id === item);
                                return character ? (
                                    <div key={item} className="relative inline-block mt-1 mr-1 group cursor-pointer mb-2">
                                        <img className='w-11 h-11 rounded-full object-cover shadow-[0_0_10px_rgba(74,222,128,0.5)] border border-green-500/30 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(74,222,128,0.8)] transition-all duration-300' src={character.imgUrl || Logo5} alt={character.name} />
                                        <FaTimesCircle onClick={() => handleRemoveItem("characters", item)} className="absolute top-0 right-0 text-rose-500 bg-white rounded-full text-[14px] cursor-pointer hover:text-white hover:bg-rose-500 hover:scale-125 hover:rotate-90 transition-all duration-300 z-10 shadow-sm" />
                                        <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                            {character.name}
                                        </div>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </div>

                    <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 flex flex-col gap-5">
                        <p className="text-pink-400 text-xs font-bold uppercase tracking-widest text-center">Task 4: Media Uploads</p>

                        <div className="flex gap-4">
                            <div className="flex flex-col items-center w-1/3">
                                <p className="text-white text-[11px] mb-1 font-bold opacity-70">Poster</p>
                                <div className="flex bg-slate-900/80 rounded-lg p-0.5 mb-2 w-full border border-white/10">
                                    <button type="button" onClick={() => setPosterMode('file')} className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-bold transition-all duration-300 ${posterMode === 'file' ? 'bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]' : 'text-gray-400 hover:text-white'}`}>
                                        <FaCloudUploadAlt className="text-xs" /> File
                                    </button>
                                    <button type="button" onClick={() => setPosterMode('url')} className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-bold transition-all duration-300 ${posterMode === 'url' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white'}`}>
                                        <FaLink className="text-xs" /> URL
                                    </button>
                                </div>
                                {posterMode === 'file' ? (
                                    <div className="relative w-full aspect-2/3 rounded-xl overflow-hidden border-2 border-dashed border-slate-600 group bg-slate-900/50 flex items-center justify-center transition-all hover:border-pink-400">
                                        <img src={posterPreview} className="w-full h-full object-cover group-hover:opacity-20 transition-all" alt="Poster" />
                                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all">
                                            <FaCloudUploadAlt className="text-3xl text-pink-400 mb-1" />
                                            <span className="text-white text-xs font-bold">Upload</span>
                                            <VisuallyHiddenInput type="file" onChange={handleImageChange} accept="image/*" />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="w-full flex flex-col gap-2">
                                        <TextField
                                            className="modal-input-x"
                                            placeholder="https://example.com/poster.jpg"
                                            value={movie.imgUrl?.startsWith('http') ? movie.imgUrl : ''}
                                            onChange={handlePosterUrlChange}
                                            fullWidth
                                            size="small"
                                            InputProps={{ style: { fontSize: 11 } }}
                                        />
                                        <div className="w-full aspect-2/3 rounded-xl overflow-hidden border border-white/10 bg-slate-900/50 flex items-center justify-center">
                                            <img src={movie.imgUrl || Logo5} className="w-full h-full object-cover" alt="Poster Preview" onError={(e) => e.target.src = Logo5} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-center w-2/3">
                                <p className="text-white text-[11px] mb-1 font-bold opacity-70">Banner</p>
                                <div className="flex bg-slate-900/80 rounded-lg p-0.5 mb-2 w-full border border-white/10">
                                    <button type="button" onClick={() => setBannerMode('file')} className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-bold transition-all duration-300 ${bannerMode === 'file' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-[0_0_12px_rgba(234,179,8,0.4)]' : 'text-gray-400 hover:text-white'}`}>
                                        <FaCloudUploadAlt className="text-xs" /> File
                                    </button>
                                    <button type="button" onClick={() => setBannerMode('url')} className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-bold transition-all duration-300 ${bannerMode === 'url' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white'}`}>
                                        <FaLink className="text-xs" /> URL
                                    </button>
                                </div>
                                {bannerMode === 'file' ? (
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-dashed border-slate-600 group bg-slate-900/50 flex items-center justify-center transition-all hover:border-yellow-400">
                                        <img src={bannerPreview} className="w-full h-full object-cover group-hover:opacity-20 transition-all" alt="Banner" />
                                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all">
                                            <FaCloudUploadAlt className="text-4xl text-yellow-400 mb-1" />
                                            <span className="text-white text-xs font-bold">Upload</span>
                                            <VisuallyHiddenInput type="file" onChange={handleBannerChange} accept="image/*" />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="w-full flex flex-col gap-2">
                                        <TextField
                                            className="modal-input-x"
                                            placeholder="https://example.com/banner.jpg"
                                            value={movie.bannerUrl?.startsWith('http') ? movie.bannerUrl : ''}
                                            onChange={handleBannerUrlChange}
                                            fullWidth
                                            size="small"
                                            InputProps={{ style: { fontSize: 11 } }}
                                        />
                                        <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-900/50 flex items-center justify-center">
                                            <img src={movie.bannerUrl || Logo5} className="w-full h-full object-cover" alt="Banner Preview" onError={(e) => e.target.src = Logo5} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </DialogContent>
            
            <DialogActions className="modal-actions-x p-6 w-full flex flex-col">
                {loading ? (
                    <div className="w-full bg-slate-900/40 p-4 rounded-xl border border-white/10 shadow-inner">
                        <div className="flex justify-between text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                            <span className="animate-pulse">Syncing to Cloud Database...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-black/60 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
                            <div 
                                className="bg-linear-to-r from-cyan-400 via-fuchsia-500 to-yellow-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex justify-end gap-3 pt-2">
                        <Button onClick={handleClose} className="btn-cancel-x">Cancel</Button>
                        <Button onClick={addOrUpdateMovie} disabled={loading} className="btn-submit-x">
                            {movie.id ? 'Save Changes' : 'Create Movie'}
                        </Button>
                    </div>
                )}
            </DialogActions>

            <ModalChoose
                handleClickChoose={handleClickChoose} type={type} dataChoose={dataChoose}
                handleCloseChoose={handleCloseChoose} openChoose={openChoose} selectedItems={getSelectedItems()}
            />
        </Dialog>
    );
}
