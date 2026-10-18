const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const angleDelta = (value, origin) => ((value - origin + 540) % 360) - 180;

// Calibrate to the user's comfortable holding angle, including landscape mode.
export function tiltDirection(sample, origin, screenAngle = 0) {
    const x = angleDelta(sample.gamma, origin.gamma);
    const y = angleDelta(sample.beta, origin.beta);
    const radians = screenAngle * Math.PI / 180;
    const axis = value => Math.sign(value) * clamp((Math.abs(value) - 1) / 14, 0, 1);
    const dx = axis(x * Math.cos(radians) + y * Math.sin(radians));
    const dy = axis(y * Math.cos(radians) - x * Math.sin(radians));
    const length = Math.max(1, Math.hypot(dx, dy));
    return { x: dx / length, y: dy / length };
}

export function createSpiderTilt({ onDirection, onState = () => {}, win = window, doc = document }) {
    let listening = false, disposed = false, pending = false, origin = null, timer, generation = 0;
    let permission = null;
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
    const firstTouch = event => {
        if (event.isTrusted && !listening && permission !== 'denied') void controls.enable();
    };
    const controls = {
        start() {
            if (disposed || listening || pending) return;
            doc.addEventListener('pointerup', firstTouch, { capture: true, passive: true });
            // Android starts immediately. iOS asks during the first real touch,
            // because its permission API requires a user gesture.
            if (typeof win.DeviceOrientationEvent?.requestPermission !== 'function' || permission === 'granted') void controls.enable();
        },
        async enable() {
            if (disposed || pending) return;
            if (listening) { calibrate(); return; }
            const orientation = win.DeviceOrientationEvent;
            if (!win.isSecureContext || !orientation) { onState('unavailable'); return; }
            pending = true;
            const attempt = ++generation;
            onState('requesting');
            try {
                permission ??= typeof orientation.requestPermission === 'function'
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
        disable() { doc.removeEventListener('pointerup', firstTouch, true); stop(); onState('idle'); },
        destroy() { disposed = true; doc.removeEventListener('pointerup', firstTouch, true); stop(); },
    };
    return controls;
}

// Capture decorative surfaces so the beam stays under the finger even when a
// drag crosses the form. Actual inputs/buttons retain native editing and clicks.
export function bindFlashlightPointer({ root, onAim, doc = document }) {
    let touchID = null, capturedID = null;
    let lampDrag = null, suppressLampClick = null;
    const aim = event => onAim({ x: event.clientX, y: event.clientY });
    const down = event => {
        if (event.isPrimary === false || !root.contains(event.target)) return;
        suppressLampClick = null;
        if (event.pointerType === 'touch') touchID = event.pointerId;
        const eye = event.target.closest('.eye');
        lampDrag = eye && event.pointerType === 'touch'
            ? { eye, id: event.pointerId, x: event.clientX, y: event.clientY, moved: false } : null;
        if (event.pointerType === 'touch' && !event.target.closest('input, textarea, button, label, a, [contenteditable="true"]')) {
            capturedID = event.pointerId;
            root.setPointerCapture(event.pointerId);
        }
        aim(event);
    };
    const move = event => {
        if (event.isPrimary === false || (event.pointerType === 'touch' && event.pointerId !== touchID)) return;
        if (lampDrag?.id === event.pointerId && Math.hypot(event.clientX-lampDrag.x, event.clientY-lampDrag.y) > 8) lampDrag.moved = true;
        aim(event);
    };
    const end = event => {
        if (lampDrag?.id === event.pointerId) {
            suppressLampClick = event.type === 'pointerup' && lampDrag.moved ? lampDrag.eye : null;
            lampDrag = null;
        }
        if (event.pointerId === capturedID) {
            if (root.hasPointerCapture(capturedID)) root.releasePointerCapture(capturedID);
            capturedID = null;
        }
        if (event.pointerId === touchID) touchID = null;
    };
    const click = event => {
        const suppress = suppressLampClick;
        suppressLampClick = null;
        if (suppress && event.target.closest('.eye') === suppress) {
            event.preventDefault();
            event.stopPropagation();
        }
    };
    const options = { passive: true };
    doc.addEventListener('pointerdown', down, options);
    doc.addEventListener('pointermove', move, options);
    doc.addEventListener('pointerup', end, options);
    doc.addEventListener('pointercancel', end, options);
    doc.addEventListener('click', click, true);
    return () => {
        if (capturedID !== null && root.hasPointerCapture(capturedID)) root.releasePointerCapture(capturedID);
        doc.removeEventListener('pointerdown', down);
        doc.removeEventListener('pointermove', move);
        doc.removeEventListener('pointerup', end);
        doc.removeEventListener('pointercancel', end);
        doc.removeEventListener('click', click, true);
    };
}
