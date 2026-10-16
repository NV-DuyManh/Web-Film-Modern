import { FaLock } from 'react-icons/fa';

const chainImage = `url("data:image/svg+xml,%3Csvg width='22' height='10' viewBox='0 0 22 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='metal' x2='0' y2='1'%3E%3Cstop stop-color='%23f1f5f9'/%3E%3Cstop offset='.5' stop-color='%2394a3b8'/%3E%3Cstop offset='1' stop-color='%23475569'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='1' y='1' width='15' height='8' rx='4' fill='none' stroke='url(%23metal)' stroke-width='2'/%3E%3Crect x='13' y='3' width='8' height='4' rx='2' fill='url(%23metal)' stroke='%23334155'/%3E%3C/svg%3E")`;

export default function EpisodeLockOverlay() {
    return (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <span className="absolute inset-0 bg-linear-to-b from-transparent to-slate-950/40" />
            <span className="absolute inset-x-3 top-0 h-px bg-linear-to-r from-transparent via-amber-200/60 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 flex h-3 items-center justify-center">
                {[8, -8].map(angle => (
                    <span key={angle} className="absolute h-1.5 w-[110%] opacity-35" style={{
                        backgroundImage: chainImage, backgroundRepeat: 'repeat-x', backgroundPosition: 'center',
                        backgroundSize: '15px 7px', transform: `rotate(${angle}deg)`,
                    }} />
                ))}
            </span>
            <span className="absolute bottom-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-amber-300/60 bg-linear-to-b from-slate-700 to-slate-950 shadow-sm transition-colors duration-200 group-hover:border-amber-200 motion-reduce:transition-none">
                <FaLock className="text-[8px] text-amber-300" />
            </span>
        </span>
    );
}
