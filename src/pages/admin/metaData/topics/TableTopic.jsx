import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useTopics } from '../../../../hooks/useCollections';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import DeleteBar, { useSelectRows } from '../../../../components/admin/DeleteBar';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.scss";
import "../../../../App.scss";

function TableTopic({ search, onEdit }) {
    const topics = useTopics() || [];
    const [open, setOpen] = useState(false);
    const [topicToDelete, setTopicToDelete] = useState(null);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const start = (page - 1) * rowsPerPage;

    const dataSearch = useMemo(() => {
        if (!search) return topics;
        const lowerSearch = search.toLowerCase();
        return topics.filter(topic =>
            (topic.title || topic.name)?.toLowerCase().includes(lowerSearch) ||
            topic.description?.toLowerCase().includes(lowerSearch)
        );
    }, [search, topics]);
    
    const currentData = dataSearch?.slice(start, start + rowsPerPage) || [];

    useEffect(() => { setPage(1); }, [search]);

    const { selectedIds, openBulk, setOpenBulk, isAllSelected, isIndeterminate, handleSelectAll, handleSelectRow, clearSelected } = useSelectRows(currentData, search);

    const handleClickOpenDele = (row) => {
        setOpen(true);
        setTopicToDelete(row);
    };

    const handleClose = () => setOpen(false);

    const handleDeleted = async () => {
        await deleteDocument("Topics", topicToDelete);
        if (page > 1 && currentData.length === 1) setPage(page - 1);
        handleClose();
    };

    const handleBulkDeleted = async () => {
        await Promise.all(
            selectedIds.map(id => {
                const item = topics.find(c => c.id === id);
                return item ? deleteDocument("Topics", item) : Promise.resolve();
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

                                <th className="text-center px-4 w-48">TITLE</th>
                                <th className="text-center px-4">DESCRIPTION</th>
                                <th className="text-center px-4">MOVIES</th>
                                <th className="w-[10%] text-center">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((row, index) => {
                                const isSelected = selectedIds.includes(row.id);

                                return (
                                    <tr
                                        key={row.id}
                                        className="table-row"
                                        style={isSelected ? { background: 'rgba(34,211,238,0.07)' } : {}}
                                    >
                                        <td className="table-cell" style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectRow(row.id)}
                                                style={{ accentColor: '#22d3ee', width: '15px', height: '15px', cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td className="table-cell text-center">{start + index + 1}</td>

                                        <td className="table-cell text-center whitespace-nowrap px-4">{row.title || row.name}</td>
                                        <td className="table-cell text-center px-4">{row.description}</td>
                                        <td className="table-cell text-center px-4">
                                            {row.isSmart ? 'Auto' : (row.movieID?.length || 0)}
                                        </td>
                                        <td className="table-cell text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => onEdit(row)} className="action-btn btn-edit">
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
                titleDelete={"DELETE TOPIC"}
                contentDelete={"Are you sure you want to delete this topic?"}
            />

            <ModalDelete
                handleClose={() => setOpenBulk(false)}
                open={openBulk}
                handleDeleted={handleBulkDeleted}
                titleDelete={"DELETE SELECTED"}
                contentDelete={`Are you sure you want to delete ${selectedIds.length} selected topic${selectedIds.length > 1 ? 's' : ''}?`}
            />
        </div>
    );
}

export default TableTopic;
