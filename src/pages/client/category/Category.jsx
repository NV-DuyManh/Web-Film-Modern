import React, { useContext, useState } from "react";
import { CategoriesContext } from "../../../contexts/CategoryProvider";

function Category({ openCate }) {
    const categories = useContext(CategoriesContext);
    
    return (
        <div 
            className={`absolute top-full mt-3 -left-4 z-50 w-[500px] rounded-2xl bg-black/75 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.05)] transition-all duration-300 origin-top ${openCate ? "opacity-100 visible translate-y-0 scale-100" : "opacity-0 invisible -translate-y-2 scale-95"}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-5 grid grid-cols-4 gap-x-2 gap-y-1.5 max-h-[450px] overflow-y-auto custom-scrollbar">
                {categories.map((e, index) => (
                    <div 
                        key={index} 
                        className="cursor-pointer text-gray-200 px-3 py-2 rounded-lg hover:text-yellow-400 hover:bg-white/10 hover:translate-x-1 text-[13.5px] font-medium transition-all duration-300"
                    >
                        {e.name}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Category;
