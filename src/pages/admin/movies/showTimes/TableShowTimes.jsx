import React, { useContext, useEffect, useMemo, useState } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.css";
import { ShowTimeContext } from '../../../../contexts/ShowTimeProvider';
import { MovieContext } from '../../../../contexts/MovieProvider';
import DeleteBar, { useSelectRows } from '../../../../components/admin/DeleteBar';

function TableShowTimes({ handleClickOpen, setShowTime, showTime, search }) {
    const showTimes = useContext(ShowTimeContext);
    const movies = useContext(MovieContext);
    const [open, setOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const start = (page - 1) * rowsPerPage;

    const getMovieName = (movieId) => {
        return movies?.find(e => e.id === movieId)?.name || "N/A";
    }

    const formatDateTime = (value) => {
        if (!value) return "N/A";

        let date;

        if (value?.toDate) {
            date = value.toDate();
        } else if (value?.seconds) {
            date = new Date(value.seconds * 1000);
        } else {
            date = new Date(value);
        }

        if (isNaN(date.getTime())) return value;

        return date.toLocaleString("vi-VN");
    };

    const getDateValue = (value) => {
        if (!value) return 0;

        if (value?.toDate) {
            return value.toDate().getTime();
        }

        if (value?.seconds) {
            return value.seconds * 1000;
        }

        const date = new Date(value);
        return isNaN(date.getTime()) ? 0 : date.getTime();
    };

    const dataSearch = useMemo(() => {
        const keyword = search.toLowerCase();

        return showTimes
            ?.filter(e =>
                getMovieName(e?.movieId)?.toLowerCase().includes(keyword) ||
                e?.roomName?.toLowerCase().includes(keyword) ||
                formatDateTime(e?.time)?.toLowerCase().includes(keyword)
            )
            ?.sort((a, b) => getDateValue(a.time) - getDateValue(b.time));
    }, [search, showTimes, movies]);

    const currentData = dataSearch?.slice(start, start + rowsPerPage) || [];

    useEffect(() => {
        setPage(1);
    }, [search]);

    const { selectedIds, openBulk, setOpenBulk, isAllSelected, isIndeterminate, handleSelectAll, handleSelectRow, clearSelected } = useSelectRows(currentData, search);

    const handleClickOpenDele = (row) => {
        setOpen(true);
        setShowTime(row);
    };

    const handleClose = () => setOpen(false);

    const handleEdit = (row) => {
        handleClickOpen();
        setShowTime(row);
    };

    const handleDeleted = async () => {
        await deleteDocument("ShowTimes", showTime);

        if (page > 1 && currentData.length === 1) {
            setPage(page - 1);
        }

        handleClose();
    };

    const handleBulkDeleted = async () => {
        await Promise.all(
            selectedIds.map(id => {
                const item = showTimes.find(c => c.id === id);
                return item ? deleteDocument("ShowTimes", item) : Promise.resolve();
            })
        );
        const remaining = currentData.filter(row => !selectedIds.includes(row.id)).length;
        if (page > 1 && remaining === 0) setPage(page - 1);
        clearSelected();
        setOpenBulk(false);
    };

    return (
        <div className="p-5">
            <DeleteBar count={selectedIds.length} onDelete={() => setOpenBulk(true)} />
            <div className="table-wrapper">
                <div className="table-container">
                    <table className="w-full text-left">
                        <thead className="table-header">
                            <tr>
                                <th style={{ width: '40px', padding: '10px 12px' }}>
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                                        onChange={handleSelectAll}
                                        style={{ accentColor: '#22d3ee', width: '15px', height: '15px', cursor: 'pointer' }}
                                    />
                                </th>
                                <th>ID</th>
                                <th className="text-center">MOVIE</th>
                                <th className="text-center">TIME</th>
                                <th className="text-center">ROOM</th>
                                <th className="text-right">ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentData.map((row, index) => {
                                const isSelected = selectedIds.includes(row.id);
                                return (
                                <tr key={row.id || index} className="table-row" style={isSelected ? { background: 'rgba(34,211,238,0.07)' } : {}}>
                                    <td className="table-cell" style={{ width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleSelectRow(row.id)}
                                            style={{ accentColor: '#22d3ee', width: '15px', height: '15px', cursor: 'pointer' }}
                                        />
                                    </td>
                                    <td className="table-cell">
                                        {start + index + 1}
                                    </td>

                                    <td className="table-cell text-center font-bold text-cyan-400">
                                        {getMovieName(row.movieId)}
                                    </td>

                                    <td className="table-cell text-center">
                                        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-500/30">
                                            {formatDateTime(row.time)}
                                        </span>
                                    </td>

                                    <td className="table-cell text-center text-green-400 font-bold">
                                        {row.roomName}
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
                titleDelete={"DELETE SHOWTIME"}
                contentDelete={`Are you sure you want to delete the showtime of "${getMovieName(showTime?.movieId)}"?`}
            />
            
            <ModalDelete
                handleClose={() => setOpenBulk(false)}
                open={openBulk}
                handleDeleted={handleBulkDeleted}
                titleDelete={"DELETE SELECTED"}
                contentDelete={`Are you sure you want to delete ${selectedIds.length} selected showtime${selectedIds.length > 1 ? 's' : ''}?`}
            />
        </div>
    );
}

export default TableShowTimes;