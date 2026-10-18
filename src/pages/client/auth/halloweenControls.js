const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const angleDelta = (value, origin) => ((value - origin + 540) % 360) - 180;

// Calibrate to the user's comfortable holding angle, including landscape mode.
export function tiltDirection(sample, origin, screenAngle = 0) {
    const x = angleDelta(sample.gamma, origin.gamma);
    const y = angleDelta(sample.beta, origin.beta);
    const radians = screenAngle * Math.PI / 180;
    const axis = value => Math.sign(value) * clamp((Math.abs(value) - 2.5) / 22.5, 0, 1);
    const dx = axis(x * Math.cos(radians) + y * Math.sin(radians));
    const dy = axis(y * Math.cos(radians) - x * Math.sin(radians));
    const length = Math.max(1, Math.hypot(dx, dy));
    return { x: dx / length, y: dy / length };
}

export function createSpiderTilt({ onDirection, onState, win = window, doc = document }) {
    let listening = false, disposed = false, pending = false, origin = null, timer, generation = 0;
    const stop = () => {
        generation++;
        listening = false;
        origin = null;
        clearTimeout(timer);
        win.removeEventListener('deviceorientation', sample);
        win.removeEventListener('orientationchange', calibrate);
        win.screen?.orientation?.removeEventListener('change', calibrate);
        doc.removeEventListener('visibilitychange', calibrate);
        onDirection(null);
    };
    function calibrate() {
        origin = null;
        onDirection({ x: 0, y: 0 });
    }
    function sample(event) {
        if (!listening || doc.hidden || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
        clearTimeout(timer);
        if (!origin) { origin = { beta: event.beta, gamma: event.gamma }; onState('enabled'); }
        onDirection(tiltDirection(event, origin, win.screen?.orientation?.angle ?? win.orientation ?? 0));
    }
    return {
        async enable() {
            if (disposed || pending) return;
            if (listening) { calibrate(); return; }
            const orientation = win.DeviceOrientationEvent;
            if (!win.isSecureContext || !orientation) { onState('unavailable'); return; }
            pending = true;
            const attempt = ++generation;
            onState('requesting');
            try {
                // iOS requires this call directly inside the user's button click.
                const permission = typeof orientation.requestPermission === 'function'
                    ? await orientation.requestPermission() : 'granted';
                if (disposed || attempt !== generation) return;
                if (permission !== 'granted') { onState('denied'); return; }
                listening = true;
                onState('calibrating');
                win.addEventListener('deviceorientation', sample, { passive: true });
                win.addEventListener('orientationchange', calibrate);
                win.screen?.orientation?.addEventListener('change', calibrate);
                doc.addEventListener('visibilitychange', calibrate);
                timer = setTimeout(() => { stop(); onState('unavailable'); }, 4000);
            } catch {
                if (!disposed && attempt === generation) { stop(); onState('denied'); }
            } finally { pending = false; }
        },
        disable() { stop(); onState('idle'); },
        destroy() { disposed = true; stop(); },
    };
}

export function flashlightPadPoint(point, pad, bounds) {
    return {
        x: bounds.left + clamp((point.clientX - pad.left) / Math.max(1, pad.width), 0, 1) * bounds.width,
        y: bounds.top + clamp((point.clientY - pad.top) / Math.max(1, pad.height), 0, 1) * bounds.height,
    };
}

// Only the dedicated pad owns a drag. Inputs and the rest of the dialog retain
// native focus, selection and scrolling; a single tap can also aim the light.
export function bindFlashlightPointer({ root, pad, onAim, doc = document, win = window }) {
    let touchID = null, padID = null;
    const aim = event => {
        if (padID === event.pointerId) {
            const rect = root.getBoundingClientRect();
            const viewport = win.visualViewport;
            const viewportTop = viewport?.offsetTop || 0;
            const top = Math.max(rect.top, viewportTop);
            const bottom = Math.min(rect.bottom, viewportTop + (viewport?.height || win.innerHeight));
            onAim(flashlightPadPoint(event, pad.getBoundingClientRect(), {
                left: rect.left, top, width: rect.width, height: Math.max(1, bottom - top),
            }));
        } else onAim({ x: event.clientX, y: event.clientY });
    };
    const down = event => {
        if (event.isPrimary === false || !root.contains(event.target)) return;
        if (event.pointerType === 'touch') touchID = event.pointerId;
        if (pad?.contains(event.target)) {
            padID = event.pointerId;
            pad.setPointerCapture(event.pointerId);
        }
        aim(event);
    };
    const move = event => {
        if (event.isPrimary === false || (event.pointerType === 'touch' && event.pointerId !== touchID)) return;
        aim(event);
    };
    const end = event => {
        if (event.pointerId === padID) padID = null;
        if (event.pointerId === touchID) touchID = null;
    };
    const options = { passive: true };
    doc.addEventListener('pointerdown', down, options);
    doc.addEventListener('pointermove', move, options);
    doc.addEventListener('pointerup', end, options);
    doc.addEventListener('pointercancel', end, options);
    return () => {
        if (padID !== null && pad.hasPointerCapture(padID)) pad.releasePointerCapture(padID);
        doc.removeEventListener('pointerdown', down);
        doc.removeEventListener('pointermove', move);
        doc.removeEventListener('pointerup', end);
        doc.removeEventListener('pointercancel', end);
    };
}
