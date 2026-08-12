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

    useEffect(() => {

        const fetchTopFilms = async () => {

            const data = await getTop5Films();

            setTopFilms(data);

        };

        const fetchTopRents = async () => {

            const data = await getTop5RentedFilms();

            setTopRents(data);

        };

        fetchTopFilms();
        fetchTopRents();

    }, []);


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


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <motion.div variants={itemVariants}>
                    <CategoryChart movies={movies} categories={categories} />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <PlanChart data={total} />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <DemographicChart users={users} />
                </motion.div>
            </div>



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