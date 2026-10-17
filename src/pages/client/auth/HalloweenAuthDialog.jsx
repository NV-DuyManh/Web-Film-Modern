import { memo, useEffect, useRef, useState } from 'react';
import { Dialog } from '@mui/material';
import { IoClose, IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';
import panelDay from '../../../assets/auth-halloween/images/panel-day.svg';
import panelNight from '../../../assets/auth-halloween/images/panel-night.svg';
import witch from '../../../assets/auth-halloween/images/witch.svg';
import batArtwork from '../../../assets/auth-halloween/images/bat.svg?raw';
import vineArtwork from '../../../assets/auth-halloween/images/vine-styles/outer/artwork.svg?raw';
import vineFrames from '../../../assets/auth-halloween/images/vine-styles/outer/keyframes.json';
import wolfRoute from '../../../assets/auth-halloween/images/wolf-frames/keyframes.json';
import { startHalloweenSpider } from './halloweenSpider';
import { fitVineArtwork } from './halloweenVines';
import './HalloweenAuth.css';

const wolfImages = import.meta.glob('../../../assets/auth-halloween/images/wolf-transparent/*.png', {
    eager: true, query: '?url', import: 'default',
});
const wolfSources = Object.keys(wolfImages).sort().map(key => wolfImages[key]);

function SkyFlight() {
    return <div className="sky-flight" aria-hidden="true">
        {Array.from({ length: 3 }, (_, i) => <span className={`sky-bat bat-${i + 1}`} key={i}>
            <span className="flyer-facing" dangerouslySetInnerHTML={{ __html: batArtwork }} />
        </span>)}
        <span className="sky-witch"><span className="flyer-facing"><img src={witch} alt="" /></span></span>
    </div>;
}

const Landscape = memo(function Landscape() {
    return <div className="landscape-scene" aria-hidden="true">
        <div className="scene-sky-objects"><div className="scene-sun" /><div className="scene-moon" /></div>
        <img className="scene-land scene-day" src={panelDay} alt="" />
        <img className="scene-land scene-night" src={panelNight} alt="" />
        <SkyFlight />
    </div>;
});

// Keep React from replacing SVG nodes that the fitting/growth effects animate.
const VineArtwork = memo(function VineArtwork({ host }) {
    return <div ref={host} className="halloween-vines" aria-hidden="true" dangerouslySetInnerHTML={{ __html: vineArtwork }} />;
});

function Vines({ night }) {
    const host = useRef(null);
    useEffect(() => fitVineArtwork(host.current.querySelector('svg')), []);
    useEffect(() => {
        const svg = host.current.querySelector('svg');
        const nodes = [...svg.querySelectorAll('[data-grow]')];
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        let frame;
        let start;
        let lastIndex = -1;
        const paint = now => {
            start ??= now;
            const progress = reduced ? 1 : Math.min(1, (now - start) / 2400);
            const index = Math.round((night ? progress : 1 - progress) * (vineFrames.length - 1));
            if (index !== lastIndex) nodes.forEach((node, i) => {
                const pose = vineFrames[index][i];
                if ('dash' in pose) {
                    node.setAttribute('stroke-dashoffset', pose.dash);
                    node.setAttribute('opacity', pose.dash >= 999.99 ? '0' : '1');
                } else {
                    node.setAttribute('opacity', pose.opacity);
                    node.setAttribute('transform', `rotate(${pose.angle}) scale(${pose.scale})`);
                }
            });
            lastIndex = index;
            if (progress < 1) frame = requestAnimationFrame(paint);
        };
        frame = requestAnimationFrame(paint);
        return () => cancelAnimationFrame(frame);
    }, [night]);
    // These SVG strings are vetted, local artwork, never user/API content.
    return <VineArtwork host={host} />;
}

const Wolf = memo(function Wolf({ night }) {
    const group = useRef(null);
    const pose = useRef(null);
    const image = useRef(null);
    useEffect(() => {
        if (!night) return;
        const reduced = matchMedia('(prefers-reduced-motion: reduce)');
        const stage = image.current.closest('.summit-stage');
        const started = performance.now();
        let frame = 0;
        let lastRoute, lastOpacity, lastLean, lastSource;
        const paint = now => {
            frame = 0;
            if (!group.current || !pose.current || !image.current) return;
            if (document.hidden) return;
            const seconds = reduced.matches ? 5.8 : Math.max(0, (now - started) / 1000);
            const route = wolfRoute.frames[Math.min(wolfRoute.frames.length - 1, Math.floor(seconds * wolfRoute.fps))];
            const transform = `translate(${route.x} ${route.y}) scale(.86)`;
            if (lastRoute !== transform) { group.current.setAttribute('transform', transform); lastRoute = transform; }
            if (lastOpacity !== route.opacity) { group.current.setAttribute('opacity', route.opacity); lastOpacity = route.opacity; }
            if (lastLean !== route.lean) { pose.current.setAttribute('transform', `rotate(${route.lean})`); lastLean = route.lean; }
            const lit = stage.classList.contains('is-beam-lit');
            let index = seconds < 3.8 ? Math.min(38, Math.floor(Math.max(0, seconds - .7) / 3.1 * 39))
                : seconds < 4.4 ? Math.min(47, 39 + Math.floor((seconds - 3.8) / .6 * 9))
                    : Math.min(59, 48 + Math.floor((seconds - 4.4) / 1.4 * 12));
            if (lit && seconds >= 5.8 && !reduced.matches) index = Math.round(53 + Math.sin(seconds * 3) * 6);
            if (lastSource !== index) { image.current.setAttribute('href', wolfSources[index]); lastSource = index; }
            // Once the entry finishes there is no visual change until the beam hits it.
            if (!reduced.matches && (seconds < 5.8 || lit)) frame = requestAnimationFrame(paint);
        };
        const wake = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(paint); };
        const observer = new MutationObserver(wake);
        observer.observe(stage, { attributes: true, attributeFilter: ['class'] });
        const visibilityChanged = () => { cancelAnimationFrame(frame); frame = 0; wake(); };
        document.addEventListener('visibilitychange', visibilityChanged);
        reduced.addEventListener('change', wake);
        paint(performance.now());
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            document.removeEventListener('visibilitychange', visibilityChanged);
            reduced.removeEventListener('change', wake);
        };
    }, [night]);
    return <div className="summit-stage" aria-hidden="true"><svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
        <g ref={group} opacity="0"><g ref={pose}><image ref={image} x="-62.5" y="-84.375" width="125" height="90.625" /></g></g>
    </svg></div>;
});

function HalloweenContent({ mode, onClose, children }) {
    const [night, setNight] = useState(true);
    const root = useRef(null);
    useEffect(() => startHalloweenSpider(root.current), []);
    return <div ref={root} className={`mfilm-halloween ${night ? 'night' : ''}`}>
        <button className="mfilm-auth-close" type="button" onClick={onClose} aria-label="Đóng hộp thoại"><IoClose size={22} /></button>
        <div className="login-shell">
            <Vines night={night} />
            <div className="login-card">
                <section className="scene-panel" aria-label="Đêm phim Halloween cùng MFilm">
                    <Landscape />
                    <Wolf night={night} />
                    <button className="theme-toggle" type="button" onClick={() => setNight(value => !value)}
                        aria-pressed={night} aria-label={night ? 'Chuyển sang ban ngày' : 'Bật đêm Halloween'}>
                        <span className="theme-toggle-thumb" /><IoSunnyOutline className="theme-sun" /><IoMoonOutline className="theme-moon" />
                    </button>
                    <div className="scene-copy">
                        <span className="mfilm-season-label">MFILM · HALLOWEEN NIGHT</span>
                        <h2>{mode === 'register' ? <>Gia nhập<br /> thế giới MFilm</> : <>Đêm nay,<br /> xem gì cùng MFilm?</>}</h2>
                        <p>Phim hay, một chút bí ẩn.<br />Cả thế giới điện ảnh đang chờ bạn.</p>
                    </div>
                    <span className="mfilm-scene-caption">Một tài khoản · Trọn trải nghiệm</span>
                </section>
                <section className="form-panel">
                    <div className="login-form">{children}</div>
                </section>
            </div>
        </div>
        <canvas className="mfilm-halloween-spider" aria-hidden="true" />
    </div>;
}

export default function HalloweenAuthDialog({ open, onClose, mode = 'login', children }) {
    return <Dialog open={open} onClose={onClose} maxWidth={false} fullWidth scroll="body"
        aria-labelledby={`mfilm-${mode}-title`} className="mfilm-halloween-dialog"
        sx={{ zIndex: 10020 }}
        slotProps={{ paper: { className: 'mfilm-halloween-paper' }, backdrop: { className: 'mfilm-halloween-dimmer' } }}>
        {open && <HalloweenContent mode={mode} onClose={onClose}>{children}</HalloweenContent>}
    </Dialog>;
}
