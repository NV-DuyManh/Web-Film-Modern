import { useEffect, useState } from 'react';
import { episodeLabel } from '../../../../utils/episodes';

export default function NextEpisodePrompt({ episode, onContinue, onCancel }) {
    const [remaining, setRemaining] = useState(8);
    useEffect(() => {
        if (remaining === 0) { onContinue(); return; }
        const timer = setTimeout(() => setRemaining(value => value - 1), 1000);
        return () => clearTimeout(timer);
    }, [remaining, onContinue]);
    return <div className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
        <div className="rounded-2xl border border-yellow-400/40 bg-[#141a24] p-5 text-center max-w-sm w-full">
            <p className="text-white font-bold">Tập tiếp theo: {episodeLabel(episode)}</p>
            <p role="status" className="text-slate-300 text-sm mt-2">Tự chuyển sau {remaining} giây</p>
            <div className="flex justify-center gap-3 mt-4">
                <button onClick={onContinue} className="rounded-lg bg-yellow-400 text-black px-4 py-2 font-bold">Xem ngay</button>
                <button onClick={onCancel} className="rounded-lg border border-slate-600 text-slate-200 px-4 py-2">Hủy</button>
            </div>
        </div>
    </div>;
}
