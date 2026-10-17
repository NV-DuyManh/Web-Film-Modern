import { memo, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';
import owlArtwork from '../../../assets/auth-halloween/images/owl.svg?raw';
import flashlight from '../../../assets/auth-halloween/images/flashlight.svg';
import { readAuthNight } from './authTheme';

const owlHues = [0, 35, 85, 145, 190, 235, 280, 320, 115, 210];
const EmailOwls = memo(function EmailOwls() {
    return <div className="mfilm-owl-perch" aria-hidden="true">
        {owlHues.map((hue, index) => <span key={hue} className="email-owl"
            style={{ '--owl-hue': `${hue}deg`, '--owl-delay': `${index * -.47}s` }}
            dangerouslySetInnerHTML={{ __html: owlArtwork }} />)}
    </div>;
});

function PasswordLight({ field, value }) {
    const beam = useRef(null);
    const lamp = useRef(null);
    const overlay = useRef(null);
    const pointer = useRef(null);
    useEffect(() => {
        const input = field.current.querySelector('input');
        const button = field.current.querySelector('button');
        const root = input.closest('.mfilm-halloween');
        const owls = [...root.querySelectorAll('.email-owl')];
        const characters = [...overlay.current.querySelectorAll('.reveal-char')];
        const reactions = [...root.querySelectorAll('.pumpkin-reaction, .summit-stage')];
        const setStyles = (node, styles) => {
            for (const [name, next] of Object.entries(styles)) {
                if (name.startsWith('--')) {
                    if (node.style.getPropertyValue(name) !== next) node.style.setProperty(name, next);
                } else if (node.style[name] !== next) node.style[name] = next;
            }
        };
        const toggle = (node, name, enabled) => {
            if (node.classList.contains(name) !== enabled) node.classList.toggle(name, enabled);
        };
        let queued;
        const paint = () => {
            queued = 0;
            if (!beam.current || !lamp.current || !overlay.current || !input.isConnected) return;
            // Batch all geometry reads before style writes to avoid forced layouts.
            const eye = button.getBoundingClientRect();
            const rect = input.getBoundingClientRect();
            const advance = characters[0]?.getBoundingClientRect().width || 0;
            const owlBounds = owls.map(owl => owl.getBoundingClientRect());
            const reactionBounds = reactions.map(node => node.getBoundingClientRect());
            const ox = eye.left + eye.width / 2, oy = eye.top + eye.height / 2;
            pointer.current ??= { x: rect.left, y: oy };
            const angle = Math.atan2(pointer.current.y - oy, pointer.current.x - ox);
            const ux = Math.cos(angle), uy = Math.sin(angle);
            const length = Math.max(200, Math.min(1600, Math.hypot(pointer.current.x - ox, pointer.current.y - oy) * 1.65));
            const height = length * .38;
            setStyles(beam.current, { left: `${ox}px`, top: `${oy - height / 2}px`, width: `${length}px`, height: `${height}px`, transform: `rotate(${angle}rad)` });
            setStyles(lamp.current, { left: `${ox - 17}px`, top: `${oy - 17}px`, transform: `rotate(${angle}rad)` });
            setStyles(overlay.current, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width - 48}px`, height: `${rect.height}px` });
            setStyles(overlay.current.firstElementChild, { transform: `translateX(${-input.scrollLeft}px)` });
            const lightAt = (x, y) => {
                const dx = x - ox, dy = y - oy;
                const along = dx * ux + dy * uy;
                const sideways = Math.abs(-dx * uy + dy * ux);
                return along >= 0 && along < length ? Math.max(0, Math.min(1, (height * .49 * along / length - sideways + 4) / 16)) : 0;
            };
            characters.forEach((char, index) => {
                // Every character has the same 1ch width in this monospace overlay.
                const x = rect.left + 17 - input.scrollLeft + advance * (index + .5);
                const lit = String(lightAt(x, oy));
                if (char.style.getPropertyValue('--lit') !== lit) char.style.setProperty('--lit', lit);
            });
            owls.forEach((owl, index) => {
                const bounds = owlBounds[index];
                const lit = lightAt(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
                setStyles(owl, { opacity: String(lit) });
                toggle(owl, 'is-lit', lit > .08);
                setStyles(owl, { '--owl-gaze-x': `${ux * -70}px`, '--owl-gaze-y': `${uy * -45}px` });
            });
            reactions.forEach((node, index) => {
                const bounds = reactionBounds[index];
                toggle(node, 'is-beam-lit', lightAt(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2) > .08);
            });
        };
        const schedule = event => {
            if (event?.type === 'pointermove') pointer.current = { x: event.clientX, y: event.clientY };
            if (!queued) queued = requestAnimationFrame(paint);
        };
        const controller = new AbortController();
        const options = { signal: controller.signal, passive: true };
        document.addEventListener('pointermove', schedule, options);
        window.addEventListener('resize', schedule, options);
        document.addEventListener('scroll', schedule, { ...options, capture: true });
        input.addEventListener('scroll', schedule, options);
        const resize = new ResizeObserver(schedule);
        resize.observe(root);
        paint();
        return () => {
            controller.abort();
            resize.disconnect();
            cancelAnimationFrame(queued);
            owls.forEach(owl => {
                owl.style.opacity = '';
                owl.style.removeProperty('--owl-gaze-x');
                owl.style.removeProperty('--owl-gaze-y');
                owl.classList.remove('is-lit');
            });
            root.querySelectorAll('.is-beam-lit').forEach(node => node.classList.remove('is-beam-lit'));
        };
    }, [field, value]);
    return createPortal(<div className="mfilm-halloween mfilm-halloween-light-portal">
        <div ref={beam} className="flash-beam mfilm-light-active" aria-hidden="true" />
        <div ref={lamp} className="flashlight mfilm-light-active" aria-hidden="true"><img src={flashlight} alt="" /></div>
        <div ref={overlay} className="password-reveal mfilm-light-active" aria-hidden="true"><span>
            {Array.from(value, (letter, i) => <span className="reveal-char" key={i}><span className="masked-char">•</span><span className="plain-char">{letter}</span></span>)}
        </span></div>
    </div>, document.body);
}

export default function HalloweenField({ label, name, type = 'text', value, onChange, error, autoComplete, owl = false, ...inputProps }) {
    const id = useId();
    const field = useRef(null);
    const [reveal, setReveal] = useState(false);
    const [night, setNight] = useState(readAuthNight);
    const password = type === 'password';
    useEffect(() => {
        const root = field.current.closest('.mfilm-halloween');
        const observer = new MutationObserver(() => {
            setNight(root.classList.contains('night'));
            setReveal(false);
        });
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);
    const lit = password && reveal && night;
    return <div ref={field} className={`field mfilm-auth-field ${owl ? 'mfilm-has-owls' : ''} ${password ? 'password' : ''} ${lit ? 'mfilm-field-lit' : ''}`}>
        <label htmlFor={id}>{label}</label>
        <div className="mfilm-input-wrap">
            {owl && <EmailOwls />}
            <input {...inputProps} id={id} name={name} type={password && reveal && !night ? 'text' : type}
                value={value} onChange={onChange} autoComplete={autoComplete}
                aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
            {password && <button type="button" className="eye" aria-controls={id} aria-pressed={reveal}
                aria-label={reveal ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`}
                onClick={() => setReveal(current => !current)}>{reveal ? <IoEyeOffOutline /> : <IoEyeOutline />}</button>}
        </div>
        {error && <p className="mfilm-field-error" id={`${id}-error`} role="alert">{error}</p>}
        {lit && <PasswordLight field={field} value={value} />}
    </div>;
}
