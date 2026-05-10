// src/pages/admin/movies/moviesList/TableMovies.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';

function TableMovies({ movies, search, handleEdit, handleDelete }) {
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
                                <th className="w-24 text-center">IMAGE</th>
                                <th>NAME</th>
                                <th>COUNTRY</th>
                                <th className="text-center">DURATION</th>
                                <th className="text-center">EPISODE</th>
                                <th className="text-center">RENT</th>
                                <th className="text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((row, index) => (
                                <tr key={row.id} className="table-row">
                                    <td className="table-cell">{(page - 1) * rowsPerPage + index + 1}</td>
                                    <td className="table-cell py-2">
                                        <img src={row.imgUrl} alt={row.name} className="w-24 h-24 object-cover rounded-md shadow-md border border-white/10" />
                                    </td>
                                    <td className="table-cell min-w-50 max-w-62.5 whitespace-normal wrap-break-words text-xs leading-relaxed text-gray-300">{row.name}</td>
                                    <td className="table-cell min-w-50 max-w-62.5 whitespace-normal wrap-break-words text-xs leading-relaxed text-gray-300">
                                        {row.countriesID || "N/A"}
                                    </td>
                                    <td className="table-cell text-center">
                                        {row.duration ? `${row.duration} mins` : "N/A"}
                                    </td>
                                    <td className="table-cell text-center">
                                        {row.endEpisode ? `${row.endEpisode} eps` : "N/A"}
                                    </td>
                                    <td className="table-cell text-center">
                                        {row.rent ? `${row.rent} VND` : "Free"}
                                    </td>
                                    <td className="table-cell text-right">
                                        <div className="flex justify-end gap-2">
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