import React from 'react';

import {
    ResponsiveContainer,
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';


function LineChart({ data = [] }) {

    console.log("LineChart:", data);


    return (

        <div className="bg-white rounded-xl shadow-md p-5">

            {/* =================================
                HEADER
            ================================== */}

            <div className="mb-4">

                <h2 className="text-xl font-semibold text-gray-800">
                    Revenue Overview
                </h2>

                <p className="text-sm text-gray-500">
                    Revenue generated over time
                </p>

            </div>


            {/* =================================
                CHART
            ================================== */}

            <div className="w-full h-87.5">

                {data.length === 0 ? (

                    <div className="h-full flex items-center justify-center text-gray-400">

                        No revenue data available

                    </div>

                ) : (

                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >

                        <RechartsLineChart

                            data={data}

                            margin={{
                                top: 10,
                                right: 20,
                                left: 10,
                                bottom: 10
                            }}

                        >

                            {/* GRID */}

                            <CartesianGrid
                                strokeDasharray="3 3"
                            />


                            {/* X AXIS */}

                            <XAxis

                                dataKey="date"

                                tick={{
                                    fontSize: 12
                                }}

                            />


                            {/* Y AXIS */}

                            <YAxis

                                tickFormatter={(value) =>
                                    `$${value}`
                                }

                            />


                            {/* TOOLTIP */}

                            <Tooltip

                                formatter={(value) => [

                                    `$${Number(value).toFixed(2)}`,

                                    "Revenue"

                                ]}

                            />


                            {/* LEGEND */}

                            <Legend />


                            {/* LINE */}

                            <Line

                                type="monotone"

                                dataKey="revenue"

                                name="Revenue"

                                strokeWidth={3}

                                dot={{
                                    r: 5
                                }}

                                activeDot={{
                                    r: 8
                                }}

                            />

                        </RechartsLineChart>

                    </ResponsiveContainer>

                )}

            </div>

        </div>

    );

}


export default LineChart;