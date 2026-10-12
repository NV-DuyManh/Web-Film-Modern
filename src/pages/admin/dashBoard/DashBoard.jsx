import { completedPayments } from '../../../utils/adminRevenue';
import { monthlyRevenue, membershipMix, movieOrigins, genreMix, libraryPlans } from '../../../utils/dashboardCharts';
import { MembershipChart, OriginsChart, GenreChart, LibraryPlanChart } from './DashboardCharts';
import { PlanContext } from '../../../contexts/PlanProvider';
import { CategoryContext } from '../../../contexts/CategoryProvider';
import { CategoryTypeContext } from '../../../contexts/CategoryTypeProvider';
import { getUserPlanInfo } from '../../../utils/appUtils';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import RevenueChart from './RevenueChart';
import { SubscriptionContext } from '../../../contexts/SubscriptionProvider';
import { useRentMovies, useMovies } from '../../../hooks/useCollections';
import useDashboardRankings from '../../../hooks/useDashboardRankings';
import TopFilms from "./TopFilms";
import TopRents from "./TopRents";
import RentalChart from './RentalChart';
import DashboardStats from './DashboardStats';
import { UserContext } from '../../../contexts/UserProvider';
import useMovieIndex from '../../../hooks/useMovieIndex';
import useCatalogStatus from '../../../hooks/useCatalogStatus';

const REVENUE_PERIOD = { from: '', to: '', currency: 'USD' };

function DashBoard() {

    const allSubscriptions = useContext(SubscriptionContext);
    const users = useContext(UserContext);
    const movies = useMovieIndex();
    const movieStatus = useCatalogStatus('MovieIndex');
    const library = useMovies();
    const libraryStatus = useCatalogStatus('Movies');
    const plans = useContext(PlanContext) || [];
    const categories = useContext(CategoryContext) || [];
    const types = useContext(CategoryTypeContext) || [];
    const plansStatus = useCatalogStatus('Plans');
    const userStatus = useCatalogStatus('Users');
    const subscriptionStatus = useCatalogStatus('Subscriptions');
    const rentalStatus = useCatalogStatus('RentMovies');
    const categoryStatus = useCatalogStatus('Categories');
    const typeStatus = useCatalogStatus('CategoryTypes');
    const period = REVENUE_PERIOD;
    const subscriptions = useMemo(() => completedPayments(allSubscriptions, period), [allSubscriptions, period]);

    const allRents = useRentMovies();
    const rentMovies = useMemo(() => completedPayments(allRents, period), [allRents, period]);

    const { topFilms, topRents, filmsLoading, filmsError, rentsLoading, rentsError } = useDashboardRankings(allRents);
    const [qoeData, setQoeData] = useState(null);

    const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

    useEffect(() => {

        const fetchQoE = async () => {
            try {
                const res = await fetch(`${API_BASE_URL.replace(/\/+$/, '')}/analytics/qoe`);
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.metrics) {
                        setQoeData(json.metrics);
                    }
                }
            } catch {
                // Silently ignore if analytics backend is not available
            }
        };

        fetchQoE();

    }, [API_BASE_URL]);






    const chartData = useMemo(() => monthlyRevenue(subscriptions, rentMovies), [subscriptions, rentMovies]);
    const mixData = useMemo(() => membershipMix(users || [], user => getUserPlanInfo(user, allSubscriptions || [], plans)), [users, allSubscriptions, plans]);
    const originsData = useMemo(() => movieOrigins(library), [library]);
    const genresData = useMemo(() => genreMix(library, categories, types), [library, categories, types]);
    const libraryPlanData = useMemo(() => libraryPlans(library, plans), [library, plans]);
    const pending = status => !['ready', 'error'].includes(status.status);
    const libraryLoading = pending(libraryStatus) && !library.length;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 80,
                damping: 15
            }
        }
    };

    return (
        <motion.div
            className="flex flex-col gap-4 p-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >


            <DashboardStats period={period} subscriptions={subscriptions} rentals={rentMovies} movieCount={movieStatus.status === 'ready' ? movies.length : null} userCount={users?.length} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div variants={itemVariants}>
                    <RevenueChart data={chartData} currency={period.currency} loading={pending(subscriptionStatus) || pending(rentalStatus)} error={subscriptionStatus.status === 'error' || rentalStatus.status === 'error'} />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <RentalChart rentMovies={rentMovies} currency={period.currency} />
                </motion.div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div variants={itemVariants}><MembershipChart data={mixData} loading={pending(plansStatus) || pending(subscriptionStatus) || (pending(userStatus) && !users?.length)} error={plansStatus.status === 'error' || userStatus.status === 'error'} /></motion.div>
                <motion.div variants={itemVariants}><OriginsChart data={originsData} loading={libraryLoading} error={libraryStatus.status === 'error'} /></motion.div>
                <motion.div variants={itemVariants}><GenreChart data={genresData} loading={libraryLoading || (pending(categoryStatus) && !categories.length) || (pending(typeStatus) && !types.length)} error={libraryStatus.status === 'error'} /></motion.div>
                <motion.div variants={itemVariants}><LibraryPlanChart data={libraryPlanData} loading={libraryLoading || pending(plansStatus)} error={libraryStatus.status === 'error' || plansStatus.status === 'error'} /></motion.div>
            </div>

            {qoeData && (
                <motion.div variants={itemVariants} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <h3 className="font-bold text-white text-base md:text-lg">
                                Streaming QoE Analytics (Big Data Telemetry)
                            </h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            qoeData.healthStatus === 'HEALTHY'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                            STATUS: {qoeData.healthStatus}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                            <p className="text-slate-400 text-xs font-semibold mb-1">Buffer event ratio</p>
                            <p className="text-xl md:text-2xl font-black text-amber-400">
                                {(qoeData.bufferEventRatio * 100).toFixed(2)}%
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Target &lt; 2.0%</p>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                            <p className="text-slate-400 text-xs font-semibold mb-1">Completion rate</p>
                            <p className="text-xl md:text-2xl font-black text-emerald-400">
                                {(qoeData.completionRate * 100).toFixed(1)}%
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Completed streams</p>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                            <p className="text-slate-400 text-xs font-semibold mb-1">Average playback progress</p>
                            <p className="text-xl md:text-2xl font-black text-cyan-400">
                                {qoeData.avgPlaybackProgressPercent}%
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Watch time per episode</p>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                            <p className="text-slate-400 text-xs font-semibold mb-1">Streams analyzed</p>
                            <p className="text-xl md:text-2xl font-black text-white">
                                {Number(qoeData.totalStreamsAnalyzed).toLocaleString('vi-VN')}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Rolling window</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <motion.div variants={itemVariants}>
                    <TopFilms films={topFilms} loading={filmsLoading} error={filmsError} />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <TopRents films={topRents} loading={rentsLoading} error={rentsError} />
                </motion.div>
            </div>

        </motion.div>
    );

}

export default DashBoard;
