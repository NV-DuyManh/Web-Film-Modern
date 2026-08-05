import React, { useState, useContext, useMemo } from 'react';
import { FaFilm, FaSearch, FaTh, FaList, FaPlay, FaHeart, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { updateDocument } from '../../../../services/firebaseService';
import Swal from 'sweetalert2';
import { searchTV } from '../../../../components/admin/search/SearchTV';
import DeleteDialog from '../../../../components/client/DeleteDialog';

function Favorites(props) {
    const { isLogin } = useContext(AuthContext);
    const moviesData = useContext(MovieContext) || [];
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const handleRemoveFavorite = (movieId, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLogin) return;
        setItemToDelete(movieId);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteFavorite = async () => {
        if (!itemToDelete || !isLogin) return;
        try {
            const updatedList = (isLogin.listFavorite || []).filter(id => id !== itemToDelete);
            await updateDocument("Users", { id: isLogin.id, listFavorite: updatedList });
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
            Swal.fire({
                title: 'Đã xóa!',
                text: 'Đã xóa khỏi danh sách yêu thích.',
                icon: 'success',
                background: '#1e293b',
                color: '#fff',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error removing favorite", error);
        }
    };

    const favorites = useMemo(() => {
        const favoriteIds = isLogin?.listFavorite || [];
        return moviesData.filter(m => favoriteIds.includes(m.id));
    }, [moviesData, isLogin]);

    const filteredMovies = useMemo(() => {
        if (!searchQuery.trim()) return favorites;
        const lowerQuery = searchTV(searchQuery);
        return favorites.filter(m =>
            searchTV(m.name || '').includes(lowerQuery) ||
            searchTV(m.otherName || '').includes(lowerQuery)
        );
    }, [favorites, searchQuery]);

    return (
        <div className="w-full flex flex-col gap-6 p-6 bg-[#1e293b]/60 rounded-2xl border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] min-h-full">
            <style>{`
                @keyframes fadeInFavorites {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-favorites {
                    animation: fadeInFavorites 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .glow-text {
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3);
                }
            `}</style>

            {favorites.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full mb-2">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:flex-1">
                        <div className="relative group w-full md:max-w-md lg:max-w-lg">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                <FaSearch className="text-slate-400 group-hover:text-green-500 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] group-focus-within:text-[#ff00ff] group-focus-within:drop-shadow-[0_0_8px_#ff00ff] group-focus-within:scale-[1.15] transition-all duration-300" />
                            </div>
                            <input
                                type="text"
                                placeholder="Tìm trong yêu thích..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent text-white text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none placeholder:text-slate-500 relative border border-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.6),inset_0_0_5px_rgba(0,242,254,0.2)] hover:border-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.8),inset_0_0_5px_rgba(34,197,94,0.3)] focus:border-[#ff00ff] focus:shadow-[0_0_25px_rgba(255,0,255,0.9),inset_0_0_10px_rgba(255,0,255,0.4)] transition-all duration-300"
                            />
                        </div>
                        <div className="premium-border-box flex w-full sm:w-auto justify-center items-center gap-3 px-4 py-2 bg-slate-800/50 backdrop-blur-md rounded-xl shadow-lg whitespace-nowrap group">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Số lượng</span>
                            <div className="flex items-center justify-center bg-yellow-500/10 border border-yellow-500/20 px-3 py-0.5 rounded-lg group-hover:bg-yellow-500/20 group-hover:border-yellow-500/40 group-hover:shadow-[0_0_15px_rgba(250,204,21,0.3)] transition-all duration-300">
                                <span className="text-yellow-400 font-black text-sm">{favorites.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md w-full md:w-auto justify-center md:justify-start shrink-0">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center ${viewMode === 'grid' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.3)] scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                        >
                            <FaTh size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center ${viewMode === 'list' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.3)] scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                        >
                            <FaList size={20} />
                        </button>
                    </div>
                </div>
            )}

            {favorites.length === 0 ? (
                <div className="mt-4 w-full min-h-87.5 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden animate-fade-in-favorites" style={{ animationDelay: '0.2s', opacity: 0 }}>
                    <div className="w-16 h-16 rounded-full border border-yellow-500/30 bg-yellow-500/10 flex items-center justify-center mb-6">
                        <FaHeart className="text-yellow-500/60 text-2xl" />
                    </div>
                    <h3 className="text-slate-300 text-lg md:text-xl font-bold mb-3">Chưa có phim yêu thích</h3>
                    <p className="text-slate-500 text-sm md:text-base">
                        Hãy thả tim những bộ phim bạn yêu thích và chúng sẽ xuất hiện ở đây
                    </p>
                </div>
            ) : (
                <div className={`mt-4 ${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'flex flex-col gap-4'}`}>
                    {filteredMovies.length > 0 ? filteredMovies.map((movie, index) => (
                        viewMode === 'grid' ? (
                            <Link to={`/detailFilm/${movie.id}`} key={`grid-${movie.id}`} className="group relative flex flex-col gap-3 cursor-pointer animate-fade-in-favorites" style={{ animationDelay: `${0.1 + index * 0.05}s`, opacity: 0 }}>
                                <div className="relative rounded-2xl overflow-hidden border-[3px] border-transparent bg-slate-800/40 hover:border-yellow-400 transition-all duration-300 hover:shadow-[0_12px_25px_rgba(250,204,21,0.3)] hover:-translate-y-2 aspect-2/3 w-full">
                                    <img src={movie.imgUrl} alt={movie.name} className="w-full h-full object-cover transition-opacity duration-300 opacity-90 group-hover:opacity-100" />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent opacity-70"></div>
                                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.8)] border border-yellow-500/50 group-hover:border-yellow-400 group-hover:shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-all duration-300 flex items-center gap-1.5">
                                        <FaPlay size={10} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]" />
                                        <span className="text-yellow-400 text-xs font-bold">Xem ngay</span>
                                    </div>
                                    <button onClick={(e) => handleRemoveFavorite(movie.id, e)} className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] z-10" title="Xóa khỏi yêu thích">
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                                <div className="px-1 mt-2 mb-1 flex flex-col items-center">
                                    <h3 className="text-white font-bold text-sm md:text-base text-center line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-yellow-400 group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] transition-all duration-300">
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
                            <div key={`list-${movie.id}`} className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-md hover:border-yellow-500/40 hover:shadow-[0_0_25px_rgba(250,204,21,0.2)] transition-all duration-300 group animate-fade-in-favorites" style={{ animationDelay: `${0.1 + index * 0.05}s`, opacity: 0 }}>
                                <Link to={`/detailFilm/${movie.id}`} className="w-32 sm:w-40 md:w-48 h-auto aspect-video rounded-xl overflow-hidden shrink-0 border-[3px] border-transparent group-hover:border-yellow-400 transition-all duration-300 relative block">
                                    <img src={movie.bannerUrl || movie.imgUrl} alt={movie.name} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                                </Link>

                                <div className="flex-1 w-full flex flex-col justify-center py-1 gap-1.5">
                                    <Link to={`/detailFilm/${movie.id}`}>
                                        <h3 className="text-white font-bold text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-yellow-400 group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] transition-all duration-300 line-clamp-1">
                                            {movie.otherName || movie.name}
                                        </h3>
                                        {movie.otherName && movie.otherName !== movie.name && (
                                            <p className="text-slate-400 text-sm mt-0.5 line-clamp-1 group-hover:text-slate-300 transition-all duration-300">
                                                {movie.name}
                                            </p>
                                        )}
                                    </Link>
                                    <div className="flex flex-wrap gap-2 mt-0.5">
                                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded border border-yellow-500/30 uppercase tracking-wider">
                                            Yêu Thích
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center shrink-0 sm:ml-auto w-full sm:w-auto justify-end pr-2 gap-3">
                                    <Link to={`/play/${movie.id}`} className="flex items-center gap-2 bg-linear-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white px-5 py-2 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.5)] hover:scale-105 border border-yellow-400/50 text-sm">
                                        <FaPlay size={12} /> Xem phim
                                    </Link>
                                    <button onClick={(e) => handleRemoveFavorite(movie.id, e)} className="p-2.5 rounded-xl bg-slate-700/50 text-slate-400 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/40 transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]" title="Xóa khỏi yêu thích">
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                            </div>
                        )
                    )) : (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500">
                            <FaSearch size={40} className="mb-4 opacity-20" />
                            <p>Không tìm thấy phim yêu thích nào phù hợp</p>
                        </div>
                    )}
                </div>
            )}
            
            <DeleteDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDeleteFavorite}
                title="Xóa yêu thích?"
                message="Bạn muốn xóa phim này khỏi danh sách yêu thích?"
            />
        </div>
    );
}

export default Favorites;