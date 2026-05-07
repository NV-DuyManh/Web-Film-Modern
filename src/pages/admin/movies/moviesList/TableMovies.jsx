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
                <div className="table-container">
                    <table className="w-full text-left">
                        <thead className="table-header">
                            <tr>
                                <th>STT</th>
                                <th>POSTER</th>
                                <th>NAME</th>
                                <th>YEAR</th>
                                <th>STATUS</th>
                                <th className="text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((row, index) => (
                                <tr key={row.id} className="table-row">
                                    <td className="table-cell">{(page - 1) * rowsPerPage + index + 1}</td>
                                    <td className="table-cell">
                                        <img src={row.imgUrl} alt={row.name} className="w-10 h-10 object-cover rounded-md" />
                                    </td>
                                    <td className="table-cell font-bold text-cyan-400">{row.name}</td>
                                    <td className="table-cell">{row.productionYear}</td>
                                    <td className="table-cell"><span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] rounded font-bold">{row.status}</span></td>
                                    <td className="table-cell text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleView(row)} className="action-btn btn-edit !bg-transparent !border !border-cyan-400 !text-cyan-400 hover:!bg-cyan-400 hover:!text-black"><FaEye /></button>
                                            <button onClick={() => handleEdit(row)} className="action-btn btn-edit"><CiEdit /></button>
                                            <button onClick={() => handleDelete(row)} className="action-btn btn-delete"><RiDeleteBin6Fill /></button>
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