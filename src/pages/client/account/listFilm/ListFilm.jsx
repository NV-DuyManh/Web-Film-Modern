import { getOptimizedUrl } from '../../../../utils/cloudinary';
import React, { useState, useContext, useMemo } from 'react';
import { useMovies } from '../../../../hooks/useCollections';
import { FaLayerGroup, FaSearch, FaTh, FaList, FaPlus, FaPen, FaPlay, FaTrash, FaStar, FaFilm, FaArrowLeft, FaImage, FaCloudUploadAlt, FaLink, FaTimes } from 'react-icons/fa';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { updateDocument } from '../../../../services/firebaseService';
import { Link, useSearchParams } from 'react-router-dom';
import Logo6 from '../../../../assets/Logo6.png';
import { searchTV } from '../../../../components/admin/search/SearchTV';
import ModalDeleteListFilm from './ModalDeleteListFilm';
import ModalListFilm from './ModalListFilm';

function ListFilm(props) {
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedListId = searchParams.get('list');

    const setSelectedListId = (id) => {
        if (id) {
            setSearchParams({ list: id });
        } else {
            setSearchParams({});
        }
    };

    const [avatarModalState, setAvatarModalState] = useState({ isOpen: false, listId: null, uploadMode: 'file', imgUrl: '' });
    const { isLogin } = useContext(AuthContext);
    const moviesData = useMovies() || [];

    const userLists = useMemo(() => {
        if (!isLogin) return [];
        return isLogin.listFilm || [];
    }, [isLogin]);

    const filteredLists = useMemo(() => {
        if (!searchQuery.trim()) return userLists;
        const lowerQuery = searchTV(searchQuery);
        return userLists.filter(list => searchTV(list.name || '').includes(lowerQuery));
    }, [userLists, searchQuery]);

    const [inputModal, setInputModal] = useState({ isOpen: false, mode: 'create', listId: null, defaultValue: '' });

    const handleAddList = () => {
        if (!isLogin) return;
        if (userLists.length >= 10) return;
        setInputModal({ isOpen: false, mode: 'create', listId: null, defaultValue: '' });
        setTimeout(() => setInputModal({ isOpen: true, mode: 'create', listId: null, defaultValue: '' }), 10);
    };

    const handleConfirmInput = async (value) => {
        if (!isLogin) return;
        try {
            if (inputModal.mode === 'create') {
                const newList = {
                    id: Date.now().toString(),
                    name: value,
                    movies: [],
                    createdAt: new Date().toISOString()
                };
                const updatedLists = [...userLists, newList];
                await updateDocument("Users", { id: isLogin.id, listFilm: updatedLists });
            } else if (inputModal.mode === 'edit') {
                const updatedLists = userLists.map(list =>
                    list.id === inputModal.listId ? { ...list, name: value } : list
                );
                await updateDocument("Users", { id: isLogin.id, listFilm: updatedLists });
            }
            setInputModal({ isOpen: false, mode: 'create', listId: null, defaultValue: '' });
        } catch (error) {
            console.error("Error saving list", error);
        }
    };

    const handleEditList = (listId, currentName) => {
        if (!isLogin) return;
        setInputModal({ isOpen: false, mode: 'edit', listId, defaultValue: currentName });
        setTimeout(() => setInputModal({ isOpen: true, mode: 'edit', listId, defaultValue: currentName }), 10);
    };

    const openAvatarModal = (listId, currentAvatar) => {
        setAvatarModalState({ isOpen: true, listId, uploadMode: 'file', imgUrl: currentAvatar || '' });
    };

    const closeAvatarModal = () => {
        setAvatarModalState({ isOpen: false, listId: null, uploadMode: 'file', imgUrl: '' });
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setAvatarModalState(prev => ({ ...prev, imgUrl: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveAvatar = async () => {
        if (!isLogin || !avatarModalState.listId) return;
        try {
            const updatedLists = userLists.map(list =>
                list.id === avatarModalState.listId ? { ...list, avatar: avatarModalState.imgUrl } : list
            );
            await updateDocument("Users", { id: isLogin.id, listFilm: updatedLists });
            closeAvatarModal();
        } catch (error) {
            console.error("Error editing list avatar", error);
        }
    };

    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, type: '', id: null, movieId: null, title: '', message: '' });

    const handleDeleteList = (listId) => {
        if (!isLogin) return;
        setDeleteDialog({
            isOpen: true,
            type: 'list',
            id: listId,
            title: 'Xóa danh sách?',
            message: 'Bạn không thể hoàn tác hành động này!'
        });
    };

    const handleRemoveMovie = (movieId, listId) => {
        if (!isLogin) return;
        setDeleteDialog({
            isOpen: true,
            type: 'movie',
            id: listId,
            movieId: movieId,
            title: 'Bỏ phim khỏi danh sách?',
            message: 'Bạn muốn xóa phim này khỏi danh sách?'
        });
    };

    const confirmDeleteAction = async () => {
        try {
            if (deleteDialog.type === 'list') {
                const updatedLists = userLists.filter(list => list.id !== deleteDialog.id);
                await updateDocument("Users", { id: isLogin.id, listFilm: updatedLists });
                if (selectedListId === deleteDialog.id) {
                    setSelectedListId(null);
                }
            } else if (deleteDialog.type === 'movie') {
                const updatedLists = userLists.map(list => {
                    if (list.id === deleteDialog.id) {
                        return { ...list, movies: (list.movies || []).filter(id => id !== deleteDialog.movieId) };
                    }
                    return list;
                });
                await updateDocument("Users", { id: isLogin.id, listFilm: updatedLists });
            }
            setDeleteDialog({ ...deleteDialog, isOpen: false });
        } catch (error) {
            console.error("Error confirming delete", error);
        }
    };

    const activeList = useMemo(() => {
        return userLists.find(l => l.id === selectedListId);
    }, [userLists, selectedListId]);

    const activeListMovies = useMemo(() => {
        if (!activeList || !activeList.movies) return [];
        return moviesData.filter(m => activeList.movies.includes(m.id));
    }, [activeList, moviesData]);

    if (selectedListId && activeList) {
        return (
            <div className="w-full flex flex-col gap-6 p-6 bg-[#1e293b]/60 rounded-2xl border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.15)] min-h-full">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <button onClick={() => setSelectedListId(null)} className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-2 font-bold text-sm">
                            <FaArrowLeft /> Quay lại danh sách
                        </button>
                        <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                            <FaLayerGroup className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.9)]" />
                            {activeList.name}
                        </h1>
                        <p className="text-slate-400 mt-2 font-medium text-base md:text-lg ml-1">
                            {activeListMovies.length} bộ phim
                        </p>
                    </div>

                    <div className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md self-start sm:self-auto">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-lg flex items-center justify-center ${viewMode === 'grid'
                                ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <FaTh size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-lg flex items-center justify-center ${viewMode === 'list'
                                ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <FaList size={20} />
                        </button>
                    </div>
                </div>

                <div className={`mt-4 ${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'flex flex-col gap-4'}`}>
                    {activeListMovies.length > 0 ? activeListMovies.map(movie => (
                        viewMode === 'grid' ? (
                            <Link to={`/phim/${movie.slug || movie.id}`} key={movie.id} className="group relative flex flex-col gap-3 cursor-pointer">
                                <div className="relative rounded-2xl overflow-hidden border-[3px] border-transparent bg-slate-800/40 hover:border-[#facc15] transition-all duration-300 hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)] hover:-translate-y-2 aspect-2/3 w-full">
                                    <img src={getOptimizedUrl(movie.imgUrl, 300, 450, 'poster')} alt={movie.name} className="w-full h-full object-cover transition-opacity duration-300 opacity-90 group-hover:opacity-100" />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent opacity-70"></div>
                                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md p-2 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.8)] border border-cyan-500/50 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-300">
                                        <FaStar size={14} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)] group-hover:scale-110 transition-transform duration-300" />
                                    </div>

                                    <button onClick={(e) => { e.preventDefault(); handleRemoveMovie(movie.id, activeList.id); }} className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] z-10">
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                                <div className="px-1 mt-2 mb-1 flex flex-col items-center">
                                    <h3 className="text-white font-bold text-sm md:text-base text-center line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all duration-300">
                                        {movie.otherName}
                                    </h3>
                                    {movie.otherName && movie.otherName !== movie.name && (
                                        <p className="text-slate-400 text-[11px] sm:text-xs text-center line-clamp-1 mt-0.5 group-hover:text-slate-300 transition-all duration-300">
                                            {movie.name}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ) : (
                            <div key={movie.id} className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-md hover:border-[#facc15]/50 hover:shadow-[0_0_25px_rgba(250,204,21,0.2)] transition-all duration-300 group">
                                <Link to={`/phim/${movie.slug || movie.id}`} className="w-32 sm:w-40 md:w-48 h-auto aspect-video rounded-xl overflow-hidden shrink-0 border-[3px] border-transparent group-hover:border-[#facc15] transition-all duration-300 relative block">
                                    <img src={getOptimizedUrl(movie.bannerUrl || movie.imgUrl, 480, 270, 'thumb')} alt={movie.name} className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                                </Link>

                                <div className="flex-1 w-full flex flex-col justify-center py-2 gap-2">
                                    <Link to={`/phim/${movie.slug || movie.id}`}>
                                        <h3 className="text-white font-bold text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all duration-300 line-clamp-1">{movie.otherName || movie.name}</h3>
                                        {movie.otherName && movie.otherName !== movie.name && (
                                            <p className="text-slate-400 text-sm mt-0.5 line-clamp-1 group-hover:text-slate-300 transition-all duration-300">
                                                {movie.name}
                                            </p>
                                        )}
                                    </Link>
                                </div>

                                <div className="flex items-center gap-4 shrink-0 sm:ml-auto w-full sm:w-auto justify-end">
                                    <Link to={`/xem-phim/${movie.slug || movie.id}`} className="flex items-center gap-2 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-6 py-2.5 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:scale-105 border border-cyan-400/50">
                                        <FaPlay size={14} /> Xem
                                    </Link>
                                    <button onClick={() => handleRemoveMovie(movie.id, activeList.id)} className="p-3.5 rounded-xl bg-white/5 text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 border border-transparent hover:border-pink-500/40 transition-all duration-300 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                                        <FaTrash size={16} />
                                    </button>
                                </div>
                            </div>
                        )
                    )) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-70">
                            <FaFilm className="text-slate-600 text-6xl mb-4" />
                            <p className="text-slate-400 text-lg font-medium">Chưa có bộ phim nào trong danh sách này</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-6 p-6 bg-[#1e293b]/60 rounded-2xl border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] min-h-full">
            <style>{`
                .glow-text {
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3);
                }
            `}</style>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 w-full mb-2">
                <div className="flex flex-row items-center gap-3 w-full lg:flex-1 lg:max-w-2xl">
                    <div className="relative group flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                            <FaSearch className="text-slate-400 group-hover:text-green-500 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] group-focus-within:text-[#ff00ff] group-focus-within:drop-shadow-[0_0_8px_#ff00ff] group-focus-within:scale-[1.15] transition-all duration-300" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm danh sách..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-white text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none placeholder:text-slate-500 relative border border-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.6),inset_0_0_5px_rgba(0,242,254,0.2)] hover:border-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.8),inset_0_0_5px_rgba(34,197,94,0.3)] focus:border-[#ff00ff] focus:shadow-[0_0_25px_rgba(255,0,255,0.9),inset_0_0_10px_rgba(255,0,255,0.4)] transition-all duration-300"
                        />
                    </div>

                    <button
                        onClick={handleAddList}
                        className="btn-add whitespace-nowrap bg-transparent! backdrop-blur-none! shadow-none shrink-0 justify-center h-[42px] flex items-center gap-1.5 sm:gap-2"
                        style={{ padding: '0.625rem 1rem', fontSize: '0.875rem' }}
                    >
                        <span className="hidden sm:inline">Thêm mới</span>
                        <span className="sm:hidden">Thêm</span>
                        <FaPlus className="text-sm" />
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between sm:justify-end gap-3 w-full lg:w-auto shrink-0">
                    <div className="flex flex-row items-center justify-between w-full sm:w-auto gap-3">
                        <div className="premium-border-box flex flex-1 sm:flex-none justify-center items-center gap-3 px-4 py-2 bg-slate-800/50 backdrop-blur-md rounded-xl shadow-lg whitespace-nowrap group h-[42px]">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Danh sách</span>
                            <div className="flex items-center justify-center bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-lg group-hover:bg-cyan-500/20 group-hover:border-cyan-500/40 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300">
                                <span className="text-cyan-400 font-black text-sm">{userLists.length} / 10</span>
                            </div>
                        </div>

                        <div className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md shrink-0 h-[42px]">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 flex items-center justify-center ${viewMode === 'grid'
                                    ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)] scale-105'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <FaTh size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 flex items-center justify-center ${viewMode === 'list'
                                    ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)] scale-105'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <FaList size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`mt-2 ${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'flex flex-col gap-4'}`}>
                {filteredLists.length > 0 ? filteredLists.map((list) => {
                    const movieCount = list.movies?.length || 0;

                    return viewMode === 'grid' ? (
                        <div key={`grid-${list.id}`} onClick={() => setSelectedListId(list.id)} className="group relative flex flex-col gap-3">
                            <div className="relative rounded-2xl overflow-hidden border-[3px] border-transparent bg-slate-800/40 hover:border-[#facc15] hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)] aspect-3/4 w-full flex items-center justify-center cursor-pointer">
                                <img src={list.avatar || Logo6} alt={list.name} className="w-full h-full object-cover transition-opacity duration-300 opacity-80 group-hover:opacity-100" />
                                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent opacity-70"></div>

                                <div className="absolute top-3 right-3 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openAvatarModal(list.id, list.avatar); }}
                                        className="bg-blue-500/80 hover:bg-blue-500 text-white p-2 rounded-xl backdrop-blur-md hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all"
                                        title="Đổi ảnh bìa"
                                    >
                                        <FaImage size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEditList(list.id, list.name); }}
                                        className="bg-yellow-500/80 hover:bg-yellow-500 text-black p-2 rounded-xl backdrop-blur-md hover:shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all"
                                        title="Đổi tên"
                                    >
                                        <FaPen size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
                                        className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-xl backdrop-blur-md hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all"
                                        title="Xóa danh sách"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>

                                <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.8)] border border-yellow-500/50 flex items-center gap-1.5 group-hover:border-yellow-400 group-hover:shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-all duration-300 z-10">
                                    <FaPlay size={10} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]" />
                                    <span className="text-yellow-400 text-xs font-bold">{movieCount} phim</span>
                                </div>
                            </div>
                            <div className="px-1 mt-1 cursor-pointer">
                                <h3 className="text-white font-bold text-sm md:text-base line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all duration-300">{list.name}</h3>
                                <p className="text-slate-500 text-xs mt-0.5">{movieCount} phim</p>
                            </div>
                        </div>
                    ) : (
                        <div key={`list-${list.id}`} onClick={() => setSelectedListId(list.id)} className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-md hover:border-[#facc15]/50 hover:shadow-[0_0_25px_rgba(250,204,21,0.2)] group cursor-pointer">
                            <div className="w-32 sm:w-40 md:w-48 h-auto aspect-video rounded-xl bg-slate-700/50 border-[3px] border-transparent overflow-hidden shrink-0 group-hover:border-[#facc15] transition-all duration-300 relative block">
                                <img src={list.avatar || Logo6} alt={list.name} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                            </div>

                            <div className="flex-1 w-full flex flex-col justify-center gap-1 text-center sm:text-left">
                                <h3 className="text-white font-bold text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-cyan-400 transition-all duration-300 line-clamp-2">{list.name}</h3>
                                <p className="text-slate-500 text-sm">{movieCount} phim</p>
                            </div>

                            <div className="flex items-center gap-4 shrink-0 mt-2 sm:mt-0 justify-center w-full sm:w-auto">
                                <div className="text-yellow-400 hidden sm:flex items-center gap-1 p-2">
                                    <FaStar size={14} className="drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                                    <span className="text-sm font-bold">0</span>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); openAvatarModal(list.id, list.avatar); }}
                                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:scale-105"
                                    title="Đổi ảnh bìa"
                                >
                                    <FaImage size={12} /> Ảnh bìa
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEditList(list.id, list.name); }}
                                    className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-2.5 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,179,8,0.5)] hover:scale-105"
                                    title="Đổi tên"
                                >
                                    <FaPen size={12} /> Sửa tên
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
                                    className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-105"
                                    title="Xóa danh sách"
                                >
                                    <FaTrash size={12} /> Xóa
                                </button>
                            </div>
                        </div>
                    )
                }) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-70">
                        <FaLayerGroup className="text-slate-600 text-6xl mb-4" />
                        <p className="text-slate-400 text-lg font-medium">Bạn chưa tạo danh sách phim nào</p>
                    </div>
                )}
            </div>

            {avatarModalState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#1e293b] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col transform">
                        <div className="flex justify-between items-center p-5 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Thay đổi ảnh bìa</h2>
                            <button onClick={closeAvatarModal} className="text-slate-400 hover:text-white transition-colors bg-slate-800/80 hover:bg-red-500 p-2 rounded-full group">
                                <FaTimes className="group-hover:rotate-180 transition-transform duration-300" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col items-center gap-5">
                            <div className="flex bg-slate-900/80 rounded-lg p-1 w-full max-w-70 border border-white/5 shadow-inner">
                                <button onClick={() => setAvatarModalState(p => ({ ...p, uploadMode: 'file' }))} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${avatarModalState.uploadMode === 'file' ? 'bg-linear-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'text-slate-400 hover:text-white'}`}>
                                    <FaCloudUploadAlt size={14} /> Tải ảnh lên
                                </button>
                                <button onClick={() => setAvatarModalState(p => ({ ...p, uploadMode: 'url' }))} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${avatarModalState.uploadMode === 'url' ? 'bg-linear-to-r from-fuchsia-500 to-purple-600 text-white shadow-[0_0_12px_rgba(217,70,239,0.4)]' : 'text-slate-400 hover:text-white'}`}>
                                    <FaLink size={12} /> Link URL
                                </button>
                            </div>

                            <div className="w-full h-12.5 flex items-center justify-center">
                                {avatarModalState.uploadMode === 'url' ? (
                                    <input
                                        type="text"
                                        placeholder="Nhập đường dẫn ảnh (https://...)"
                                        value={avatarModalState.imgUrl}
                                        onChange={(e) => setAvatarModalState(p => ({ ...p, imgUrl: e.target.value }))}
                                        className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl py-3.5 px-4 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
                                    />
                                ) : (
                                    <p className="text-slate-400 text-xs italic text-center">Click trực tiếp vào ảnh bên dưới để tải lên từ thiết bị</p>
                                )}
                            </div>

                            <div className={`relative w-40 h-56 rounded-xl overflow-hidden group bg-slate-800/50 flex flex-col items-center justify-center transition-all duration-300 ${avatarModalState.uploadMode === 'file' ? 'border-2 border-dashed border-slate-500 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] cursor-pointer' : 'border border-slate-700 shadow-lg'}`}>
                                <img src={avatarModalState.imgUrl || Logo6} onError={(e) => e.target.src = Logo6} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${avatarModalState.uploadMode === 'file' ? 'group-hover:opacity-30' : ''}`} />

                                {avatarModalState.uploadMode === 'file' && (
                                    <>
                                        <input type="file" onChange={handleImageChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" />
                                        <div className="z-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <FaCloudUploadAlt className="text-4xl text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] mb-2" />
                                            <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">Chọn ảnh</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/30">
                            <button onClick={closeAvatarModal} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                                Hủy bỏ
                            </button>
                            <button onClick={handleSaveAvatar} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)] hover:scale-105 transition-all">
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ModalDeleteListFilm
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ ...deleteDialog, isOpen: false })}
                onConfirm={confirmDeleteAction}
                title={deleteDialog.title}
                message={deleteDialog.message}
            />

            <ModalListFilm
                isOpen={inputModal.isOpen}
                onClose={() => setInputModal({ ...inputModal, isOpen: false })}
                onConfirm={handleConfirmInput}
                title={inputModal.mode === 'create' ? 'Tạo danh sách mới' : 'Đổi tên danh sách'}
                placeholder="Nhập tên danh sách (VD: Phim ma, Hành động...)"
                defaultValue={inputModal.defaultValue}
                confirmText={inputModal.mode === 'create' ? 'Tạo ngay' : 'Lưu thay đổi'}
                confirmColor={inputModal.mode === 'create' ? 'cyan' : 'yellow'}
            />
        </div>
    );
}

export default ListFilm;
