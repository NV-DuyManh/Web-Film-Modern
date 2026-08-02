import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { COUNTRIES } from '../../../utils/Constants';
import { MovieContext } from '../../../contexts/MovieProvider';

function Country({ openCountry, setOpenCountry }) {
    const movies = useContext(MovieContext) || [];
    const navigate = useNavigate();

    // Filter to only include countries that have at least one movie
    const validCountries = COUNTRIES.filter(c => 
        movies.some(m => m.countriesID?.toLowerCase() === c.toLowerCase())
    );

    return (
        <div 
            className={`absolute top-full mt-3 z-50 w-[90vw] sm:w-[600px] rounded-2xl bg-[#0f172a] border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 origin-top-right ${openCountry ? "opacity-100 visible translate-y-0 scale-100" : "opacity-0 invisible -translate-y-2 scale-95"} max-[1149px]:left-0 max-[1149px]:right-0 max-[1149px]:mx-auto min-[1150px]:-right-10 min-[1150px]:left-auto`}
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
