import React, { useEffect, useMemo, useState } from 'react';
import { useMovies } from '../../../../hooks/useCollections';
import useCatalogChoices from '../../../../hooks/useCatalogChoices';
import { selectTopicMovies } from '../../../../utils/curatedTopics';
import { searchTV } from '../../../../components/admin/search/SearchTV';
import PaginationAdmin from '../../../../components/admin/PaginationAdmin';

export default function TableTopic({ topics, search, onToggle, savingIds }) {
    const movies = useMovies();
    const categories = useCatalogChoices('Categories', [], true);
    const categoryTypes = useCatalogChoices('CategoryTypes', [], true);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const rows = useMemo(() => topics.filter(topic => searchTV(`${topic.name} ${topic.description}`).includes(searchTV(search))), [topics, search]);
    const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / rowsPerPage)));
    const start = (currentPage - 1) * rowsPerPage;
    const currentRows = rows.slice(start, start + rowsPerPage);
    useEffect(() => { setPage(1); }, [search]);
    const counts = useMemo(() => Object.fromEntries(topics.map(topic => [topic.id, selectTopicMovies({ ...topic, enabled: true }, movies, categories, categoryTypes).length])), [topics, movies, categories, categoryTypes]);
    return (
        <div className="p-5">
            <div className="table-wrapper"><div className="table-container">
                <table className="w-full text-left">
                    <thead className="table-header"><tr>
                        <th className="text-center">#</th><th>TITLE</th><th>DESCRIPTION</th><th className="text-center">MOVIES</th><th className="text-center">VISIBILITY</th>
                    </tr></thead>
                    <tbody>{currentRows.map(topic => <tr key={topic.id} className="table-row">
                        <td className="table-cell text-center">{topic.order + 1}</td>
                        <td className="table-cell font-bold">{topic.name}</td>
                        <td className="table-cell">{topic.description}</td>
                        <td className="table-cell text-center">{movies.length && categories.length && categoryTypes.length ? counts[topic.id] : '…'}</td>
                        <td className="table-cell text-center">
                            <button type="button" role="switch" aria-checked={topic.enabled} aria-label={`Show ${topic.name}`} aria-busy={savingIds.has(topic.id)} disabled={savingIds.has(topic.id)} onClick={() => onToggle(topic)} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-bold text-xs cursor-pointer disabled:opacity-50 ${topic.enabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-red-500/20 text-red-300 border border-red-400/40'}`}>
                                <span aria-hidden="true" className={`w-7 h-4 rounded-full p-0.5 ${topic.enabled ? 'bg-emerald-500' : 'bg-red-500'}`}><span className={`block w-3 h-3 rounded-full bg-white transition-transform ${topic.enabled ? 'translate-x-3' : ''}`} /></span>
                                {savingIds.has(topic.id) ? 'Saving...' : topic.enabled ? 'Enabled' : 'Disabled'}
                            </button>
                        </td>
                    </tr>)}</tbody>
                </table>
                {rows.length === 0 && <p className="p-6 text-center text-slate-400">No topics found.</p>}
                <div className="table-footer">
                    <PaginationAdmin page={currentPage} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} totalItems={rows.length} />
                </div>
            </div></div>
        </div>
    );
}
