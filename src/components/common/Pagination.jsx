import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ 
    currentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    onPageChange 
}) => {
    const [jumpPage, setJumpPage] = useState('');

    // Reset jump input when current page changes externally
    useEffect(() => {
        setJumpPage('');
    }, [currentPage]);

    if (totalPages <= 1 && totalItems === 0) return null;
    if (totalPages === 0) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const handleJump = () => {
        const page = parseInt(jumpPage, 10);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
        setJumpPage('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleJump();
        }
    };

    // Calculate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex flex-col xl:flex-row justify-center items-center w-full mt-8">
            {/* Right Controls */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                {/* Prev Button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-800/80 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-800/80 disabled:cursor-not-allowed transition-colors border border-slate-700 cursor-pointer"
                >
                    <FaChevronLeft size={12} />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                        {page === '...' ? (
                            <span className="w-6 sm:w-8 text-center text-slate-500 font-bold tracking-wider">...</span>
                        ) : (
                            <button
                                onClick={() => onPageChange(page)}
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center border cursor-pointer ${
                                    currentPage === page
                                        ? 'bg-slate-800 border-[#facc15] text-[#facc15] shadow-[0_0_10px_rgba(250,204,21,0.2)]'
                                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                                }`}
                            >
                                {page}
                            </button>
                        )}
                    </React.Fragment>
                ))}

                {/* Next Button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-800/80 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-800/80 disabled:cursor-not-allowed transition-colors border border-slate-700 cursor-pointer"
                >
                    <FaChevronRight size={12} />
                </button>

                {/* Jump to Page */}
                <div className="flex items-center gap-2 ml-0 sm:ml-4 pl-0 sm:pl-4 border-l-0 sm:border-l border-slate-700 mt-2 sm:mt-0">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 tracking-wider">PAGE</span>
                    <input
                        type="text"
                        value={jumpPage}
                        onChange={(e) => setJumpPage(e.target.value.replace(/[^0-9]/g, ''))}
                        onKeyDown={handleKeyDown}
                        className="w-10 sm:w-12 h-8 sm:h-9 bg-slate-800/80 border border-slate-700 rounded-lg text-center text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <button
                        onClick={handleJump}
                        className="h-8 sm:h-9 px-3 rounded-lg bg-slate-800/80 border border-yellow-500/50 text-[#facc15] text-[10px] sm:text-xs font-bold hover:bg-yellow-500 hover:text-black transition-all shadow-[0_0_10px_rgba(250,204,21,0.1)] cursor-pointer"
                    >
                        GO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pagination;
