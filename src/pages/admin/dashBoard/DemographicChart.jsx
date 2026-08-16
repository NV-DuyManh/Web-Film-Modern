import React, { useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

const COLORS = ['#FF9FF3', '#54A0FF', '#FECA57', '#48DBFB'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
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
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: payload[0].payload.fill,
                        }}
                    />
                    <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 500 }}>
                        {payload[0].name}:
                    </span>
                    <span style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>
                        {payload[0].value} Users
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

function DemographicChart({ users = [] }) {
    const data = useMemo(() => {
        if (!users || users.length === 0) return [];

        const genderCount = {
            'Male': 0,
            'Female': 0,
            'Other': 0
        };

        users.forEach(user => {
            const gender = user.sexID || user.gender || 'Other';
            if (gender === 'Male' || gender === 'Female') {
                genderCount[gender] += 1;
            } else {
                genderCount['Other'] += 1;
            }
        });

        return [
            { name: 'Female', value: genderCount['Female'] },
            { name: 'Male', value: genderCount['Male'] },
            { name: 'Other', value: genderCount['Other'] },
        ].filter(item => item.value > 0);
    }, [users]);

    return (
        <div className="rounded-[14px] p-5 relative overflow-hidden h-full border border-white/5" style={{ background: 'rgba(15, 23, 42, 0.92)' }}>
            <div className="mb-4 relative">
                <div className="flex items-center gap-2">
                    <span style={{ fontSize: '22px' }}>👥</span>
                    <h2 className="text-xl font-semibold text-gray-100">
                        User Demographics
                    </h2>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                    Gender distribution across the platform
                </p>
            </div>

            <div className="w-full h-56 [&_*]:outline-none!">
                {data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        No user data available
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart style={{ outline: 'none', cursor: 'pointer' }}>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{
                                    fontSize: '12px',
                                    color: '#94a3b8',
                                    fontWeight: 500
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

export default DemographicChart;
