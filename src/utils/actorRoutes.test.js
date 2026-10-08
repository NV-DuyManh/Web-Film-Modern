import { test } from 'node:test';
import assert from 'node:assert/strict';
import { actorNameSlug, createActorRouteIndex } from './actorRoutes.js';

test('actor names produce readable paths across punctuation and accented alphabets', () => {
    for (const [name, slug] of [
        ['CCH Pounder', 'cch-pounder'],
        [' Đặng Thị Hồng Ánh ', 'dang-thi-hong-anh'],
        ['Kıvılcım Kaya', 'kivilcim-kaya'],
        ["Dwayne ‘The Rock’ Johnson", 'dwayne-the-rock-johnson'],
        ['梁朝偉', '梁朝偉'],
    ]) assert.equal(actorNameSlug(name), slug);
});

test('name links, old ID links and existing slug aliases resolve the same profile', () => {
    const actor = { id: '01R0K8HgidQla6kbh5bg', name: 'CCH Pounder', slug: 'old-cch-page' };
    const routes = createActorRouteIndex([actor]);
    assert.equal(routes.path(actor), '/dien-vien/cch-pounder');
    for (const link of ['cch-pounder', actor.id, actor.slug]) assert.equal(routes.find(link), actor);
    assert.equal(routes.find('missing-actor'), undefined);
});

test('actors with matching normalized names keep distinct paths regardless of catalog order', () => {
    const actors = [
        { id: 'b', name: 'Alex Smith' },
        { id: 'a', name: 'Alex Smith' },
        { id: 'c', name: 'Alex Smith 2' },
        { id: 'd', name: 'Álex Smith' },
    ];
    const routes = createActorRouteIndex(actors);
    const reordered = createActorRouteIndex([...actors].reverse());
    assert.equal(new Set(actors.map(actor => routes.path(actor))).size, actors.length);
    assert.equal(routes.path(actors[0]), '/dien-vien/alex-smith-3');
    assert.equal(routes.path(actors[2]), '/dien-vien/alex-smith-2');
    for (const actor of actors) {
        assert.equal(routes.path(actor), reordered.path(actor));
        assert.equal(routes.find(decodeURIComponent(routes.path(actor).split('/').pop())), actor);
    }
    // A movie's cast may contain only the second actor, but uses the full index.
    assert.equal(routes.path({ ...actors[0] }), '/dien-vien/alex-smith-3');
});

test('Unicode actor links encode safely and resolve after router decoding', () => {
    const actor = { id: 'unicode-id', name: '梁朝偉' };
    const routes = createActorRouteIndex([actor]);
    assert.equal(routes.path(actor), `/dien-vien/${encodeURIComponent(actor.name)}`);
    assert.equal(routes.find(decodeURIComponent(routes.path(actor).split('/').pop())), actor);
});
