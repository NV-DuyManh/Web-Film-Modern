export const parseTSV = (text) => {
    if (!text) return [];
    
    // Xóa ký tự bảng Markdown và trim khoảng trắng ở hai đầu mỗi dòng
    let cleanText = text.replace(/\|/g, '\t').replace(/^[\t\s]+|[\t\s]+$/gm, '');
    
    // Tách dòng
    const lines = cleanText.split('\n').filter(line => line.trim() !== '' && !line.includes('---'));
    if (lines.length < 2) return [];

    // Lấy header, giữ nguyên mảng để không làm lệch index nếu có cột trống
    const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        const row = {};
        
        headers.forEach((header, index) => {
            if (header) { // Chỉ gán nếu có tên cột
                row[header] = values[index] ? values[index].trim() : "";
            }
        });
        data.push(row);
    }
    return data;
};

export const mapMovieData = (parsedData) => {
    return parsedData.map(row => {
        const epTotal = parseInt(row["episodes"] || row["số tập"] || row["tổng số tập"]) || 1;
        
        // Phân tích Sub/Dub/Voice
        const epSub = parseInt(row["số tập vietsub"] || row["tập sub"] || row["episodesub"]) || parseInt(row["episodes"] || row["số tập"]) || 1;
        const epDub = parseInt(row["số tập thuyết minh"] || row["tập dub"] || row["episodedub"]) || 0;
        const epVoice = parseInt(row["số tập lồng tiếng"] || row["tập voice"] || row["episodevoice"]) || 0;

        return {
            // Thông tin chung
            name: row["movie name"] || row["name"] || row["tên phim"] || "",
            otherName: row["original name"] || row["other name"] || row["tên gốc"] || row["tên khác"] || "",
            description: row["description"] || row["nội dung"] || row["mô tả"] || "Nội dung đang được cập nhật...",
            
            countriesID: row["country"] || row["quốc gia"] || "Nhật Bản",
            releaseYear: parseInt(row["year"] || row["release year"] || row["năm"] || row["năm phát hành"]) || new Date().getFullYear(),
            
            // Các trường thực thể & Phân loại
            rawCategories: row["categories"] || row["thể loại"] || "",
            rawCategoryType: row["categorytype"] || row["loại phim"] || row["loại"] || "", 
            rawAuthor: row["director"] || row["author"] || row["đạo diễn"] || row["tác giả"] || "",
            rawActors: row["actors"] || row["diễn viên"] || "",
            rawCharacters: row["characters"] || row["nhân vật"] || "",
            rawPlan: row["plan"] || row["gói"] || row["gói đăng ký"] || "",
            
            // Thông số
            status: row["status"] || row["trạng thái"] || "Đang chiếu",
            ageRating: row["age"] || row["age rating"] || row["độ tuổi"] || "T13",
            duration: parseInt(row["duration"] || row["thời lượng"]) || 0,
            endEpisode: epTotal,
            rent: parseFloat(row["rent price"] || row["rent"] || row["giá thuê"] || row["giá"]) || 0,
            rawShowtimes: row["showtimes"] || row["lịch chiếu"] || "",

            // Ảnh (Poster & Banner)
            imgUrl: row["poster"] || row["ảnh"] || row["imgurl"] || row["hình ảnh"] || "",
            bannerUrl: row["banner"] || row["ảnh bìa"] || row["bannerurl"] || "",
            
            // Sub/Dub/Voice
            hasSub: epSub > 0,
            hasDub: epDub > 0,
            hasVoice: epVoice > 0,
            episodeSub: epSub,
            episodeDub: epDub,
            episodeVoice: epVoice,
        };
    });
};