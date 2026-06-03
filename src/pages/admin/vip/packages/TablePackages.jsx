import React, { useContext, useState, useEffect, useMemo } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.css";
import { PackageContext } from '../../../../contexts/PackageProvider';
import { PlanContext } from '../../../../contexts/PlanProvider';

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

    useEffect(() => {
        setPage(1);
    }, [search]);

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
                                <th className="text-center">PLAN</th>
                                <th className="text-center">DISCOUNT</th>
                                <th className="text-center">TIME</th>
                                <th className="text-right">ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentData.map((row, index) => (
                                <tr key={row.id || index} className="table-row">
                                    <td className="table-cell">
                                        {start + index + 1}
                                    </td>
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
                titleDelete={"DELETE PACKAGE"}
                contentDelete={"Are you sure you want to delete this package?"}
            />
        </div>
    );
}

export default TablePackages;