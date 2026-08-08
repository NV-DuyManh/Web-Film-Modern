export const getAgeRatingColorClass = (rating) => {
    switch (rating) {
        case 'P': 
            return "bg-linear-to-r from-emerald-500 to-green-600 text-white";
        case 'K': 
            return "bg-linear-to-r from-orange-500 to-red-500 text-white";
        case 'T13': 
            return "bg-linear-to-r from-yellow-400 to-amber-500 text-black";
        case 'T16': 
            return "bg-linear-to-r from-orange-500 to-red-500 text-white";
        case 'T18': 
            return "bg-linear-to-r from-red-600 to-rose-700 text-white";
        default: 
            return "bg-linear-to-r from-blue-500 to-blue-600 text-white";
    }
};
