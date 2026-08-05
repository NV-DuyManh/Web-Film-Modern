const fs = require('fs');
const file = 'f:\\FILM_MANAGEMENT\\src\\pages\\client\\watch\\detailFilm\\DetailFilm.jsx';
let content = fs.readFileSync(file, 'utf8');

// Fix paragraph nesting
content = content.replace(/<p className="text-slate-400 leading-relaxed text-justify">/g, '<div className="text-slate-400 leading-relaxed text-justify">');
content = content.replace(/<p className="font-bold text-white block mb-1">Giới thiệu:<\/p>/g, '<span className="font-bold text-white block mb-1">Giới thiệu:</span>');
content = content.replace(/<\/p>\r?\n(\s*)<p className="text-slate-400">/g, '</div>\n$1<div className="text-slate-400">');
content = content.replace(/<p className="font-bold text-white inline">/g, '<span className="font-bold text-white inline">');
content = content.replace(/<\/p> {movie\.time/g, '</span> {movie.time');
content = content.replace(/<\/p> <p className="text-slate-300/g, '</span> <span className="text-slate-300');
content = content.replace(/<\/p><\/p>/g, '</span></div>');
content = content.replace(/<p className="text-slate-400">/g, '<div className="text-slate-400">');

// Remove 'Các bản chiếu'
const startStr = '<div className="flex flex-col gap-5 animate-fade-in mt-2">';
const startIdx = content.indexOf(startStr);
if (startIdx !== -1) {
    const endStr = '</div>\r\n\r\n                    </div>';
    const endIdx = content.indexOf(endStr, startIdx);
    if (endIdx !== -1) {
        content = content.substring(0, startIdx) + '                    </div>';
    } else {
        const endStr2 = '</div>\n\n                    </div>';
        const endIdx2 = content.indexOf(endStr2, startIdx);
        if (endIdx2 !== -1) {
            content = content.substring(0, startIdx) + '                    </div>';
        }
    }
}

fs.writeFileSync(file, content);
console.log("Done");
