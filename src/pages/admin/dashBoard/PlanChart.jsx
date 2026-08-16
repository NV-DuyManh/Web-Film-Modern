import React from 'react';

import {
    ResponsiveContainer,
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Cell
} from 'recharts';


const RAINBOW_COLORS = [
    '#FF6B6B',
    '#FECA57',
    '#48DBFB',
    '#FF9FF3',
    '#54A0FF',
    '#5F27CD',
    '#01A3A4',
    '#FF6348',
    '#2ED573',
    '#FFA502',
];


const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
        <div
            style={{
                background: 'rgba(17, 24, 39, 0.9)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.2s ease',
            }}
        >
            <p style={{
                color: '#94a3b8',
                fontWeight: 600,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
            }}>
                {label}
            </p>

            {payload.map((entry, index) => (
                <div
                    key={index}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: entry.color || '#a5b4fc',
                            boxShadow: `0 0 8px ${entry.color || '#a5b4fc'}88`
                        }}
                    />
                    <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 500 }}>
                        {entry.name}:
                    </span>
                    <span style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>
                        {entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
};





function PlanChart({ data = [] }) {

    return (

        <div className="rounded-[14px] p-5 relative overflow-hidden h-full border border-white/5" style={{ background: 'rgba(15, 23, 42, 0.92)' }}>



            <div className="mb-4 relative">

                <div className="flex items-center gap-2">
                    <span style={{
                        fontSize: '22px',
                    }}>📊</span>

                    <h2 className="text-xl font-semibold text-gray-100">
                        Subscriptions by Plan
                    </h2>
                </div>

                <p className="text-sm text-gray-400 mt-1">
                    Number of subscriptions for each plan
                </p>

            </div>


            <div className="w-full h-56 [&_.recharts-wrapper]:outline-none [&_.recharts-wrapper]:outline-none! [&_svg]:outline-none! [&_div]:outline-none!">

                {data.length === 0 ? (

                    <div className="h-full flex items-center justify-center text-gray-500">

                        No subscription data available

                    </div>

                ) : (

                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >

                        <RechartsBarChart
                            data={data}
                            style={{ outline: 'none', cursor: 'pointer' }}
                            margin={{
                                top: 30,
                                right: 20,
                                left: 10,
                                bottom: 10
                            }}
                        >

                            <defs>
                                {RAINBOW_COLORS.map((color, index) => (
                                    <linearGradient
                                        key={`barGrad-${index}`}
                                        id={`barGrad-${index}`}
                                        x1="0" y1="0" x2="0" y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor={color}
                                            stopOpacity={1}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor={color}
                                            stopOpacity={0.6}
                                        />
                                    </linearGradient>
                                ))}
                            </defs>


                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.08)"
                                vertical={false}
                            />


                            <XAxis

                                dataKey="planID"

                                tick={{
                                    fontSize: 12,
                                    fill: '#94a3b8',
                                    fontWeight: 600,
                                }}



                                interval={0}

                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}

                                tickLine={false}

                            />


                            <YAxis
                                allowDecimals={false}
                                tick={{
                                    fontSize: 12,
                                    fill: '#64748b',
                                }}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, dataMax => Math.ceil(dataMax * 1.15)]}
                            />


                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: 'rgba(99, 102, 241, 0.08)', radius: 8 }}
                            />




                            <Bar
                                dataKey="count"
                                name="Subscriptions"
                                radius={[12, 12, 0, 0]}
                                barSize={60}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={`url(#barGrad-${index % RAINBOW_COLORS.length})`}
                                        style={{
                                            filter: `drop-shadow(0 4px 8px ${RAINBOW_COLORS[index % RAINBOW_COLORS.length]}44)`,
                                        }}
                                    />
                                ))}
                            </Bar>

                        </RechartsBarChart>

                    </ResponsiveContainer>

                )}

            </div>

        </div>

    );

}


export default PlanChart;