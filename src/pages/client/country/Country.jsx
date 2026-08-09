import React, { useContext } from 'react';
import { useMovies } from '../../../hooks/useCollections';
import { useNavigate } from 'react-router-dom';
import { COUNTRIES } from '../../../utils/Constants';

function Country({ openCountry, setOpenCountry, isRightCol }) {
    const movies = useMovies() || [];
    const navigate = useNavigate();

    const validCountries = COUNTRIES.filter(c => 
        movies.some(m => m.countriesID?.toLowerCase() === c.toLowerCase())
    );

    return (
        <div 
            className={`absolute top-full mt-3 z-100 rounded-2xl bg-[#0f172a] border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 ${openCountry ? "opacity-100 visible translate-y-0 scale-100" : "opacity-0 invisible -translate-y-2 scale-95"} max-[1199px]:absolute max-[1199px]:w-[calc(200%+4px)] ${isRightCol ? 'max-[1199px]:right-0 max-[1199px]:origin-top-right' : 'max-[1199px]:left-0 max-[1199px]:origin-top-left'} min-[1200px]:-right-10 min-[1200px]:origin-top-right min-[1200px]:left-auto min-[1200px]:w-150`}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <div className="px-3 pb-4 pt-2 grid grid-cols-2 sm:grid-cols-4 max-h-80 overflow-y-auto custom-scrollbar">
                {validCountries.map((e, index) => (
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
                ))}
            </div>
        </div>
    );
}

export default Country;
