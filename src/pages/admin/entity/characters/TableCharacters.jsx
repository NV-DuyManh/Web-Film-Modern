import React, { useContext, useState, useEffect, useMemo } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.css";
import { CharacterContext } from '../../../../contexts/CharacterProvider';
import DeleteBar, { useSelectRows } from '../../../../components/admin/DeleteBar';

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

    const { selectedIds, openBulk, setOpenBulk, isAllSelected, isIndeterminate, handleSelectAll, handleSelectRow, clearSelected } = useSelectRows(currentData, search);

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

    const handleBulkDeleted = async () => {
        await Promise.all(
            selectedIds.map(id => {
                const item = characters.find(c => c.id === id);
                return item ? deleteDocument("Characters", item) : Promise.resolve();
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
                                <th className="text-center">IMAGE</th>
                                <th className="text-center">NAME</th>
                                <th className="text-center">GENDER</th>
                                <th className="text-center">COUNTRY</th>
                                <th className="text-center">DESCRIPTION</th>
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
                                    <td className="flex justify-center items-center py-2">
                                        <div className="group relative w-14 h-14 rounded-full overflow-hidden shadow-md border border-white/10 cursor-pointer">
                                            <img 
                                                src={row.imgUrl} 
                                                alt={row.name} 
                                                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:opacity-80" 
                                            />
                                        </div>
                                    </td>
                                    <td className="table-cell text-center font-bold text-white">
                                        {row.name}
                                    </td>
                                    <td className="table-cell text-center">
                                        <span className={`px-2 py-1 rounded text-[11px] font-bold border ${getSexStyle(row.sexID)}`}>
                                            {row.sexID || "N/A"}
                                        </span>
                                    </td>
                                    <td className="table-cell text-center text-cyan-400 font-bold">
                                        {row.countriesID}
                                    </td>
                                    <td className="table-cell text-center max-w-50 whitespace-normal text-[12px] text-gray-400" title={row.description}>
                                        <div className="line-clamp-3 leading-relaxed text-left">
                                            {row.description || "N/A"}
                                        </div>
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
                titleDelete={"DELETE CHARACTER"}
                contentDelete={`Are you sure you want to delete the character "${character?.name}"?`}
            />

            <ModalDelete
                handleClose={() => setOpenBulk(false)}
                open={openBulk}
                handleDeleted={handleBulkDeleted}
                titleDelete={"DELETE SELECTED"}
                contentDelete={`Are you sure you want to delete ${selectedIds.length} selected character${selectedIds.length > 1 ? 's' : ''}?`}
            />
        </div>
    );
}

export default TableCharacters;