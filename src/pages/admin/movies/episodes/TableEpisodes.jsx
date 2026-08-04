import React, { useEffect, useMemo, useState } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.scss";
import DeleteBar, { useSelectRows } from '../../../../components/admin/DeleteBar';

function TableEpisodes({ handleClickOpen, setEpisode, episode, search, selectedMovie, episodes }) {
    const [open, setOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const start = (page - 1) * rowsPerPage;

    useEffect(() => { setPage(1); }, [search, selectedMovie]);

    const dataSearch = useMemo(() => {
        if (!episodes || episodes.length === 0) return [];

        return episodes
            .filter(ep => {
                if (!search) return true;
                const keyword = search.toLowerCase();
                return (
                    String(ep.numberEpisode).toLowerCase().includes(keyword) ||
                    ep.url?.toLowerCase().includes(keyword)
                );
            })
            .sort((a, b) => Number(a.numberEpisode) - Number(b.numberEpisode));
    }, [episodes, search]);

    const currentData = dataSearch.slice(start, start + rowsPerPage);

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
                                <th className="w-[80%] text-center">URL</th>
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
                                            <td className="table-cell text-center px-4 max-w-[200px] md:max-w-[400px] lg:max-w-[600px]">
                                                <a href={row.url} target="_blank" rel="noopener noreferrer"
                                                    className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors block truncate w-full"
                                                    title={row.url}>
                                                    {row.url}
                                                </a>
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
                            totalItems={dataSearch.length || 0}
                        />
                    </div>
                </div>
            </div>

            <ModalDelete
                open={open}
                handleClose={handleClose}
                handleDeleted={handleDeleted}
                titleDelete={"DELETE EPISODE"}
                contentDelete={`Are you sure you want to delete episode ${episode?.numberEpisode}?`}
            />

            <ModalDelete
                open={openBulk}
                handleClose={() => setOpenBulk(false)}
                handleDeleted={handleBulkDeleted}
                titleDelete={"DELETE SELECTED"}
                contentDelete={`Are you sure you want to delete ${selectedIds.length} selected episode${selectedIds.length > 1 ? 's' : ''}?`}
            />
        </div>
    );
}

export default TableEpisodes;
