const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');

const code = readFileSync(require('node:path').join(__dirname, '../../public/app-recovery.js'), 'utf8');
function browser(query = '', storageAvailable = true) {
    const handlers = {}, navigations = [], storage = new Map(), fetched = [], deleted = [];
    const root = { children: [], get firstElementChild() { return this.children[0]; }, hasChildNodes() { return this.children.length > 0; }, replaceChildren(...nodes) { this.children = nodes; } };
    const cacheEntries = new Map([
        ['https://mfilm.online/assets/index-old.js', new Response('<html>', { headers: { 'content-type': 'text/html' } })],
        ['https://mfilm.online/assets/good.js', new Response('code', { headers: { 'content-type': 'application/javascript' } })],
        ['https://mfilm.online/poster.jpg', new Response('image', { headers: { 'content-type': 'image/jpeg' } })],
    ]);
    const cache = { keys: async () => [...cacheEntries.keys()].map(url => ({ url })), match: async request => cacheEntries.get(request.url), delete: async request => { deleted.push(request.url); cacheEntries.delete(request.url); } };
    const context = {
        URL, Date, AbortSignal,
        window: { addEventListener: (name, cb) => { handlers[name] = cb; }, caches: {} },
        location: { href: `https://mfilm.online/${query}`, origin: 'https://mfilm.online', replace: url => navigations.push(url) },
        history: { state: null, replaceState: (_state, _title, url) => { context.location.href = url; } },
        sessionStorage: { getItem: key => { if (!storageAvailable) throw Error('disabled'); return storage.get(key); }, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
        document: { getElementById: () => root, createElement: () => ({ style: {}, children: [], append(node) { this.children.push(node); } }), querySelectorAll: () => [] },
        caches: { keys: async () => ['assets-cache'], open: async () => cache },
        fetch: async (url, options) => { fetched.push({ url, options }); return new Response('code'); },
    };
    runInNewContext(code, context);
    return { handlers, context, root, storage, navigations, fetched, deleted, flush: () => new Promise(resolve => setImmediate(resolve)),
        fail: () => handlers.error({ target: { tagName: 'SCRIPT', type: 'module', src: 'https://mfilm.online/assets/index-old.js' } }) };
}

test('entry failure removes only poisoned assets, refreshes HTTP cache and navigates once', async () => {
    const b = browser();
    b.fail(); b.fail(); await b.flush();
    assert.deepEqual(b.deleted, ['https://mfilm.online/assets/index-old.js']);
    assert.equal(b.fetched[0].options.cache, 'reload');
    assert.equal(b.navigations.length, 1);
    assert.match(b.navigations[0], /__mfilm_reload=/);
    assert.equal(b.root.children.length, 1);
});

test('a repeated error offers a retry button without looping, even with unavailable storage', async () => {
    const b = browser('?__mfilm_reload=123', false);
    b.fail(); await b.flush();
    assert.equal(b.navigations.length, 0);
    assert.equal(b.root.children[0].children[1].textContent, 'Tải lại trang');
});

test('hidden public HTML cannot block entry-error recovery or count as a successful React mount', async () => {
    const b = browser('?__mfilm_reload=123');
    b.root.children.push({ id: 'mfilm-public-html' });
    b.storage.set('mfilm_asset_recovery', '123');
    b.handlers.load();
    assert.equal(b.storage.get('mfilm_asset_recovery'), '123');
    b.fail(); await b.flush();
    assert.equal(b.root.children.length, 1);
    assert.equal(b.root.firstElementChild.children[1].textContent, 'Tải lại trang');
    assert.equal(b.navigations.length, 0);
});

test('image and extension errors do not trigger recovery; healthy startup clears the retry marker', () => {
    const b = browser('?__mfilm_reload=123&keep=1');
    b.handlers.error({ target: { tagName: 'IMG', src: '/poster.jpg' } });
    b.handlers.error({ target: { tagName: 'SCRIPT', type: 'module', src: 'chrome-extension://test/script.js' } });
    assert.equal(b.navigations.length, 0);
    b.root.children.push({}); b.storage.set('mfilm_asset_recovery', '123'); b.handlers.load();
    assert.equal(b.storage.size, 0);
    assert.equal(b.context.location.href, 'https://mfilm.online/?keep=1');
});
