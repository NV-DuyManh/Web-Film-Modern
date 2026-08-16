import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useMovies } from '../../../../hooks/useCollections';
import { useSearchParams } from 'react-router-dom';
import ModalEpisodes from './ModalEpisodes';
import TableEpisodes from './TableEpisodes';
import { addDocument, updateDocument, fetchDataById } from '../../../../services/firebaseService';
import { Autocomplete, TextField, createFilterOptions } from '@mui/material';
import { BsSearch } from 'react-icons/bs';
import { FaPlus } from 'react-icons/fa';
import { MdMovie } from 'react-icons/md';

import { AuthContext } from '../../../../contexts/AuthProvider';
import { UserContext } from '../../../../contexts/UserProvider';
import { getObjectById } from '../../../../services/firebaseResponse';
import { NEW_EPISODE, YOUR_SERVICE_ID, YOUR_USER_ID } from '../../../../utils/Constants';
import emailjs from "@emailjs/browser";

const inner = { numberEpisode: "", title: "", movieID: "", url: "" };


function Episodes() {
    const users = useContext(UserContext);
    const movies = useMovies() || [];
    
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedMovie, setSelectedMovie] = useState(null);

    useEffect(() => {
        const movieId = searchParams.get("movie");
        if (movieId && movies.length > 0) {
            const mv = movies.find(m => m.slug === movieId || m.id === movieId || m.otherName === movieId);
            if (mv) setSelectedMovie(mv);
        }
    }, [searchParams, movies]);
    const [episodes, setEpisodes] = useState([]);

    useEffect(() => {
        if (!selectedMovie?.id) {
            setEpisodes([]);
            return;
        }
        const unsubscribe = fetchDataById("Episodes", "movieID", selectedMovie.id, (data) => {
            setEpisodes(data);
        });
        return () => unsubscribe();
    }, [selectedMovie?.id]);

    const [open, setOpen] = useState(false);
    const [episode, setEpisode] = useState(inner);
    const [error, setError] = useState(inner);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [isBulkMode, setIsBulkMode] = useState(false);
    const [bulkTarget, setBulkTarget] = useState('both');
    const [bulkText, setBulkText] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (selectedMovie) {
            setEpisode(prev => ({ ...prev, movieID: selectedMovie.id, title: selectedMovie.name }));
        } else {
            setEpisode(inner);
        }
    }, [selectedMovie]);

    const onChangeSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleClickOpen = () => {
        if (!selectedMovie) {
            alert("Please select a movie first.");
            return;
        }
        setOpen(true);
        setEpisode({ ...inner, movieID: selectedMovie.id });
        setError(inner);
    };

    const handleClose = () => {
        setOpen(false);
        setIsBulkMode(false);
        setBulkTarget('both');
        setBulkText("");
        setEpisode({ ...inner, movieID: selectedMovie ? selectedMovie.id : "" });
    };

    const onChangeInput = (e) => {
        setEpisode(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(prev => ({ ...prev, [e.target.name]: "" }));
    };

    const validation = () => {
        const newError = {};
        newError.numberEpisode = episode.numberEpisode !== "" ? "" : "Please enter episode number";
        newError.movieID = episode.movieID ? "" : "Please select a movie";
        newError.url = episode.url ? "" : "Please enter episode url";

        setError(newError);
        return Object.values(newError).some(e => e !== "");
    };

    const addEpisode = async () => {
        if (validation()) return;
        setLoading(true);
        setProgress(20);

        try {
            let submitData = { ...episode };
            submitData.numberEpisode = parseInt(submitData.numberEpisode) || 0;
            setProgress(50);

            if (!episode.id) {
                const existingEp = episodes?.find(e => e.movieID === submitData.movieID && Number(e.numberEpisode) === Number(submitData.numberEpisode));
                if (existingEp) {
                    submitData.id = existingEp.id;
                    await updateDocument("Episodes", submitData);
                } else {
                    await addDocument("Episodes", submitData);       
                    const listUser = users.filter(t => t?.listFavorite?.some(p => p == submitData.movieID));
                    const movie = getObjectById(movies, submitData.movieID);
                    
                    listUser.forEach(p => {
                        const templateParams = {
                            to_email: p.email,
                            user_name: p.name || p.email,
                            movie_name: movie?.otherName || movie?.name || 'Phim Mới',
                            episode_number: submitData.numberEpisode,
                            release_date: new Date().toLocaleDateString('vi-VN'),
                            movie_banner: movie?.bannerUrl || movie?.imgUrl || movie?.thumbUrl || 'https://via.placeholder.com/480x270',
                            watch_url: `https://mfilm.online/phim/${movie?.slug || ''}`
                        };
                        
                        emailjs.send(YOUR_SERVICE_ID, NEW_EPISODE, templateParams, YOUR_USER_ID);
                    });
                }
            } else {
                await updateDocument("Episodes", submitData);
            }

            setProgress(100);
            setTimeout(() => {
                handleClose();
                setLoading(false);
                setProgress(0);
            }, 500);
        } catch (err) {
            alert("Có lỗi xảy ra, vui lòng thử lại!");
            setLoading(false);
            setProgress(0);
        }
    };

    const addBulkEpisodes = async () => {
        if (!episode.movieID) {
            setError({ ...inner, movieID: "Vui lòng chọn phim trước" });
            return;
        }
        if (!bulkText.trim()) {
            alert("Vui lòng nhập nội dung!");
            return;
        }

        setLoading(true);
        setProgress(5);

        try {
            const lines = bulkText.split('\n').filter(line => line.trim() !== '');
            const total = lines.length;
            let count = 0;

            for (let i = 0; i < total; i++) {
                const line = lines[i];
                const parts = line.split('|');

                if (parts.length >= 2) {
                    const epName = parts[0].trim();
                    let url = '';
                    let url2 = '';

                    if (bulkTarget === '1') {
                        url = parts[1]?.trim() || '';
                    } else if (bulkTarget === '2') {
                        url2 = parts[1]?.trim() || '';
                    } else {
                        url = parts[1]?.trim() || '';
                        url2 = parts[2]?.trim() || '';
                    }

                    const numMatch = epName.match(/\d+/);
                    const numberEpisode = numMatch ? parseInt(numMatch[0]) : (i + 1);

                    const existingEp = episodes?.find(e => e.movieID === episode.movieID && Number(e.numberEpisode) === Number(numberEpisode));

                    const submitData = {
                        movieID: episode.movieID,
                        title: selectedMovie?.name || "",
                        numberEpisode: numberEpisode,
                    };

                    if (bulkTarget === '1' || bulkTarget === 'both') {
                        submitData.url = url;
                    }
                    if (bulkTarget === '2' || bulkTarget === 'both') {
                        submitData.url2 = url2;
                    }

                    if (existingEp) {
                        submitData.id = existingEp.id;
                        await updateDocument("Episodes", submitData);
                    } else {
                        await addDocument("Episodes", submitData);

                        const listUser = users.filter(t => t.listFavorite.some(p => p == submitData.movieID));
                        listUser.map(p => {
                            const templateParams = {
                                to_email: p.email,
                                user_name: p.name,
                                movie_name: getObjectById(movies, submitData.movieID).name,
                                episode_number: submitData.numberEpisode,
                                release_date: new Date(),
                            };
                            console.log(templateParams);

                            emailjs.send(
                                YOUR_SERVICE_ID,
                                NEW_EPISODE,
                                templateParams,
                                YOUR_USER_ID
                            );

                        });
                    }
                }

                count++;
                setProgress(Math.floor((count / total) * 100));
            }

            setProgress(100);
            setTimeout(() => {
                handleClose();
                setLoading(false);
                setProgress(0);
                setBulkText("");
            }, 1000);

        } catch (err) {

            alert("Có lỗi xảy ra trong quá trình thêm hàng loạt!");
            setLoading(false);
            setProgress(0);
        }
    };

    const selectedMovieEpisodesCount = episodes?.length || 0;

    const filterOptions = createFilterOptions({
        matchFrom: 'any',
        stringify: (option) => option.name + " " + (option.otherName || "")
    });

    return (
        <div>
            <div className="flex items-center justify-between gap-6 p-4 bg-black/20 relative z-10">
                <h1 className="font-bold text-3xl glow-text tracking-wide whitespace-nowrap m-0">
                    Episode Manager
                </h1>

                <div className="w-full flex-1 max-w-4xl">
                    <Autocomplete
                        options={movies}
                        filterOptions={filterOptions}
                        getOptionLabel={(opt) => opt?.otherName || opt?.name || ""}
                        value={selectedMovie}
                        onChange={(e, val) => { setSelectedMovie(val); if (val) { setSearchParams({ movie: val.slug || val.otherName || val.id }); } else { setSearchParams({}); } }}
                        classes={{ paper: 'neon-paper', listbox: 'neon-listbox', option: 'neon-option' }}
                        className="w-full"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                padding: '0.4rem 1rem',
                                paddingRight: '3rem !important',
                                borderRadius: '0.5rem',
                                background: 'rgba(24, 24, 27, 0.4)',
                                border: '1px solid #00f2fe',
                                boxShadow: '0 0 15px rgba(0, 242, 254, 0.6), inset 0 0 5px rgba(0, 242, 254, 0.2)',
                                color: 'white',
                                fontSize: '0.875rem',
                                transition: 'all 0.3s ease',
                                '& fieldset': { border: 'none' },
                                '&:hover': {
                                    borderColor: '#22c55e',
                                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.8), inset 0 0 5px rgba(34, 197, 94, 0.3)',
                                },
                                '&.Mui-focused': {
                                    borderColor: '#ff00ff',
                                    boxShadow: '0 0 25px rgba(255, 0, 255, 0.9), inset 0 0 10px rgba(255, 0, 255, 0.4)',
                                }
                            },
                            '& .MuiInputBase-input': {
                                color: 'white',
                                '&::placeholder': { color: 'rgba(255, 255, 255, 0.5)', opacity: 1 }
                            },
                            '& .MuiAutocomplete-endAdornment': {
                                right: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                            },
                            '& .MuiIconButton-root': {
                                color: '#00f2fe'
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Type to search movie..."
                                variant="outlined"
                            />
                        )}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                    />
                </div>
            </div>

            {!selectedMovie ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] mt-4 animate-[fadeIn_0.5s_ease-out]">
                    <div className="flex flex-col items-center justify-center text-center bg-slate-900/40 backdrop-blur-md p-10 rounded-2xl border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)] max-w-lg w-full mx-4 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-500 to-transparent"></div>
                        <div className="w-20 h-20 bg-cyan-900/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(6,182,212,0.2)] border border-cyan-400/30 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-500">
                            <MdMovie className="text-4xl text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-black text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-500 mb-3 uppercase tracking-wider">No Movie Selected</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Search and choose a movie from the top bar to view and manage its episodes.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-1 animate-[fadeIn_0.5s_ease-out]">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-5 py-2 mb-0">
                        <div className="search w-full sm:max-w-md">
                            <input
                                type="text"
                                placeholder="Search Episode Number..."
                                className="search-input"
                                value={search}
                                onChange={onChangeSearch}
                            />
                            <BsSearch className="search-icon" />
                        </div>

                        <div className="flex items-center justify-end gap-4 w-full sm:w-auto flex-1">
                            {selectedMovie && (
                                <span className="text-sm font-bold text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-lg border border-cyan-400/20 whitespace-nowrap hidden sm:block">
                                    {selectedMovieEpisodesCount} Episodes
                                </span>
                            )}
                            <button onClick={handleClickOpen} className="btn-add whitespace-nowrap w-full sm:w-auto shadow-lg">
                                ADD <FaPlus />
                            </button>
                        </div>
                    </div>

                    <TableEpisodes
                        setEpisode={setEpisode}
                        handleClickOpen={handleClickOpen}
                        episode={episode}
                        search={search}
                        selectedMovie={selectedMovie}
                        episodes={episodes}
                    />
                </div>
            )}

            <ModalEpisodes
                addEpisode={addEpisode}
                addBulkEpisodes={addBulkEpisodes}
                onChangeInput={onChangeInput}
                open={open}
                handleClose={handleClose}
                error={error}
                loading={loading}
                progress={progress}
                episode={episode}
                setEpisode={setEpisode}
                isBulkMode={isBulkMode}
                setIsBulkMode={setIsBulkMode}
                bulkTarget={bulkTarget}
                setBulkTarget={setBulkTarget}
                bulkText={bulkText}
                setBulkText={setBulkText}
                selectedMovie={selectedMovie}
            />
        </div>
    );
}

export default Episodes;
