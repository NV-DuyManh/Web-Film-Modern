import React, { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { FaFilm, FaSearch, FaTh, FaList, FaPlay, FaStar, FaInfoCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../../../contexts/AuthProvider';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { RentMovieContext } from '../../../../contexts/RentMovieProvider';
import { getObjectById } from '../../../../services/firebaseResponse';
import { searchTV } from '../../../../components/admin/search/SearchTV';

function CountdownTimer({ expireDate, onExpire }) {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const end = new Date(expireDate);
            const diff = end - now;

            if (diff <= 0) {
                if (onExpire) onExpire();
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
            const minutes = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
            const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');

            if (days > 0) {
                setTimeLeft(
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <span>⏳ Còn {days} ngày</span>
                        <span className="text-[10px] md:text-xs font-mono">{hours}:{minutes}:{seconds}</span>
                    </span>
                );
            } else {
                setTimeLeft(
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <span>⏳ Còn</span>
                        <span className="text-[10px] md:text-xs font-mono">{hours}:{minutes}:{seconds}</span>
                    </span>
                );
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expireDate]);

    return <span className="flex flex-col items-center justify-center leading-tight gap-0.5">{timeLeft}</span>;
};

function RentMovies(props) {
    const { isLogin } = useContext(AuthContext);
    const moviesData = useContext(RentMovieContext);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const movies = useContext(MovieContext);
    const [expiredMovieIds, setExpiredMovieIds] = useState(new Set());

    const handleExpire = useCallback((id) => {
        setExpiredMovieIds(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    }, []);

    const rawRentedMovies = useMemo(() => {
        if (!isLogin || !moviesData) return [];
        const rentByUser = moviesData.filter(p => {
            if (!p.expiryDate) return false;
            const expiry = typeof p.expiryDate.toDate === 'function'
                ? p.expiryDate.toDate()
                : (p.expiryDate.seconds ? new Date(p.expiryDate.seconds * 1000) : new Date(p.expiryDate));
            return p.userID == isLogin.id && expiry > new Date();
        });
        const mappedMovies = rentByUser.map(c => {
            const movie = getObjectById(movies, c.movieID);
            if (!movie) return null;
            const expiry = typeof c.expiryDate.toDate === 'function'
                ? c.expiryDate.toDate()
                : (c.expiryDate.seconds ? new Date(c.expiryDate.seconds * 1000) : new Date(c.expiryDate));
            return { ...movie, expireDate: expiry };
        }).filter(Boolean);

        const uniqueMovies = {};
        mappedMovies.forEach(m => {
            if (!uniqueMovies[m.id] || m.expireDate > uniqueMovies[m.id].expireDate) {
                uniqueMovies[m.id] = m;
            }
        });

        return Object.values(uniqueMovies).sort((a, b) => b.expireDate - a.expireDate);
    }, [moviesData, isLogin, movies]);

    const rentedMovies = useMemo(() => {
        return rawRentedMovies.filter(m => !expiredMovieIds.has(m.id));
    }, [rawRentedMovies, expiredMovieIds]);

    const filteredMovies = useMemo(() => {
        if (!searchQuery.trim()) return rentedMovies;
        const lowerQuery = searchTV(searchQuery);
        return rentedMovies.filter(m =>
            searchTV(m.name || '').includes(lowerQuery) ||
            searchTV(m.otherName || '').includes(lowerQuery)
        );
    }, [rentedMovies, searchQuery]);

    return (
        <div className="w-full flex flex-col gap-6 p-6 bg-[#1e293b]/60 rounded-2xl border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] min-h-full">
            {rentedMovies.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full mb-2">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:flex-1">
                        <div className="relative group w-full md:max-w-md lg:max-w-lg">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                <FaSearch className="text-slate-500 group-hover:text-green-500 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] group-focus-within:text-[#ff00ff] group-focus-within:drop-shadow-[0_0_8px_#ff00ff] group-focus-within:scale-[1.15] transition-all duration-300" />
                            </div>
                            <input
                                type="text"
                                placeholder="Tìm kiếm phim đã thuê..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent text-white text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none placeholder:text-slate-600 relative border border-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.6),inset_0_0_5px_rgba(0,242,254,0.2)] hover:border-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.8),inset_0_0_5px_rgba(34,197,94,0.3)] focus:border-[#ff00ff] focus:shadow-[0_0_25px_rgba(255,0,255,0.9),inset_0_0_10px_rgba(255,0,255,0.4)] transition-all duration-300"
                            />
                        </div>
                        <div className="premium-border-box flex w-full sm:w-auto justify-center items-center gap-3 px-4 py-2 bg-slate-800/50 backdrop-blur-md rounded-xl shadow-lg whitespace-nowrap group">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Số lượng</span>
                            <div className="flex items-center justify-center bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-0.5 rounded-lg group-hover:bg-fuchsia-500/20 group-hover:border-fuchsia-500/40 group-hover:shadow-[0_0_15px_rgba(232,121,249,0.3)] transition-all duration-300">
                                <span className="text-fuchsia-400 font-black text-sm">{rentedMovies.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md w-full md:w-auto justify-center md:justify-start shrink-0">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center ${viewMode === 'grid' ? 'bg-fuchsia-400/20 text-fuchsia-400 border border-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,0.3)] scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                        >
                            <FaTh size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center ${viewMode === 'list' ? 'bg-fuchsia-400/20 text-fuchsia-400 border border-fuchsia-400 shadow-[0_0_15px_rgba(232,121,249,0.3)] scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                        >
                            <FaList size={20} />
                        </button>
                    </div>
                </div>
            )}

            {rentedMovies.length === 0 ? (
                <div className="mt-6 w-full min-h-100 border border-dashed border-slate-700/60 rounded-3xl bg-slate-900/20 flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
                    <span className="text-6xl mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">🎬</span>
                    <h3 className="text-slate-400 text-base md:text-lg mb-8">Bạn chưa thuê bộ phim nào</h3>
                </div>
            ) : (
                <div className={`mt-4 ${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'flex flex-col gap-4'}`}>
                    {filteredMovies.length > 0 ? filteredMovies.map(movie => (
                        viewMode === 'grid' ? (
                            <Link to={`/detailFilm/${movie.id}`} key={`grid-${movie.id}`} className="group relative flex flex-col gap-3 cursor-pointer">
                                <div className="relative rounded-2xl overflow-hidden border-[3px] border-transparent bg-slate-800/40 hover:border-fuchsia-400 transition-all duration-300 hover:shadow-[0_12px_25px_rgba(232,121,249,0.3)] hover:-translate-y-2 aspect-2/3 w-full">
                                    <img src={movie.imgUrl} alt={movie.name} className="w-full h-full object-cover transition-opacity duration-300 opacity-90 group-hover:opacity-100" />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent opacity-70"></div>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-max max-w-[90%] bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.8)] border border-fuchsia-500/50 group-hover:border-fuchsia-400 group-hover:shadow-[0_0_15px_rgba(232,121,249,0.5)] transition-all duration-300 flex items-center justify-center gap-1.5">
                                        <FaPlay size={10} className="text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.9)] shrink-0" />
                                        <span className="text-fuchsia-400 text-[10px] sm:text-[11px] font-bold truncate">Xem ngay</span>
                                    </div>
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-max max-w-[90%] bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg border border-fuchsia-500/50 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                                        <span className="text-fuchsia-400 text-[9px] sm:text-[10px] font-bold tracking-wider"><CountdownTimer expireDate={movie.expireDate} onExpire={() => handleExpire(movie.id)} /></span>
                                    </div>
                                </div>
                                <div className="px-1 mt-2 mb-1 flex flex-col items-center">
                                    <h3 className="text-white font-bold text-sm md:text-base text-center line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-fuchsia-400 group-hover:drop-shadow-[0_0_8px_rgba(232,121,249,0.5)] transition-all duration-300">
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
                            <div key={`list-${movie.id}`} className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-md hover:border-fuchsia-500/40 hover:shadow-[0_0_25px_rgba(232,121,249,0.2)] transition-all duration-300 group">
                                <Link to={`/detailFilm/${movie.id}`} className="w-32 sm:w-40 md:w-48 h-auto aspect-video rounded-xl overflow-hidden shrink-0 border-[3px] border-transparent group-hover:border-fuchsia-400 transition-all duration-300 relative block">
                                    <img src={movie.bannerUrl || movie.imgUrl} alt={movie.name} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                                </Link>

                                <div className="flex-1 w-full flex flex-col justify-center py-2 gap-2">
                                    <Link to={`/detailFilm/${movie.id}`}>
                                        <h3 className="text-white font-bold text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-fuchsia-400 group-hover:drop-shadow-[0_0_8px_rgba(232,121,249,0.5)] transition-all duration-300 line-clamp-1">
                                            {movie.otherName || movie.name}
                                        </h3>
                                        {movie.otherName && movie.otherName !== movie.name && (
                                            <p className="text-slate-400 text-sm mt-0.5 line-clamp-1 group-hover:text-slate-300 transition-all duration-300">
                                                {movie.name}
                                            </p>
                                        )}
                                    </Link>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <span className="px-2 py-1 bg-fuchsia-500/20 text-fuchsia-400 text-[10px] font-bold rounded border border-fuchsia-500/30 tracking-wider">
                                            <CountdownTimer expireDate={movie.expireDate} onExpire={() => handleExpire(movie.id)} />
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0 sm:ml-auto w-full sm:w-auto justify-end">
                                    <Link to={`/play/${movie.id}`} className="flex items-center gap-2 bg-linear-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(232,121,249,0.5)] hover:scale-105 border border-fuchsia-400/50">
                                        <FaPlay size={14} /> Xem ngay
                                    </Link>
                                </div>
                            </div>
                        )
                    )) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-70">
                            <FaInfoCircle className="text-slate-600 text-6xl mb-4" />
                            <p className="text-slate-400 text-lg font-medium">Không tìm thấy phim phù hợp</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default RentMovies;