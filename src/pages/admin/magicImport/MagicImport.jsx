import React, { useState, useContext, useEffect } from 'react';
import { FaMagic, FaCloudUploadAlt, FaCheckCircle, FaFileExcel, FaTrash, FaExchangeAlt, FaRobot, FaCopy, FaPlay, FaEraser } from 'react-icons/fa';
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
    
    // PROGRESS STATES FOR ULTRA SMOOTH CRAWLING
    const [visualProgress, setVisualProgress] = useState(0);
    const [currentImportIdx, setCurrentImportIdx] = useState(-1);
    const [rowStatuses, setRowStatuses] = useState({});

    const [promptCount, setPromptCount] = useState(5);
    const [promptTheme, setPromptTheme] = useState("Anime Isekai");

    const categories = useContext(CategoriesContext) || [];
    const authors = useContext(AuthorContext) || [];
    const plans = useContext(PlanContext) || [];
    const categoryTypes = useContext(CategoryTypeContext) || [];
    const actors = useContext(ActorContext) || [];
    const characters = useContext(CharacterContext) || [];
    const existingMovies = useContext(MovieContext) || []; 
    const existingEpisodes = useContext(EpisodeContext) || [];
    const existingShowtimes = useContext(ShowTimeContext) || [];

    // BACKGROUND SMOOTH CRAWLER EFFECT
    useEffect(() => {
        let timer;
        if (loading && previewData.length > 0) {
            const chunkSize = 100 / previewData.length;
            timer = setInterval(() => {
                setVisualProgress(prev => {
                    if (currentImportIdx >= 0) {
                        const currentCeiling = (currentImportIdx + 0.92) * chunkSize;
                        if (prev < currentCeiling) {
                            const step = Math.max(0.08, chunkSize / 70);
                            return Math.min(currentCeiling, parseFloat((prev + step).toFixed(2)));
                        }
                    }
                    return prev;
                });
            }, 25); 
        }
        return () => clearInterval(timer);
    }, [loading, currentImportIdx, previewData.length]);

    const enrichWithMovieMapping = (mappedData) => {
        return mappedData.map(movie => {
            const match = existingMovies.find(m => m?.name && movie?.name && m.name.toLowerCase() === movie.name.toLowerCase());
            return { ...movie, matchedMovieId: match ? match.id : "" };
        });
    };

    const handleParse = () => {
        const rawData = parseTSV(inputText);
        const mapped = enrichWithMovieMapping(mapMovieData(rawData));
        setPreviewData(mapped);
        setRowStatuses({});
        setVisualProgress(0);
        setCurrentImportIdx(-1);
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
            const mapped = enrichWithMovieMapping(mapMovieData(formattedData));
            setPreviewData(mapped);
            setRowStatuses({});
            setVisualProgress(0);
            setCurrentImportIdx(-1);
        };
        reader.readAsBinaryString(file);
        e.target.value = null;
    };

    const handleRemoveRow = (indexToRemove) => {
        setPreviewData(prevData => prevData.filter((_, index) => index !== indexToRemove));
    };

    // HÀM CLEAR TẤT CẢ DỮ LIỆU CỦA TOOL
    const handleClearAll = () => {
        setInputText("");
        setPreviewData([]);
        setRowStatuses({});
        setVisualProgress(0);
        setCurrentImportIdx(-1);
        setSuccessMsg("Đã dọn dẹp sạch sẽ dữ liệu!");
        setTimeout(() => setSuccessMsg(""), 3000);
    };

    const handleCopyPrompt = () => {
        const promptText = `Hãy đóng vai một chuyên gia dữ liệu và một người đam mê điện ảnh/anime. Nhiệm vụ của bạn là tạo ra một bảng dữ liệu định dạng TSV (Tab-Separated Values) cho ${promptCount} bộ phim ${promptTheme}. 

Bảng dữ liệu phải có ĐÚNG 29 CỘT theo thứ tự sau, cách nhau bằng dấu Tab:
Name	Original Name	Movie Description	Type	Categories	Cat Desc	Director	Dir Desc	Actors	Actor Desc	Characters	Char Desc	Gender	Char Gender	Plan	Country	Year	Episodes	Ep Sub	Ep Dub	Ep Voice	Episode Number	URL	Room	Time	Status	Age Rating	Duration	Rent Price

BẠN PHẢI TUÂN THỦ NGHIÊM NGẶT CÁC QUY TẮC SAU:

1. QUY TẮC ĐỐI ỨNG 1:1 VÀ DẤU PHÂN CÁCH: 
- Cột Name (Actors, Characters, Categories) ngăn cách bằng dấu phẩy (,).
- Cột Description (Actor Desc, Char Desc, Cat Desc) và Gender (Gender, Char Gender) BẮT BUỘC dùng dấu gạch đứng ( | ) để ngăn cách.
- Số lượng phần tử phải khớp nhau tuyệt đối (Số lượng diễn viên = Số đoạn mô tả diễn viên = Số giới tính diễn viên).

2. QUY TẮC MÔ TẢ (SỐ ÍT):
- Mô tả Diễn viên, Đạo diễn, Nhân vật KHÔNG DÙNG từ chỉ số nhiều (như: những, các). Phải dùng danh xưng cá nhân (Ông, Bà, Anh, Cô, Cậu bé, Hắn...).
- Mỗi đoạn mô tả phải chi tiết, văn phong bách khoa toàn thư.

3. ĐỊNH DẠNG TRƯỜNG CỤ THỂ:
- URL: Sử dụng link mẫu: https://player.phimapi.com/player/?url=https://s6.kkphimplayer6.com/20251229/qOcvuFyt/index.m3u8 (Có thể thay đổi phần hash để đảm bảo tính duy nhất nếu cần).
- Type: "Phim Lẻ" hoặc "Phim Bộ".
- Plan: "Free", "VIP", hoặc "Premium".
- Gender / Char Gender: Chỉ dùng "Male", "Female", hoặc "Other".
- Time: Định dạng ISO 8601 (VD: 2026-08-01T18:00).
- Status: "Đang chiếu", "Hoàn thành", "Sắp chiếu".
- Age Rating: "P", "K", "T13", "T16", "T18".

MẪU 1 BỘ PHIM HOÀN CHỈNH (Hãy làm theo mẫu này):
Name: Jujutsu Kaisen 0
Original Name: Chú Thuật Hồi Chiến 0
Movie Description: Yuta Okkotsu là một nam sinh trung học bị ám bởi linh hồn người bạn thanh mai trúc mã.
Type: Phim Lẻ
Categories: Hành Động, Giả Tưởng
Cat Desc: Thể loại hành động nhanh | Thế giới phép thuật hư cấu
Director: Sunghoo Park
Dir Desc: Anh là một đạo diễn tài năng.
Actors: Megumi Ogata, Kana Hanazawa
Actor Desc: Cô là một Seiyuu gạo cội | Nữ diễn viên lồng tiếng này sở hữu chất giọng trong trẻo.
Characters: Yuta Okkotsu, Rika Orimoto
Char Desc: Cậu là một học sinh nhút nhát | Cô bé đáng thương này đã biến thành một oán linh mạnh mẽ.
Gender: Female | Female
Char Gender: Male | Female
Plan: Premium
Country: Japan
Year: 2021
Episodes: 1
Ep Sub: 1
Ep Dub: 1
Ep Voice: 0
Episode Number: 1
URL: https://player.phimapi.com/player/?url=https://s6.kkphimplayer6.com/20251229/qOcvuFyt/index.m3u8
Room: Room A
Time: 2026-07-05T19:30
Status: Hoàn thành
Age Rating: T16
Duration: 105
Rent Price: 30000

Hãy tạo dữ liệu thật phong phú (ít nhất 4-5 thể loại, 4-5 diễn viên/nhân vật cho mỗi phim). Xuất kết quả dưới dạng text thuần (raw text) có thể copy được ngay.`;

        navigator.clipboard.writeText(promptText);
        setSuccessMsg(`Copied AI Prompt for ${promptCount} "${promptTheme}" movies!`);
        setTimeout(() => setSuccessMsg(""), 4000); 
    };

    const handleExecuteImport = async () => {
        if (previewData.length === 0) return;
        setLoading(true);
        setVisualProgress(0);
        setRowStatuses({});

        let localCategories = [...categories];
        let localAuthors = [...authors];
        let localActors = [...actors];
        let localCharacters = [...characters];
        let localCategoryTypes = [...categoryTypes];
        let localMovies = [...existingMovies]; 
        let localEpisodes = [...existingEpisodes];
        let localShowtimes = [...existingShowtimes];

        let moviesAdded = 0, moviesUpdated = 0, epsAdded = 0, showtimesAdded = 0;
        const totalRows = previewData.length;
        const chunkSize = 100 / totalRows;

        try {
            for (let idx = 0; idx < totalRows; idx++) {
                const movie = previewData[idx];
                
                setCurrentImportIdx(idx);
                setRowStatuses(prev => ({ ...prev, [idx]: 'processing' }));

                let currentMovieId = "";
                let existingMovie = null;
                if (movie.matchedMovieId) {
                    existingMovie = localMovies.find(m => m.id === movie.matchedMovieId);
                } else {
                    existingMovie = localMovies.find(m => m?.name && movie?.name && m.name.toLowerCase() === movie.name.toLowerCase());
                }
                
                if (existingMovie && mode === 'IMPORT') {
                    currentMovieId = existingMovie.id; 
                } else {
                    let list_Category = [];
                    let list_Actor = [];
                    let list_Character = [];
                    let authorID = "";
                    let category_Type_Id = "";

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

                setRowStatuses(prev => ({ ...prev, [idx]: 'success' }));
                setVisualProgress((idx + 1) * chunkSize);
            }

            setSuccessMsg(`Import successful! Created ${moviesAdded} Movies, Updated ${moviesUpdated} Movies/Entities.`);
        } catch (error) {
            console.error(error);
            alert("An error occurred! Please check F12 Console for details.");
        } finally {
            setLoading(false);
            setCurrentImportIdx(-1);
            setVisualProgress(100); 
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
            <div className='flex items-center justify-between gap-4 mb-8 bg-slate-900/20 backdrop-blur-lg p-5 rounded-2xl border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all'>
                <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 rounded-xl bg-linear-to-br from-cyan-400 to-purple-500 flex justify-center items-center shadow-[0_0_15px_rgba(34,211,238,0.5)]'>
                        <FaMagic className='text-3xl text-white' />
                    </div>
                    <div>
                        <h1 className='text-3xl font-black tracking-wide glow-text uppercase'>Magic Import</h1>
                        <p className='text-gray-400 text-sm mt-1'>Copy table from Excel to automatically sync Movies, Episodes & Showtimes.</p>
                    </div>
                </div>

                {/* WRAPPER CHỨA NÚT CLEAR VÀ AI PROMPT ĐỂ NẰM CÙNG HÀNG */}
                <div className='flex items-center gap-4'>
                    
                    {/* NÚT CLEAR DATA SIÊU NGẦU */}
                    <button 
                        onClick={handleClearAll}
                        title="Clear all inputs and tables"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95"
                    >
                        <FaEraser className="text-sm" />
                        <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Clear</span>
                    </button>

                    {/* AI PROMPT GENERATOR */}
                    <div className='flex items-center gap-2 bg-slate-900/40 p-2 rounded-xl border border-pink-500/30 shadow-[0_0_15px_rgba(219,39,119,0.15)]'>
                        <div className='flex items-center gap-2 px-2 border-r border-white/10'>
                            <FaRobot className="text-pink-400 text-xl" />
                            <span className="text-xs font-bold text-pink-300 uppercase tracking-wider hidden xl:block">AI Prompt</span>
                        </div>
                        <input
                            type="number"
                            className="w-16 bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-center text-gray-300 focus:outline-none focus:border-pink-400 transition-all"
                            placeholder="Qty"
                            value={promptCount}
                            onChange={(e) => setPromptCount(e.target.value)}
                        />
                        <input
                            type="text"
                            className="w-36 lg:w-48 bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-gray-300 focus:outline-none focus:border-pink-400 transition-all"
                            placeholder="Theme (e.g. Marvel)"
                            value={promptTheme}
                            onChange={(e) => setPromptTheme(e.target.value)}
                        />
                        <button 
                            onClick={handleCopyPrompt}
                            className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(219,39,119,0.4)] active:scale-95"
                        >
                            <FaCopy className="text-sm"/> Copy
                        </button>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
                <div className='col-span-1 lg:col-span-4 flex flex-col gap-4'>
                    <div className='bg-slate-900/20 backdrop-blur-lg border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)] rounded-2xl p-5 relative group transition-all'>
                        
                        <div className="flex bg-slate-800/50 rounded-xl p-1 mb-5 border border-white/10 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/60 p-1.5 rounded-full z-10">
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
                            className='w-full h-80 bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-gray-300 font-mono focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] custom-scrollbar'
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
                            
                            <label className='w-full py-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wider uppercase transition-all cursor-pointer shadow-[0_0_15px_rgba(5,150,105,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] active:scale-95'>
                                <FaFileExcel className="text-xl" /> Upload Excel
                                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>

                <div className='col-span-1 lg:col-span-8 flex flex-col gap-4'>
                    <div className={`bg-slate-900/20 backdrop-blur-lg rounded-2xl p-5 h-full flex flex-col justify-between transition-all duration-300 border
                        ${mode === 'IMPORT' ? 'border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'border-fuchsia-500/40 shadow-[0_0_20px_rgba(217,70,239,0.15)]'}`}>
                        <div>
                            <h2 className={`font-bold mb-3 uppercase tracking-wider text-sm flex items-center justify-between transition-colors
                                ${mode === 'IMPORT' ? 'text-cyan-400' : 'text-fuchsia-400'}`}>
                                <span>Preview Table ({mode === 'UPDATE' ? 'Update Mode' : 'Import Mode'})</span>
                                <span className={`px-3 py-1 rounded-full text-xs border transition-colors
                                    ${mode === 'IMPORT' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30'}`}>
                                    {previewData.length} items
                                </span>
                            </h2>
                            
                            <div className='border border-white/10 rounded-xl bg-black/20 relative overflow-hidden h-105'>
                                {previewData.length > 0 ? (
                                    <div className='overflow-auto h-full custom-scrollbar p-2'>
                                        <table className='w-full whitespace-nowrap text-xs min-w-max'>
                                            <thead className='text-gray-400 border-b border-white/10 bg-slate-800/40 sticky top-0 z-10'>
                                                <tr>
                                                    <th className='p-3 text-center align-middle'>ACTION</th>
                                                    <th className='p-3 text-center align-middle'>NAME (INTL / SELECT)</th>
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
                                                    const isDuplicated = existingMovies.some(m => m?.name && row?.name && m.name.toLowerCase() === row.name.toLowerCase());
                                                    
                                                    let rowClass = "border-b border-white/5 transition-all duration-300 text-gray-200 ";
                                                    if (rowStatuses[idx] === 'processing') {
                                                        rowClass += "bg-cyan-500/15 border-l-4 border-l-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-pulse text-cyan-300";
                                                    } else if (rowStatuses[idx] === 'success') {
                                                        rowClass += "bg-emerald-500/15 border-l-4 border-l-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
                                                    } else if (isDuplicated) {
                                                        rowClass += mode === 'UPDATE' ? 'bg-fuchsia-500/10 hover:bg-fuchsia-500/20' : 'bg-indigo-500/10 hover:bg-indigo-500/20';
                                                    } else {
                                                        rowClass += "hover:bg-white/5";
                                                    }

                                                    return (
                                                        <tr key={idx} className={rowClass}>
                                                            <td className='p-3 text-center align-middle'>
                                                                <button onClick={() => handleRemoveRow(idx)} className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="Remove row"><FaTrash size={14} /></button>
                                                            </td>
                                                            
                                                            <td className='p-3 text-center align-middle font-bold text-cyan-300 min-w-45'>
                                                                <div className="flex flex-col gap-1">
                                                                    <span>{row.name}</span>
                                                                    {mode === 'UPDATE' && (
                                                                        <select
                                                                            value={row.matchedMovieId || ""}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                setPreviewData(prev => prev.map((item, i) => i === idx ? { ...item, matchedMovieId: val } : item));
                                                                            }}
                                                                            className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-[10px] text-fuchsia-400 focus:outline-none focus:border-fuchsia-500 w-full font-sans cursor-pointer mt-1"
                                                                        >
                                                                            <option value="">-- Manual Link Select --</option>
                                                                            {existingMovies.map(m => (
                                                                                <option key={m.id} value={m.id}>{m.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    )}
                                                                    {rowStatuses[idx] === 'processing' && <div className="text-[10px] text-cyan-400 font-normal mt-1">Syncing Data...</div>}
                                                                    {rowStatuses[idx] === 'success' && <div className="text-[10px] text-emerald-400 font-bold mt-1">✓ Completed</div>}
                                                                    {!rowStatuses[idx] && isDuplicated && (
                                                                        mode === 'UPDATE' ? (
                                                                            <div className="text-[9px] bg-fuchsia-500 text-white px-1.5 py-0.5 rounded uppercase inline-block mx-auto mt-1">Will Update</div>
                                                                        ) : (
                                                                            <div className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase inline-block mx-auto mt-1">Append Eps</div>
                                                                        )
                                                                    )}
                                                                    {!rowStatuses[idx] && !isDuplicated && <div className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase inline-block mx-auto mt-1">Create New</div>}
                                                                </div>
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
                                                            <td className='p-3 text-center align-middle text-pink-300 truncate max-w-20' title={row.gender}>{row.gender}</td>
                                                            <td className='p-3 text-center align-middle text-pink-300 truncate max-w-20' title={row.charGender}>{row.charGender}</td>
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
                        </div>

                        <div className="mt-4 bg-slate-900/20 backdrop-blur-lg p-4 rounded-xl border border-white/10 shadow-inner">
                            {loading && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs font-bold text-cyan-400 mb-1.5 uppercase tracking-wider">
                                        <span className="animate-pulse">Syncing Cloud Database...</span>
                                        <span>{visualProgress}%</span>
                                    </div>
                                    <div className="w-full bg-black/40 rounded-full h-3.5 overflow-hidden p-0.5 border border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                                        <div 
                                            className="bg-linear-to-r from-cyan-400 via-fuchsia-500 to-yellow-400 h-full rounded-full transition-[width] duration-1500 ease-out shadow-[0_0_20px_rgba(217,70,239,0.7)]"
                                            style={{ width: `${visualProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {successMsg && (
                                <div className="mb-3 p-2.5 border rounded-lg flex items-center justify-center gap-2 text-xs font-bold bg-green-500/10 border-green-500/20 text-green-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                    <FaCheckCircle className="text-base" /> {successMsg}
                                </div>
                            )}

                            <button 
                                onClick={handleExecuteImport}
                                disabled={loading || previewData.length === 0}
                                className={`w-full py-3.5 rounded-xl font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 text-xs text-white
                                    ${previewData.length > 0 
                                        ? (mode === 'IMPORT' 
                                            ? 'bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer active:scale-[0.98]'
                                            : 'bg-linear-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 shadow-[0_0_15px_rgba(217,70,239,0.4)] cursor-pointer active:scale-[0.98]')
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'}`}
                            >
                                <FaPlay className="text-xs" /> {loading ? "Syncing..." : `Confirm & Execute Magic (${mode})`}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default MagicImport;