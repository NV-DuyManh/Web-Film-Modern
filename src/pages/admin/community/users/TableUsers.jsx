// src/pages/admin/community/users/TableUsers.jsx
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.css";
import { UserContext } from '../../../../contexts/UserProvider';

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

    return (
        <div className="p-5">
            <div className="table-wrapper">
                <div className="table-container">
                    <table className="w-full text-left">
                        <thead className="table-header">
                            <tr>
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
                            {currentData.map((row, index) => (
                                <tr key={row.id || index} className="table-row">
                                    <td className="table-cell">
                                        {start + index + 1}
                                    </td>
                                    <td className="table-cell">
                                        <div className="flex justify-center items-center">
                                            {row.avatarUrl && (
                                                <img
                                                    src={row.avatarUrl}
                                                    alt={row.name}
                                                    className="w-17 h-17 object-cover rounded-full"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="table-cell text-center">
                                        {row.name}
                                    </td>
                                    <td className="table-cell text-center">
                                        {row.email}
                                    </td>
                                    <td className="table-cell text-center">
                                        {row.phone}
                                    </td>
                                    <td className="table-cell text-center">
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
                            ))}
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
        </div>
    );
}

export default TableUsers;