import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useComments, useMovies, useSubscriptions } from '../../../../hooks/useCollections';
import { PlanContext } from '../../../../contexts/PlanProvider';
import PlanBadge from '../../../../components/PlanBadge';
import { getUserPlanInfo } from '../../../../utils/appUtils';
import { resolveCommentMember } from '../../../../utils/membership';
import { commentTime, commentLikes } from '../../../../utils/commentThreads';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.scss";
import { UserContext } from '../../../../contexts/UserProvider';
import DeleteBar, { useSelectRows } from '../../../../components/admin/DeleteBar';
import { searchTV } from '../../../../components/admin/search/SearchTV';


function TableComments({ handleClickOpen, setComment, comment, search }) {
    const comments = useComments();
    const movies = useMovies();
    const users = useContext(UserContext);
    const plans = useContext(PlanContext) || [];
    const subscriptions = useSubscriptions() || [];
    const [open, setOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const start = (page - 1) * rowsPerPage;

    const dataSearch = useMemo(() => {
        return comments
            ?.filter(e => searchTV(e?.description).includes(searchTV(search)))
            ?.sort((a, b) => {
                return commentTime(b) - commentTime(a);
            });
    }, [search, comments]);

    const currentData = dataSearch?.slice(start, start + rowsPerPage) || [];

    useEffect(() => {
        setPage(1);
    }, [search]);

    const { selectedIds, openBulk, setOpenBulk, isAllSelected, isIndeterminate, handleSelectAll, handleSelectRow, clearSelected } = useSelectRows(currentData, search);

    const handleClickOpenDele = (row) => {
        setOpen(true);
        setComment(row);
    };

    const handleClose = () => setOpen(false);

    const handleEdit = (row) => {
        handleClickOpen();
        setComment(row);
    };

    const handleDeleted = async () => {
        await deleteDocument("Comments", comment);

        if (page > 1 && currentData.length === 1) {
            setPage(page - 1);
        }

        handleClose();
    };

    const handleBulkDeleted = async () => {
        await Promise.all(
            selectedIds.map(id => {
                const item = comments.find(c => c.id === id);
                return item ? deleteDocument("Comments", item) : Promise.resolve();
            })
        );
        const remaining = currentData.filter(row => !selectedIds.includes(row.id)).length;
        if (page > 1 && remaining === 0) setPage(page - 1);
        clearSelected();
        setOpenBulk(false);
    };

    const getMovieName = (movieID) => {
        const m = movies?.find(x => x.id === movieID);
        return m ? m.name : "Unknown Movie";
    };

    const getUserName = (row) => {
        const u = users?.find(x => x.id === row.userID);
        return u?.name || u?.fullName || row.author?.name || "Unknown User";
    };

    return (
        <div className="p-5">
            <DeleteBar count={selectedIds.length} onDelete={() => setOpenBulk(true)} />
            <div className="table-wrapper">
                <div className="table-container">
                    <table className="w-full text-left whitespace-nowrap border-collapse">
                        <thead className="table-header border-b border-white/20">
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
                                <th className="text-center">ID</th>
                                <th className="text-center">USER</th>
                                <th className="text-center">MOVIE</th>
                                <th className="text-center">DESCRIPTION</th>
                                <th className="text-center">LIKES</th>
                                <th className="text-center">DATE</th>
                                <th className="w-[10%] text-center">ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentData.map((row, index) => {
                                const isSelected = selectedIds.includes(row.id);
                                return (
                                <tr key={row.id || index} className="table-row" style={isSelected ? { background: 'rgba(34,211,238,0.07)' } : {}}>
                                    <td className="table-cell text-center" style={{ width: '40px' }}>
                                        <div className="flex justify-center">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectRow(row.id)}
                                                style={{ accentColor: '#22d3ee', width: '15px', height: '15px', cursor: 'pointer' }}
                                            />
                                        </div>
                                    </td>
                                    <td className="table-cell text-center">
                                        {start + index + 1}
                                    </td>
                                    <td className="table-cell text-center font-bold text-cyan-400">
                                        {getUserName(row)}
                                        <div className="mt-1"><PlanBadge plan={(() => {
                                            const user = users?.find(item => item.id === row.userID);
                                            return user ? getUserPlanInfo(user, subscriptions, plans) : resolveCommentMember(row).plan;
                                        })()} /></div>
                                    </td>
                                    <td className="table-cell text-center font-bold text-fuchsia-400">
                                        {getMovieName(row.movieID)}
                                    </td>
                                    <td className="table-cell text-center truncate max-w-62.5" title={row.description}>
                                        {row.parentID && <span className="block text-[10px] text-cyan-400 mb-1">Reply</span>}
                                        {row.description}
                                    </td>
                                    <td className="table-cell text-center text-cyan-300 tabular-nums">{commentLikes(row).length}</td>
                                    <td className="table-cell text-center text-gray-400 text-xs">
                                        {commentTime(row) ? new Date(commentTime(row)).toLocaleDateString('vi-VN') : ""}
                                    </td>
                                    <td className="table-cell text-center">
                                        <div className="flex justify-center! gap-2">
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
                titleDelete={"DELETE COMMENT"}
                contentDelete={`Are you sure you want to delete this comment?`}
            />
            <ModalDelete
                handleClose={() => setOpenBulk(false)}
                open={openBulk}
                handleDeleted={handleBulkDeleted}
                titleDelete={"DELETE SELECTED"}
                contentDelete={`Are you sure you want to delete ${selectedIds.length} selected comment${selectedIds.length > 1 ? 's' : ''}?`}
            />
        </div>
    );
}

export default TableComments;

