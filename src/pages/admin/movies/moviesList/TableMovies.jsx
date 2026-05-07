import React, { useState, useMemo, useEffect } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import { FaEye } from 'react-icons/fa';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';

function TableMovies({ movies, search, handleView, handleEdit, handleDelete }) {
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const dataSearch = useMemo(() => 
        movies?.filter(e => e?.name?.toLowerCase().includes(search.toLowerCase())), 
    [search, movies]);

    const currentData = dataSearch?.slice((page - 1) * rowsPerPage, page * rowsPerPage) || [];

    useEffect(() => { setPage(1); }, [search]);

    return (
        <div className="p-5">
            <div className="table-wrapper">
                <div className="table-container overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="table-header">
                            <tr>
                                <th className="w-16">ID</th>
                                <th className="w-24">IMAGE</th>
                                <th>NAME</th>
                                <th className="text-center">RATING</th>
                                <th className="text-center">DURATION</th>
                                <th className="text-center">EPISODE</th>
                                <th className="text-center">STATUS</th>
                                <th className="text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((row, index) => (
                                <tr key={row.id} className="table-row">
                                    <td className="table-cell">{(page - 1) * rowsPerPage + index + 1}</td>
                                    <td className="table-cell py-2">
                                        <img src={row.imgUrl} alt={row.name} className="w-14 h-20 object-cover rounded-md shadow-md border border-white/10" />
                                    </td>
                                    <td className="table-cell">{row.name}</td>
                                    <td className="table-cell text-center">
                                        <span className="text-yellow-400">★</span> {row.rating}
                                    </td>
                                    <td className="table-cell text-center">
                                        {row.duration ? `${row.duration} mins` : "N/A"}
                                    </td>
                                    <td className="table-cell text-center">
                                        {row.endEpisode ? `${row.endEpisode} eps` : "N/A"}
                                    </td>
                                    <td className="table-cell text-center">
                                        <span className={`px-2 py-1 text-[10px] rounded uppercase tracking-wider font-bold ${
                                            row.status === 'Ended' ? 'bg-red-500/20 text-red-400' 
                                            : row.status === 'Now Showing' ? 'bg-green-500/20 text-green-400' 
                                            : 'bg-cyan-500/20 text-cyan-400'
                                        }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="table-cell text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleView(row)} className="action-btn btn-edit bg-transparent border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black">
                                                <FaEye size={16}/>
                                            </button>
                                            <button onClick={() => handleEdit(row)} className="action-btn btn-edit">
                                                <CiEdit size={16}/>
                                            </button>
                                            <button onClick={() => handleDelete(row)} className="action-btn btn-delete">
                                                <RiDeleteBin6Fill size={16}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="table-footer">
                        <PaginationAdmin page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} totalItems={dataSearch?.length || 0} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TableMovies;