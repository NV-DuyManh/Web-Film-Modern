import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CategoryContext } from "../../../contexts/CategoryProvider";
import { MovieContext } from "../../../contexts/MovieProvider";

function Category({ openCate, setOpenCate }) {
    const categories = useContext(CategoryContext) || [];
    const movies = useContext(MovieContext) || [];
    const navigate = useNavigate();
    
    const validCategories = categories.filter(c => 
        movies.some(m => (m.listCategory || []).some(catId => String(catId) === String(c.id)))
    );

    return (
        <div 
            className={`absolute top-full mt-3 z-50 w-[90vw] sm:w-[600px] rounded-2xl bg-[#0f172a] border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 origin-top ${openCate ? "opacity-100 visible translate-y-0 scale-100" : "opacity-0 invisible -translate-y-2 scale-95"} max-[1149px]:left-0 max-[1149px]:right-0 max-[1149px]:mx-auto min-[1150px]:-left-4`}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <div className="px-3 pb-4 pt-2 grid grid-cols-2 sm:grid-cols-4 max-h-80 overflow-y-auto custom-scrollbar">
                {validCategories.map((e, index) => (
                    <div 
                        key={index} 
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            navigate(`/category/${e.id}`);
                            if (setOpenCate) setOpenCate(false);
                        }}
                        className="cursor-pointer px-2 py-1 group"
                    >
                        <div className="text-gray-200 px-3 py-2 rounded-lg group-hover:text-yellow-400 group-hover:bg-white/10 text-[13.5px] font-medium transition-colors duration-200">
                            {e.name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Category;
