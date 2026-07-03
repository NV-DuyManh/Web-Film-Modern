import React, { useContext, useState, useEffect, useMemo } from "react";
import { CiEdit } from "react-icons/ci";
import { RiDeleteBin6Fill } from "react-icons/ri";
import ModalDelete from "../../../../components/admin/ModalDelete";
import { deleteDocument } from "../../../../services/firebaseService";
import PaginationAdmin from "../../../../components/admin/PaginationAdmin";
import "../../../../App.scss";
import { RentMovieContext } from "../../../../contexts/RentMovieProvider";
import { MovieContext } from "../../../../contexts/MovieProvider";
import { UserContext } from "../../../../contexts/UserProvider";
import DeleteBar, { useSelectRows } from "../../../../components/admin/DeleteBar";
import { searchTV } from '../../../../components/admin/search/SearchTV';


function TableRentMovies({ handleClickOpen, setRentMovie, rentMovie, search }) {
    const rentMovies = useContext(RentMovieContext);
    const movies = useContext(MovieContext);
    const users = useContext(UserContext);
    const [open, setOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const start = (page - 1) * rowsPerPage;

    const dataSearch = useMemo(() => {
        return rentMovies
            ?.filter(e => searchTV(e?.transactionID).includes(searchTV(search)))
            ?.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
    }, [search, rentMovies]);

    const currentData = dataSearch?.slice(start, start + rowsPerPage) || [];

    useEffect(() => {
        setPage(1);
    }, [search]);

    const { selectedIds, openBulk, setOpenBulk, isAllSelected, isIndeterminate, handleSelectAll, handleSelectRow, clearSelected } = useSelectRows(currentData, search);

    const handleClickOpenDele = (row) => {
        setOpen(true);
        setRentMovie(row);
    };

    const handleClose = () => setOpen(false);

    const handleEdit = (row) => {
        handleClickOpen();
        setRentMovie(row);
    };

    const handleDeleted = async () => {
        await deleteDocument("RentMovies", rentMovie);

        if (page > 1 && currentData.length === 1) {
            setPage(page - 1);
        }

        handleClose();
    };

    const handleBulkDeleted = async () => {
        await Promise.all(
            selectedIds.map(id => {
                const item = rentMovies.find(c => c.id === id);
                return item ? deleteDocument("RentMovies", item) : Promise.resolve();
            })
        );
        const remaining = currentData.filter(row => !selectedIds.includes(row.id)).length;
        if (page > 1 && remaining === 0) setPage(page - 1);
        clearSelected();
        setOpenBulk(false);
    };

    const getMovieName = (moviesId) => {
        const m = movies?.find(x => x.id === moviesId);
        return m ? m.name : "Unknown Movie";
    };

    const getUserName = (userId) => {
        const u = users?.find(x => x.id === userId);
        return u ? (u.displayName || u.name || u.email || "Unknown User") : "Unknown User";
    };

    return (
        <div className="p-5">
            <DeleteBar count={selectedIds.length} onDelete={() => setOpenBulk(true)} />
            <div className="table-wrapper">
                <div className="table-container">
                    <table className="w-full text-left whitespace-nowrap border-collapse">
                        <thead className="table-header border-b border-white/20">
                            <tr>
                                <th style={{ width: "40px", padding: "10px 12px" }}>
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                                        onChange={handleSelectAll}
                                        style={{ accentColor: "#22d3ee", width: "15px", height: "15px", cursor: "pointer" }}
                                    />
                                </th>
                                <th >TRANSACTION</th>
                                <th >USER</th>
                                <th >MOVIE</th>
                                <th >PRICE</th>
                                <th >STATUS</th>
                                <th >DATE</th>
                                <th className="text-right">ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentData.map((row, index) => {
                                const isSelected = selectedIds.includes(row.id);
                                return (
                                <tr key={row.id || index} className="table-row" style={isSelected ? { background: "rgba(34,211,238,0.07)" } : {}}>
                                    <td className="table-cell" style={{ width: "40px" }}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleSelectRow(row.id)}
                                            style={{ accentColor: "#22d3ee", width: "15px", height: "15px", cursor: "pointer" }}
                                        />
                                    </td>
                                    <td className="table-cell font-bold text-amber-400">
                                        {row.transactionID}
                                    </td>
                                    <td className="table-cell font-bold text-cyan-400">
                                        {getUserName(row.userId)}
                                    </td>
                                    <td className="table-cell font-bold text-fuchsia-400">
                                        {getMovieName(row.moviesId)}
                                    </td>
                                    <td className="table-cell font-bold text-emerald-400">
                                        ${row.price}
                                    </td>
                                    <td className="table-cell">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${row.status === "success" ? "bg-emerald-500/20 text-emerald-400" : row.status === "pending" ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"}`}>
                                            {row.status?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="table-cell text-gray-400 text-xs">
                                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString("vi-VN") : ""}
                                    </td>
                                    <td className="table-cell text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(row)}
                                                className="action-btn btn-edit"
                                            >
                                                <CiEdit />
                                            </button>

                                            <button
                                                onClick={() => handleClickOpenDele(row)}
                                                className="action-btn btn-delete"
                                            >
                                                <RiDeleteBin6Fill />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    <div className="table-footer">
                        <PaginationAdmin
                            page={page}
                            setPage={setPage}
                            rowsPerPage={rowsPerPage}
                            setRowsPerPage={setRowsPerPage}
                            totalItems={dataSearch?.length || 0}
                        />
                    </div>
                </div>
            </div>
            <ModalDelete
                handleClose={handleClose}
                open={open}
                handleDeleted={handleDeleted}
                titleDelete={"DELETE RENT MOVIE"}
                contentDelete={`Are you sure you want to delete this rent movie record?`}
            />
            <ModalDelete
                handleClose={() => setOpenBulk(false)}
                open={openBulk}
                handleDeleted={handleBulkDeleted}
                titleDelete={"DELETE SELECTED"}
                contentDelete={`Are you sure you want to delete ${selectedIds.length} selected record${selectedIds.length > 1 ? "s" : ""}?`}
            />
        </div>
    );
}

export default TableRentMovies;
