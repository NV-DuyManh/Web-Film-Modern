export default function OnlineIndicator({ online, available, name }) {
    const label = available ? online ? 'Online' : 'Offline' : 'Online status unavailable';
    return <span role="img" aria-label={`${name || 'User'}: ${label}`} title={label}
        className={`absolute -bottom-0.5 -right-0.5 z-20 h-3.5 w-3.5 rounded-full border-[3px] border-[#0f172a] ${online && available ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]' : 'bg-slate-500'}`} />;
}
