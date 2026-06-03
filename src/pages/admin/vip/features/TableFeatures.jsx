import React, { useContext, useState, useEffect, useMemo } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.css";
import { FeatureContext } from '../../../../contexts/FeatureProvider';
import { PlanContext } from '../../../../contexts/PlanProvider';

function TableFeatures({ handleClickOpen, setFeature, feature, search }) {
    const features = useContext(FeatureContext);
    const plans = useContext(PlanContext);
    const [open, setOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const start = (page - 1) * rowsPerPage;

    const getPlanName = (planID) => {
        return plans?.find(e => e.id === planID)?.name || "N/A";
    }

    const dataSearch = useMemo(() => features?.filter(e => e?.description?.toLowerCase().includes(search.toLowerCase())), [search, features]);

    const currentData = dataSearch?.slice(start, start + rowsPerPage) || [];

    useEffect(() => {
        setPage(1);
    }, [search]);

    const handleClickOpenDele = (row) => {
        setOpen(true);
        setFeature(row);
    };

    const handleClose = () => setOpen(false);

    const handleEdit = (row) => {
        handleClickOpen();
        setFeature(row);
    };

    const handleDeleted = async () => {
        await deleteDocument("Features", feature);

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
                                <th className="text-center">DESCRIPTION</th>
                                <th className="text-center">AVAILABLE</th>
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
                                    <td className="table-cell text-center">
                                        {row.description}
                                    </td>
                                    <td className="table-cell  text-center">
                                        <span className={`${row.available ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"} px-2 py-1 rounded text-xs font-bold border`}>
                                            {row.available ? "True" : "False"}
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
                titleDelete={"DELETE FEATURE"}
                contentDelete={"Are you sure you want to delete this feature?"}
            />
        </div>
    );
}

export default TableFeatures;