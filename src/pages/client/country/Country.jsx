import React from 'react';
import { COUNTRIES } from '../../../utils/Contants';

function Country({ openCountry }) {
    return (
        <div 
            className={`absolute top-full mt-3 right-0 lg:-right-10 z-50 w-[580px] rounded-2xl bg-black/80 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.05)] transition-all duration-300 origin-top-right ${openCountry ? "opacity-100 visible translate-y-0 scale-100" : "opacity-0 invisible -translate-y-2 scale-95"}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-5 grid grid-cols-4 gap-x-2 gap-y-1.5 max-h-[450px] overflow-y-auto custom-scrollbar">
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
