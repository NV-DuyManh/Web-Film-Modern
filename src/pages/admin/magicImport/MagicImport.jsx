import React, { useState, useContext } from 'react';
import { FaMagic, FaCloudUploadAlt, FaSpinner, FaCheckCircle, FaFileExcel, FaTrash, FaExchangeAlt } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { parseTSV, mapMovieData } from './MagicParser';
import { db } from '../../../config/firebaseConfig';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore'; 

import { CategoriesContext } from '../../../contexts/CategoryProvider';
import { AuthorContext } from '../../../contexts/AuthorProvider';
import { PlanContext } from '../../../contexts/PlanProvider';
import { CategoryTypeContext } from '../../../contexts/CategoryTypeProvider';
import { ActorContext } from '../../../contexts/ActorProvider';
import { CharacterContext } from '../../../contexts/CharacterProvider';
import { MovieContext } from '../../../contexts/MovieProvider';
import { EpisodeContext } from '../../../contexts/EpisodeProvider';
import { ShowTimeContext } from '../../../contexts/ShowTimeProvider';

import LOGO from "../../../assets/Logo.png";

function MagicImport() {
    const [inputText, setInputText] = useState("");
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [mode, setMode] = useState('IMPORT'); 

    const categories = useContext(CategoriesContext) || [];
    const authors = useContext(AuthorContext) || [];
    const plans = useContext(PlanContext) || [];
    const categoryTypes = useContext(CategoryTypeContext) || [];
    const actors = useContext(ActorContext) || [];
    const characters = useContext(CharacterContext) || [];
    const existingMovies = useContext(MovieContext) || []; 
    const existingEpisodes = useContext(EpisodeContext) || [];
    const existingShowtimes = useContext(ShowTimeContext) || [];

    const handleParse = () => {
        const rawData = parseTSV(inputText);
        setPreviewData(mapMovieData(rawData));
        setSuccessMsg("");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSuccessMsg("");
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            const formattedData = data.map(row => {
                const newRow = {};
                for (let key in row) newRow[key.toLowerCase().trim()] = String(row[key]);
                return newRow;
            });
            setPreviewData(mapMovieData(formattedData));
        };
        reader.readAsBinaryString(file);
        e.target.value = null;
    };

    const handleRemoveRow = (indexToRemove) => {
        setPreviewData(prevData => prevData.filter((_, index) => index !== indexToRemove));
    };

    const handleExecuteImport = async () => {
        if (previewData.length === 0) return;
        setLoading(true);

        let localCategories = [...categories];
        let localAuthors = [...authors];
        let localActors = [...actors];
        let localCharacters = [...characters];
        let localCategoryTypes = [...categoryTypes];
        let localMovies = [...existingMovies]; 
        let localEpisodes = [...existingEpisodes];
        let localShowtimes = [...existingShowtimes];

        let moviesAdded = 0, moviesUpdated = 0, epsAdded = 0, showtimesAdded = 0;

        try {
            for (const movie of previewData) {
                let currentMovieId = "";
                const existingMovie = localMovies.find(m => m?.name && movie?.name && m.name.toLowerCase() === movie.name.toLowerCase());
                
                if (existingMovie && mode === 'IMPORT') {
                    currentMovieId = existingMovie.id; 
                } else {
                    let list_Category = [];
                    let list_Actor = [];
                    let list_Character = [];
                    let authorID = "";
                    let category_Type_Id = "";

                    // 1. Categories
                    if (movie.rawCategories) {
                        const names = movie.rawCategories.split(',').map(n => n.trim());
                        const descs = movie.rawCategoryDesc ? movie.rawCategoryDesc.split('|').map(d => d.trim()) : [];
                        for (let i = 0; i < names.length; i++) {
                            const name = names[i];
                            const exist = localCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
                            const finalDesc = descs[i] || "Đang cập nhật..."; 
                            if (exist) {
                                list_Category.push(exist.id);
                                if (mode === 'UPDATE') await updateDoc(doc(db, "Categories", exist.id), { description: finalDesc });
                            } else {
                                const newRef = doc(collection(db, "Categories"));
                                await setDoc(newRef, { id: newRef.id, name, description: finalDesc });
                                list_Category.push(newRef.id);
                                localCategories.push({ id: newRef.id, name });
                            }
                        }
                    }

                    // 2. CategoryType
                    if (movie.rawCategoryType) {
                        const exist = localCategoryTypes.find(c => c.name.toLowerCase() === movie.rawCategoryType.toLowerCase());
                        if (exist) category_Type_Id = exist.id;
                        else {
                            const newRef = doc(collection(db, "CategoryType"));
                            await setDoc(newRef, { id: newRef.id, name: movie.rawCategoryType, description: "Đang cập nhật..." });
                            category_Type_Id = newRef.id;
                            localCategoryTypes.push({ id: newRef.id, name: movie.rawCategoryType });
                        }
                    }

                    // 3. Authors
                    if (movie.rawAuthor) {
                        const exist = localAuthors.find(a => a.name.toLowerCase() === movie.rawAuthor.toLowerCase());
                        const finalDesc = movie.rawAuthorDesc || "Đang cập nhật...";
                        const finalGender = movie.gender ? movie.gender.split('|')[0].trim() : "Male";
                        
                        if (exist) {
                            authorID = exist.id;
                            if (mode === 'UPDATE') await updateDoc(doc(db, "Authors", exist.id), { description: finalDesc, sexID: finalGender });
                        } else {
                            const newRef = doc(collection(db, "Authors"));
                            await setDoc(newRef, { id: newRef.id, name: movie.rawAuthor, imgUrl: LOGO, description: finalDesc, sexID: finalGender, countriesID: movie.countriesID });
                            authorID = newRef.id;
                            localAuthors.push({ id: newRef.id, name: movie.rawAuthor });
                        }
                    }

                    // 4. Actors (Tách giới tính bằng |)
                    if (movie.rawActors) {
                        const names = movie.rawActors.split(',').map(n => n.trim());
                        const descs = movie.rawActorDesc ? movie.rawActorDesc.split('|').map(d => d.trim()) : [];
                        const genders = movie.gender ? movie.gender.split('|').map(g => g.trim()) : [];
                        for (let i = 0; i < names.length; i++) {
                            const name = names[i];
                            const finalDesc = descs[i] || "Đang cập nhật...";
                            const finalGender = genders[i] || "Male";
                            
                            const exist = localActors.find(a => a.name.toLowerCase() === name.toLowerCase());
                            if (exist) {
                                list_Actor.push(exist.id);
                                if (mode === 'UPDATE') await updateDoc(doc(db, "Actors", exist.id), { description: finalDesc, sexID: finalGender });
                            } else {
                                const newRef = doc(collection(db, "Actors"));
                                await setDoc(newRef, { id: newRef.id, name, imgUrl: LOGO, description: finalDesc, sexID: finalGender, countriesID: movie.countriesID });
                                list_Actor.push(newRef.id);
                                localActors.push({ id: newRef.id, name });
                            }
                        }
                    }

                    // 5. Characters (Tách giới tính bằng |)
                    if (movie.rawCharacters) {
                        const names = movie.rawCharacters.split(',').map(n => n.trim());
                        const descs = movie.rawCharacterDesc ? movie.rawCharacterDesc.split('|').map(d => d.trim()) : [];
                        const genders = movie.charGender ? movie.charGender.split('|').map(g => g.trim()) : [];
                        for (let i = 0; i < names.length; i++) {
                            const name = names[i];
                            const finalDesc = descs[i] || "Đang cập nhật...";
                            const finalGender = genders[i] || "Male";
                            
                            const exist = localCharacters.find(c => c.name.toLowerCase() === name.toLowerCase());
                            if (exist) {
                                list_Character.push(exist.id);
                                if (mode === 'UPDATE') await updateDoc(doc(db, "Characters", exist.id), { description: finalDesc, sexID: finalGender });
                            } else {
                                const newRef = doc(collection(db, "Characters"));
                                await setDoc(newRef, { id: newRef.id, name, imgUrl: LOGO, description: finalDesc, sexID: finalGender, countriesID: movie.countriesID });
                                list_Character.push(newRef.id);
                                localCharacters.push({ id: newRef.id, name });
                            }
                        }
                    }

                    let finalPlanID = plans.length > 0 ? plans[0].id : "";
                    if (movie.rawPlan) {
                        const foundPlan = plans.find(p => p.name.toLowerCase() === movie.rawPlan.toLowerCase());
                        if (foundPlan) finalPlanID = foundPlan.id;
                    }

                    if (existingMovie && mode === 'UPDATE') {
                        currentMovieId = existingMovie.id;
                        const movieRef = doc(db, "Movies", currentMovieId);
                        const updateData = { updatedAt: new Date().toISOString() };
                        if (movie.description !== "Đang cập nhật...") updateData.description = movie.description;
                        if (movie.duration > 0) updateData.duration = movie.duration;
                        if (movie.rent >= 0) updateData.rent = movie.rent;
                        if (movie.releaseYear) updateData.releaseYear = movie.releaseYear;
                        if (authorID) updateData.author = authorID;
                        if (category_Type_Id) updateData.category_Type_Id = category_Type_Id;
                        
                        updateData.list_Category = Array.from(new Set([...(existingMovie.list_Category || []), ...list_Category]));
                        updateData.list_Actor = Array.from(new Set([...(existingMovie.list_Actor || []), ...list_Actor]));
                        updateData.list_Character = Array.from(new Set([...(existingMovie.list_Character || []), ...list_Character]));

                        await updateDoc(movieRef, updateData);
                        moviesUpdated++;
                    } else if (!existingMovie) {
                        const movieRef = doc(collection(db, "Movies"));
                        currentMovieId = movieRef.id;
                        const submitMovie = {
                            ...movie, id: currentMovieId, imgUrl: LOGO, bannerUrl: LOGO, list_Category, list_Actor, list_Character,
                            author: authorID, category_Type_Id, planID: finalPlanID, createdAt: new Date().toISOString()
                        };
                        await setDoc(movieRef, submitMovie);
                        localMovies.push({ id: currentMovieId, name: movie.name });
                        moviesAdded++;
                    }
                }

                if (movie.epNumber && movie.epUrl) {
                    const epExists = localEpisodes.find(e => e.movieID === currentMovieId && e.numberEpisode === Number(movie.epNumber));
                    if (!epExists) {
                        const epRef = doc(collection(db, "Episodes"));
                        await setDoc(epRef, { id: epRef.id, movieID: currentMovieId, numberEpisode: Number(movie.epNumber), url: movie.epUrl, createdAt: new Date().toISOString() });
                        localEpisodes.push({ movieID: currentMovieId, numberEpisode: Number(movie.epNumber) });
                        epsAdded++;
                    }
                }

                if (movie.rawShowtimes && movie.roomName) {
                    const stExists = localShowtimes.find(s => s.movieId === currentMovieId && s.roomName === movie.roomName && s.time === movie.rawShowtimes);
                    if (!stExists) {
                        const stRef = doc(collection(db, "ShowTimes")); 
                        await setDoc(stRef, { id: stRef.id, movieId: currentMovieId, time: movie.rawShowtimes, roomName: movie.roomName, createdAt: new Date().toISOString() });
                        localShowtimes.push({ movieId: currentMovieId, roomName: movie.roomName, time: movie.rawShowtimes });
                        showtimesAdded++;
                    }
                }
            }

            if (moviesAdded > 0 || epsAdded > 0 || showtimesAdded > 0 || moviesUpdated > 0) {
                setSuccessMsg(`Import successful! Created ${moviesAdded} Movies, Updated ${moviesUpdated} Movies/Entities.`);
            } else {
                setSuccessMsg(`No items processed! Data is already fully up-to-date.`);
            }
            setPreviewData([]);
        } catch (error) {
            console.error(error);
            alert("An error occurred! Please check F12 Console for details.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase();
        if (s === "ongoing" || s === "đang chiếu") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        if (s === "completed" || s === "hoàn thành") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    };

    return (
        <div className='p-6 min-h-screen text-white'>
            <div className='flex items-center gap-4 mb-8 bg-slate-800/40 p-5 rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)]'>
                <div className='w-14 h-14 rounded-xl bg-linear-to-br from-cyan-400 to-purple-500 flex justify-center items-center shadow-[0_0_15px_rgba(34,211,238,0.5)]'>
                    <FaMagic className='text-3xl text-white' />
                </div>
                <div>
                    <h1 className='text-3xl font-black tracking-wide glow-text uppercase'>Magic Import</h1>
                    <p className='text-gray-400 text-sm mt-1'>Copy table from Excel to automatically sync Movies, Episodes & Showtimes.</p>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
                <div className='col-span-1 lg:col-span-4 flex flex-col gap-4'>
                    <div className='bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl relative group transition-all hover:border-cyan-500/50'>
                        
                        <div className="flex bg-slate-800 rounded-xl p-1 mb-5 border border-white/10 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 p-1.5 rounded-full z-10">
                                <FaExchangeAlt className="text-gray-500 text-xs" />
                            </div>
                            <button 
                                onClick={() => setMode('IMPORT')}
                                className={`flex-1 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 z-0
                                    ${mode === 'IMPORT' ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Import Only
                            </button>
                            <button 
                                onClick={() => setMode('UPDATE')}
                                className={`flex-1 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 z-0
                                    ${mode === 'UPDATE' ? 'bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Smart Update
                            </button>
                        </div>

                        <h2 className='text-cyan-400 font-bold mb-3 uppercase tracking-wider text-sm flex items-center gap-2'>
                            <FaCloudUploadAlt className="text-xl" /> Data Input Area
                        </h2>
                        <textarea
                            className='w-full h-80 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-gray-300 font-mono focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] custom-scrollbar'
                            placeholder='Paste data table here...'
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)} 
                        />
                        
                        <div className="flex flex-col gap-3 mt-4">
                            <button 
                                onClick={handleParse}
                                className={`w-full py-3 rounded-xl text-white font-bold tracking-wider uppercase transition-all active:scale-95
                                    ${mode === 'IMPORT' ? 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_rgba(8,145,178,0.4)]' : 'bg-fuchsia-600 hover:bg-fuchsia-500 shadow-[0_0_15px_rgba(192,38,211,0.4)]'}`}
                            >
                                Parse Data ({mode})
                            </button>
                        </div>
                    </div>
                </div>

                <div className='col-span-1 lg:col-span-8 flex flex-col gap-4'>
                    <div className='bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl h-full flex flex-col'>
                        <h2 className='text-pink-400 font-bold mb-3 uppercase tracking-wider text-sm flex items-center justify-between'>
                            <span>Preview Table ({mode === 'UPDATE' ? 'Update Mode' : 'Import Mode'})</span>
                            <span className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-xs border border-pink-500/30">
                                {previewData.length} items
                            </span>
                        </h2>
                        
                        <div className='flex-1 border border-white/10 rounded-xl bg-black/40 relative overflow-hidden'>
                            {previewData.length > 0 ? (
                                <div className='overflow-auto h-100 custom-scrollbar p-2'>
                                    <table className='w-full whitespace-nowrap text-xs min-w-max'>
                                        <thead className='text-gray-400 border-b border-white/10 bg-slate-800/50 sticky top-0 z-10'>
                                            <tr>
                                                <th className='p-3 text-center align-middle'>ACTION</th>
                                                <th className='p-3 text-center align-middle'>NAME (INTL)</th>
                                                <th className='p-3 text-center align-middle'>NAME (VN)</th>
                                                <th className='p-3 text-center align-middle'>MOVIE DESC</th>
                                                <th className='p-3 text-center align-middle'>TYPE</th>
                                                <th className='p-3 text-center align-middle'>CATEGORIES</th>
                                                <th className='p-3 text-center align-middle'>CAT DESC</th>
                                                <th className='p-3 text-center align-middle'>DIRECTOR</th>
                                                <th className='p-3 text-center align-middle'>DIR DESC</th>
                                                <th className='p-3 text-center align-middle'>ACTORS</th>
                                                <th className='p-3 text-center align-middle'>ACTOR DESC</th>
                                                <th className='p-3 text-center align-middle'>CHARACTERS</th>
                                                <th className='p-3 text-center align-middle'>CHAR DESC</th>
                                                <th className='p-3 text-center align-middle'>GENDER</th>
                                                <th className='p-3 text-center align-middle'>CHAR GENDER</th>
                                                <th className='p-3 text-center align-middle'>INFO (YEAR/AGE/PLAN)</th>
                                                <th className='p-3 text-center align-middle'>DURATION</th>
                                                <th className='p-3 text-center align-middle'>RENT PRICE</th>
                                                <th className='p-3 text-center align-middle'>COUNTRY</th>
                                                <th className='p-3 text-center align-middle'>EPISODES</th>
                                                <th className='p-3 text-center align-middle'>EP DATA (NUM/URL)</th>
                                                <th className='p-3 text-center align-middle'>SHOWTIME (ROOM/TIME)</th>
                                                <th className='p-3 text-center align-middle'>STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((row, idx) => {
                                                const isDuplicated = existingMovies.find(m => m?.name && row?.name && m.name.toLowerCase() === row.name.toLowerCase());
                                                return (
                                                    <tr key={idx} className={`border-b border-white/5 transition-colors ${isDuplicated ? (mode === 'UPDATE' ? 'bg-fuchsia-500/10 hover:bg-fuchsia-500/20' : 'bg-indigo-500/10 hover:bg-indigo-500/20') : 'hover:bg-white/5 text-gray-200'}`}>
                                                        <td className='p-3 text-center align-middle'>
                                                            <button onClick={() => handleRemoveRow(idx)} className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="Remove row"><FaTrash size={14} /></button>
                                                        </td>
                                                        <td className='p-3 text-center align-middle font-bold text-cyan-300'>
                                                            {row.name} 
                                                            {isDuplicated ? (
                                                                mode === 'UPDATE' ? (
                                                                    <div className="mt-1 text-[9px] bg-fuchsia-500 text-white px-1.5 py-0.5 rounded uppercase block w-max mx-auto shadow-[0_0_8px_rgba(217,70,239,0.5)]">Will Update</div>
                                                                ) : (
                                                                    <div className="mt-1 text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase block w-max mx-auto shadow-[0_0_8px_rgba(99,102,241,0.5)]">Append Eps</div>
                                                                )
                                                            ) : (
                                                                <div className="mt-1 text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase block w-max mx-auto shadow-[0_0_8px_rgba(16,185,129,0.5)]">Create New</div>
                                                            )}
                                                        </td>
                                                        <td className='p-3 text-center align-middle text-emerald-300 font-semibold'>{row.otherName}</td>
                                                        <td className='p-3 text-center align-middle text-gray-300 truncate max-w-40' title={row.description}>{row.description}</td>
                                                        <td className='p-3 text-center align-middle text-purple-300'>{row.rawCategoryType}</td>
                                                        <td className='p-3 text-center align-middle text-pink-300'>{row.rawCategories}</td>
                                                        <td className='p-3 text-center align-middle text-pink-200 truncate max-w-40' title={row.rawCategoryDesc}>{row.rawCategoryDesc}</td>
                                                        <td className='p-3 text-center align-middle text-green-300'>{row.rawAuthor}</td>
                                                        <td className='p-3 text-center align-middle text-green-200 truncate max-w-40' title={row.rawAuthorDesc}>{row.rawAuthorDesc}</td>
                                                        <td className='p-3 text-center align-middle text-blue-300 truncate max-w-30' title={row.rawActors}>{row.rawActors}</td>
                                                        <td className='p-3 text-center align-middle text-blue-200 truncate max-w-40' title={row.rawActorDesc}>{row.rawActorDesc}</td>
                                                        <td className='p-3 text-center align-middle text-orange-300 truncate max-w-30' title={row.rawCharacters}>{row.rawCharacters}</td>
                                                        <td className='p-3 text-center align-middle text-orange-200 truncate max-w-40' title={row.rawCharacterDesc}>{row.rawCharacterDesc}</td>
                                                        <td className='p-3 text-center align-middle text-emerald-300 truncate max-w-20' title={row.gender}>{row.gender}</td>
                                                        <td className='p-3 text-center align-middle text-emerald-300 truncate max-w-20' title={row.charGender}>{row.charGender}</td>
                                                        <td className='p-3 text-center align-middle'>
                                                            <div className="flex flex-col gap-1 items-center">
                                                                <span className="text-yellow-400 font-bold">{row.releaseYear}</span>
                                                                <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold">{row.ageRating}</span>
                                                                <span className="bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold">{row.rawPlan || "Free"}</span>
                                                            </div>
                                                        </td>
                                                        <td className='p-3 text-center align-middle font-mono'>{row.duration}m</td>
                                                        <td className='p-3 text-center align-middle font-mono text-green-400'>{row.rent.toLocaleString()}</td>
                                                        <td className='p-3 text-center align-middle'><span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded text-[11px] font-bold">{row.countriesID}</span></td>
                                                        <td className='p-3 text-center align-middle'>
                                                            <div className="flex flex-col gap-1 items-center bg-purple-500/10 border border-purple-500/20 p-1.5 rounded-lg">
                                                                <span className="text-purple-300 font-bold text-[13px]">Total: {row.endEpisode}</span>
                                                                <span className="text-[10px] text-purple-400">S:{row.episodeSub} | D:{row.episodeDub}</span>
                                                            </div>
                                                        </td>
                                                        <td className='p-3 text-center align-middle'>
                                                            <div className="flex flex-col gap-1 items-center">
                                                                {row.epNumber ? <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">Ep: {row.epNumber}</span> : <span className="text-gray-500 text-[10px]">-</span>}
                                                                {row.epUrl ? <span className="text-blue-400 text-[10px] truncate w-16" title={row.epUrl}>URL OK</span> : <span className="text-gray-500 text-[10px]">-</span>}
                                                            </div>
                                                        </td>
                                                        <td className='p-3 text-center align-middle'>
                                                            <div className="flex flex-col gap-1 items-center">
                                                                {row.roomName ? <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-bold">{row.roomName}</span> : <span className="text-gray-500 text-[10px]">-</span>}
                                                                {row.rawShowtimes ? <span className="text-cyan-200 text-[10px] truncate w-16" title={row.rawShowtimes}>{row.rawShowtimes}</span> : <span className="text-gray-500 text-[10px]">-</span>}
                                                            </div>
                                                        </td>
                                                        <td className='p-3 text-center align-middle'>
                                                            <span className={`px-2 py-1 rounded text-[11px] font-bold border ${getStatusStyle(row.status)}`}>{row.status}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className='absolute inset-0 flex flex-col items-center justify-center text-gray-500 opacity-50'>
                                    <FaMagic className='text-5xl mb-3' />
                                    <p>Data will appear here after parsing</p>
                                </div>
                            )}
                        </div>

                        {successMsg && (
                            <div className={`mt-4 p-3 border rounded-xl flex items-center justify-center gap-2 text-sm font-bold animate-pulse ${successMsg.includes('No items') ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-green-500/20 border-green-500/50 text-green-400'}`}>
                                <FaCheckCircle /> {successMsg}
                            </div>
                        )}

                        <button 
                            onClick={handleExecuteImport}
                            disabled={loading || previewData.length === 0}
                            className={`w-full mt-4 py-3 rounded-xl font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2
                                ${previewData.length > 0 
                                    ? (mode === 'IMPORT' 
                                        ? 'bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                                        : 'bg-linear-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 shadow-[0_0_15px_rgba(217,70,239,0.5)]')
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'}`}
                        >
                            {loading ? <FaSpinner className="spin text-xl" /> : `CONFIRM & EXECUTE (${mode})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MagicImport;