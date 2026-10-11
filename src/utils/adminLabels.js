export function adminMovieStatus(status) {
    return ({ 'Sắp chiếu': 'Upcoming', 'Đang chiếu': 'Ongoing', 'Hoàn thành': 'Completed' })[status] || status;
}
