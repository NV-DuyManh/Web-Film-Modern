import { fetchDocumentsRealtime } from '../../../../services/firebaseService';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Slide } from '@mui/material';
import { FaTimesCircle, FaStar, FaGlobe, FaClock, FaCalendarAlt, FaTv, FaCrown, FaFilm, FaUserTie, FaUsers, FaUserNinja, FaMoneyBillWave, FaEdit } from 'react-icons/fa';
import { MdOutlineSubtitles, MdMic, MdOutlineVoiceChat } from 'react-icons/md';
import { BiSolidCategoryAlt } from 'react-icons/bi';

import { CategoryContext } from '../../../../contexts/CategoryProvider';
import { PlanContext } from '../../../../contexts/PlanProvider';
import { CategoryTypeContext } from '../../../../contexts/CategoryTypeProvider';
import Logo5 from "../../../../assets/Logo5.png";
import { getDefaultAvatar, getSafeEntityAvatar, OTHER_AVATAR } from '../../../../utils/appUtils';

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);


function NeonBadge({ icon: Icon, text, color = "cyan" }) {
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
        <div className={`flex items-center gap-2 bg-linear-to- ${colorMap[color]} px-3.5 py-2 rounded-xl border text-sm font-bold backdrop-blur-sm hover:-translate-y-1 transition-all duration-300 cursor-default`}>
            {Icon && <Icon className="text-sm" />} <p className="inline">{text}</p>
        </div>
    );
}

function GlowCard({ title, icon: Icon, color = "cyan", children }) {
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
        <div className={`bg-white/3 backdrop-blur-sm rounded-2xl border ${c.border} ${c.glow} p-4 transition-all duration-500`}>
            <div className="flex items-center gap-2.5 mb-3">
                <div className={`${c.iconBg} p-1.5 rounded-lg`}>
                    <Icon className={`${c.title} text-sm`} />
                </div>
                <h4 className={`${c.title} text-[11px] font-bold uppercase tracking-[0.15em]`}>{title}</h4>
            </div>
            {children}
        </div>
    );
}

function AvatarItem({ entity, fallback, color, entityType, handleClose }) {
    const [hovered, setHovered] = React.useState(false);
    const navigate = useNavigate();
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
            className="relative cursor-pointer"
            onClick={() => { if (entityType) { navigate(`/${entityType}?search=${encodeURIComponent(entity.name)}`); } }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <img
                src={getSafeEntityAvatar(entity.imgUrl, entity.sexID)}
                alt={entity.name}
                className={`w-10 h-10 rounded-full object-cover border-2 ${g.base} transition-all duration-300 ${hovered ? g.active : ''}`}
                onError={(e) => { e.target.onerror = null; e.target.src = getDefaultAvatar(entity.sexID); }}
            />
            <div className={`absolute -bottom-7 left-1/2 -translate-x-1/2 ${tipBg[color]} text-white text-[9px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap transition-all duration-200 pointer-events-none z-30 shadow-lg ${hovered ? 'opacity-100' : 'opacity-0'}`}>
                {entity.name}
            </div>
        </div>
    );
}

function AvatarRow({ items, list, fallback, color = "cyan", entityType, handleClose }) {
    if (!items || items.length === 0) return <p className="text-gray-600 text-xs italic inline">N/A</p>;

    return (
        <div className="flex flex-wrap gap-2.5">
            {items.map((id, idx) => {
                const entity = list?.find(e => e.id === id);
                if (!entity) return null;
                return <AvatarItem key={idx} entity={entity} fallback={fallback} color={color} entityType={entityType} handleClose={handleClose} />;
            })}
        </div>
    );
}


function ModalViewMovie({ open, handleClose, movie, onEdit }) {
    const navigate = useNavigate();
    const categoryTypes = useContext(CategoryTypeContext);
    const [actors, setActors] = useState([]);
    useEffect(() => { const unsub = fetchDocumentsRealtime("Actors", setActors); return () => unsub(); }, []);
    const categoriesList = useContext(CategoryContext);
    const [authors, setAuthors] = useState([]);
    useEffect(() => { const unsub = fetchDocumentsRealtime("Authors", setAuthors); return () => unsub(); }, []);
    const [characters, setCharacters] = useState([]);
    useEffect(() => { const unsub = fetchDocumentsRealtime("Characters", setCharacters); return () => unsub(); }, []);
    const plansList = useContext(PlanContext);

    if (!movie) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case "Sắp chiếu": return "orange";
            case "Đang chiếu": return "green";
            case "Hoàn thành": return "cyan";
            default: return "slate";
        }
    };

    const currentPlan = plansList?.find(p => p.id === movie.planID);
    const currentCategoryType = categoryTypes?.find(c => c.id === movie.categoryTypeID);

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
                <div className="absolute inset-0 rounded-3xl pointer-events-none z-1" style={{
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


                <div className="absolute inset-0 rounded-3xl pointer-events-none z-21" style={{
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

                <div className="absolute top-5 right-5 z-30 flex gap-3">
                    <button
                        onClick={() => navigate(`/episodes?movie=${movie.slug || movie.otherName || movie.id}`)}
                        className="w-10 h-10 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/30 hover:scale-110 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all duration-500 cursor-pointer"
                    >
                        <FaTv size={18} />
                    </button>
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="w-10 h-10 rounded-full bg-blue-500/10 backdrop-blur-md border border-blue-500/20 flex items-center justify-center text-blue-400 hover:text-blue-200 hover:border-blue-400 hover:bg-blue-500/30 hover:scale-110 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all duration-500 cursor-pointer"
                        >
                            <FaEdit size={18} />
                        </button>
                    )}
                    <button
                        onClick={handleClose}
                        className="w-10 h-10 rounded-full bg-red-500/10 backdrop-blur-md border border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-200 hover:border-red-400 hover:bg-red-500/30 hover:rotate-90 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all duration-500 cursor-pointer"
                    >
                        <FaTimesCircle size={20} />
                    </button>
                </div>

                <div className="movie-view-modal w-[calc(100%-12px)] mx-auto my-1.5 rounded-3xl overflow-y-auto overflow-x-hidden custom-scrollbar relative z-5 flex-1 p-0.5">

                    <div className="relative w-full h-55 overflow-hidden rounded-t-[22px]">
                        <img
                            src={movie.bannerUrl || movie.imgUrl}
                            alt="banner"
                            className="w-full h-full object-cover"
                            style={{ filter: 'brightness(0.4) saturate(1.3)' }}
                        />
                        <div className="absolute inset-0 bg-linear-to- from-[#0a0f1e] via-transparent to-transparent"></div>
                        <div className="absolute inset-0 bg-linear-to- from-[#0a0f1e]/60 via-transparent to-[#0a0f1e]/60"></div>

                    </div>

                    <div className="relative px-8 -mt-28 z-20 flex gap-7 items-end">
                        <div className="relative shrink-0 group cursor-pointer">
                            <div className="absolute -inset-1 bg-linear-to- from-cyan-500 via-purple-500 to-pink-500 rounded-2xl opacity-50 blur-md group-hover:opacity-100 group-hover:blur-xl transition-all duration-700"></div>
                            <div className="relative z-10 group-hover:-translate-y-4 group-hover:scale-105 transition-all duration-500">
                                {movie.isHot && (
                                    <div className="magic-fire-container absolute -top-8 -right-3 scale-[1.3] z-30">
                                        <div className="magic-fire"></div>
                                        <div className="magic-spark"></div>
                                        <div className="magic-spark"></div>
                                        <div className="magic-spark"></div>
                                    </div>
                                )}
                                <img
                                    src={movie.imgUrl}
                                    alt={movie.name}
                                    className="w-42.5 aspect- object-cover rounded-2xl border-2 border-white/20 shadow-2xl"
                                />
                            </div>
                        </div>

                        <div className="flex-1 pb-3">
                            <h2 className="text-2xl md:text-4xl font-black glow-text tracking-tight mb-2" style={{ paddingBottom: '0.1em' }}>
                                {movie.otherName || movie.name}
                            </h2>
                            {movie.otherName && (
                                <p className="text-gray-400 text-sm italic font-medium mb-3">{movie.name}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {currentPlan && <NeonBadge icon={FaCrown} text={currentPlan.name} color="rose" />}
                                <NeonBadge text={movie.status} color={getStatusColor(movie.status)} />
                                {currentCategoryType && <NeonBadge icon={FaFilm} text={currentCategoryType.name} color="blue" />}
                                <NeonBadge text={movie.ageRating} color="red" />
                                <NeonBadge icon={FaCalendarAlt} text={movie.releaseYear} color="indigo" />
                                <NeonBadge icon={FaClock} text={movie.duration ? `${movie.duration} min` : "N/A"} color="yellow" />
                                <NeonBadge icon={FaTv} text={`${movie.endEpisode} Eps`} color="fuchsia" />
                                {movie.countriesID && <NeonBadge icon={FaGlobe} text={movie.countriesID} color="emerald" />}
                            </div>
                        </div>
                    </div>

                    <div className="px-8 pt-6 pb-8 space-y-5">
                        <div className="relative bg-white/2 rounded-2xl border border-white/5 p-5 overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-linear-to- from-cyan-500 via-purple-500 to-pink-500 rounded-l-full"></div>
                            <p className="text-gray-300/90 text-sm leading-relaxed pl-4 max-h-22.5 overflow-y-auto custom-scrollbar">
                                {movie.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <GlowCard title="Categories" icon={BiSolidCategoryAlt} color="purple">
                                <div className="flex flex-wrap gap-2">
                                    {movie.listCategory?.map((catId, idx) => {
                                        const cat = categoriesList?.find(c => c.id === catId);
                                        return cat ? (
                                            <p key={idx} className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/25 rounded-lg text-[11px] font-bold tracking-wide uppercase hover:bg-purple-500/20 hover:border-purple-400/40 hover:-translate-y-1 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all duration-300 cursor-default inline">
                                                {cat.name}
                                            </p>
                                        ) : null;
                                    })}
                                    {(!movie.listCategory || movie.listCategory.length === 0) && <p className="text-gray-600 text-xs italic inline">None</p>}
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
                                    {(!movie.hasSub && !movie.hasDub && !movie.hasVoice) && <p className="text-gray-600 text-xs italic inline">No episodes</p>}
                                </div>
                            </GlowCard>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <GlowCard title="Directors" icon={FaUserTie} color="yellow">
                                <AvatarRow items={movie.listAuthor} list={authors} fallback={Logo5} color="yellow" entityType="authors" handleClose={handleClose} />
                            </GlowCard>
                            <GlowCard title="Actors" icon={FaUsers} color="pink">
                                <AvatarRow items={movie.listActor} list={actors} fallback={Logo5} color="pink" entityType="actors" handleClose={handleClose} />
                            </GlowCard>
                            <GlowCard title="Characters" icon={FaUserNinja} color="green">
                                <AvatarRow items={movie.listCharacter} list={characters} fallback={Logo5} color="green" entityType="characters" handleClose={handleClose} />
                            </GlowCard>
                        </div>

                        <div className="relative overflow-hidden bg-linear-to- from-slate-800/50 via-slate-800/30 to-slate-800/50 rounded-2xl border border-white/5 p-4 flex items-center justify-between">
                            <div className="absolute inset-0 bg-linear-to- from-transparent via-cyan-500/5 to-transparent animate-pulse pointer-events-none"></div>
                            <div className="flex items-center gap-3 z-10">
                                <div className="bg-yellow-500/10 p-2 rounded-xl">
                                    <FaMoneyBillWave className="text-yellow-400 text-lg" />
                                </div>
                                <p className="text-gray-400 text-xs uppercase tracking-[0.15em] font-bold inline">Rent Price</p>
                            </div>
                            <p className="text-yellow-400 font-black text-xl z-10 inline" style={{ textShadow: '0 0 15px rgba(234,179,8,0.4)' }}>
                                {movie.rent > 0 ? `${Number(movie.rent).toLocaleString()} ₫` : 'Free'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}

export default ModalViewMovie;
