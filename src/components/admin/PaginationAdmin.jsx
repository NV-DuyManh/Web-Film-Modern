import React from 'react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

export default function PaginationAdmin({
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    totalItems
}) {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const from = totalItems === 0 ? 0 : (page - 1) * rowsPerPage + 1;
    const to = Math.min(page * rowsPerPage, totalItems);

    return (
        <div className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-900/20 px-6 py-2 backdrop-blur-md">
            
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Rows</span>
                <Select
                    labelId="rows-per-page-label"
                    id="rows-per-page-select"
                    value={rowsPerPage}
                    onChange={(e) => {
                        setRowsPerPage(e.target.value);
                        setPage(1);
                    }}
                    size="small"
                    sx={{
                        height: 28,
                        bgcolor: "rgba(255, 255, 255, 0.03)",
                        color: "#a855f7",
                        fontSize: 12,
                        fontWeight: "700",
                        borderRadius: "6px",
                        "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(168, 85, 247, 0.2)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#a855f7",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#a855f7",
                            borderWidth: "1px",
                        },
                        "& .MuiSvgIcon-root": {
                            color: "#a855f7",
                            fontSize: 18
                        }
                    }}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                bgcolor: "#1e293b",
                                color: "white",
                                border: "1px solid rgba(255,255,255,0.1)",
                                "& .MuiMenuItem-root:hover": {
                                    bgcolor: "rgba(168, 85, 247, 0.1)",
                                    color: "#a855f7"
                                }
                            }
                        }
                    }}
                >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={15}>15</MenuItem>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <span 
                    aria-hidden="true" 
                    className="w-6" 
                    style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(168, 85, 247, 0.5))' }}
                />
                <p className="text-xs font-medium tracking-tight text-gray-300">
                    Showing <span className="font-bold text-purple-400">{from}</span> 
                    <span className="mx-1 text-gray-500">to</span> 
                    <span className="font-bold text-purple-400">{to}</span> 
                    <span className="mx-1 text-gray-500">of</span> 
                    <span className="font-bold text-white">{totalItems}</span>
                </p>
                <span 
                    aria-hidden="true" 
                    className="w-6" 
                    style={{ height: '1px', background: 'linear-gradient(to left, transparent, rgba(168, 85, 247, 0.5))' }}
                />
            </div>

            <Stack spacing={2}>
                <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    shape="rounded"
                    siblingCount={0}
                    boundaryCount={1}
                    sx={{
                        "& .MuiPaginationItem-root": {
                            color: "rgba(255, 255, 255, 0.6)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            bgcolor: "transparent",
                            fontSize: 12,
                            fontWeight: "600",
                            minWidth: 28,
                            height: 28,
                            margin: "0 2px",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                                bgcolor: "rgba(168, 85, 247, 0.1)",
                                borderColor: "#a855f7",
                                color: "#a855f7",
                            }
                        },
                        "& .Mui-selected": {
                            bgcolor: "rgba(168, 85, 247, 0.2) !important",
                            color: "#a855f7 !important",
                            borderColor: "#a855f7 !important",
                            boxShadow: "0 0 10px rgba(168, 85, 247, 0.3)",
                        },
                        "& .MuiPaginationItem-ellipsis": {
                            color: "gray",
                            border: "none"
                        },
                        "& .MuiPaginationItem-previousNext": {
                            bgcolor: "rgba(255, 255, 255, 0.03)",
                            "& svg": {
                                fontSize: 18,
                                color: "#a855f7"
                            }
                        }
                    }}
                />
            </Stack>
        </div>
    );
}