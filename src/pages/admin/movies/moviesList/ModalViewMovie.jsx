import * as React from 'react';
import { Dialog, DialogContent, DialogTitle, Slide } from '@mui/material';

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

export default function ModalViewMovie({ open, handleClose, movie }) {
    if (!movie) return null;
    const fields = [
        { label: "Movie ID", value: movie.id, mono: true },
        { label: "Status", value: movie.status, color: "text-cyan-400" },
        { label: "Year", value: movie.productionYear },
        { label: "Duration", value: `${movie.duration} mins` },
        { label: "Rating", value: `★ ${movie.rating}`, color: "text-yellow-400" },
        { label: "Views", value: movie.views?.toLocaleString(), color: "text-pink-400" },
        { label: "End Episode", value: movie.endEpisode },
        { label: "Rent Price", value: `${movie.rent?.toLocaleString()} VND`, color: "text-green-400" },
        { label: "VIP Plan", value: movie.planID || "Free" },
        { label: "Category Type", value: movie.category_Type_Id },
    ];

    return (
        <Dialog open={open} TransitionComponent={Transition} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ className: "modal-inner !bg-[#0f172a]" }}>
            <DialogTitle className="modal-header-x">CHI TIẾT PHIM: {movie.name}</DialogTitle>
            <DialogContent className="modal-body-x grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                <div className="col-span-1">
                    <img src={movie.imgUrl} className="w-full rounded-xl border border-white/10" alt="Poster" />
                    <button className="w-full mt-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-bold">▶ Xem Trailer</button>
                </div>
                <div className="col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {fields.map((f, i) => (
                            <div key={i}>
                                <span className="text-[10px] text-gray-500 uppercase font-bold">{f.label}</span>
                                <p className={`text-sm ${f.color || 'text-gray-300'} ${f.mono ? 'font-mono' : ''}`}>{f.value}</p>
                            </div>
                        ))}
                    </div>
                    <div><span className="text-[10px] text-gray-500 uppercase font-bold">Actors</span><p className="text-sm text-gray-300">{movie.list_Actor}</p></div>
                    <div><span className="text-[10px] text-gray-500 uppercase font-bold">Storyline</span><p className="text-sm text-gray-400 italic">{movie.description}</p></div>
                </div>
            </DialogContent>
        </Dialog>
    );
}