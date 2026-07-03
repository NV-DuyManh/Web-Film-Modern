import React, { useContext, useEffect, useMemo, useState } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.scss";
import { UserContext } from '../../../../contexts/UserProvider';
import DeleteBar, { useSelectRows } from '../../../../components/admin/DeleteBar';
import { searchTV } from '../../../../components/admin/search/SearchTV';


function TableUsers({ handleClickOpen, setUser, user, search }) {
    const users = useContext(UserContext);
    const [open, setOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const start = (page - 1) * rowsPerPage;

    const dataSearch = useMemo(() => {
        const keyword = search.toLowerCase();
        return users?.filter(e => 
            e?.displayName?.toLowerCase().includes(keyword) || 
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
        setUser({
            ...row,
            displayName: row.displayName || row.name || "", 
            email: row.email || "", 
            password: row.password || "", 
            phone: row.phone || "", 
            imgUrl: row.imgUrl || row.avatarUrl || "", 
            sexId: row.sexId || "", 
            role: row.role || 'user'
        });
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
                                <th className='text-center'>ROLE</th>
                                <th className='text-center'>PASSWORD</th>
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
                                            {(row.imgUrl || row.avatarUrl) && (
                                                <img
                                                    src={row.imgUrl || row.avatarUrl}
                                                    alt={row.displayName || row.name}
                                                    className="w-17 h-17 object-cover rounded-full shadow-md"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="table-cell text-center font-bold text-white">
                                        {row.displayName || row.name}
                                    </td>
                                    <td className="table-cell text-center text-cyan-400">
                                        {row.email}
                                    </td>
                                    <td className="table-cell text-center">
                                        {row.phone}
                                    </td>
                                    <td className="table-cell text-center">
                                        {row.sexId && (
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                                                row.sexId === 'Male' 
                                                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-[0_0_8px_rgba(14,165,233,0.2)]' 
                                                    : row.sexId === 'Female' 
                                                        ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30 shadow-[0_0_8px_rgba(236,72,153,0.2)]' 
                                                        : 'bg-violet-500/15 text-violet-400 border border-violet-500/30 shadow-[0_0_8px_rgba(139,92,246,0.2)]'
                                            }`}>
                                                {row.sexId}
                                            </span>
                                        )}
                                    </td>
                                    <td className="table-cell text-center">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                                            row.role === 'admin' 
                                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.25)]' 
                                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                                        }`}>
                                            {row.role === 'admin' ? '👑 Admin' : '👤 Client'}
                                        </span>
                                    </td>
                                    <td className="table-cell text-center text-gray-400 font-bold text-sm">
                                        {row.password}
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
