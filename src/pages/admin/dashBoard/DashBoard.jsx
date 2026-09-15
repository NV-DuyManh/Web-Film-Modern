import React, { useContext, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PlanChart from './PlanChart';
import RevenueChart from './RevenueChart';
import { SubscriptionContext } from '../../../contexts/SubscriptionProvider';
import { PlanContext } from '../../../contexts/PlanProvider';
import { getObjectById } from '../../../services/firebaseResponse';
import { useMovies, useRentMovies } from '../../../hooks/useCollections';
import { getTop5Films, getTop5RentedFilms } from '../../../services/firebaseService';
import TopFilms from "./TopFilms";
import TopRents from "./TopRents";
import { UserContext } from '../../../contexts/UserProvider';
import DemographicChart from './DemographicChart';
import RentalChart from './RentalChart';
import CategoryChart from './CategoryChart';
import { CategoryContext } from '../../../contexts/CategoryProvider';

function DashBoard() {

    const subscriptions = useContext(SubscriptionContext);
    const plans = useContext(PlanContext);
    const users = useContext(UserContext);
    const categories = useContext(CategoryContext);
    
    const rentMovies = useRentMovies();
    const movies = useMovies();

    const [topFilms, setTopFilms] = useState([]);
    const [topRents, setTopRents] = useState([]);
    const [qoeData, setQoeData] = useState(null);

    const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

    useEffect(() => {

        const fetchTopFilms = async () => {
            const data = await getTop5Films();
            setTopFilms(data);
        };

        const fetchTopRents = async () => {
            const data = await getTop5RentedFilms();
            setTopRents(data);
        };

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

        fetchTopFilms();
        fetchTopRents();
        fetchQoE();

    }, [API_BASE_URL]);



    const total = useMemo(() => {

        const data = [];

        if (!subscriptions || !Array.isArray(subscriptions)) {
            return data;
        }

        subscriptions.forEach((element) => {

            const price = parseFloat(element.price) || 0;

            const index = data.findIndex(
                (item) => item.planID === element.planID
            );

            if (index === -1) {

                data.push({
                    planID: element.planID,
                    count: 1,
                    total: price
                });

            } else {

                data[index].count += 1;
                data[index].total += price;

            }

        });

        return data.map(p => {
            p.planID = getObjectById(plans, p.planID)?.name;
            return p;
        });

    }, [subscriptions]);


    const chartData = useMemo(() => {

        if (!subscriptions || !Array.isArray(subscriptions)) {
            return [];
        }

        const data = {};

        subscriptions.forEach((element) => {

            if (!element.startDate) {
                return;
            }


            let date;

            if (
                element.startDate &&
                typeof element.startDate.toDate === "function"
            ) {

                date = element.startDate.toDate();

            }

            else if (element.startDate instanceof Date) {

                date = element.startDate;

            }

            else {

                date = new Date(element.startDate);

            }


            if (isNaN(date.getTime())) {
                return;
            }


            const year = date.getFullYear();

            const month = String(
                date.getMonth() + 1
            ).padStart(2, "0");

            const day = String(
                date.getDate()
            ).padStart(2, "0");


            const dateKey =
                `${year}-${month}-${day}`;


            const price =
                parseFloat(element.price) || 0;


            if (!data[dateKey]) {

                data[dateKey] = {

                    date: dateKey,

                    revenue: 0

                };

            }


            data[dateKey].revenue += price;

        });


        const sortedData = Object.values(data).sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );

        if (sortedData.length > 0) {
            sortedData.unshift({ 
                date: "", 
                revenue: 0 
            });
        }

        return sortedData;

    }, [subscriptions]);


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
            

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div variants={itemVariants}>
                    <RevenueChart data={chartData} />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <RentalChart rentMovies={rentMovies} />
                </motion.div>
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
                            <p className="text-slate-400 text-xs font-semibold mb-1">Tỷ lệ giật/lag (Buffer Ratio)</p>
                            <p className="text-xl md:text-2xl font-black text-amber-400">
                                {(qoeData.bufferEventRatio * 100).toFixed(2)}%
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Mục tiêu &lt; 2.0%</p>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                            <p className="text-slate-400 text-xs font-semibold mb-1">Tỷ lệ xem trọn vẹn</p>
                            <p className="text-xl md:text-2xl font-black text-emerald-400">
                                {(qoeData.completionRate * 100).toFixed(1)}%
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Stream hoàn tất</p>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                            <p className="text-slate-400 text-xs font-semibold mb-1">Tiến độ xem trung bình</p>
                            <p className="text-xl md:text-2xl font-black text-cyan-400">
                                {qoeData.avgPlaybackProgressPercent}%
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Thời lượng xem / tập</p>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                            <p className="text-slate-400 text-xs font-semibold mb-1">Phiên phát đã phân tích</p>
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
                    <TopFilms films={topFilms} />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <TopRents films={topRents} />
                </motion.div>
            </div>

        </motion.div>
    );

}

export default DashBoard;