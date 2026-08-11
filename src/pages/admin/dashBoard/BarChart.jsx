import React from 'react';

import {
    ResponsiveContainer,
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';


function BarChart({ data = [] }) {

    console.log("BarChart:", data);


    return (

        <div className="bg-white rounded-xl shadow-md p-5">

            {/* =================================
                HEADER
            ================================== */}

            <div className="mb-4">

                <h2 className="text-xl font-semibold text-gray-800">
                    Subscriptions by Plan
                </h2>

                <p className="text-sm text-gray-500">
                    Number of subscriptions for each plan
                </p>

            </div>


            {/* =================================
                CHART
            ================================== */}

            <div className="w-full h-87.5">

                {data.length === 0 ? (

                    <div className="h-full flex items-center justify-center text-gray-400">

                        No subscription data available

                    </div>

                ) : (

                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >

                        <RechartsBarChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 20,
                                left: 10,
                                bottom: 60
                            }}
                        >

                            {/* GRID */}

                            <CartesianGrid
                                strokeDasharray="3 3"
                            />


                            {/* X AXIS */}

                            <XAxis

                                dataKey="planID"

                                tick={{
                                    fontSize: 11
                                }}

                                angle={-20}

                                textAnchor="end"

                                interval={0}

                            />


                            {/* Y AXIS */}

                            <YAxis
                                allowDecimals={false}
                            />


                            {/* TOOLTIP */}

                            <Tooltip

                                formatter={(value, name) => {

                                    if (
                                        name === "Subscriptions"
                                    ) {

                                        return [
                                            value,
                                            "Subscriptions"
                                        ];

                                    }

                                    return [
                                        value,
                                        name
                                    ];

                                }}

                            />


                            {/* LEGEND */}

                            <Legend />


                            {/* BAR */}

                            <Bar

                                dataKey="count"

                                name="Subscriptions"

                                radius={[
                                    6,
                                    6,
                                    0,
                                    0
                                ]}

                            />

                        </RechartsBarChart>

                    </ResponsiveContainer>

                )}

            </div>

        </div>

    );

}


export default BarChart;