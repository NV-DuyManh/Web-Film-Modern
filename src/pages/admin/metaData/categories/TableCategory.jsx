import React, { useContext, useEffect, useMemo, useState } from 'react';
import { CategoriesContext } from '../../../../contexts/CategoryProvider';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import DeleteBar, { useSelectRows } from '../../../../components/admin/DeleteBar';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.scss";
import { searchTV } from '../../../../components/admin/search/SearchTV';


function TableCategory({ handleClickOpen, setCategory, category, search }) {
    const categories = useContext(CategoriesContext);
    const [open, setOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const start = (page - 1) * rowsPerPage;

    const dataSearch = useMemo(() => categories.filter(e => searchTV(e.name).includes(searchTV(search))), [search, categories]);
    const currentData = dataSearch?.slice(start, start + rowsPerPage) || [];

    useEffect(() => { setPage(1); }, [search]);

    const { selectedIds, openBulk, setOpenBulk, isAllSelected, isIndeterminate, handleSelectAll, handleSelectRow, clearSelected } = useSelectRows(currentData, search);

    const handleClickOpenDele = (row) => {
        setOpen(true);
        setCategory(row);
    };

    const handleClose = () => setOpen(false);

    const handleEdit = (row) => {
        handleClickOpen();
        setCategory(row);
    };

    const handleDeleted = async () => {
        await deleteDocument("Categories", category);
        if (page > 1 && currentData.length === 1) setPage(page - 1);
        handleClose();
    };

    const handleBulkDeleted = async () => {
        await Promise.all(
            selectedIds.map(id => {
                const item = categories.find(c => c.id === id);
                return item ? deleteDocument("Categories", item) : Promise.resolve();
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
                                <th className="text-center">NAME</th>
                                <th className="text-center">DESCRIPTION</th>
                                <th className="text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((row, index) => {
                                const isSelected = selectedIds.includes(row.id);
                                return (
                                    <tr
                                        key={index}
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
                                        <td className="table-cell">{start + index + 1}</td>
                                        <td className="table-cell text-center">{row.name}</td>
                                        <td className="table-cell text-center">{row.description}</td>
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
                titleDelete={"DELETE CATEGORY"}
                contentDelete={"Are you sure you want to delete this category?"}
            />

            <ModalDelete
                handleClose={() => setOpenBulk(false)}
                open={openBulk}
                handleDeleted={handleBulkDeleted}
                titleDelete={"DELETE SELECTED"}
                contentDelete={`Are you sure you want to delete ${selectedIds.length} selected categor${selectedIds.length > 1 ? 'ies' : 'y'}?`}
            />
        </div>
    );
}

export default TableCategory;
