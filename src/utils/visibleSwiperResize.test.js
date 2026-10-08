import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observeVisibleSwiperResize } from './visibleSwiperResize.js';

function browser() {
    const frames = new Map(), viewListeners = new Map(), docListeners = new Map(), events = new Map();
    let id = 0, intersection, resize;
    const view = {
        requestAnimationFrame: callback => { frames.set(++id, callback); return id; },
        cancelAnimationFrame: frame => frames.delete(frame),
        addEventListener: (name, cb) => viewListeners.set(name, cb),
        removeEventListener: name => viewListeners.delete(name),
        IntersectionObserver: class { constructor(cb) { intersection = cb; } observe() {} disconnect() {} },
        ResizeObserver: class { constructor(cb) { resize = cb; } observe() {} disconnect() {} },
    };
    const document = { defaultView: view, hidden: false,
        addEventListener: (name, cb) => docListeners.set(name, cb), removeEventListener: name => docListeners.delete(name) };
    const emitted = [];
    const swiper = { el: { ownerDocument: document }, destroyed: false,
        emit: name => emitted.push(name), on: (name, cb) => events.set(name, cb), off: name => events.delete(name) };
    return { swiper, frames, emitted, viewListeners, docListeners,
        visible: value => intersection([{ isIntersecting: value }]),
        resize: () => resize(),
        hidden: value => { document.hidden = value; docListeners.get('visibilitychange')?.(); },
        tick: () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(cb => cb()); },
        destroy: () => { swiper.destroyed = true; events.get('destroy')?.(); } };
}

test('offscreen resizes do no work; returning to the viewport refreshes the slider once', () => {
    const b = browser();
    const cleanup = observeVisibleSwiperResize(b.swiper);
    for (let i = 0; i < 20; i++) { b.resize(); b.tick(); }
    assert.equal(b.emitted.length, 0);
    b.visible(true); b.tick();
    assert.deepEqual(b.emitted, ['observerUpdate']);
    b.visible(false); b.resize(); b.resize(); b.tick();
    assert.equal(b.emitted.length, 1);
    b.visible(true); b.tick();
    assert.equal(b.emitted.length, 2);
    cleanup();
});

test('rapid visible resizes coalesce into one core update per frame', () => {
    const b = browser();
    const cleanup = observeVisibleSwiperResize(b.swiper);
    b.visible(true);
    for (let i = 0; i < 20; i++) b.resize();
    assert.equal(b.frames.size, 1);
    b.tick();
    assert.equal(b.emitted.length, 1);
    b.resize(); b.visible(false); b.tick();
    assert.equal(b.emitted.length, 1);
    b.visible(true); b.tick();
    assert.equal(b.emitted.length, 2);
    cleanup();
});

test('hidden tabs defer updates and destruction cancels frames and listeners', () => {
    const b = browser();
    const cleanup = observeVisibleSwiperResize(b.swiper);
    b.visible(true); b.hidden(true); b.tick();
    assert.equal(b.emitted.length, 0);
    b.hidden(false); b.tick();
    assert.equal(b.emitted.length, 1);
    b.resize(); b.destroy(); b.tick(); cleanup();
    assert.equal(b.frames.size, 0);
    assert.equal(b.viewListeners.size, 0);
    assert.equal(b.docListeners.size, 0);
    assert.equal(b.emitted.length, 1);
});
