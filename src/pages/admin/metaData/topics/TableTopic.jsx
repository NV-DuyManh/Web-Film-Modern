import React, { useContext, useMemo } from 'react';
import { useMovies } from '../../../../hooks/useCollections';
import { CategoryContext } from '../../../../contexts/CategoryProvider';
import { CategoryTypeContext } from '../../../../contexts/CategoryTypeProvider';
import { selectTopicMovies } from '../../../../utils/curatedTopics';
import { searchTV } from '../../../../components/admin/search/SearchTV';

export default function TableTopic({ topics, search, onToggle, saving }) {
    const movies = useMovies();
    const categories = useContext(CategoryContext) || [];
    const categoryTypes = useContext(CategoryTypeContext) || [];
    const rows = useMemo(() => topics.filter(topic => searchTV(`${topic.name} ${topic.description}`).includes(searchTV(search))), [topics, search]);
    const counts = useMemo(() => Object.fromEntries(topics.map(topic => [topic.id, selectTopicMovies({ ...topic, enabled: true }, movies, categories, categoryTypes).length])), [topics, movies, categories, categoryTypes]);
    return (
        <div className="p-5">
            <div className="table-wrapper"><div className="table-container">
                <table className="w-full text-left">
                    <thead className="table-header"><tr>
                        <th className="text-center">#</th><th>TITLE</th><th>DESCRIPTION</th><th className="text-center">MOVIES</th><th className="text-center">VISIBILITY</th>
                    </tr></thead>
                    <tbody>{rows.map(topic => <tr key={topic.id} className="table-row">
                        <td className="table-cell text-center">{topic.order + 1}</td>
                        <td className="table-cell font-bold">{topic.name}</td>
                        <td className="table-cell">{topic.description}</td>
                        <td className="table-cell text-center">{counts[topic.id]}</td>
                        <td className="table-cell text-center">
                            <button type="button" role="switch" aria-checked={topic.enabled} aria-label={`Show ${topic.name}`} disabled={saving !== null} onClick={() => onToggle(topic)} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-bold text-xs cursor-pointer disabled:opacity-50 ${topic.enabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-slate-700/40 text-slate-400 border border-slate-600'}`}>
                                <span aria-hidden="true" className={`w-7 h-4 rounded-full p-0.5 ${topic.enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}><span className={`block w-3 h-3 rounded-full bg-white transition-transform ${topic.enabled ? 'translate-x-3' : ''}`} /></span>
                                {saving === topic.id ? 'Saving...' : topic.enabled ? 'Enabled' : 'Disabled'}
                            </button>
                        </td>
                    </tr>)}</tbody>
                </table>
                {rows.length === 0 && <p className="p-6 text-center text-slate-400">No topics found.</p>}
            </div></div>
        </div>
    );
}
