import React, { useContext, useEffect, useMemo, useState } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.css";
import { UserContext } from '../../../../contexts/UserProvider';
import DeleteBar, { useSelectRows } from '../../../../components/admin/DeleteBar';

function TableUsers({ handleClickOpen, setUser, user, search }) {
    const users = useContext(UserContext);
    const [open, setOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const start = (page - 1) * rowsPerPage;

    const dataSearch = useMemo(() => {
        const keyword = search.toLowerCase();
        return users?.filter(e => 
            e?.name?.toLowerCase().includes(keyword) || 
            e?.email?.toLowerCase().includes(keyword) || 
            e?.phone?.toLowerCase().includes(keyword)
        );
    }, [search, users]);

    const currentData = dataSearch?.slice(start, start + rowsPerPage) || [];

    useEffect(() => {
        setPage(1);
    }, [search]);

    const { selectedIds, openBulk, setOpenBulk, isAllSelected, isIndeterminate, handleSelectAll, handleSelectRow, clearSelected } = useSelectRows(currentData, search);

    const handleClickOpenDele = (row) => {
        setOpen(true);
        setUser(row);
    };

    const handleClose = () => setOpen(false);

    const handleEdit = (row) => {
        handleClickOpen();
        setUser(row);
    };

    const handleDeleted = async () => {
        await deleteDocument("Users", user);

        if (page > 1 && currentData.length === 1) {
            setPage(page - 1);
        }

        handleClose();
    };

    const handleBulkDeleted = async () => {
        await Promise.all(
            selectedIds.map(id => {
                const item = users.find(c => c.id === id);
                return item ? deleteDocument("Users", item) : Promise.resolve();
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
                                <th className='text-center'>AVATAR</th>
                                <th className='text-center'>NAME</th>
                                <th className='text-center'>EMAIL</th>
                                <th className='text-center'>PHONE</th>
                                <th className='text-center'>SEX</th>
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
                                    <td className="table-cell">
                                        <div className="flex justify-center items-center">
                                            {row.avatarUrl && (
                                                <img
                                                    src={row.avatarUrl}
                                                    alt={row.name}
                                                    className="w-17 h-17 object-cover rounded-full shadow-md"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="table-cell text-center font-bold text-white">
                                        {row.name}
                                    </td>
                                    <td className="table-cell text-center text-cyan-400">
                                        {row.email}
                                    </td>
                                    <td className="table-cell text-center">
                                        {row.phone}
                                    </td>
                                    <td className="table-cell text-center text-pink-400">
                                        {row.sexId}
                                    </td>
                                    <td className="table-cell text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(row)}
                                                className="action-btn btn-edit"
                                            >
                                                <CiEdit size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleClickOpenDele(row)}
                                                className="action-btn btn-delete"
                                            >
                                                <RiDeleteBin6Fill size={16} />
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
                titleDelete={"DELETE USER"}
                contentDelete={`Are you sure you want to delete user "${user?.name}"?`}
            />
            
            <ModalDelete
                handleClose={() => setOpenBulk(false)}
                open={openBulk}
                handleDeleted={handleBulkDeleted}
                titleDelete={"DELETE SELECTED"}
                contentDelete={`Are you sure you want to delete ${selectedIds.length} selected user${selectedIds.length > 1 ? 's' : ''}?`}
            />
        </div>
    );
}

export default TableUsers;