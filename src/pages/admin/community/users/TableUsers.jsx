import React, { useContext, useEffect, useMemo, useState } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import { FaEye } from 'react-icons/fa';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.scss";
import { UserContext } from '../../../../contexts/UserProvider';
import DeleteBar, { useSelectRows } from '../../../../components/admin/DeleteBar';
import { searchTV } from '../../../../components/admin/search/SearchTV';
import { SubscriptionContext } from '../../../../contexts/SubscriptionProvider';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { getObjectById } from '../../../../services/firebaseReponse';
import { getOptimizedUrl } from '../../../../utils/cloudinary';


function TableUsers({ handleClickOpen, handleView, setUser, user, search }) {
    const users = useContext(UserContext);
    const subscriptions = useContext(SubscriptionContext) || [];
    const plans = useContext(PlanContext) || [];
    
    const [open, setOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const getExpiryDate = (p) => {
        if (!p || !p.expiryDate) return new Date(0);
        if (typeof p.expiryDate.toDate === 'function') return p.expiryDate.toDate();
        if (p.expiryDate.seconds) return new Date(p.expiryDate.seconds * 1000);
        return new Date(p.expiryDate);
    };

    const getUserPlanInfo = (row) => {
        if (row.role === 'admin' || row.role === 'Admin') return { name: 'ADMIN', level: 99, theme: 'fuchsia' };
        
        const userSubs = subscriptions.filter(p => p.userId === row.id && getExpiryDate(p) > new Date());
        if (userSubs.length === 0) return { name: 'FREE', level: 0, theme: 'blue' };

        const highestSub = userSubs.reduce((max, item) => {
            const currentPlan = getObjectById(plans, item.planID);
            const maxPlan = getObjectById(plans, max.planID);
            return (currentPlan?.level || 0) > (maxPlan?.level || 0) ? item : max;
        }, userSubs[0]);

        const highestPlan = getObjectById(plans, highestSub.planID);
        if (!highestPlan) return { name: 'VIP', level: 1, theme: 'cyan' };
        
        const sortedPlans = [...plans].sort((a, b) => Number(a.level) - Number(b.level));
        const index = sortedPlans.findIndex(p => p.id === highestPlan.id);
        const themeNames = ['blue', 'cyan', 'yellow', 'rose'];
        const theme = themeNames[index] || 'yellow';
        
        return { name: highestPlan.name, level: highestPlan.level, theme: theme };
    };

    const getBadgeStyle = (theme) => {
        switch(theme) {
            case 'blue': return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
            case 'cyan': return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.2)]';
            case 'yellow': return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.25)]';
            case 'rose': return 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.3)]';
            case 'red': return 'bg-red-500/15 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.25)]';
            case 'fuchsia': return 'bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30 shadow-[0_0_10px_rgba(217,70,239,0.25)]';
            default: return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
        }
    };

    const start = (page - 1) * rowsPerPage;

    const dataSearch = useMemo(() => {
        const keyword = search.toLowerCase();
        return users?.filter(e => 
            e?.name?.toLowerCase().includes(keyword) ||
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
            name: row.name || "", 
            email: row.email || "", 
            password: row.password || "", 
            phone: row.phone || "", 
            avatarUrl: row.avatarUrl || "", 
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
                                <th className='text-center'>SEX</th>
                                <th className='text-center'>ROLE</th>
                                <th className='text-center'>PACKAGE</th>
                                <th className="w-[10%] text-center">ACTIONS</th>
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
                                        <div className="flex justify-center items-center py-2">
                                            {row.avatarUrl && (
                                                <div className="group relative w-14 h-14 rounded-full overflow-hidden shadow-md border border-white/10 cursor-pointer">
                                                    <img
                                                        src={getOptimizedUrl(row.avatarUrl)}
                                                        alt={row.name}
                                                        className="w-full h-full object-cover transition-all duration-300"
                                                    />
                                                </div>
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
                                        {row.sexId && (
                                            <p className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${ row.sexId === 'Male' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-[0_0_8px_rgba(14,165,233,0.2)]' : row.sexId === 'Female' ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30 shadow-[0_0_8px_rgba(236,72,153,0.2)]' : 'bg-violet-500/15 text-violet-400 border border-violet-500/30 shadow-[0_0_8px_rgba(139,92,246,0.2)]' }`}>
                                                {row.sexId}
                                            </p>
                                        )}
                                    </td>
                                    <td className="table-cell text-center">
                                        <p className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${ row.role === 'admin' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.25)]' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]' }`}>
                                            {row.role === 'admin' ? '👑 Admin' : '👤 Client'}
                                        </p>
                                    </td>
                                    <td className="table-cell text-center">
                                        {(() => {
                                            const pInfo = getUserPlanInfo(row);
                                            return (
                                                <p className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getBadgeStyle(pInfo.theme)}`}>
                                                    {pInfo.name}
                                                </p>
                                            );
                                        })()}
                                    </td>
                                    <td className="table-cell text-center">
                                        <div className="flex justify-center! gap-2">
                                            <button
                                                onClick={() => handleView && handleView({ ...row, tableIndex: start + index + 1 })}
                                                className="action-btn btn-view"
                                            >
                                                <FaEye size={16} />
                                            </button>
                                            
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



