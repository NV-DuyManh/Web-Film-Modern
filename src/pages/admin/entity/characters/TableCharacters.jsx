import React, { useContext, useState, useEffect, useMemo } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.css";
import { CharacterContext } from '../../../../contexts/CharacterProvider';

const getSexStyle = (sex) => {
    switch (sex) {
        case "Male": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        case "Female": return "bg-pink-500/20 text-pink-400 border-pink-500/30";
        default: return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    }
};

function TableCharacters({ handleClickOpen, setCharacter, character, search }) {
    const characters = useContext(CharacterContext);
    const [open, setOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const start = (page - 1) * rowsPerPage;

    const dataSearch = useMemo(() => {
        return characters?.filter(e => e?.name?.toLowerCase().includes(search.toLowerCase()));
    }, [search, characters]);

    const currentData = dataSearch?.slice(start, start + rowsPerPage) || [];

    useEffect(() => {
        setPage(1);
    }, [search]);

    const handleClickOpenDele = (row) => {
        setOpen(true);
        setCharacter(row);
    };

    const handleClose = () => setOpen(false);

    const handleEdit = (row) => {
        handleClickOpen();
        setCharacter(row);
    };

    const handleDeleted = async () => {
        await deleteDocument("Characters", character);

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
                                <th className='text-center'>IMAGE</th>
                                <th className='text-center'>NAME</th>
                                <th className='text-center'>DESCRIPTION</th>
                                <th className='text-center'>SEX</th>
                                <th className='text-center'>COUNTRY</th>
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
                                            {row.imgUrl && (
                                                <img
                                                    src={row.imgUrl}
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
                                        {row.description}
                                    </td>

                                    <td className="table-cell text-center">
                                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getSexStyle(row.sexID)}`}>
                                            {row.sexID || "N/A"}
                                        </span>
                                    </td>

                                    <td className="table-cell text-center">
                                        {row.countriesID}
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
                titleDelete={"DELETE CHARACTER"}
                contentDelete={`Are you sure you want to delete the character "${character?.name}"?`}
            />
        </div>
    );
}

export default TableCharacters;