import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEpisode, episodeKey, episodeLabel, normalizeEpisodes, highestEpisode, findEpisode } from './episodes.js';
import { episodeSyncChanges } from './episodeSync.js';
import { nextPlayableEpisode } from './playback.js';
import { episodeRepairPlan } from './episodeRepair.js';

test('Source labels preserve decimals, combined episodes, zero and special variants', () => {
    assert.equal(parseEpisode('Tập 603-604-605').number, 603);
    assert.equal(parseEpisode('Tập 603-604-605').end, 605);
    assert.equal(parseEpisode('Tập 603-604-605').label, '603–605');
    assert.equal(parseEpisode('Tập 1076.5').number, 1076.5);
    assert.equal(parseEpisode('Tập 08.2').label, '8.2');
    assert.equal(parseEpisode('Tập 0').number, 0);
    assert.equal(parseEpisode('Full').number, 1);
    assert.equal(parseEpisode('Tập 100 OVA2').key, '100-ova-2');
    assert.equal(parseEpisode('Tập 753A').key, '753-a');
    assert.equal(parseEpisode('Tập Đặc biệt 1').key, 'sp-1');
    for (const name of ['Trailer', '', 'Tập -1', 'Tập 10-2', 'S2E3', '2024 Trailer']) assert.equal(parseEpisode(name), null);
});

test('Duplicate rows collapse by source identity while OVA and decimal episodes remain selectable', () => {
    const rows = [
        { id: 'old', numberEpisode: 10765, nameEpisode: 'Tập 1076.5', url: 'broken' },
        { id: 'good', numberEpisode: 1076.5, nameEpisode: 'Tập 1076.5', url: 'https://video' },
        { id: 'ova2', numberEpisode: 1002, nameEpisode: 'Tập 100 OVA2', url: 'https://video/ova2' },
        { id: 'ova1', numberEpisode: 1001, nameEpisode: 'Tập 100 OVA1', url: 'https://video/ova1' },
        { id: 'main', numberEpisode: 100, url: 'https://video/main' },
    ];
    const normalized = normalizeEpisodes(rows);
    assert.deepEqual(normalized.map(ep => ep.id), ['main', 'ova1', 'ova2', 'good']);
    assert.equal(episodeKey(normalized[2]), '100-ova-2');
    assert.equal(episodeLabel(normalized[3]), '1076.5');
    assert.equal(findEpisode(normalized, '10765').id, 'good');
    assert.equal(findEpisode(normalized, '100-ova-2').id, 'ova2');
    assert.equal(nextPlayableEpisode(normalized, normalized[0]).id, 'ova1');
    assert.equal(nextPlayableEpisode(normalized, normalized[1]).id, 'ova2');
    const bundle = { id: 'bundle', numberEpisode: 1, nameEpisode: 'Tập 01-06', url: 'https://video/bundle' };
    const bundled = [bundle, { id: 'two', numberEpisode: 2, url: 'https://video/2' }, { id: 'seven', numberEpisode: 7, url: 'https://video/7' }];
    assert.equal(nextPlayableEpisode(bundled, bundle).id, 'seven');
});

test('Sync does not recreate corrupted legacy entries or invent episode 1 for unknown labels', () => {
    const existing = [{ id: 'original', numberEpisode: 603604605, nameEpisode: 'Tập 603-604-605', url: 'https://video', urlM3u8: '', url2: 'https://alternate' }];
    const source = [{ name: 'Tập 603-604-605', link_embed: 'https://video' }, { name: 'Tập 1076.5', link_embed: 'https://special' }, { name: 'Trailer', link_embed: 'https://trailer' }];
    const changes = episodeSyncChanges({ id: 'movie', endEpisode: 603604605 }, source, existing);
    assert.deepEqual(changes.creates.map(ep => ep.numberEpisode), [1076.5]);
    assert.equal(changes.updates[0].id, 'original');
    assert.equal(changes.updates[0].numberEpisode, 603);
    assert.equal(changes.highest, 1076.5);
    assert.equal(highestEpisode(existing), 605);
    assert.equal(changes.updates[0].url2, undefined);
});

test('Repair checks video identity, preserves IDs and streams and only corrects proven totals', () => {
    const movie = { id: 'movie', slug: 'conan', endEpisode: 603604605 };
    const rows = [{ id: 'legacy', movieID: 'movie', numberEpisode: 603604605, nameEpisode: 'Tập 603-604-605', url: 'https://player/?url=https://video/index.m3u8', url2: 'https://alternate' }];
    const source = { conan: { episodes: [{ server_data: [{ name: 'Tập 603-604-605', link_m3u8: 'https://video/index.m3u8' }] }] } };
    const plan = episodeRepairPlan([movie], rows, source);
    assert.equal(plan.patches.length, 2);
    assert.equal(plan.patches[0].id, 'legacy');
    assert.deepEqual(plan.patches[0].after, { numberEpisode: 603, nameEpisode: 'Tập 603-604-605', legacyEpisodeNumber: 603604605 });
    assert.deepEqual(plan.patches[1].after, { endEpisode: 605 });
    assert.equal(rows[0].numberEpisode, 603604605);
    source.conan.episodes[0].server_data[0].link_m3u8 = 'https://different/video';
    const refused = episodeRepairPlan([movie], rows, source);
    assert.equal(refused.patches.length, 0);
    assert.equal(refused.unresolved.length, 1);
});
