import React, { useMemo } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';

const RAINBOW_COLORS = [
    '#FF6B6B',
    '#FECA57',
    '#48DBFB',
    '#FF9FF3',
    '#54A0FF',
];

const CustomCursor = (props) => {
    const { points, payload } = props;
    if (payload && payload.length > 0 && payload[0].payload.date === "") return null;
    if (!points || points.length < 2) return null;
    return (
        <line
            x1={points[0].x}
            y1={points[0].y}
            x2={points[1].x}
            y2={points[1].y}
            stroke="#a5b4fc"
            strokeWidth={1}
            strokeDasharray="4 4"
        />
    );
};

const CustomDot = (props) => {
    const { cx, cy, index, payload } = props;

    if (index === 0 || (payload && payload.date === "")) return null;

    const colors = [
        '#FF9FF3', '#54A0FF', '#48DBFB',
        '#FECA57', '#FF6B6B'
    ];

    const color = colors[index % colors.length];

    return (
        <g>
            <circle cx={cx} cy={cy} r={10} fill={color} opacity={0.2} />
            <circle cx={cx} cy={cy} r={6} fill="#fff" stroke={color} strokeWidth={3} />
            <circle cx={cx} cy={cy} r={3} fill={color} />
        </g>
    );
};

const CustomActiveDot = (props) => {
    const { cx, cy, index, payload } = props;

    if (index === 0 || (payload && payload.date === "")) return null;

    const colors = [
        '#FF9FF3', '#54A0FF', '#48DBFB',
        '#FECA57', '#FF6B6B'
    ];

    const color = colors[index % colors.length];

    return (
        <g>
            <circle cx={cx} cy={cy} r={12} fill={color} opacity={0.15} />
            <circle cx={cx} cy={cy} r={6} fill="#fff" stroke={color} strokeWidth={2} />
            <circle cx={cx} cy={cy} r={3} fill={color} />
        </g>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        if (payload[0].payload.date === "") return null;
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
                                background: entry.color,
                            }} 
                        />
                        <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 500 }}>
                            {entry.name}:
                        </span>
                        <span style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>
                            ${Number(entry.value).toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

function RentalChart({ rentMovies = [] }) {
    const data = useMemo(() => {
        const mergedData = {};

        const processItem = (item, type) => {
            let rawDate = item.startDate || item.createdAt;
            if (!rawDate) return;
            
            let date;
            if (rawDate && typeof rawDate.toDate === "function") {
                date = rawDate.toDate();
            } else if (rawDate instanceof Date) {
                date = rawDate;
            } else {
                date = new Date(rawDate);
            }

            if (isNaN(date.getTime())) return;
            
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const price = parseFloat(item.price) || 0;

            if (!mergedData[dateKey]) {
                mergedData[dateKey] = { date: dateKey, rents: 0 };
            }
            mergedData[dateKey][type] += price;
        };

        if (Array.isArray(rentMovies)) {
            rentMovies.forEach(rent => processItem(rent, 'rents'));
        }

        const sortedData = Object.values(mergedData).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (sortedData.length > 0) {
            sortedData.unshift({ date: "", rents: 0 });
        }

        return sortedData;
    }, [rentMovies]);

    return (
        <div className="rounded-[14px] p-5 relative overflow-hidden h-full border border-white/5" style={{ background: 'rgba(15, 23, 42, 0.92)' }}>
            <div className="mb-4 relative">
                <div className="flex items-center gap-2">
                    <span style={{ fontSize: '22px' }}>💰</span>
                    <h2 className="text-xl font-semibold text-gray-100">
                        Rental Revenue
                    </h2>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                    Revenue from rented movies
                </p>
            </div>

            <div className="w-full h-56 [&_*]:!outline-none">
                {data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        No revenue data available
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            style={{ outline: 'none', cursor: 'pointer' }}
                            margin={{ top: 30, right: 20, left: 10, bottom: 10 }}
                        >
                            <defs>
                                <linearGradient
                                    id="rentRainbowLine"
                                    x1="0" y1="0" x2="1" y2="0"
                                >
                                    <stop offset="0%" stopColor="#FF9FF3" />
                                    <stop offset="25%" stopColor="#54A0FF" />
                                    <stop offset="50%" stopColor="#48DBFB" />
                                    <stop offset="75%" stopColor="#FECA57" />
                                    <stop offset="100%" stopColor="#FF6B6B" />
                                </linearGradient>

                                <linearGradient
                                    id="rentRainbowFill"
                                    x1="0" y1="0" x2="1" y2="1"
                                >
                                    <stop offset="0%" stopColor="#FF9FF3" stopOpacity={0.3} />
                                    <stop offset="25%" stopColor="#54A0FF" stopOpacity={0.2} />
                                    <stop offset="50%" stopColor="#48DBFB" stopOpacity={0.15} />
                                    <stop offset="75%" stopColor="#FECA57" stopOpacity={0.1} />
                                    <stop offset="100%" stopColor="#FF6B6B" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                            
                            <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                tickLine={false}
                            />
                            
                            <YAxis 
                                tickFormatter={(value) => `$${value}`}
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, dataMax => Math.ceil(dataMax * 1.15)]}
                            />
                            
                            <Tooltip content={<CustomTooltip />} cursor={<CustomCursor />} />
                            
                            
                            <Area 
                                type="monotone"
                                dataKey="rents" 
                                name="Rentals" 
                                stroke="url(#rentRainbowLine)"
                                strokeWidth={4}
                                fill="url(#rentRainbowFill)"
                                dot={<CustomDot />}
                                activeDot={<CustomActiveDot />}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

export default RentalChart;
