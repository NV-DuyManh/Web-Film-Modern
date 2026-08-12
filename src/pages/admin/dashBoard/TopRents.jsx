import React from "react";

const RANK_STYLES = [
    {
        bg: 'linear-gradient(135deg, #FF3CAC, #FF2D2D)',
        color: '#fff',
        shadow: '0 3px 14px rgba(255, 60, 172, 0.55)',
    },
    {
        bg: 'linear-gradient(135deg, #FF8C00, #FFD700)',
        color: '#fff',
        shadow: '0 3px 14px rgba(255, 140, 0, 0.55)',
    },
    {
        bg: 'linear-gradient(135deg, #00E676, #00BFA5)',
        color: '#fff',
        shadow: '0 3px 14px rgba(0, 230, 118, 0.5)',
    },
    {
        bg: 'linear-gradient(135deg, #448AFF, #00B0FF)',
        color: '#fff',
        shadow: '0 3px 14px rgba(68, 138, 255, 0.5)',
    },
    {
        bg: 'linear-gradient(135deg, #AA00FF, #E040FB)',
        color: '#fff',
        shadow: '0 3px 14px rgba(170, 0, 255, 0.5)',
    },
];

const PROGRESS_COLORS = [
    'linear-gradient(90deg, #FF3CAC, #FF2D2D)',
    'linear-gradient(90deg, #FF8C00, #FFD700)',
    'linear-gradient(90deg, #00E676, #00BFA5)',
    'linear-gradient(90deg, #448AFF, #00B0FF)',
    'linear-gradient(90deg, #AA00FF, #E040FB)',
];


function TopRents({ films = [] }) {

    const formatCount = (count) => {
        const number = Number(count) || 0;

        if (number >= 1000000) {
            return `${(number / 1000000).toFixed(1)}M`;
        }

        if (number >= 1000) {
            return `${(number / 1000).toFixed(1)}K`;
        }

        return number.toLocaleString();
    };

    const maxRents = films.length > 0
        ? Math.max(...films.map(f => Number(f.rentCount) || 0))
        : 0;


    return (
        <div className="rounded-[14px] p-5 relative overflow-hidden h-full border border-white/5" style={{ background: 'rgba(15, 23, 42, 0.92)' }}>

            <div className="mb-5 relative">

                <div className="flex items-center gap-2">
                    <span style={{ fontSize: '22px' }}>🎬</span>

                    <h2 className="text-xl font-semibold text-gray-100">
                        Top 5 Rented Films
                    </h2>
                </div>

                <p className="text-sm text-gray-400 mt-1">
                    Most rented films
                </p>

            </div>


            <div className="space-y-3">

                {films.length === 0 ? (

                    <div className="h-50 flex items-center justify-center text-gray-500">
                        No rent data available
                    </div>

                ) : (

                    films.map((film, index) => {

                        const rankStyle = RANK_STYLES[index] || RANK_STYLES[3];
                        const rentPercent = maxRents > 0
                            ? ((Number(film.rentCount) || 0) / maxRents) * 100
                            : 0;

                        return (
                            <div
                                key={film.id}
                                className="flex items-center gap-4 p-3 rounded-xl"
                            >

                                <div
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%',
                                        background: rankStyle.bg,
                                        color: rankStyle.color,
                                        boxShadow: rankStyle.shadow,
                                        fontWeight: 800,
                                        fontSize: '13px',
                                        flexShrink: 0,
                                    }}
                                >
                                    #{index + 1}
                                </div>


                                <div
                                    className="shrink-0 overflow-hidden"
                                    style={{
                                        width: '56px',
                                        height: '80px',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    }}
                                >

                                    <img
                                        src={
                                            film.imgUrl ||
                                            "https://via.placeholder.com/100x150?text=No+Image"
                                        }
                                        alt={film.name || "Film"}
                                        className="w-full h-full object-cover"
                                    />

                                </div>


                                <div className="flex-1 min-w-0">

                                    <h3 className="font-semibold text-gray-100 truncate">
                                        {film.otherName ||
                                            film.title ||
                                            film.name ||
                                            "Unknown Film"}
                                    </h3>

                                    <p className="text-sm text-gray-400 mt-1 truncate">
                                        {film.name || film.title || "Unknown"}
                                    </p>

                                    <div
                                        style={{
                                            marginTop: '8px',
                                            width: '100%',
                                            height: '6px',
                                            background: 'rgba(255,255,255,0.1)',
                                            borderRadius: '3px',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${rentPercent}%`,
                                                height: '100%',
                                                background: PROGRESS_COLORS[index] || PROGRESS_COLORS[3],
                                                borderRadius: '3px',
                                                transition: 'width 1s ease-out',
                                            }}
                                        />
                                    </div>

                                </div>


                                <div
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: '#e2e8f0',
                                        flexShrink: 0,
                                    }}
                                >
                                    {formatCount(film.rentCount)}
                                </div>

                            </div>
                        );
                    })

                )}

            </div>

        </div>
    );
}

export default TopRents;