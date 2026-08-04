import React, { useState, useEffect, useMemo } from 'react';
import { FaFilm, FaStar, FaGift, FaCheck, FaCheckDouble, FaBell } from 'react-icons/fa';
import { fetchDocumentsRealtime } from '../../../../services/firebaseService';

function timeAgo(timestamp) {
    if (!timestamp) return 'Vừa xong';
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return 'Vài giây trước';
}

function Notify(props) {
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState('tat-ca');
    const [readIds, setReadIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('mfilm_read_notifications') || '[]');
        } catch {
            return [];
        }
    });

    useEffect(() => {
        const unsubscribe = fetchDocumentsRealtime("Notifications", (data) => {
            setNotifications(data);
        });
        return () => unsubscribe();
    }, []);

    const processedNotifications = notifications.map(n => {
        let icon = <FaBell className="text-slate-400" />;
        let iconBg = 'bg-slate-400/10 border-slate-400/30';
        
        if (n.type === 'phim-moi') {
            icon = <FaFilm className="text-yellow-500" />;
            iconBg = 'bg-yellow-500/10 border-yellow-500/30';
        } else if (n.type === 'uu-dai') {
            icon = <FaGift className="text-orange-400" />;
            iconBg = 'bg-orange-400/10 border-orange-400/30';
        } else if (n.type === 'goi-y') {
            icon = <FaStar className="text-blue-400" />;
            iconBg = 'bg-blue-400/10 border-blue-400/30';
        } else if (n.type === 'khac') {
            icon = <FaCheck className="text-green-400" />;
            iconBg = 'bg-green-400/10 border-green-400/30';
        }

        return {
            ...n,
            unread: !readIds.includes(n.id),
            timeStr: n.createdAt ? timeAgo(n.createdAt) : (n.time || 'Vừa xong'),
            icon,
            iconBg
        };
    });

    const unreadCount = processedNotifications.filter(n => n.unread).length;

    const handleMarkAllAsRead = () => {
        const allIds = notifications.map(n => n.id);
        setReadIds(allIds);
        localStorage.setItem('mfilm_read_notifications', JSON.stringify(allIds));
    };

    const handleMarkAsRead = (id) => {
        if (!readIds.includes(id)) {
            const newReadIds = [...readIds, id];
            setReadIds(newReadIds);
            localStorage.setItem('mfilm_read_notifications', JSON.stringify(newReadIds));
        }
    };

    const filteredNotifications = processedNotifications.filter(n => {
        if (filter === 'tat-ca') return true;
        if (filter === 'chua-doc') return n.unread;
        if (filter === 'phim-moi') return n.type === 'phim-moi';
        if (filter === 'uu-dai') return n.type === 'uu-dai';
        return true;
    });

    function FilterButton({ id, label, count }) {
        const isActive = filter === id;
        return (
            <button
                onClick={() => setFilter(id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border ${
                    isActive 
                        ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' 
                        : 'border-white/10 text-slate-400 hover:text-white hover:border-white/30 bg-transparent'
                } flex items-center gap-2`}
            >
                {label}
                {count > 0 && (
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isActive ? 'bg-yellow-500 text-black' : 'bg-yellow-500 text-black'
                    }`}>
                        {count}
                    </span>
                )}
            </button>
        );
    };

    return (
        <div className="w-full flex flex-col gap-6 p-6 bg-[#1e293b]/60 rounded-2xl border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] min-h-full">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex flex-col gap-1 w-full relative z-10">
                    <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                        Thông Báo
                        {unreadCount > 0 && (
                            <span className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black text-lg shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <span className="text-slate-400 text-sm md:text-base font-medium ml-1">
                        {notifications.length} thông báo
                    </span>
                </div>
                
                {unreadCount > 0 && (
                    <button 
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 hover:border-yellow-500/50 rounded-xl text-sm font-bold transition-all duration-300 shrink-0 shadow-[0_0_10px_rgba(234,179,8,0.1)] hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                    >
                        <FaCheckDouble /> Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-4">
                <FilterButton id="tat-ca" label="Tất cả" count={0} />
                <FilterButton id="chua-doc" label="Chưa đọc" count={unreadCount} />
                <FilterButton id="phim-moi" label="Phim mới" count={0} />
                <FilterButton id="uu-dai" label="Ưu đãi" count={0} />
            </div>

            <div className="flex flex-col gap-3">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notify) => (
                        <div 
                            key={notify.id} 
                            onClick={() => handleMarkAsRead(notify.id)}
                            className={`relative flex items-start gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer border ${
                                notify.unread 
                                    ? 'bg-[#1c1c1c] border-white/5 hover:border-white/10 hover:bg-[#222]' 
                                    : 'bg-[#151515] border-transparent opacity-70 hover:opacity-100 hover:bg-[#1a1a1a]'
                            }`}
                        >
                            {notify.unread && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-yellow-500 rounded-r-md shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>
                            )}
                            
                            <div className="relative shrink-0">
                                {notify.unread && (
                                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,1)] z-10"></div>
                                )}
                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm ${notify.iconBg}`}>
                                    {notify.icon}
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-0.5 flex-1">
                                <h3 className={`text-sm font-bold ${notify.unread ? 'text-white' : 'text-slate-300'}`}>
                                    {notify.title}
                                </h3>
                                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                                    {notify.message}
                                </p>
                                <span className="text-slate-500 text-[10px] md:text-xs mt-0.5 font-medium">
                                    {notify.timeStr}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="w-full py-20 flex flex-col items-center justify-center opacity-70">
                        <FaCheckDouble className="text-slate-600 text-6xl mb-4" />
                        <h3 className="text-slate-300 text-lg font-bold mb-2">Bạn đã đọc hết thông báo!</h3>
                        <p className="text-slate-500">Không có thông báo nào trong mục này.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Notify;
