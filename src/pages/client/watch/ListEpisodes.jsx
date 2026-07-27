import React, { useState } from 'react';
import { FaPlay } from 'react-icons/fa';

function ListEpisodes({ episodeShow, playEpisodes, handleClickEpisodes }) {
    const [rangeIndex, setRangeIndex] = useState(0);
    const CHUNK_SIZE = 30;

    if (!episodeShow || episodeShow.length === 0) {
        return (
            <div className="py-8 text-center text-slate-400 bg-[#0d121f] rounded-xl border border-slate-700/80 my-2">
                <p className="text-sm font-medium">Danh sách tập phim đang được cập nhật...</p>
            </div>
        );
    }

    const hasRanges = episodeShow.length > CHUNK_SIZE;
    const ranges = [];
    if (hasRanges) {
        for (let i = 0; i < episodeShow.length; i += CHUNK_SIZE) {
            ranges.push(episodeShow.slice(i, i + CHUNK_SIZE));
        }
    }

    const currentEpisodes = hasRanges ? (ranges[rangeIndex] || episodeShow) : episodeShow;

    return (
        <div className="flex flex-col gap-4 py-1">
            {/* Range Pagination if many episodes */}
            {hasRanges && (
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-3 border-b border-slate-700/60">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 inline">
                        Chọn phần:
                    </p>
                    {ranges.map((_, idx) => {
                        const start = idx * CHUNK_SIZE + 1;
                        const end = Math.min((idx + 1) * CHUNK_SIZE, episodeShow.length);
                        const isSelected = rangeIndex === idx;
                        return (
                            <button
                                key={idx}
                                onClick={() => setRangeIndex(idx)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer whitespace-nowrap border ${
                                    isSelected
                                        ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                                        : "bg-[#0d121f] text-slate-300 hover:text-white hover:bg-[#161d30] border-slate-700/80"
                                }`}
                            >
                                Tập {start} - {end}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* High-Contrast Distinct Solid Episode Buttons */}
            <div className="flex flex-wrap gap-2.5">
                {currentEpisodes.map((e) => {
                    const isActive = playEpisodes?.id == e.id;
                    return (
                        <button
                            key={e.id || e.numberEpisode}
                            onClick={() => handleClickEpisodes(e)}
                            className={`group relative flex h-10 sm:h-11 items-center justify-center gap-2 px-5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer border whitespace-nowrap ${
                                isActive
                                    ? "ep-btn-active bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 border-amber-300 font-black scale-105 ring-2 ring-amber-400/50 ring-offset-2 ring-offset-[#0d0f14]"
                                    : "bg-slate-700/80 text-white border-slate-500/60 hover:border-cyan-400 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(34,211,238,0.25)] hover:scale-[1.04] active:scale-95"
                            }`}
                        >
                            <FaPlay className={`text-[10px] shrink-0 transition-all duration-300 ${isActive ? "text-slate-950 drop-shadow-sm" : "text-amber-400 group-hover:text-cyan-400 group-hover:scale-110"}`} />
                            <p className="relative inline">Tập {e.numberEpisode}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default ListEpisodes;