export const parseTSV = (text) => {
    if (!text) return [];
    
    // Tách các dòng, loại bỏ dòng trống
    const lines = text.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    // Lấy header (dòng đầu tiên)
    const headers = lines[0].split('\t').map(h => h.trim());
    const data = [];

    // Lặp qua các dòng dữ liệu để tạo mảng object
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : "";
        });
        data.push(row);
    }
    return data;
};

export const mapMovieData = (parsedData) => {
    return parsedData.map(row => ({
        // Thông tin cơ bản
        name: row["Movie Name"] || row["Name"] || "",
        otherName: row["Original Name"] || "",
        countriesID: row["Country"] || "Japan",
        releaseYear: parseInt(row["Year"]) || new Date().getFullYear(),
        
        // Các trường phân loại & thực thể (Đã thêm Full)
        rawCategories: row["Categories"] || "",
        rawCategoryType: row["CategoryType"] || "", 
        rawAuthor: row["Director"] || "",
        rawActors: row["Actors"] || "",
        rawCharacters: row["Characters"] || "",
        
        // Trạng thái & Giá trị
        status: row["Status"] || "Đang chiếu",
        ageRating: row["Age"] || "T13",
        duration: parseInt(row["Duration"]) || 0,
        endEpisode: parseInt(row["Episodes"]) || 1,
        rent: parseFloat(row["Rent Price"]) || 0,
        rawShowtimes: row["Showtimes"] || "",
        
        // Các trường mặc định cho Firebase
        description: "Nội dung đang được cập nhật...",
        hasSub: true, 
        hasDub: false, 
        hasVoice: false,
        episodeSub: parseInt(row["Episodes"]) || 1,
        episodeDub: 0, 
        episodeVoice: 0,
        list_Actor: [], 
        list_Character: []
    }));
};