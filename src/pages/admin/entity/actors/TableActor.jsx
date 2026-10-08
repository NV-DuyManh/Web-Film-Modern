import useAdminList from '../../../../hooks/useAdminList';
import AdminCursorFooter from '../../../../components/admin/AdminCursorFooter';
import React, { useState } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import "../../../../App.scss";
import DeleteBar, { useSelectRows } from '../../../../components/admin/DeleteBar';
import LOGO from "../../../../assets/Logo.png";
import { getDefaultAvatar, getSafeEntityAvatar, OTHER_AVATAR } from '../../../../utils/appUtils';


const getSexStyle = (sex) => {
    switch (sex) {
        case "Male": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        case "Female": return "bg-pink-500/20 text-pink-400 border-pink-500/30";
        default: return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    }
};

function TableActor({ handleClickOpen, setActor, actor, search }) {
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const cursor = useAdminList('Actors', search, rowsPerPage);
    const actors = cursor.rows;
    const [open, setOpen] = useState(false);

    const page = cursor.page;
    const currentData = cursor.rows;

    const { selectedIds, openBulk, setOpenBulk, isAllSelected, isIndeterminate, handleSelectAll, handleSelectRow, clearSelected } = useSelectRows(currentData, search);

    const handleClickOpenDele = (row) => {
        setOpen(true);
        setActor(row);
    };

    const handleClose = () => setOpen(false);

    const handleEdit = (row) => {
        handleClickOpen();
        setActor(row);
    };

    const handleDeleted = async () => {
        await deleteDocument("Actors", actor);

        handleClose();
    };

    const handleBulkDeleted = async () => {
        await Promise.all(
            selectedIds.map(id => {
                const item = actors.find(c => c.id === id);
                return item ? deleteDocument("Actors", item) : Promise.resolve();
            })
        );

        clearSelected();
        setOpenBulk(false);
    };

    return (
        <div className="p-5">
            <label className="text-slate-300 text-sm">Số dòng <select className="bg-slate-900 border border-slate-600 rounded p-1 ml-2" value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))}>{[5, 10, 20, 50].map(size => <option key={size}>{size}</option>)}</select></label>
            {cursor.loading && <p role="status" className="text-cyan-300 p-3">Đang tải dữ liệu...</p>}
            {cursor.error && <p role="alert" className="text-red-300 p-3">{cursor.error}</p>}
            {!cursor.loading && !cursor.error && !cursor.rows.length && <p className="text-slate-400 p-3">Chưa có dữ liệu phù hợp.</p>}
            <DeleteBar count={selectedIds.length} onDelete={() => setOpenBulk(true)} />
            <div className="table-wrapper">
                <div className="table-container">
                    <table className="w-full text-left whitespace-nowrap">
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
                                <th>STT</th>
                                <th className="text-center">ẢNH</th>
                                <th className="text-center">TÊN</th>
                                <th className="text-center">GIỚI TÍNH</th>
                                <th className="text-center">QUỐC GIA</th>
                                <th className="text-center">GIỚI THIỆU</th>
                                <th className="w-[10%] text-center">THAO TÁC</th>
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
                                        {(page - 1) * rowsPerPage + index + 1}
                                    </td>
                                    <td className="table-cell">
                                        <div className="flex justify-center items-center py-2">
                                            <div className="group relative w-14 h-14 rounded-full overflow-hidden shadow-md border border-white/10 cursor-pointer">
                                                <img
                                                    src={getSafeEntityAvatar(row.imgUrl, row.sexID)}
                                                    alt={row.name}
                                                    className="w-full h-full object-cover transition-all duration-300"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = getDefaultAvatar(row.sexID); }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="table-cell text-center font-bold text-white">
                                        {row.name}
                                    </td>
                                    <td className="table-cell text-center">
                                        <p className={`px-2 py-1 rounded text-[11px] font-bold border ${getSexStyle(row.sexID)} inline`}>
                                            {row.sexID}
                                        </p>
                                    </td>
                                    <td className="table-cell text-center text-cyan-400 font-bold">
                                        {row.countriesID}
                                    </td>
                                    <td className="table-cell min-w-87.5 max-w-150 whitespace-normal text-[13px] text-gray-300">
                                        <div className="leading-relaxed text-justify px-2 py-2">
                                            {row.description}
                                        </div>
                                    </td>
                                    <td className="table-cell text-center">
                                        <div className="flex justify-center! gap-2">
                                            <button
                                                onClick={() => handleEdit(row)}
                                                title="Chỉnh sửa" aria-label="Chỉnh sửa" className="action-btn btn-edit"
                                            >
                                                <CiEdit size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleClickOpenDele(row)}
                                                title="Chuyển vào thùng rác" aria-label="Chuyển vào thùng rác" className="action-btn btn-delete"
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
                        <AdminCursorFooter {...cursor} />
                    </div>
                </div>
            </div>
            <ModalDelete
                handleClose={handleClose}
                open={open}
                handleDeleted={handleDeleted}
                titleDelete={"CHUYỂN VÀO THÙNG RÁC"}
                contentDelete={`Chuyển mục đã chọn vào thùng rác? Bạn có thể khôi phục trong mục Vận hành.`}
            />
            <ModalDelete
                handleClose={() => setOpenBulk(false)}
                open={openBulk}
                handleDeleted={handleBulkDeleted}
                titleDelete={"CHUYỂN CÁC MỤC ĐÃ CHỌN VÀO THÙNG RÁC"}
                contentDelete={`Chuyển mục đã chọn vào thùng rác? Bạn có thể khôi phục trong mục Vận hành.`}
            />
        </div>
    );
}

export default TableActor;



