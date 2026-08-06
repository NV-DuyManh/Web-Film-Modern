import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShowTimeContext } from '../../../contexts/ShowTimeProvider';
import { MovieContext } from '../../../contexts/MovieProvider';
import { getOptimizedUrl } from '../../../utils/cloudinary';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTicketAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { MdLocalMovies, MdAccessTime, MdRoom } from 'react-icons/md';

function Showtimes() {
    const showTimes = useContext(ShowTimeContext) || [];
    const movies = useContext(MovieContext) || [];
    const navigate = useNavigate();

    const dates = useMemo(() => {
        const result = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            result.push(d);
        }
        return result;
    }, []);

    const [selectedDate, setSelectedDate] = useState(dates[0]);

    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const [isDragging, setIsDragging] = useState(false);
    const [hasDragged, setHasDragged] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e) => {
        if (!scrollContainerRef.current) return;
        setIsDragging(true);
        setHasDragged(false);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        if (Math.abs(x - startX) > 5) {
            setHasDragged(true);
        }
        const walk = (x - startX) * 2;
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
        }
    };

    useEffect(() => {
        handleScroll(); 
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, [dates]);

    const scrollByAmount = (direction) => {
        if (scrollContainerRef.current) {
            
            const firstChild = scrollContainerRef.current.children[0];
            const scrollAmount = firstChild ? firstChild.clientWidth : 120;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const formatDateKey = (date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const getDateValue = (value) => {
        if (!value) return 0;
        if (value?.toDate) return value.toDate().getTime();
        if (value?.seconds) return value.seconds * 1000;
        const date = new Date(value);
        return isNaN(date.getTime()) ? 0 : date.getTime();
    };

    const groupedShowtimes = useMemo(() => {
        const selectedKey = formatDateKey(selectedDate);
        const filtered = showTimes.filter(st => {
            const stDate = new Date(getDateValue(st.time));
            return formatDateKey(stDate) === selectedKey;
        });

        const grouped = {};
        filtered.forEach(st => {
            if (!grouped[st.movieID]) {
                grouped[st.movieID] = [];
            }
            grouped[st.movieID].push(st);
        });

        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => getDateValue(a.time) - getDateValue(b.time));
        });

        return grouped;
    }, [showTimes, selectedDate]);

    const formatTimeOnly = (value) => {
        const date = new Date(getDateValue(value));
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const getDayName = (date, index) => {
        if (index === 0) return 'Hôm nay';
        if (index === 1) return 'Ngày mai';
        return date.toLocaleDateString('vi-VN', { weekday: 'short' });
    };

    return (
        <div className="min-h-screen bg-[#111827] pb-20 pt-24 px-6 md:px-10 lg:px-20 xl:px-28">
            
            <div className="flex items-center gap-3 mb-8">
                <FaCalendarAlt className="text-2xl md:text-3xl text-slate-200" />
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Lịch chiếu
                </h1>
            </div>

            <div className="relative mb-10">
                <div className="absolute top-1/2 -translate-y-1/2 -left-5 md:-left-8 lg:-left-12 xl:-left-16 z-10 hidden lg:flex items-center justify-center">
                    <button 
                        onClick={() => scrollByAmount('left')}
                        className={`w-8 h-8 rounded-full bg-slate-700 hover:bg-amber-500 flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-md cursor-pointer ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    >
                        <FaChevronLeft className="text-sm mr-0.5" />
                    </button>
                </div>

                <div 
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    className={`flex overflow-x-auto hide-scrollbar border-b border-white/10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
                >
                    {dates.map((date, index) => {
                        const isSelected = formatDateKey(date) === formatDateKey(selectedDate);
                        return (
                            <button
                                key={index}
                                onClick={(e) => {
                                    if (hasDragged) {
                                        e.preventDefault();
                                        return;
                                    }
                                    setSelectedDate(date);
                                }}
                                className={`group flex-shrink-0 w-[calc(100%/3)] sm:w-[calc(100%/4)] md:w-[calc(100%/5)] lg:w-[calc(100%/7)] py-3 px-4 flex flex-col items-start justify-center border-t-2 border-r border-white/5 transition-all
                                    ${isSelected 
                                        ? 'border-t-amber-500 bg-[#2b2f3a] shadow-inner' 
                                        : 'border-t-transparent bg-[#1e232e] hover:bg-[#252a36]'
                                    }
                                `}
                            >
                                <span className={`text-xs mb-1 font-medium tracking-wider transition-colors ${isSelected ? 'text-amber-500/80' : 'text-slate-400 group-hover:text-slate-300'}`}>
                                    {String(date.getDate()).padStart(2, '0')}/{String(date.getMonth() + 1).padStart(2, '0')}
                                </span>
                                <span className={`text-sm md:text-base font-bold transition-colors ${isSelected ? 'text-amber-500 drop-shadow-sm' : 'text-slate-200 group-hover:text-white'}`}>
                                    {getDayName(date, index)}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="absolute top-1/2 -translate-y-1/2 -right-5 md:-right-8 lg:-right-12 xl:-right-16 z-10 hidden lg:flex items-center justify-center">
                    <button 
                        onClick={() => scrollByAmount('right')}
                        className={`w-8 h-8 rounded-full bg-slate-700 hover:bg-amber-500 flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-md cursor-pointer ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    >
                        <FaChevronRight className="text-sm ml-0.5" />
                    </button>
                </div>
            </div>

            <div className="relative min-h-[400px]">
                {Object.keys(groupedShowtimes).length === 0 ? (
                    <div className="flex flex-col items-center justify-center pt-20 pb-32">
                        <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                            <FaTicketAlt className="text-4xl text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Không có suất chiếu nào</h3>
                        <p className="text-slate-500 mt-2">Vui lòng chọn ngày khác để xem lịch chiếu.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                        {Object.keys(groupedShowtimes).map(movieID => {
                            const movie = movies.find(m => m.id === movieID);
                            if (!movie) return null;
                            const slots = groupedShowtimes[movieID];

                            return (
                                <div 
                                    key={movieID} 
                                    onClick={() => navigate(`/detailFilm/${movieID}`)}
                                    className="flex gap-4 bg-[#2b2f3a] hover:bg-[#383d4a] transition-colors duration-300 rounded-xl p-3 items-center group cursor-pointer border border-transparent hover:border-white/5"
                                >
                                    
                                    <div className="w-16 h-24 sm:w-16 sm:h-24 md:w-20 md:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-[#1f222a] shadow-md">
                                        <img 
                                            src={movie.imgUrl || movie.posterUrl || movie.thumbUrl} 
                                            alt={movie.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 select-none pointer-events-none"
                                            loading="lazy"
                                         onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()} />
                                    </div>

                                    <div className="flex flex-col flex-1 min-w-0 py-1 justify-center">
                                        <h2 
                                            className="text-sm md:text-base font-bold text-slate-200 leading-snug mb-1 group-hover:text-white transition-colors truncate" 
                                            title={movie.otherName || movie.name}
                                        >
                                            {movie.otherName || movie.name}
                                        </h2>
                                        <p 
                                            className="text-xs text-slate-500 font-medium truncate mb-1"
                                            title={movie.name}
                                        >
                                            {movie.name}
                                        </p>
                                        
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {slots.map((st, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/detailFilm/${movieID}`); }}
                                                    className="flex items-center gap-1.5 hover:-translate-y-1 hover:scale-105 transition-all duration-300 group/time cursor-pointer"
                                                >
                                                    
                                                    <div className="flex items-center justify-center gap-1 px-2.5 py-1 bg-linear-to-r from-blue-500 to-cyan-400 rounded-full shadow-[0_2px_10px_rgba(6,182,212,0.3)] group-hover/time:shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-shadow border border-white/10">
                                                        <MdAccessTime className="text-white text-[11px]" />
                                                        <span className="text-[10px] leading-none font-bold text-white drop-shadow-sm whitespace-nowrap mt-[1px]">
                                                            {formatTimeOnly(st.time)}
                                                        </span>
                                                    </div>

                                                    {st.roomName && (
                                                        <div className="flex items-center justify-center gap-1 px-2.5 py-1 bg-linear-to-r from-orange-500 to-red-500 rounded-full shadow-[0_2px_10px_rgba(245,158,11,0.3)] group-hover/time:shadow-[0_0_15px_rgba(245,158,11,0.6)] transition-shadow border border-white/10">
                                                            <MdRoom className="text-white text-[11px]" />
                                                            <span className="text-[10px] leading-none font-bold text-white uppercase drop-shadow-sm whitespace-nowrap mt-[1px]">
                                                                {st.roomName}
                                                            </span>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style jsx="true">{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}

export default Showtimes;
