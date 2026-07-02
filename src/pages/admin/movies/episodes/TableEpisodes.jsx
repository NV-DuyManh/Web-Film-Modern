import React, { useContext, useEffect, useMemo, useState } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.css";
import { EpisodeContext } from '../../../../contexts/EpisodeProvider';
import { MovieContext } from '../../../../contexts/MovieProvider';
import { getObjectById } from '../../../../services/firebaseReponse';
import DeleteBar, { useSelectRows } from '../../../../components/admin/DeleteBar';
import { searchTV } from '../../../../components/admin/search/SearchTV';


function TableEpisodes({ handleClickOpen, setEpisode, episode, search }) {
    const episodes = useContext(EpisodeContext);
    const movies = useContext(MovieContext);
    const [open, setOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const start = (page - 1) * rowsPerPage;

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

    const dataSearch = useMemo(() => {
        const keyword = search.toLowerCase();

        return episodes
            .filter(e => {
                const matchedMovie = getObjectById(movies, e.movieID);
                const movieNameMatch = matchedMovie ? matchedMovie.name.toLowerCase().includes(keyword) : false;
                const episodeMatch = e.numberEpisode.toString().includes(keyword);
                return movieNameMatch || episodeMatch;
            })
            .sort((a, b) => b.createdAt?.localeCompare(a.createdAt));
    }, [search, episodes, movies]);

    const currentData = dataSearch?.slice(start, start + rowsPerPage) || [];

    useEffect(() => { setPage(1); }, [search]);

    const { selectedIds, openBulk, setOpenBulk, isAllSelected, isIndeterminate, handleSelectAll, handleSelectRow, clearSelected } = useSelectRows(currentData, search);

    const handleClickOpenDele = (row) => {
        setOpen(true);
        setEpisode(row);
    };

    const handleClose = () => setOpen(false);

    const handleEdit = (row) => {
        handleClickOpen();
        setEpisode(row);
    };

    const handleDeleted = async () => {
        await deleteDocument("Episodes", episode);
        if (page > 1 && currentData.length === 1) setPage(page - 1);
        handleClose();
    };

    const handleBulkDeleted = async () => {
        await Promise.all(
            selectedIds.map(id => {
                const item = episodes.find(c => c.id === id);
                return item ? deleteDocument("Episodes", item) : Promise.resolve();
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
                                <th className="text-center">MOVIE NAME</th>
                                <th className="text-center">EPISODE</th>
                                <th className="text-center">URL</th>
                                <th className="text-center">CREATED AT</th>
                                <th className="text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((row, index) => {
                                const matchedMovie = getObjectById(movies, row.movieID);
                                const isSelected = selectedIds.includes(row.id);
                                
                                return (
                                    <tr key={index} className="table-row" style={isSelected ? { background: 'rgba(34,211,238,0.07)' } : {}}>
                                        <td className="table-cell" style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectRow(row.id)}
                                                style={{ accentColor: '#22d3ee', width: '15px', height: '15px', cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td className="table-cell">{start + index + 1}</td>
                                        <td className="table-cell text-center font-bold text-cyan-400">
                                            {matchedMovie ? matchedMovie.name : "N/A"}
                                        </td>
                                        <td className="table-cell text-center text-pink-400 font-bold">
                                            Tập {row.numberEpisode}
                                        </td>
                                        <td className="table-cell text-center truncate max-w-50" title={row.url}>
                                            <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                                                {row.url}
                                            </a>
                                        </td>
                                        <td className="table-cell text-center text-gray-400 text-sm">
                                            {formatDateTime(row.createdAt)}
                                        </td>
                                        <td className="table-cell text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(row)} className="action-btn btn-edit">
                                                    <CiEdit />
                                                </button>
                                                <button onClick={() => handleClickOpenDele(row)} className="action-btn btn-delete">
                                                    <RiDeleteBin6Fill />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
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
                titleDelete={"DELETE EPISODE"}
                contentDelete={`Are you sure you want to delete Episode ${episode?.numberEpisode}?`}
            />
            
            <ModalDelete
                handleClose={() => setOpenBulk(false)}
                open={openBulk}
                handleDeleted={handleBulkDeleted}
                titleDelete={"DELETE SELECTED"}
                contentDelete={`Are you sure you want to delete ${selectedIds.length} selected episode${selectedIds.length > 1 ? 's' : ''}?`}
            />
        </div>
    );
}

export default TableEpisodes;