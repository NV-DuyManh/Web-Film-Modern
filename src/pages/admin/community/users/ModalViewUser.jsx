import React, { useContext, useMemo, useState } from 'react';
import { useSubscriptions } from '../../../../hooks/useCollections';
import { Dialog, Slide } from '@mui/material';
import { FaTimesCircle, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBirthdayCake, FaVenusMars, FaCrown, FaKey, FaShieldAlt, FaEye, FaEyeSlash, FaIdBadge } from 'react-icons/fa';

import { PlanContext } from '../../../../contexts/PlanProvider';
import { getObjectById } from '../../../../services/firebaseResponse';
import { getOptimizedUrl } from '../../../../utils/cloudinary';
import { getUserPlanInfo } from '../../../../utils/appUtils';

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
        <div className={`flex items-center gap-1.5 bg-linear-to-r ${colorMap[color]} px-2.5 py-1 rounded-lg border text-xs font-bold backdrop-blur-sm hover:-translate-y-0.5 transition-all duration-300 cursor-default`}>
            {Icon && <Icon className="text-[11px]" />} <p className="inline tracking-wide">{text}</p>
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
        rose: { border: "border-rose-500/20 hover:border-rose-500/50", title: "text-rose-400", glow: "hover:shadow-[0_0_25px_rgba(244,63,94,0.12)]", iconBg: "bg-rose-500/10" },
    };
    const c = colorMap[color] || colorMap.cyan;
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

function ModalViewUser({ open, handleClose, user }) {
    const subscriptions = useSubscriptions() || [];
    const plans = useContext(PlanContext) || [];
    const [showPassword, setShowPassword] = useState(false);

    const EmptyText = () => <span className="text-slate-500 italic text-[13px] font-normal tracking-wide">Not provided</span>;

    const currentPlanInfo = useMemo(() => {
        return getUserPlanInfo(user, subscriptions, plans);
    }, [user, subscriptions, plans]);

    const avatarGlowMap = {
        cyan: "ring-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.6)]",
        yellow: "ring-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.6)]",
        red: "ring-red-500 shadow-[0_0_40px_rgba(239,68,68,0.6)]",
        rose: "ring-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.6)]",
        blue: "ring-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.6)]",
        emerald: "ring-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.6)]",
        purple: "ring-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.6)]",
        pink: "ring-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.6)]",
        fuchsia: "ring-fuchsia-500 shadow-[0_0_40px_rgba(217,70,239,0.6)]",
    };

    if (!user) return null;

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            onClose={handleClose}
            className="modal-wrapper"
            PaperProps={{ className: "modal-inner !bg-slate-950 !rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden" }}
            BackdropProps={{ className: "modal-backdrop-x backdrop-blur-md" }}
            maxWidth="md"
            fullWidth
        >
            <div className="relative">
                <div className="h-32 bg-linear-to-r from-blue-900/40 via-purple-900/40 to-pink-900/40 relative">
                    <div className="absolute inset-0 opacity-30 mix-blend-overlay"></div>
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-white/50 hover:text-red-400 hover:rotate-90 hover:scale-110 transition-all duration-300 z-10 bg-black/20 rounded-full p-1"
                    >
                        <FaTimesCircle size={28} />
                    </button>
                </div>

                <div className="px-8 pb-8 -mt-16 relative z-10">
                    <div className="flex flex-col md:flex-row gap-6 items-end md:items-center mb-8">
                        <div className="relative shrink-0">
                            {user.role === 'admin' && (
                                <>
                                    <div className="absolute -inset-2.5 rounded-full border-2 border-dashed border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-[spin_6s_linear_infinite] pointer-events-none z-0"></div>
                                    <div className="absolute -inset-5 rounded-full border-4 border-dotted border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-[spin_4s_linear_infinite_reverse] pointer-events-none z-0"></div>
                                </>
                            )}
                            <div className={`w-32 h-32 rounded-full border-4 border-slate-950 overflow-hidden relative group bg-slate-900 ring-4 ring-offset-4 ring-offset-slate-950 ${avatarGlowMap[currentPlanInfo.theme] || avatarGlowMap.blue} transition-all duration-700 z-10`}>
                                <img
                                    src={getOptimizedUrl(user.avatarUrl, 400, 400)}
                                    alt={user.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 rounded-full ring-inset ring-1 ring-white/10 pointer-events-none"></div>
                            </div>
                        </div>

                        <div className="flex-1 pb-2">
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
                                {user.name || "Unknown User"}
                                {user.role === 'admin' && <FaCrown className="text-amber-400 text-xl animate-pulse" title="Admin" />}
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                <NeonBadge icon={FaIdBadge} text={`ID: ${user.tableIndex || user.id.substring(0, 5)}`} color="emerald" />
                                <NeonBadge icon={FaCrown} text={`${currentPlanInfo.name} PACKAGE`} color={currentPlanInfo.theme} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GlowCard title="Email Address" icon={FaEnvelope} color="cyan">
                            <p className="text-slate-200 font-medium truncate">{user.email || <EmptyText />}</p>
                        </GlowCard>

                        <GlowCard title="Phone Number" icon={FaPhone} color="emerald">
                            <p className="text-slate-200 font-medium">{user.phone || <EmptyText />}</p>
                        </GlowCard>

                        <GlowCard title="Address" icon={FaMapMarkerAlt} color="purple">
                            <p className="text-slate-200 font-medium truncate">{user.address || <EmptyText />}</p>
                        </GlowCard>

                        <GlowCard title="Date of Birth" icon={FaBirthdayCake} color="pink">
                            <p className="text-slate-200 font-medium">{user.dateOfBirth || <EmptyText />}</p>
                        </GlowCard>

                        <GlowCard title="Gender" icon={FaVenusMars} color="yellow">
                            <p className="text-slate-200 font-medium">
                                {user.sexID === 'Male' ? 'Male' : user.sexID === 'Female' ? 'Female' : user.sexID === 'Other' ? 'Other' : <EmptyText />}
                            </p>
                        </GlowCard>

                        <GlowCard title="Security" icon={FaShieldAlt} color="rose">
                            <div className="flex items-center justify-between gap-2 text-slate-200 font-medium">
                                <div className="flex items-center gap-2">
                                    <FaKey className="text-slate-400" />
                                    <span className={showPassword ? "" : "tracking-widest"}>
                                        {user.password ? (showPassword ? user.password : '••••••••') : <EmptyText />}
                                    </span>
                                </div>
                                {user.password && (
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                    </button>
                                )}
                            </div>
                        </GlowCard>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}

export default ModalViewUser;
