import * as React from 'react';
import { Dialog, DialogContent, DialogTitle, Slide } from '@mui/material';

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

export default function ModalViewMovie({ open, handleClose, movie }) {
    if (!movie) return null;

    const fields = [
        { label: "ID", value: movie.id, mono: true },
        { label: "Status", value: movie.status, color: movie.status === 'Completed' ? 'text-yellow-400' : 'text-cyan-400' },
        { label: "Year", value: movie.productionYear },
        { label: "Duration", value: `${movie.duration} mins` },
        { label: "Rating", value: `${movie.rating} ★`, color: "text-yellow-400" },
        { label: "Views", value: movie.views?.toLocaleString(), color: "text-pink-400" },
        { label: "Episodes", value: `${movie.endEpisode} ep(s)` },
        { label: "Rent", value: `${movie.rent?.toLocaleString()} VND`, color: "text-green-400" },
        { label: "Plan", value: movie.planID || "Free" },
        { label: "Category Type", value: movie.category_Type_Id },
    ];

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ className: "modal-inner bg-[#0f172a]" }}
            BackdropProps={{ className: "modal-backdrop-x" }}
        >
            <DialogTitle className="modal-header-x text-cyan-400 text-center font-bold">MOVIE: {movie.name}</DialogTitle>
            <DialogContent className="modal-body-x grid grid-cols-1 md:grid-cols-3 gap-8 p-8 custom-scrollbar overflow-y-auto max-h-[80vh]">
                <div className="col-span-1 flex flex-col items-center mt-6">
                    <img src={movie.imgUrl} className="w-full rounded-2xl shadow-2xl border border-white/10 aspect-2/3 object-cover" alt="Poster" />
                    {movie.trailerUrl && (
                        <a href={movie.trailerUrl} target="_blank" rel="noreferrer" className="w-full text-center mt-6 py-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-600 hover:text-white transition-all text-sm font-bold">
                            ▶ Watch Trailer
                        </a>
                    )}
                </div>
                <div className="col-span-1 md:col-span-2 space-y-6 mt-6">
                    <div className="grid grid-cols-2 gap-6 bg-white/5 p-5 rounded-2xl">
                        {fields.map((f, i) => (
                            <div key={i}>
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{f.label}</span>
                                <p className={`text-sm font-medium mt-1 ${f.color || 'text-gray-200'} ${f.mono ? 'font-mono' : ''}`}>{f.value || "N/A"}</p>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4 px-2">
                        <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Categories</span>
                            <p className="text-sm text-gray-200 leading-relaxed">{movie.list_Category || "N/A"}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Actors</span>
                            <p className="text-sm text-gray-200 leading-relaxed">{movie.list_Actor || "N/A"}</p>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Storyline</span>
                            <p className="text-sm text-gray-400 italic leading-relaxed">{movie.description || "No description provided."}</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}