import React, { useContext, useState, useEffect } from "react";
import { useMovies } from '../../../hooks/useCollections';
import { useNavigate } from "react-router-dom";
import { CategoryContext } from "../../../contexts/CategoryProvider";
import { FaSearch } from "react-icons/fa";
import { searchTV } from "../../../components/admin/search/SearchTV";

function Category({ openCate, setOpenCate, isRightCol }) {
    const categories = useContext(CategoryContext) || [];
    const movies = useMovies() || [];
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!openCate) {
            setSearchTerm('');
        }
    }, [openCate]);

    const validCategories = categories.filter(c => 
        movies.some(m => (m.listCategory || []).some(catId => String(catId) === String(c.id)))
    ).filter(c => searchTV(c.name).includes(searchTV(searchTerm)));

    return (
        <div 
            className={`absolute top-full mt-1 z-100 rounded-2xl bg-[#0f172a] border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)] transition duration-300 ${openCate ? "opacity-100 visible translate-y-0 scale-100" : "opacity-0 invisible -translate-y-2 scale-95"} max-[1199px]:absolute max-[1199px]:w-[calc(200%+4px)] ${isRightCol ? 'max-[1199px]:right-0 max-[1199px]:origin-top-right' : 'max-[1199px]:left-0 max-[1199px]:origin-top-left'} min-[1200px]:-left-4 min-[1200px]:origin-top min-[1200px]:w-150`}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <div className="px-4 pt-3 pb-2 bg-[#0f172a] rounded-t-2xl border-b border-white/5 z-10">
                <div className="relative w-full group">
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm thể loại..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/80 border border-cyan-400/40 text-cyan-100 text-[13px] rounded-full pl-9 pr-4 py-2 focus:outline-none focus:bg-slate-800 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.5),inset_0_0_10px_rgba(34,211,238,0.3)] transition placeholder-cyan-400/60 hover:border-cyan-400/70 hover:bg-slate-800 hover:shadow-[0_0_10px_rgba(34,211,238,0.2)] shadow-[inset_0_0_8px_rgba(34,211,238,0.1)]"
                    />
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 group-hover:text-cyan-200 group-focus-within:text-cyan-300 group-focus-within:animate-pulse transition text-sm drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                </div>
            </div>
            <div className="px-3 pb-4 pt-2 grid grid-cols-2 sm:grid-cols-4 max-h-75 overflow-y-auto custom-scrollbar">
                {validCategories.length > 0 ? validCategories.map((e, index) => (
                    <div 
                        key={index} 
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            navigate(`/category/${encodeURIComponent(e.name)}`);
                            if (setOpenCate) setOpenCate(false);
                        }}
                        className="cursor-pointer px-2 py-1 group"
                    >
                        <div className="text-gray-200 px-3 py-2 rounded-lg group-hover:text-yellow-400 group-hover:bg-white/10 text-[13.5px] font-medium transition-colors duration-200">
                            {e.name}
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full text-center py-8 text-slate-400 text-sm font-medium">
                        Không tìm thấy thể loại "{searchTerm}"
                    </div>
                )}
            </div>
        </div>
    );
}

export default Category;
