import { useState } from 'react';
import { movieImageCandidates } from '../utils/movieImages';
import Logo5 from '../assets/Logo5.png';
import Logo6 from '../assets/Logo6.png';

export default function MovieImage({ movie, kind = 'poster', imageWidth = 400, imageHeight = 600, imageType = kind, ...props }) {
    const candidates = [...new Set([...movieImageCandidates(movie, kind, imageWidth, imageHeight, imageType), kind === 'banner' ? Logo5 : Logo6])];
    const key = candidates.join('\n');
    const [failure, setFailure] = useState(null);
    const index = failure?.key === key ? failure.index : 0;
    return <img {...props} src={candidates[index]} onError={index + 1 < candidates.length ? () => setFailure({ key, index: index + 1 }) : undefined} />;
}
