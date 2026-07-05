    import React, { useContext } from 'react';
import { Dialog, Slide } from '@mui/material';
import { FaTimesCircle, FaStar, FaGlobe, FaClock, FaCalendarAlt, FaTv, FaCrown, FaFilm, FaUserTie, FaUsers, FaUserNinja, FaMoneyBillWave } from 'react-icons/fa';
import { MdOutlineSubtitles, MdMic, MdOutlineVoiceChat } from 'react-icons/md';
import { BiSolidCategoryAlt } from 'react-icons/bi';

import { ActorContext } from '../../../../contexts/ActorProvider';
import { CategoriesContext } from '../../../../contexts/CategoryProvider';
import { AuthorContext } from '../../../../contexts/AuthorProvider';
import { CharacterContext } from '../../../../contexts/CharacterProvider';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { CategoryTypeContext } from '../../../../contexts/CategoryTypeProvider';
import Logo5 from "../../../../assets/Logo5.png";

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

// --- Sub-components ---

const NeonBadge = ({ icon: Icon, text, color = "cyan" }) => {
    const colorMap = {
        cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]",
        yellow: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/40 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.15)]",
        purple: "from-purple-500/20 to-purple-500/5 border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]",
        green: "from-green-500/20 to-green-500/5 border-green-500/40 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
        pink: "from-pink-500/20 to-pink-500/5 border-pink-500/40 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.15)]",
        blue: "from-blue-500/20 to-blue-500/5 border-blue-500/40 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    };
    return (
        <div className={`flex items-center gap-2 bg-gradient-to-r ${colorMap[color]} px-3.5 py-2 rounded-xl border text-sm font-semibold backdrop-blur-sm hover:scale-105 transition-transform duration-300 cursor-default`}>
            {Icon && <Icon className="text-sm" />} <span>{text}</span>
        </div>
    );
};

const GlowCard = ({ title, icon: Icon, color = "cyan", children }) => {
    const colorMap = {
        cyan: { border: "border-cyan-500/20 hover:border-cyan-500/50", title: "text-cyan-400", glow: "hover:shadow-[0_0_25px_rgba(6,182,212,0.12)]", iconBg: "bg-cyan-500/10" },
        purple: { border: "border-purple-500/20 hover:border-purple-500/50", title: "text-purple-400", glow: "hover:shadow-[0_0_25px_rgba(168,85,247,0.12)]", iconBg: "bg-purple-500/10" },
        pink: { border: "border-pink-500/20 hover:border-pink-500/50", title: "text-pink-400", glow: "hover:shadow-[0_0_25px_rgba(236,72,153,0.12)]", iconBg: "bg-pink-500/10" },
        yellow: { border: "border-yellow-500/20 hover:border-yellow-500/50", title: "text-yellow-400", glow: "hover:shadow-[0_0_25px_rgba(234,179,8,0.12)]", iconBg: "bg-yellow-500/10" },
        green: { border: "border-green-500/20 hover:border-green-500/50", title: "text-green-400", glow: "hover:shadow-[0_0_25px_rgba(34,197,94,0.12)]", iconBg: "bg-green-500/10" },
        emerald: { border: "border-emerald-500/20 hover:border-emerald-500/50", title: "text-emerald-400", glow: "hover:shadow-[0_0_25px_rgba(16,185,129,0.12)]", iconBg: "bg-emerald-500/10" },
    };
    const c = colorMap[color];
    return (
        <div className={`bg-white/[0.03] backdrop-blur-sm rounded-2xl border ${c.border} ${c.glow} p-4 transition-all duration-500`}>
            <div className="flex items-center gap-2.5 mb-3">
                <div className={`${c.iconBg} p-1.5 rounded-lg`}>
                    <Icon className={`${c.title} text-sm`} />
                </div>
                <h4 className={`${c.title} text-[11px] font-bold uppercase tracking-[0.15em]`}>{title}</h4>
            </div>
            {children}
        </div>
    );
};

const AvatarItem = ({ entity, fallback, color }) => {
    const [hovered, setHovered] = React.useState(false);
    const glowMap = {
        cyan: { base: "shadow-[0_0_10px_rgba(6,182,212,0.4)] border-cyan-500/40", active: "shadow-[0_0_18px_rgba(6,182,212,0.7)] scale-110 -translate-y-1" },
        pink: { base: "shadow-[0_0_10px_rgba(236,72,153,0.4)] border-pink-500/40", active: "shadow-[0_0_18px_rgba(236,72,153,0.7)] scale-110 -translate-y-1" },
        yellow: { base: "shadow-[0_0_10px_rgba(234,179,8,0.4)] border-yellow-500/40", active: "shadow-[0_0_18px_rgba(234,179,8,0.7)] scale-110 -translate-y-1" },
        green: { base: "shadow-[0_0_10px_rgba(34,197,94,0.4)] border-green-500/40", active: "shadow-[0_0_18px_rgba(34,197,94,0.7)] scale-110 -translate-y-1" },
    };
    const tipBg = { cyan: "bg-cyan-600", pink: "bg-pink-600", yellow: "bg-yellow-600", green: "bg-green-600" };
    const g = glowMap[color];

    return (
        <div 
            className="relative cursor-default"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <img 
                src={entity.imgUrl || fallback} 
                alt={entity.name}
                className={`w-10 h-10 rounded-full object-cover border-2 ${g.base} transition-all duration-300 ${hovered ? g.active : ''}`}
            />
            <div className={`absolute -bottom-7 left-1/2 -translate-x-1/2 ${tipBg[color]} text-white text-[9px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap transition-all duration-200 pointer-events-none z-30 shadow-lg ${hovered ? 'opacity-100' : 'opacity-0'}`}>
                {entity.name}
            </div>
        </div>
    );
};

const AvatarRow = ({ items, list, fallback, color = "cyan" }) => {
    if (!items || items.length === 0) return <span className="text-gray-600 text-xs italic">N/A</span>;

    return (
        <div className="flex flex-wrap gap-2.5">
            {items.map((id, idx) => {
                const entity = list?.find(e => e.id === id);
                if (!entity) return null;
                return <AvatarItem key={idx} entity={entity} fallback={fallback} color={color} />;
            })}
        </div>
    );
};

// --- Main Component ---

export default function ModalViewMovie({ open, handleClose, movie }) {
    const categoryTypes = useContext(CategoryTypeContext);
    const actorsList = useContext(ActorContext);
    const categoriesList = useContext(CategoriesContext);
    const authorsList = useContext(AuthorContext);
    const charactersList = useContext(CharacterContext);
    const plansList = useContext(PlanContext);

    if (!movie) return null;

    const getStatusStyle = (status) => {
        switch(status) {
            case "Sắp chiếu": return "from-amber-500 to-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]";
            case "Đang chiếu": return "from-emerald-500 to-green-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]";
            case "Hoàn thành": return "from-blue-500 to-cyan-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]";
            default: return "from-slate-500 to-slate-400 shadow-[0_0_20px_rgba(100,116,139,0.5)]";
        }
    };

    const currentPlan = plansList?.find(p => p.id === movie.planID);
    const currentCategoryType = categoryTypes?.find(c => c.id === movie.category_Type_Id);

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ style: { background: 'transparent', boxShadow: 'none', overflow: 'auto', borderRadius: 24, maxHeight: '90vh' } }}
        >
            <div className="movie-view-modal relative rounded-3xl overflow-y-auto overflow-x-hidden custom-scrollbar" style={{ background: 'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(10,15,30,0.99))', maxHeight: '90vh' }}>

                {/* ═══ Animated border glow ═══ */}
                <div className="absolute inset-0 rounded-3xl pointer-events-none z-50" style={{ 
                    background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent, rgba(168,85,247,0.3), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'borderGlow 4s linear infinite',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    padding: '1.5px',
                    borderRadius: 24
                }}></div>

                {/* ═══ HERO BANNER SECTION ═══ */}
                <div className="relative w-full h-[220px] overflow-hidden">
                    <img 
                        src={movie.bannerUrl || movie.imgUrl || Logo5}
                        alt="banner"
                        className="w-full h-full object-cover"
                        style={{ filter: 'brightness(0.4) saturate(1.3)' }}
                    />
                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1e]/60 via-transparent to-[#0a0f1e]/60"></div>
                    
                    {/* Scan line effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
                    }}></div>

                    {/* Close button */}
                    <button 
                        onClick={handleClose}
                        className="absolute top-5 right-5 z-50 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:rotate-90 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-500 cursor-pointer"
                    >
                        <FaTimesCircle size={20} />
                    </button>


                </div>

                {/* ═══ POSTER + TITLE OVERLAY ═══ */}
                <div className="relative px-8 -mt-28 z-20 flex gap-7 items-end">
                    {/* Poster with neon frame */}
                    <div className="relative shrink-0 group">
                        <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-2xl opacity-50 blur-md group-hover:opacity-80 transition-all duration-700"></div>
                        <img 
                            src={movie.imgUrl || Logo5}
                            alt={movie.name}
                            className="relative w-[170px] aspect-[2/3] object-cover rounded-2xl border-2 border-white/20 shadow-2xl z-10"
                        />
                    </div>

                    {/* Title area */}
                    <div className="flex-1 pb-4">
                        <h2 
                            className="text-3xl font-black mb-1 leading-tight"
                            style={{
                                background: 'linear-gradient(135deg, #22d3ee, #a855f7, #ec4899)',
                                backgroundSize: '200% auto',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                animation: 'textMove 4s linear infinite',
                                filter: 'drop-shadow(0 0 12px rgba(34,211,238,0.3))'
                            }}
                        >
                            {movie.name}
                        </h2>
                        {movie.otherName && (
                            <p className="text-gray-400 text-sm italic font-medium mb-3">{movie.otherName}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                            <span className={`px-3.5 py-2 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r ${getStatusStyle(movie.status)} border border-white/20 tracking-wide`}>
                                {movie.status || "N/A"}
                            </span>
                            <span className="px-3.5 py-2 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-red-400/30">
                                {movie.ageRating || "N/A"}
                            </span>
                            <NeonBadge icon={FaCalendarAlt} text={movie.releaseYear || "N/A"} color="cyan" />
                            <NeonBadge icon={FaClock} text={movie.duration ? `${movie.duration} min` : "N/A"} color="yellow" />
                            <NeonBadge icon={FaTv} text={`${movie.endEpisode || "?"} Eps`} color="purple" />
                            {movie.countriesID && <NeonBadge icon={FaGlobe} text={movie.countriesID} color="green" />}
                            {currentPlan && <NeonBadge icon={FaCrown} text={currentPlan.name} color="pink" />}
                            {currentCategoryType && <NeonBadge icon={FaFilm} text={currentCategoryType.name} color="blue" />}
                        </div>
                    </div>
                </div>

                {/* ═══ CONTENT BODY ═══ */}
                <div className="px-8 pt-6 pb-8 space-y-5">

                    {/* Description */}
                    <div className="relative bg-white/[0.02] rounded-2xl border border-white/5 p-5 overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500 rounded-l-full"></div>
                        <p className="text-gray-300/90 text-[14px] leading-relaxed pl-4 max-h-[90px] overflow-y-auto custom-scrollbar">
                            {movie.description || "No description available."}
                        </p>
                    </div>

                    {/* Grid: Categories + Availability */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GlowCard title="Categories" icon={BiSolidCategoryAlt} color="purple">
                            <div className="flex flex-wrap gap-2">
                                {movie.list_Category?.map((catId, idx) => {
                                    const cat = categoriesList?.find(c => c.id === catId);
                                    return cat ? (
                                        <span key={idx} className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/25 rounded-lg text-[11px] font-bold tracking-wide uppercase hover:bg-purple-500/20 hover:border-purple-400/40 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all duration-300 cursor-default">
                                            {cat.name}
                                        </span>
                                    ) : null;
                                })}
                                {(!movie.list_Category || movie.list_Category.length === 0) && <span className="text-gray-600 text-xs italic">None</span>}
                            </div>
                        </GlowCard>

                        <GlowCard title="Availability" icon={MdOutlineSubtitles} color="emerald">
                            <div className="flex flex-wrap gap-2">
                                {movie.hasSub && (
                                    <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-[0_0_8px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-shadow duration-300">
                                        <MdOutlineSubtitles className="text-sm" /> Sub: {movie.episodeSub}/{movie.endEpisode}
                                    </div>
                                )}
                                {movie.hasDub && (
                                    <div className="flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/30 text-pink-300 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-[0_0_8px_rgba(236,72,153,0.1)] hover:shadow-[0_0_15px_rgba(236,72,153,0.25)] transition-shadow duration-300">
                                        <MdMic className="text-sm" /> Dub: {movie.episodeDub}/{movie.endEpisode}
                                    </div>
                                )}
                                {movie.hasVoice && (
                                    <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-300 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-[0_0_8px_rgba(249,115,22,0.1)] hover:shadow-[0_0_15px_rgba(249,115,22,0.25)] transition-shadow duration-300">
                                        <MdOutlineVoiceChat className="text-sm" /> Voice: {movie.episodeVoice}/{movie.endEpisode}
                                    </div>
                                )}
                                {(!movie.hasSub && !movie.hasDub && !movie.hasVoice) && <span className="text-gray-600 text-xs italic">No episodes</span>}
                            </div>
                        </GlowCard>
                    </div>

                    {/* Grid: Directors + Actors + Characters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <GlowCard title="Directors" icon={FaUserTie} color="yellow">
                            <AvatarRow items={movie.list_Author} list={authorsList} fallback={Logo5} color="yellow" />
                        </GlowCard>
                        <GlowCard title="Actors" icon={FaUsers} color="pink">
                            <AvatarRow items={movie.list_Actor} list={actorsList} fallback={Logo5} color="pink" />
                        </GlowCard>
                        <GlowCard title="Characters" icon={FaUserNinja} color="green">
                            <AvatarRow items={movie.list_Character} list={charactersList} fallback={Logo5} color="green" />
                        </GlowCard>
                    </div>

                    {/* Rent Price Footer */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-slate-800/50 via-slate-800/30 to-slate-800/50 rounded-2xl border border-white/5 p-4 flex items-center justify-between">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-pulse pointer-events-none"></div>
                        <div className="flex items-center gap-3 z-10">
                            <div className="bg-yellow-500/10 p-2 rounded-xl">
                                <FaMoneyBillWave className="text-yellow-400 text-lg" />
                            </div>
                            <span className="text-gray-400 text-xs uppercase tracking-[0.15em] font-bold">Rent Price</span>
                        </div>
                        <span className="text-yellow-400 font-black text-xl z-10" style={{ textShadow: '0 0 15px rgba(234,179,8,0.4)' }}>
                            {movie.rent > 0 ? `${Number(movie.rent).toLocaleString()} ₫` : 'Free'}
                        </span>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
