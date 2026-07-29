import React from 'react';
import { COUNTRIES } from '../../../utils/Contants';

function Country({ openCountry }) {
    return (
        <div 
            className={`absolute top-full mt-3 z-50 w-[90vw] sm:w-145 rounded-2xl bg-[#0f172a] border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 origin-top-right ${openCountry ? "opacity-100 visible translate-y-0 scale-100" : "opacity-0 invisible -translate-y-2 scale-95"} max-[1149px]:left-0 max-[1149px]:right-0 max-[1149px]:mx-auto min-[1150px]:-right-10 min-[1150px]:left-auto`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-1.5 max-h-80 overflow-y-auto custom-scrollbar">
                {COUNTRIES.map((e, index) => (
                    <div 
                        key={index} 
                        className="cursor-pointer text-gray-200 px-2 py-2 rounded-lg hover:text-yellow-400 hover:bg-white/10 text-[13px] font-medium transition-colors duration-200 truncate"
                        title={e}
                    >
                        {e}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Country;
