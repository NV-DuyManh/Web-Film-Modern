import { FaGlobeAsia } from 'react-icons/fa';

export default function CountryBadge({ country }) {
    const name = typeof country === 'string' ? country.trim() : '';
    if (!name) return null;

    return (
        <span aria-label={`Quốc gia sản xuất: ${name}`} title={name}
            className="inline-flex items-center gap-1 rounded-md border border-cyan-400 bg-cyan-400/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] lg:text-xs font-bold text-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.25)] backdrop-blur-sm">
            <FaGlobeAsia aria-hidden="true" className="shrink-0" />
            {name}
        </span>
    );
}
