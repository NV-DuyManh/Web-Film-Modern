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
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                        Chọn phần:
                    </span>
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
                            className={`group flex h-10 sm:h-11 items-center justify-center gap-2 px-4.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer border whitespace-nowrap ${
                                isActive
                                    ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 border-amber-300 font-black shadow-[0_0_16px_rgba(245,158,11,0.45)] scale-[1.03]"
                                    : "bg-[#0d121f] text-white border-slate-700/80 hover:border-amber-400 hover:bg-[#161d30] hover:text-amber-300 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(245,158,11,0.2)]"
                            }`}
                        >
                            <FaPlay className={`text-[10px] shrink-0 transition-colors ${isActive ? "text-slate-950" : "text-amber-400 group-hover:text-amber-300"}`} />
                            <span>Tập {e.numberEpisode}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default ListEpisodes;