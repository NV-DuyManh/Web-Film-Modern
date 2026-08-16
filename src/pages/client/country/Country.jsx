import React, { useContext, useState, useEffect } from 'react';
import { useMovies } from '../../../hooks/useCollections';
import { useNavigate } from 'react-router-dom';
import { COUNTRIES } from '../../../utils/Constants';
import { FaSearch } from "react-icons/fa";
import { searchTV } from "../../../components/admin/search/SearchTV";

function Country({ openCountry, setOpenCountry, isRightCol }) {
    const movies = useMovies() || [];
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!openCountry) {
            setSearchTerm('');
        }
    }, [openCountry]);

    const validCountries = COUNTRIES.filter(c => 
        movies.some(m => m.countriesID?.toLowerCase() === c.toLowerCase())
    ).filter(c => searchTV(c).includes(searchTV(searchTerm)));

    return (
        <div 
            className={`absolute top-full mt-3 z-100 rounded-2xl bg-[#0f172a] border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)] transition duration-300 ${openCountry ? "opacity-100 visible translate-y-0 scale-100" : "opacity-0 invisible -translate-y-2 scale-95"} max-[1199px]:absolute max-[1199px]:w-[calc(200%+4px)] ${isRightCol ? 'max-[1199px]:right-0 max-[1199px]:origin-top-right' : 'max-[1199px]:left-0 max-[1199px]:origin-top-left'} min-[1200px]:-right-10 min-[1200px]:origin-top-right min-[1200px]:left-auto min-[1200px]:w-150`}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <div className="sticky top-0 z-10 px-4 pt-4 pb-2 bg-[#0f172a] rounded-t-2xl border-b border-white/5">
                <div className="relative w-full group">
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm quốc gia..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/80 border border-yellow-400/40 text-yellow-100 text-[13px] rounded-full pl-9 pr-4 py-2 focus:outline-none focus:bg-slate-800 focus:border-yellow-400 focus:shadow-[0_0_20px_rgba(250,204,21,0.5),inset_0_0_10px_rgba(250,204,21,0.3)] transition placeholder-yellow-400/60 hover:border-yellow-400/70 hover:bg-slate-800 hover:shadow-[0_0_10px_rgba(250,204,21,0.2)] shadow-[inset_0_0_8px_rgba(250,204,21,0.1)]"
                    />
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-yellow-400 group-hover:text-yellow-200 group-focus-within:text-yellow-300 group-focus-within:animate-pulse transition text-sm drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                </div>
            </div>
            <div className="px-3 pb-4 pt-2 grid grid-cols-2 sm:grid-cols-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                {validCountries.length > 0 ? validCountries.map((e, index) => (
                    <div 
                        key={index} 
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            navigate(`/country/${encodeURIComponent(e)}`);
                            if (setOpenCountry) setOpenCountry(false);
                        }}
                        className="cursor-pointer px-2 py-1 group"
                    >
                        <div 
                            className="text-gray-200 px-2 py-2 rounded-lg group-hover:text-yellow-400 group-hover:bg-white/10 text-[13px] font-medium transition-colors duration-200 truncate"
                            title={e}
                        >
                            {e}
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full text-center py-8 text-slate-400 text-sm font-medium">
                        Không tìm thấy quốc gia "{searchTerm}"
                    </div>
                )}
            </div>
        </div>
    );
}

export default Country;
