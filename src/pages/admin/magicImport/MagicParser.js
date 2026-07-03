export const parseTSV = (text) => {
    if (!text) return [];
    
    let cleanText = text.replace(/^[\t\s]+|[\t\s]+$/gm, '');
    const lines = cleanText.split('\n').filter(line => line.trim() !== '' && !line.includes('---'));
    if (lines.length < 2) return [];

    const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        const row = {};
        headers.forEach((header, index) => {
            if (header) {
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
        const epSub = parseInt(row["số tập vietsub"] || row["ep sub"] || row["tập sub"]) || epTotal;
        const epDub = parseInt(row["số tập thuyết minh"] || row["ep dub"] || row["tập dub"]) || 0;
        const epVoice = parseInt(row["số tập lồng tiếng"] || row["ep voice"] || row["tập voice"]) || 0;

        return {
            name: row["name"] || row["movie name"] || row["tên phim"] || "",
            otherName: row["original name"] || row["other name"] || row["tên gốc"] || row["tên tiếng việt"] || "",
            
            description: row["movie description"] || row["description"] || row["mô tả"] || "Đang cập nhật...",
            rawCategoryDesc: row["cat desc"] || row["category description"] || row["mô tả thể loại"] || "",
            rawAuthorDesc: row["dir desc"] || row["director description"] || row["mô tả đạo diễn"] || "Đang cập nhật...",
            rawActorDesc: row["actor desc"] || row["actor description"] || row["mô tả diễn viên"] || "Đang cập nhật...",
            rawCharacterDesc: row["char desc"] || row["character description"] || row["mô tả nhân vật"] || "Đang cập nhật...",
            
            gender: row["gender"] || row["giới tính"] || "Male",
            charGender: row["char gender"] || row["giới tính nhân vật"] || "Male",
            rawPlan: row["plan"] || row["gói"] || "",
            roomName: row["room"] || row["phòng chiếu"] || "",
            epNumber: parseInt(row["episode number"] || row["tập số"]) || "",
            epUrl: row["url"] || row["link"] || "",

            countriesID: row["country"] || row["quốc gia"] || "Japan",
            releaseYear: parseInt(row["year"] || row["năm"]) || new Date().getFullYear(),
            
            rawCategories: row["categories"] || row["thể loại"] || "",
            rawCategoryType: row["type"] || row["categorytype"] || row["loại phim"] || "", 
            rawAuthor: row["director"] || row["đạo diễn"] || "",
            rawActors: row["actors"] || row["diễn viên"] || "",
            rawCharacters: row["characters"] || row["nhân vật"] || "",
            
            status: row["status"] || row["trạng thái"] || "Ongoing",
            ageRating: row["age rating"] || row["age"] || row["độ tuổi"] || "T13",
            duration: parseInt(row["duration"] || row["thời lượng"]) || 0,
            rent: parseFloat(row["rent price"] || row["giá thuê"]) || 0,
            
            endEpisode: epTotal,
            rawShowtimes: row["time"] || row["showtimes"] || row["lịch chiếu"] || "",

            imgUrl: "", 
            bannerUrl: "", 
            
            hasSub: epSub > 0,
            hasDub: epDub > 0,
            hasVoice: epVoice > 0,
            episodeSub: epSub,
            episodeDub: epDub,
            episodeVoice: epVoice,
        };
    });
};
