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
        cyan: "from-cyan-500/10 to-transparent border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:from-cyan-500/30 hover:to-cyan-500/10 hover:border-cyan-400 hover:text-cyan-100 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]",
        yellow: "from-yellow-500/10 to-transparent border-yellow-500/30 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:from-yellow-500/30 hover:to-yellow-500/10 hover:border-yellow-400 hover:text-yellow-100 hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]",
        purple: "from-purple-500/10 to-transparent border-purple-500/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:from-purple-500/30 hover:to-purple-500/10 hover:border-purple-400 hover:text-purple-100 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]",
        green: "from-green-500/10 to-transparent border-green-500/30 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:from-green-500/30 hover:to-green-500/10 hover:border-green-400 hover:text-green-100 hover:shadow-[0_0_25px_rgba(34,197,94,0.4)]",
        pink: "from-pink-500/10 to-transparent border-pink-500/30 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.15)] hover:from-pink-500/30 hover:to-pink-500/10 hover:border-pink-400 hover:text-pink-100 hover:shadow-[0_0_25px_rgba(236,72,153,0.4)]",
        blue: "from-blue-500/10 to-transparent border-blue-500/30 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:from-blue-500/30 hover:to-blue-500/10 hover:border-blue-400 hover:text-blue-100 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]",
        red: "from-red-500/10 to-transparent border-red-500/30 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:from-red-500/30 hover:to-red-500/10 hover:border-red-400 hover:text-red-100 hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]",
        orange: "from-orange-500/10 to-transparent border-orange-500/30 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.15)] hover:from-orange-500/30 hover:to-orange-500/10 hover:border-orange-400 hover:text-orange-100 hover:shadow-[0_0_25px_rgba(249,115,22,0.4)]",
        slate: "from-slate-500/10 to-transparent border-slate-500/30 text-slate-300 shadow-[0_0_15px_rgba(100,116,139,0.15)] hover:from-slate-500/30 hover:to-slate-500/10 hover:border-slate-400 hover:text-slate-100 hover:shadow-[0_0_25px_rgba(100,116,139,0.4)]",
        emerald: "from-emerald-500/10 to-transparent border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:from-emerald-500/30 hover:to-emerald-500/10 hover:border-emerald-400 hover:text-emerald-100 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]",
        fuchsia: "from-fuchsia-500/10 to-transparent border-fuchsia-500/30 text-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.15)] hover:from-fuchsia-500/30 hover:to-fuchsia-500/10 hover:border-fuchsia-400 hover:text-fuchsia-100 hover:shadow-[0_0_25px_rgba(217,70,239,0.4)]",
        indigo: "from-indigo-500/10 to-transparent border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:from-indigo-500/30 hover:to-indigo-500/10 hover:border-indigo-400 hover:text-indigo-100 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)]",
        rose: "from-rose-500/10 to-transparent border-rose-500/30 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:from-rose-500/30 hover:to-rose-500/10 hover:border-rose-400 hover:text-rose-100 hover:shadow-[0_0_25px_rgba(244,63,94,0.4)]",
    };
    return (
        <div className={`flex items-center gap-2 bg-gradient-to-r ${colorMap[color]} px-3.5 py-2 rounded-xl border text-sm font-bold backdrop-blur-sm hover:-translate-y-1 transition-all duration-300 cursor-default`}>
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

    const getStatusColor = (status) => {
        switch(status) {
            case "Sắp chiếu": return "orange";
            case "Đang chiếu": return "green";
            case "Hoàn thành": return "cyan";
            default: return "slate";
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
            PaperProps={{ style: { background: 'transparent', boxShadow: 'none', overflow: 'visible', borderRadius: 24 } }}
        >
            <div className="relative w-full rounded-3xl flex flex-col" style={{ 
                background: 'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(10,15,30,0.99))', 
                maxHeight: '90vh' 
            }}>
                {/* ═══ Animated border outer glow (Blurry Aura) ═══ */}
                <div className="absolute inset-0 rounded-3xl pointer-events-none z-[1]" style={{ 
                    background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.6), transparent, rgba(236,72,153,0.6), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'borderGlow 4s linear infinite',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    padding: '3px',
                    filter: 'blur(8px)',
                    borderRadius: 24
                }}></div>
                {/* ═══ Animated border glow (Sharp Line) ═══ */}
                <div className="absolute inset-0 rounded-3xl pointer-events-none z-[2]" style={{ 
                    background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.8), transparent, rgba(168,85,247,0.8), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'borderGlow 4s linear infinite',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    padding: '1.5px',
                    borderRadius: 24
                }}></div>

                {/* ═══ SCROLLABLE CONTENT ═══ */}
                <div className="movie-view-modal w-full rounded-3xl overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10 flex-1 p-[2px]">

                {/* ═══ HERO BANNER SECTION ═══ */}
                <div className="relative w-full h-[220px] overflow-hidden rounded-t-[22px]">
                    <img 
                        src={movie.bannerUrl || movie.imgUrl || Logo5}
                        alt="banner"
                        className="w-full h-full object-cover"
                        style={{ filter: 'brightness(0.4) saturate(1.3)' }}
                    />
                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1e]/60 via-transparent to-[#0a0f1e]/60"></div>
                    

                    {/* Close button */}
                    <button 
                        onClick={handleClose}
                        className="absolute top-5 right-5 z-50 w-10 h-10 rounded-full bg-red-500/10 backdrop-blur-md border border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-200 hover:border-red-400 hover:bg-red-500/30 hover:rotate-90 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all duration-500 cursor-pointer"
                    >
                        <FaTimesCircle size={20} />
                    </button>


                </div>

                {/* ═══ POSTER + TITLE OVERLAY ═══ */}
                <div className="relative px-8 -mt-28 z-20 flex gap-7 items-end">
                    {/* Poster with neon frame */}
                    <div className="relative shrink-0 group cursor-pointer">
                        <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-2xl opacity-50 blur-md group-hover:opacity-100 group-hover:blur-xl transition-all duration-700"></div>
                        <img 
                            src={movie.imgUrl || Logo5}
                            alt={movie.name}
                            className="relative w-[170px] aspect-[2/3] object-cover rounded-2xl border-2 border-white/20 shadow-2xl z-10 group-hover:-translate-y-4 group-hover:scale-105 transition-all duration-500"
                        />
                    </div>

                    {/* Title area */}
                    <div className="flex-1 pb-3">
                        <h2 className="text-2xl md:text-4xl font-black glow-text tracking-tight mb-2" style={{ paddingBottom: '0.1em' }}>
                            {movie.name}
                        </h2>
                        {movie.otherName && (
                            <p className="text-gray-400 text-sm italic font-medium mb-3">{movie.otherName}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                            <NeonBadge text={movie.status || "N/A"} color={getStatusColor(movie.status)} />
                            <NeonBadge text={movie.ageRating || "N/A"} color="red" />
                            <NeonBadge icon={FaCalendarAlt} text={movie.releaseYear || "N/A"} color="indigo" />
                            <NeonBadge icon={FaClock} text={movie.duration ? `${movie.duration} min` : "N/A"} color="yellow" />
                            <NeonBadge icon={FaTv} text={`${movie.endEpisode || "?"} Eps`} color="fuchsia" />
                            {movie.countriesID && <NeonBadge icon={FaGlobe} text={movie.countriesID} color="emerald" />}
                            {currentPlan && <NeonBadge icon={FaCrown} text={currentPlan.name} color="rose" />}
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
                                        <span key={idx} className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/25 rounded-lg text-[11px] font-bold tracking-wide uppercase hover:bg-purple-500/20 hover:border-purple-400/40 hover:-translate-y-1 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all duration-300 cursor-default">
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
                                    <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-[0_0_8px_rgba(6,182,212,0.1)] hover:bg-cyan-500/20 hover:border-cyan-400/40 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all duration-300 cursor-default">
                                        <MdOutlineSubtitles className="text-sm" /> Sub: {movie.episodeSub}/{movie.endEpisode}
                                    </div>
                                )}
                                {movie.hasDub && (
                                    <div className="flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/30 text-pink-300 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-[0_0_8px_rgba(236,72,153,0.1)] hover:bg-pink-500/20 hover:border-pink-400/40 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(236,72,153,0.25)] transition-all duration-300 cursor-default">
                                        <MdMic className="text-sm" /> Dub: {movie.episodeDub}/{movie.endEpisode}
                                    </div>
                                )}
                                {movie.hasVoice && (
                                    <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-300 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-[0_0_8px_rgba(249,115,22,0.1)] hover:bg-orange-500/20 hover:border-orange-400/40 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(249,115,22,0.25)] transition-all duration-300 cursor-default">
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
            </div>
        </Dialog>
    );
}
