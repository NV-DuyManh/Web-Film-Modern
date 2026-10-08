import { readFile, writeFile } from 'node:fs/promises';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, writeBatch, terminate } from 'firebase/firestore';
import { episodeRepairPlan } from '../src/utils/episodeRepair.js';

const args = process.argv.slice(2);
const input = args.find(arg => arg.startsWith('--snapshot='))?.split('=').slice(1).join('=');
const sourceFile = args.find(arg => arg.startsWith('--sources='))?.split('=').slice(1).join('=');
if (!input || !sourceFile) throw new Error('Provide --snapshot=<audit.json> --sources=<verified-source.json>; add --apply after reviewing the plan.');
const { movies, episodes } = JSON.parse(await readFile(input, 'utf8'));
const sources = JSON.parse(await readFile(sourceFile, 'utf8'));
const plan = episodeRepairPlan(movies, episodes, sources);
await writeFile('episode-repair-plan.local.json', JSON.stringify(plan, null, 2));
console.log(JSON.stringify({ changes: plan.patches.length, unresolved: plan.unresolved,
    movies: [...new Set(plan.patches.map(patch => patch.movie))], totals: plan.patches.filter(patch => patch.collection === 'Movies') }, null, 2));

if (args.includes('--apply')) {
    // Save full originals locally before any write; keep every episode ID and stream field unchanged.
    await writeFile('episode-repair-backup.local.json', JSON.stringify({ savedAt: new Date().toISOString(),
        originals: plan.patches.map(patch => ({ collection: patch.collection, document: (patch.collection === 'Movies' ? movies : episodes).find(row => row.id === patch.id) })) }, null, 2));
    const db = getFirestore(initializeApp({ projectId: 'manhfilm-105b3', apiKey: 'AIzaSyB2Ond6N_MfRlTIWj8nWD5VZm5BQQGh5xk' }, 'episode-repair'));
    let updated = 0;
    try {
        const batch = writeBatch(db);
        for (const patch of plan.patches) {
            const ref = doc(db, patch.collection, patch.id);
            const live = await getDoc(ref);
            if (!live.exists()) throw new Error(`Missing ${patch.collection}/${patch.id}`);
            const data = live.data();
            if (Object.entries(patch.after).every(([key, value]) => data[key] === value)) continue;
            if (!Object.entries(patch.before).every(([key, value]) => (data[key] ?? null) === value)) throw new Error(`Changed since audit: ${patch.collection}/${patch.id}`);
            batch.update(ref, patch.after);
            updated++;
        }
        // Commit all metadata repairs atomically through the SDK write stream.
        if (updated) await batch.commit();
        console.log(`Verified and repaired ${updated} documents. Backup: episode-repair-backup.local.json`);
    } finally { await terminate(db); }
}
