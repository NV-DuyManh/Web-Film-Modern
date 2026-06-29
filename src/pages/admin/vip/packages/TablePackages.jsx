import React, { useContext, useState, useEffect, useMemo } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.css";
import { PackageContext } from '../../../../contexts/PackageProvider';
import { PlanContext } from '../../../../contexts/PlanProvider';
import DeleteBar, { useSelectRows } from '../../../../components/admin/DeleteBar';

function TablePackages({ handleClickOpen, setPackageItem, packageItem, search }) {
    const packages = useContext(PackageContext);
    const plans = useContext(PlanContext);
    const [open, setOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const start = (page - 1) * rowsPerPage;

    const getPlanName = (planID) => {
        return plans?.find(e => e.id === planID)?.name || "N/A";
    }

    const dataSearch = useMemo(() => packages?.filter(e => getPlanName(e?.planID)?.toLowerCase().includes(search.toLowerCase())), [search, packages, plans]);
    const currentData = dataSearch?.slice(start, start + rowsPerPage) || [];

    useEffect(() => { setPage(1); }, [search]);

    const { selectedIds, openBulk, setOpenBulk, isAllSelected, isIndeterminate, handleSelectAll, handleSelectRow, clearSelected } = useSelectRows(currentData, search);

    const handleClickOpenDele = (row) => {
        setOpen(true);
        setPackageItem(row);
    };

    const handleClose = () => setOpen(false);

    const handleEdit = (row) => {
        handleClickOpen();
        setPackageItem(row);
    };

    const handleDeleted = async () => {
        await deleteDocument("Packages", packageItem);
        if (page > 1 && currentData.length === 1) setPage(page - 1);
        handleClose();
    };

    const handleBulkDeleted = async () => {
        await Promise.all(
            selectedIds.map(id => {
                const item = packages.find(c => c.id === id);
                return item ? deleteDocument("Packages", item) : Promise.resolve();
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
                                <th>ID</th>
                                <th className="text-center">PLAN</th>
                                <th className="text-center">DISCOUNT</th>
                                <th className="text-center">TIME</th>
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
                                    <td className="table-cell">{start + index + 1}</td>
                                    <td className="table-cell text-center font-bold text-cyan-400">
                                        {getPlanName(row.planID)}
                                    </td>
                                    <td className="table-cell text-center text-green-400 font-bold">
                                        {row.discount} %
                                    </td>
                                    <td className="table-cell text-center">
                                        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-500/30">
                                            {row.time === 1 ? "1 Month" : `${row.time} Months`}
                                        </span>
                                    </td>
                                    <td className="table-cell text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(row)} className="action-btn btn-edit"><CiEdit size={16} /></button>
                                            <button onClick={() => handleClickOpenDele(row)} className="action-btn btn-delete"><RiDeleteBin6Fill size={16} /></button>
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
                titleDelete={"DELETE PACKAGE"}
                contentDelete={"Are you sure you want to delete this package?"}
            />
            <ModalDelete
                handleClose={() => setOpenBulk(false)}
                open={openBulk}
                handleDeleted={handleBulkDeleted}
                titleDelete={"DELETE SELECTED"}
                contentDelete={`Are you sure you want to delete ${selectedIds.length} selected package${selectedIds.length > 1 ? 's' : ''}?`}
            />
        </div>
    );
}

export default TablePackages;