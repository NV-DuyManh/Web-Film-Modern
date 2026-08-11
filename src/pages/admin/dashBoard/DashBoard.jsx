import React, { useContext, useEffect, useMemo, useState } from 'react';
import BarChart from './BarChart';
import LineChart from './LineChart';
import { SubscriptionContext } from '../../../contexts/SubscriptionProvider';
import { PlanContext } from '../../../contexts/PlanProvider';
import { getObjectById } from '../../../services/firebaseResponse';
import { useMovies } from '../../../hooks/useCollections';
import { getTop5Films } from '../../../services/firebaseService';
import TopFilms from "./TopFilms";

function DashBoard() {

    const subscriptions = useContext(SubscriptionContext);
    const plans = useContext(PlanContext);
    const [topFilms, setTopFilms] = useState([]);

    useEffect(() => {

        const fetchTopFilms = async () => {

            const data = await getTop5Films();

            setTopFilms(data);

        };

        fetchTopFilms();

    }, []);
    console.log(topFilms);


    // =========================================================
    // BAR CHART DATA
    // Thống kê số lượng subscription + tổng tiền theo plan
    // =========================================================

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


    // =========================================================
    // LINE CHART DATA
    // Thống kê doanh thu theo ngày
    // =========================================================

    const chartData = useMemo(() => {

        if (!subscriptions || !Array.isArray(subscriptions)) {
            return [];
        }

        const data = {};

        subscriptions.forEach((element) => {

            if (!element.startDate) {
                return;
            }


            // -------------------------------------------------
            // FIRESTORE TIMESTAMP
            // -------------------------------------------------

            let date;

            if (
                element.startDate &&
                typeof element.startDate.toDate === "function"
            ) {

                date = element.startDate.toDate();

            }

            // -------------------------------------------------
            // JAVASCRIPT DATE
            // -------------------------------------------------

            else if (element.startDate instanceof Date) {

                date = element.startDate;

            }

            // -------------------------------------------------
            // STRING / NUMBER
            // -------------------------------------------------

            else {

                date = new Date(element.startDate);

            }


            // -------------------------------------------------
            // CHECK DATE
            // -------------------------------------------------

            if (isNaN(date.getTime())) {

                console.log(
                    "Invalid startDate:",
                    element.startDate
                );

                return;

            }


            // -------------------------------------------------
            // GET LOCAL DATE
            // -------------------------------------------------

            const year = date.getFullYear();

            const month = String(
                date.getMonth() + 1
            ).padStart(2, "0");

            const day = String(
                date.getDate()
            ).padStart(2, "0");


            const dateKey =
                `${year}-${month}-${day}`;


            // -------------------------------------------------
            // GET PRICE
            // -------------------------------------------------

            const price =
                parseFloat(element.price) || 0;


            // -------------------------------------------------
            // CREATE DATA
            // -------------------------------------------------

            if (!data[dateKey]) {

                data[dateKey] = {

                    date: dateKey,

                    revenue: 0

                };

            }


            data[dateKey].revenue += price;

        });


        // -----------------------------------------------------
        // SORT BY DATE
        // -----------------------------------------------------

        return Object.values(data).sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );

    }, [subscriptions]);


    console.log("Bar Chart Data:", total);

    console.log("Line Chart Data:", chartData);


    return (

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">

            {/* =========================
                BAR CHART
            ========================== */}

            <div>
                <BarChart
                    data={total}
                />
            </div>


            {/* =========================
                LINE CHART
            ========================== */}

            <div>
                <LineChart
                    data={chartData}
                />
            </div>
            <div className="md:col-span-2">
                <TopFilms films={topFilms} />
            </div>

        </div>

    );

}

export default DashBoard;