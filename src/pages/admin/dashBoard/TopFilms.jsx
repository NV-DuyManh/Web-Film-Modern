import React from "react";

function TopFilms({ films = [] }) {

    const formatViews = (views) => {
        const number = Number(views) || 0;

        if (number >= 1000000) {
            return `${(number / 1000000).toFixed(1)}M`;
        }

        if (number >= 1000) {
            return `${(number / 1000).toFixed(1)}K`;
        }

        return number.toLocaleString();
    };


    return (
        <div className="bg-white rounded-xl shadow-md p-5">

            {/* Header */}
            <div className="mb-5">

                <h2 className="text-xl font-semibold text-gray-800">
                    Top 5 Films
                </h2>

                <p className="text-sm text-gray-500">
                    Most watched films
                </p>

            </div>


            {/* Film List */}
            <div className="space-y-3">

                {films.length === 0 ? (

                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                        No film data available
                    </div>

                ) : (

                    films.map((film, index) => (

                        <div
                            key={film.id}
                            className="flex items-center gap-4 p-3 rounded-xl
                                       hover:bg-gray-50 transition duration-200"
                        >

                            {/* Ranking */}
                            <div
                                className={`
                                    w-10 h-10
                                    flex items-center justify-center
                                    rounded-full
                                    font-bold
                                    text-sm
                                    shrink-0
                                    ${index === 0
                                        ? "bg-yellow-100 text-yellow-600"
                                        : index === 1
                                            ? "bg-gray-200 text-gray-600"
                                            : index === 2
                                                ? "bg-orange-100 text-orange-600"
                                                : "bg-gray-100 text-gray-500"
                                    }
                                `}
                            >
                                #{index + 1}
                            </div>


                            {/* Poster */}
                            <div className="w-14 h-20 rounded-lg overflow-hidden bg-gray-200 shrink-0">

                                <img
                                    src={
     
                                        film.imgUrl ||
                                   
                                        "https://via.placeholder.com/100x150?text=No+Image"
                                    }
                                    alt={film.name || "Film"}
                                    className="w-full h-full object-cover"
                                />

                            </div>


                            {/* Film Information */}
                            <div className="flex-1 min-w-0">

                                <h3 className="font-semibold text-gray-800 truncate">
                                    {film.name ||
                                        film.title ||
                                        film.otherName ||
                                        "Unknown Film"}
                                </h3>

                                <p className="text-sm text-gray-500 mt-1">
                                    {formatViews(film.views)} views
                                </p>

                            </div>


                            {/* View Icon */}
                            <div className="text-gray-400 text-sm shrink-0">

                                👁️

                            </div>

                        </div>

                    ))

                )}

            </div>

        </div>
    );
}

export default TopFilms;