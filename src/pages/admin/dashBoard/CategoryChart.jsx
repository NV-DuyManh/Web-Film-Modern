import React, { useMemo } from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

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
                    transition: 'all 0.2s ease',
                }}
            >
                <p style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                    {payload[0].payload.category}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: payload[0].color || '#48DBFB',
                        }}
                    />
                    <span style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>
                        {payload[0].value.toLocaleString()} Views
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

function CategoryChart({ movies = [], categories = [] }) {
    const data = useMemo(() => {
        if (!movies || movies.length === 0) return [];

        const categoryViews = {};

        const resolveCategoryName = (catId) => {
            if (!categories || categories.length === 0) return catId;
            const found = categories.find(c => c.id === catId);
            return found ? found.name : catId;
        };

        movies.forEach(movie => {
            const views = parseInt(movie.views || movie.view, 10) || 0;
            if (movie.listCategory && Array.isArray(movie.listCategory)) {
                movie.listCategory.forEach(cat => {
                    let catName = typeof cat === 'string' ? cat.trim() : cat.name;
                    catName = resolveCategoryName(catName);
                    if (catName) {
                        categoryViews[catName] = (categoryViews[catName] || 0) + views;
                    }
                });
            } else if (typeof movie.listCategory === 'string') {
                const cats = movie.listCategory.split(',').map(c => c.trim());
                cats.forEach(cat => {
                    if (cat) {
                        let catName = resolveCategoryName(cat);
                        categoryViews[catName] = (categoryViews[catName] || 0) + views;
                    }
                });
            }
        });

        const sortedData = Object.keys(categoryViews)
            .map(key => ({
                category: key,
                views: categoryViews[key]
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 6);

        return sortedData;
    }, [movies]);

    return (
        <div className="rounded-[14px] p-5 relative overflow-hidden h-full border border-white/5" style={{ background: 'rgba(15, 23, 42, 0.92)' }}>
            <div className="mb-4 relative">
                <div className="flex items-center gap-2">
                    <span style={{ fontSize: '22px' }}>🕸️</span>
                    <h2 className="text-xl font-semibold text-gray-100">
                        Top Categories
                    </h2>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                    Most viewed genres
                </p>
            </div>

            <div className="w-full h-56 [&_*]:outline-none!">
                {data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        No category data available
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data} style={{ outline: 'none', cursor: 'pointer' }}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis
                                dataKey="category"
                                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                            />
                            <PolarRadiusAxis
                                angle={30}
                                domain={[0, 'auto']}
                                tick={false}
                                axisLine={false}
                            />
                            <Radar
                                name="Views"
                                dataKey="views"
                                stroke="#48DBFB"
                                strokeWidth={2}
                                fill="#48DBFB"
                                fillOpacity={0.4}
                            />
                            <Tooltip content={<CustomTooltip />} />
                        </RadarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

export default CategoryChart;
