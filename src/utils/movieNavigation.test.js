import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observeMovieNavigation } from './movieNavigation.js';

function browser() {
    const frames = new Map(), listeners = new Map(), observed = new Set(), values = new Map();
    let id = 0, resize, intersect, mutate, disconnected = 0;
    const view = {
        getComputedStyle: element => ({ borderTopWidth: `${element.borderTop ?? 0}px` }),
        requestAnimationFrame: cb => { frames.set(++id, cb); return id; },
        cancelAnimationFrame: frame => frames.delete(frame),
        ResizeObserver: class {
            constructor(cb) { resize = cb; }
            observe(element) { observed.add(element); }
            unobserve(element) { observed.delete(element); }
            disconnect() { observed.clear(); disconnected++; }
        },
        IntersectionObserver: class {
            constructor(cb) { intersect = cb; }
            observe() {}
            disconnect() { disconnected++; }
        },
        MutationObserver: class {
            constructor(cb) { mutate = cb; }
            observe() {}
            disconnect() { disconnected++; }
        },
    };
    const document = { defaultView: view, hidden: false,
        addEventListener: (name, cb) => listeners.set(name, cb),
        removeEventListener: name => listeners.delete(name) };
    const wrapper = { ownerDocument: document, offsetTop: 900,
        style: { getPropertyValue: name => values.get(name), setProperty: (name, value) => values.set(name, value), removeProperty: name => values.delete(name) },
        querySelector: () => image };
    const parent = { offsetTop: 24, offsetParent: wrapper };
    let image = { offsetTop: 12, offsetParent: parent, isConnected: true, getBoundingClientRect: () => ({ height: 200 }) };
    return { wrapper, frames, listeners, observed, values,
        get image() { return image; }, get disconnected() { return disconnected; },
        visible: value => intersect([{ isIntersecting: value }]),
        resized: height => resize([{ target: image, borderBoxSize: [{ blockSize: height }] }]),
        hidden: value => { document.hidden = value; listeners.get('visibilitychange')?.(); },
        border: width => { parent.borderTop = width; },
        replace: () => { const old = image; image = { ...image }; mutate(); return old; },
        tick: () => { const queued = [...frames.values()]; frames.clear(); queued.forEach(cb => cb()); } };
}

test('offscreen and hidden rows defer alignment; rapid poster resizes use the latest height once', () => {
    const b = browser(), stop = observeMovieNavigation(b.wrapper);
    for (let i = 0; i < 20; i++) b.resized(200 + i);
    assert.equal(b.frames.size, 0);
    b.visible(true); b.tick();
    assert.equal(b.values.get('--movie-nav-center'), '145.5px');
    for (let i = 0; i < 20; i++) b.resized(300 + i);
    assert.equal(b.frames.size, 1);
    b.hidden(true); b.tick();
    assert.equal(b.values.get('--movie-nav-center'), '145.5px');
    b.hidden(false); b.tick();
    assert.equal(b.values.get('--movie-nav-center'), '195.5px');
    stop();
});

test('virtualized poster replacement rebinds observation; unmount cancels queued work and observers', () => {
    const b = browser(), stop = observeMovieNavigation(b.wrapper);
    b.visible(true); b.tick();
    const old = b.replace();
    assert.equal(b.observed.has(old), false);
    assert.equal(b.observed.has(b.image), true);
    stop(); b.tick();
    assert.equal(b.frames.size, 0);
    assert.equal(b.observed.size, 0);
    assert.equal(b.listeners.size, 0);
    assert.equal(b.values.size, 0);
    assert.equal(b.disconnected, 3);
});

test('fractional poster borders count toward the center without including the page offset', () => {
    const b = browser(), stop = observeMovieNavigation(b.wrapper);
    b.border(2.4); b.visible(true); b.tick();
    assert.equal(b.values.get('--movie-nav-center'), '138.4px');
    stop();
});
