import { writeFile } from 'node:fs/promises';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDocFromServer, writeBatch, terminate } from 'firebase/firestore';
import { missingRentalPricePatch, rentalPriceRange } from '../src/utils/importRentalPricing.js';

// Use the SDK write stream, as public transaction RPCs currently report quota errors.
// Without --apply this command only audits; --apply updates rent only.
const apply = process.argv.includes('--apply');
const backupFile = `rental-price-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.local.json`;
const db = getFirestore(initializeApp({
    projectId: 'manhfilm-105b3', apiKey: 'AIzaSyB2Ond6N_MfRlTIWj8nWD5VZm5BQQGh5xk',
}, 'fill-rental-prices'));
const summary = { scanned: 0, candidates: 0, updatedPaid: 0, clearedFree: 0, skipped: 0, failed: false };
const changes = [];
try {
    const plans = (await getDocs(collection(db, 'Plans'))).docs.map(item => ({ ...item.data(), id: item.id }));
    const movies = await getDocs(collection(db, 'Movies'));
    summary.scanned = movies.size;
    const candidates = movies.docs.filter(item => missingRentalPricePatch(item.data(), plans, () => 0));
    summary.candidates = candidates.length;
    console.log(JSON.stringify({ ...summary, apply, ranges: plans.map(plan => ({ name: plan.name, range: rentalPriceRange(plan) })) }));
    if (apply) {
        for (let i = 0; i < candidates.length; i += 25) {
            // Re-read the small batch immediately before writing so a price entered
            // since the audit is preserved. Do not use cached/offline data.
            const current = await Promise.all(candidates.slice(i, i + 25).map(item => getDocFromServer(item.ref)));
            const batch = writeBatch(db);
            const nextChanges = [];
            for (const item of current) {
                if (!item.exists()) { summary.skipped++; continue; }
                const movie = item.data();
                const patch = missingRentalPricePatch(movie, plans);
                if (!patch) { summary.skipped++; continue; }
                nextChanges.push({ id: item.id, planID: movie.planID, before: movie.rent ?? null,
                    hadRent: Object.hasOwn(movie, 'rent'), after: patch.rent });
                batch.update(item.ref, patch);
            }
            if (!nextChanges.length) continue;
            // Preserve originals before committing, including partial/failing runs.
            changes.push(...nextChanges);
            await writeFile(backupFile, JSON.stringify({ savedAt: new Date().toISOString(), changes }, null, 2));
            await batch.commit();
            for (const change of nextChanges) {
                if (change.after === 0) summary.clearedFree++;
                else summary.updatedPaid++;
            }
            console.log(JSON.stringify({ updatedPaid: summary.updatedPaid, clearedFree: summary.clearedFree, skipped: summary.skipped }));
        }
    }
} catch (error) {
    summary.failed = true;
    summary.error = { code: error.code || 'unknown', message: error.message };
    process.exitCode = 1;
} finally {
    await writeFile('rental-price-result.local.json', JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary));
    await terminate(db);
}
