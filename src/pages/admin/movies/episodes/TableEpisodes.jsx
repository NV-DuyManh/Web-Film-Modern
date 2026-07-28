import React, { useContext, useEffect, useMemo, useState } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.scss";
import { EpisodeContext } from '../../../../contexts/EpisodeProvider';
import DeleteBar, { useSelectRows } from '../../../../components/admin/DeleteBar';

function TableEpisodes({ handleClickOpen, setEpisode, episode, search, selectedMovie }) {
    const episodes = useContext(EpisodeContext) || [];
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
        if (!selectedMovie) return [];
        
        const keyword = search.toLowerCase();

        return episodes
            .filter(e => e.movieID === selectedMovie.id)
            .filter(e => {
                if (!keyword) return true;
                
                const keywordLower = keyword.trim().toLowerCase();
                const epString = e.numberEpisode.toString();
                
                // Allow matching natural language searches
                const fullStrings = [
                    epString,
                    `tập ${epString}`,
                    `tap ${epString}`,
                    `tập${epString}`,
                    `tap${epString}`,
                    `episode ${epString}`,
                    `ep ${epString}`,
                    `episode${epString}`,
                    `ep${epString}`
                ];
                
                const matchEp = fullStrings.some(str => str.startsWith(keywordLower));
                
                // If keyword is a short number (e.g. "22"), it's an episode search. Don't match against URLs
                // because URLs have dates (20240301) and random hashes (22x...) that cause false positives.
                const isShortNumber = /^\d+$/.test(keywordLower) && keywordLower.length < 5;
                const matchUrl = !isShortNumber && e.url && e.url.toLowerCase().includes(keywordLower);
                
                return matchEp || matchUrl;
            })
            .sort((a, b) => {
                return Number(a.numberEpisode) - Number(b.numberEpisode);
            });
    }, [search, episodes, selectedMovie]);

    const currentData = dataSearch?.slice(start, start + rowsPerPage) || [];

    useEffect(() => { setPage(1); }, [search, selectedMovie]);

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
        <div className="p-5 relative">
            <DeleteBar count={selectedIds.length} onDelete={() => setOpenBulk(true)} />

            <div className="table-wrapper">
                <div className="table-container overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="table-header">
                            <tr>
                                <th style={{ width: '40px', padding: '12px' }}>
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                                        onChange={handleSelectAll}
                                        style={{ accentColor: '#22d3ee', width: '15px', height: '15px', cursor: 'pointer' }}
                                    />
                                </th>
                                <th className="w-[12%] text-center">EPISODE</th>
                                <th className="w-[50%] text-center">URL</th>
                                <th className="w-[15%] text-center">UPDATED</th>
                                <th className="w-[15%] text-center">CREATED</th>
                                <th className="w-[8%] text-center">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((row) => {
                                const isSelected = selectedIds.includes(row.id);

                                return (
                                    <React.Fragment key={row.id}>
                                        <tr className="table-row hover:bg-white/5 transition-colors duration-200 border-b border-white/5" style={isSelected ? { background: 'rgba(34,211,238,0.1)' } : {}}>
                                            <td className="table-cell" style={{ width: '40px', padding: '12px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectRow(row.id)}
                                                    style={{ accentColor: '#22d3ee', width: '15px', height: '15px', cursor: 'pointer' }}
                                                />
                                            </td>
                                            <td className="table-cell text-center font-black text-cyan-400 text-lg">
                                                Episode {row.numberEpisode}
                                            </td>
                                            <td className="table-cell text-center">
                                                <a href={row.url} target="_blank" rel="noopener noreferrer" 
                                                   className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors block truncate max-w-[200px] sm:max-w-[350px] md:max-w-[500px] mx-auto"
                                                   title={row.url}>
                                                    {row.url}
                                                </a>
                                            </td>
                                            <td className="table-cell text-center text-slate-300 text-sm">
                                                {formatDateTime(row.createdAt)}
                                            </td>
                                            <td className="table-cell text-center text-slate-500 text-xs">
                                                {formatDateTime(row.createdAt)}
                                            </td>
                                            <td className="table-cell text-center">
                                                <div className="flex justify-center! gap-2">
                                                    <button onClick={() => handleEdit(row)} className="action-btn btn-edit">
                                                        <CiEdit />
                                                    </button>
                                                    <button onClick={() => handleClickOpenDele(row)} className="action-btn btn-delete">
                                                        <RiDeleteBin6Fill />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </React.Fragment>
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
                open={open}
                handleClose={handleClose}
                handleDeleted={handleDeleted}
            />

            <ModalDelete 
                open={openBulk}
                handleClose={() => setOpenBulk(false)}
                handleDeleted={handleBulkDeleted}
            />
        </div>
    );
}

export default TableEpisodes;

