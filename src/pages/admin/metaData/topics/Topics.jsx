import React, { useRef, useState } from 'react';
import TableTopic from './TableTopic';
import { useTopics } from '../../../../hooks/useCollections';
import { setCuratedTopicEnabled } from '../../../../hooks/useCuratedTopics';
import { BsSearch } from 'react-icons/bs';

export default function Topics() {
    const topics = useTopics();
    const [search, setSearch] = useState('');
    const pending = useRef(new Set());
    const [savingIds, setSavingIds] = useState(() => new Set());
    const [error, setError] = useState('');
    const toggle = async topic => {
        if (pending.current.has(topic.id)) return;
        pending.current.add(topic.id);
        setSavingIds(new Set(pending.current));
        setError('');
        try { await setCuratedTopicEnabled(topic.id, !topic.enabled); }
        catch { setError('Could not save topic visibility. Please try again.'); }
        finally {
            pending.current.delete(topic.id);
            setSavingIds(new Set(pending.current));
        }
    };
    return (
        <div className="w-full">
            <div className="grid lg:grid-cols-8 gap-3 p-4 bg-black/20 text-white items-center">
                <h1 className="font-bold text-3xl glow-text lg:col-span-3 m-0">List Topics</h1>
                <div className="search lg:col-span-5">
                    <input type="search" placeholder="Search Topic by Name" className="search-input" value={search} onChange={e => setSearch(e.target.value)} />
                    <BsSearch className="search-icon" />
                </div>
            </div>
            {error && <p role="alert" className="mx-5 p-3 text-red-300 bg-red-950/50 rounded-lg">{error}</p>}
            <TableTopic topics={topics} search={search} onToggle={toggle} savingIds={savingIds} />
        </div>
    );
}
