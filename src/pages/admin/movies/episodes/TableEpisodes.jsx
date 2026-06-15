import React, { useContext, useEffect, useMemo, useState } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ModalDelete from '../../../../components/admin/ModalDelete';
import { deleteDocument } from '../../../../services/firebaseService';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import "../../../../App.css";
import { EpisodeContext } from '../../../../contexts/EpisodeProvider';

function TableEpisodes({ handleClickOpen, setEpisode, episode, search }) {
    const episodes = useContext(EpisodeContext);
    const [open, setOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const start = (page - 1) * rowsPerPage;

    const formatDateTime = (value) => {
        if (!value) return "N/A";

        let date;

        if (value?.toDate) {
            date = value.toDate();
        } else if (value?.seconds) {
            date = new Date(value.seconds * 1000);
        } else {
            date = new Date(value);
        }

        if (isNaN(date.getTime())) return value;

        return date.toLocaleString("vi-VN");
    };

    const dataSearch = useMemo(() => {
        const keyword = search.toLowerCase();

        return episodes
            ?.filter(e =>
                e?.title?.toLowerCase().includes(keyword) ||
                String(e?.numberEpisode || "").includes(keyword) ||
                String(e?.url || "").includes(keyword)
            )
            ?.sort((a, b) => Number(a.numberEpisode) - Number(b.numberEpisode));
    }, [search, episodes]);

    const currentData = dataSearch?.slice(start, start + rowsPerPage) || [];

    useEffect(() => {
        setPage(1);
    }, [search]);

    const handleClickOpenDele = (row) => {
        setOpen(true);
        setEpisode(row);
    };

    const handleClose = () => setOpen(false);

    const handleEdit = (row) => {
        handleClickOpen();
        setEpisode(row);
    };

    const handleDeleted = async () => {
        await deleteDocument("Episodes", episode);

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
                                <th className="text-center">NUMBER</th>
                                <th className="text-center">TITLE</th>
                                <th className="text-center">URL</th>
                                <th className="text-center">CREATED AT</th>
                                <th className="text-right">ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentData.map((row, index) => (
                                <tr key={row.id || index} className="table-row">
                                    <td className="table-cell">
                                        {start + index + 1}
                                    </td>

                                    <td className="table-cell text-center">
                                        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-500/30">
                                            Episode {row.numberEpisode}
                                        </span>
                                    </td>

                                    <td className="table-cell text-center font-bold text-cyan-400">
                                        {row.title}
                                    </td>

                                    <td className="table-cell text-center text-green-400 font-bold">
                                        {row.url}
                                    </td>

                                    <td className="table-cell text-center text-gray-300">
                                        {formatDateTime(row.createdAt)}
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
                titleDelete={"DELETE EPISODE"}
                contentDelete={`Are you sure you want to delete the episode "${episode?.title}"?`}
            />
        </div>
    );
}

export default TableEpisodes;