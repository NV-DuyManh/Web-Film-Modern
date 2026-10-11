import { FaLock } from 'react-icons/fa';

const chainImage = `url("data:image/svg+xml,%3Csvg width='22' height='10' viewBox='0 0 22 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='metal' x2='0' y2='1'%3E%3Cstop stop-color='%23f1f5f9'/%3E%3Cstop offset='.5' stop-color='%2394a3b8'/%3E%3Cstop offset='1' stop-color='%23475569'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='1' y='1' width='15' height='8' rx='4' fill='none' stroke='url(%23metal)' stroke-width='2'/%3E%3Crect x='13' y='3' width='8' height='4' rx='2' fill='url(%23metal)' stroke='%23334155'/%3E%3C/svg%3E")`;

export default function EpisodeLockOverlay() {
    return (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <span className="absolute inset-0 bg-linear-to-b from-transparent to-slate-950/65" />
            <span className="absolute inset-x-3 top-0 h-px bg-linear-to-r from-transparent via-amber-200/60 to-transparent" />
            <span className="absolute inset-x-0 bottom-1.5 flex h-7 items-center justify-center">
                {[14, -14].map(angle => (
                    <span key={angle} className="absolute h-2.5 w-[140%] opacity-80" style={{
                        backgroundImage: chainImage, backgroundRepeat: 'repeat-x', backgroundPosition: 'center',
                        transform: `rotate(${angle}deg)`, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))',
                    }} />
                ))}
                <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-amber-300/70 bg-linear-to-b from-slate-700 to-slate-950 shadow-[0_2px_8px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.25)] transition-transform duration-200 group-hover:scale-110 group-hover:border-amber-200 motion-reduce:transition-none">
                    <FaLock className="text-[11px] text-amber-300 drop-shadow-[0_1px_1px_black]" />
                </span>
            </span>
        </span>
    );
}
