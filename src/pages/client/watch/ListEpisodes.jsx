import React from 'react';
import { FaPlay } from 'react-icons/fa';

function ListEpisodes({ episodeShow , playEpisodes , handleClickEpisodes }) {
    return (
        <div className="mt-8 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {
                episodeShow.map(e => (
                    <button onClick={() => handleClickEpisodes(e)} className={`flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-colors border ${playEpisodes?.id == e.id ? "bg-yellow-400 text-black border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)]" : "text-white "}`}>
                    <FaPlay className="text-[10px]" />Tập {e.numberEpisode}
                    </button>
                ))
            }

        </div>
    );
}

export default ListEpisodes;