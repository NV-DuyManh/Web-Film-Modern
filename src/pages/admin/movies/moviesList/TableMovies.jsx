import React, { useState, useMemo, useEffect, useContext } from 'react';
import { CiEdit } from 'react-icons/ci';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';
import { IconButton, Tooltip } from '@mui/material';
import { FaUsers } from 'react-icons/fa';
import { ActorContext } from '../../../../contexts/ActorProvider';
import { getObjectById } from '../../../../services/firebaseReponse';
import { CharacterContext } from '../../../../contexts/CharacterProvider';
import { CategoriesContext } from '../../../../contexts/CategoryProvider';
import { BiSolidCategoryAlt } from 'react-icons/bi';

function TableMovies({ movies, search, handleEdit, handleDelete }) {
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const actors = useContext(ActorContext);
    const characters = useContext(CharacterContext);
    const categories = useContext(CategoriesContext);

    const dataSearch = useMemo(() =>
        movies?.filter(e => e?.name?.toLowerCase().includes(search.toLowerCase())),
        [search, movies]
    );

    const currentData = dataSearch?.slice((page - 1) * rowsPerPage, page * rowsPerPage) || [];

    useEffect(() => {
        setPage(1);
    }, [search]);

    const tooltipStyle = {
        tooltip: {
            sx: {
                bgcolor: 'rgba(15, 23, 42, 0.94)',
                color: '#e5e7eb',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
                backdropFilter: 'blur(10px)',
                p: 0,
                maxWidth: '90vw'
            }
        },
        arrow: {
            sx: {
                color: 'rgba(15, 23, 42, 0.94)'
            }
        }
    };

    const renderEntityTooltip = (row) => {
        const actorItems = (row.list_Actor || [])
            .map(id => getObjectById(actors, id))
            .filter(Boolean);

        const characterItems = (row.list_Character || [])
            .map(id => getObjectById(characters, id))
            .filter(Boolean);

        const totalItems = actorItems.length + characterItems.length;

        const tooltipWidth =
            totalItems <= 1 ? "w-[145px]" :
            totalItems === 2 ? "w-[190px]" :
            totalItems <= 4 ? "w-[260px]" :
            "w-[380px]";

        const renderItem = (item) => (
            <div
                key={item.id}
                className="group flex w-17 flex-col items-center"
            >
                <div className="relative h-12 w-12">
                    <img
                        src={item.imgUrl}
                        alt={item.name}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10 transition-all duration-300 group-hover:scale-105 group-hover:ring-cyan-300/40"
                    />
                    <span className="absolute inset-0 rounded-full bg-white/0 transition-all duration-300 group-hover:bg-white/8"></span>
                </div>

                <p className="mt-1.5 max-w-16.5 truncate text-center text-[11px] font-semibold text-gray-200 transition-colors group-hover:text-cyan-200">
                    {item.name}
                </p>
            </div>
        );

        return (
            <div className={`${tooltipWidth} max-w-[90vw] overflow-hidden`}>
                <div className="px-4 py-2.5 border-b border-white/8 bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-[13px] font-bold text-white">
                            Entity
                        </p>

                        <span className="text-[11px] text-gray-400">
                            {totalItems} items
                        </span>
                    </div>
                </div>

                <div className="max-h-85 overflow-y-auto px-2.5 py-2.5">
                    {actorItems.length > 0 && (
                        <div className="rounded-xl bg-white/2.5 px-2.5 py-2.5">
                            <div className="mb-2.5 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                    Actors
                                </p>
                            </div>

                            <div className="grid grid-cols-[repeat(auto-fit,68px)] justify-center gap-x-2 gap-y-3">
                                {actorItems.map(renderItem)}
                            </div>
                        </div>
                    )}

                    {characterItems.length > 0 && (
                        <div className={`${actorItems.length > 0 ? "mt-2.5" : ""} rounded-xl bg-white/2.5 px-2.5 py-2.5`}>
                            <div className="mb-2.5 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-pink-400"></span>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                    Characters
                                </p>
                            </div>

                            <div className="grid grid-cols-[repeat(auto-fit,68px)] justify-center gap-x-2 gap-y-3">
                                {characterItems.map(renderItem)}
                            </div>
                        </div>
                    )}

                    {totalItems === 0 && (
                        <span className="text-[12px] text-gray-500">
                            No entity
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const renderCategoryTooltip = (row) => {
        const categoryItems = (row.list_Category || [])
            .map(id => getObjectById(categories, id))
            .filter(Boolean);

        return (
            <div className="w-fit min-w-52 max-w-95 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8 bg-white/5">
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-[13px] font-bold text-white">
                            Categories
                        </p>

                        <span className="text-[11px] text-gray-400">
                            {categoryItems.length} items
                        </span>
                    </div>
                </div>

                <div className="flex w-fit max-w-95 flex-wrap gap-2 px-3 py-3 max-h-65 overflow-y-auto">
                    {categoryItems.length > 0 ? categoryItems.map((item) => (
                        <span
                            key={item.id}
                            className="rounded-full bg-purple-500/12 px-3 py-1.5 text-[12px] font-semibold text-purple-100 ring-1 ring-purple-300/15"
                        >
                            {item.name}
                        </span>
                    )) : (
                        <span className="text-[12px] text-gray-500">
                            No categories
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-5">
            <div className="table-wrapper">
                <div className="table-container overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="table-header">
                            <tr>
                                <th className="w-16">ID</th>
                                <th className="w-24 text-center">IMAGE</th>
                                <th className="text-center">NAME</th>
                                <th className="text-center">COUNTRY</th>
                                <th className="text-center">DURATION</th>
                                <th className="text-center">EPISODE</th>
                                <th className="text-center">ENTITY</th>
                                <th className="text-center">CATEGORIES</th>
                                <th className="text-right">ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentData.map((row, index) => (
                                <tr key={row.id} className="table-row">
                                    <td className="table-cell">
                                        {(page - 1) * rowsPerPage + index + 1}
                                    </td>

                                    <td className="table-cell py-2">
                                        <img
                                            src={row.imgUrl}
                                            alt={row.name}
                                            className="w-24 h-24 object-cover rounded-md shadow-md border border-white/10"
                                        />
                                    </td>

                                    <td className="table-cell text-center min-w-50 max-w-62.5 whitespace-normal wrap-break-words text-xs leading-relaxed text-gray-300">
                                        {row.name}
                                    </td>

                                    <td className="table-cell text-center min-w-50 max-w-62.5 whitespace-normal wrap-break-words text-xs leading-relaxed text-gray-300">
                                        {row.countriesID || "N/A"}
                                    </td>

                                    <td className="table-cell text-center">
                                        {row.duration ? `${row.duration} mins` : "N/A"}
                                    </td>

                                    <td className="table-cell text-center">
                                        {row.endEpisode ? `${row.endEpisode}` : "N/A"}
                                    </td>

                                    <td className="table-cell text-center">
                                        <Tooltip
                                            arrow
                                            title={renderEntityTooltip(row)}
                                            slotProps={tooltipStyle}
                                        >
                                            <IconButton className="hover:bg-green-500/10!">
                                                <FaUsers className="text-green-400 hover:text-green-300 transition-colors" />
                                            </IconButton>
                                        </Tooltip>
                                    </td>

                                    <td className="table-cell text-center">
                                        <Tooltip
                                            arrow
                                            title={renderCategoryTooltip(row)}
                                            slotProps={tooltipStyle}
                                        >
                                            <IconButton className="hover:bg-purple-500/10!">
                                                <BiSolidCategoryAlt className="text-purple-400 hover:text-purple-300 transition-colors" />
                                            </IconButton>
                                        </Tooltip>
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
                                                onClick={() => handleDelete(row)}
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
        </div>
    );
}

export default TableMovies;