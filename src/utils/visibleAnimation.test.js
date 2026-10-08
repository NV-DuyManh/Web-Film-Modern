import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observeVisibleAnimation } from './visibleAnimation.js';

function createBrowser(hasObserver = true) {
    let time = 100;
    let nextId = 0;
    let intersection;
    let disconnected = false;
    const frames = new Map();
    const listeners = new Map();
    const view = {
        performance: { now: () => time },
        requestAnimationFrame: callback => { frames.set(++nextId, callback); return nextId; },
        cancelAnimationFrame: id => frames.delete(id),
    };
    if (hasObserver) {
        view.IntersectionObserver = class {
            constructor(callback) { intersection = callback; }
            observe() {}
            disconnect() { disconnected = true; }
        };
    }
    const document = {
        hidden: false,
        defaultView: view,
        addEventListener: (name, callback) => listeners.set(name, callback),
        removeEventListener: name => listeners.delete(name),
    };
    return {
        element: { ownerDocument: document }, frames, listeners,
        get disconnected() { return disconnected; },
        advance(ms) { time += ms; },
        visible(value) { intersection([{ isIntersecting: value }]); },
        hidden(value) { document.hidden = value; listeners.get('visibilitychange')?.(); },
        tick(ms = 16) {
            time += ms;
            const queued = [...frames.values()];
            frames.clear();
            queued.forEach(callback => callback(time));
        },
    };
}

test('offscreen rows schedule no frames; visible rows keep one loop', () => {
    const browser = createBrowser();
    const calls = [];
    const cleanup = observeVisibleAnimation(browser.element, (...args) => calls.push(args));
    assert.equal(browser.frames.size, 0);
    browser.visible(true);
    browser.visible(true);
    assert.equal(browser.frames.size, 1);
    browser.tick();
    assert.deepEqual(calls, [[116, 16]]);
    assert.equal(browser.frames.size, 1);
    browser.visible(false);
    browser.tick(1000);
    assert.equal(calls.length, 1);
    assert.equal(browser.frames.size, 0);
    cleanup();
});

test('resume excludes paused time from movement and reports it for button animations', () => {
    const browser = createBrowser();
    const deltas = [];
    const pauses = [];
    const cleanup = observeVisibleAnimation(browser.element, (_time, delta) => deltas.push(delta), ms => pauses.push(ms));
    browser.visible(true);
    browser.tick();
    browser.visible(false);
    browser.advance(5000);
    browser.visible(true);
    browser.tick();
    assert.deepEqual(deltas, [16, 16]);
    assert.deepEqual(pauses, [5000]);
    cleanup();
});

test('hidden tabs stop and only resume if the row is visible', () => {
    const browser = createBrowser();
    const cleanup = observeVisibleAnimation(browser.element, () => {});
    browser.visible(true);
    browser.hidden(true);
    assert.equal(browser.frames.size, 0);
    browser.visible(false);
    browser.hidden(false);
    assert.equal(browser.frames.size, 0);
    browser.visible(true);
    assert.equal(browser.frames.size, 1);
    cleanup();
    assert.equal(browser.frames.size, 0);
    assert.equal(browser.listeners.size, 0);
    assert.equal(browser.disconnected, true);
    browser.visible(true);
    assert.equal(browser.frames.size, 0);
});

test('browsers without IntersectionObserver still animate and clean up', () => {
    const browser = createBrowser(false);
    const cleanup = observeVisibleAnimation(browser.element, () => {});
    assert.equal(browser.frames.size, 1);
    browser.hidden(true);
    assert.equal(browser.frames.size, 0);
    browser.hidden(false);
    assert.equal(browser.frames.size, 1);
    cleanup();
    assert.equal(browser.frames.size, 0);
});
