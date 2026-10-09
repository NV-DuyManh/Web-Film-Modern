import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { createAccountService } from '../server/accounts/service.js';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8089';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
const projectId = 'demo-mfilm-accounts';
const app = initializeApp({ projectId }, 'mfilm-ui-qa-seed');
const db = getFirestore(app);
const key = randomBytes(32).toString('base64');
const service = createAccountService({ db, auth: getAuth(app), encryptionKey: key });
await service.commit({ id: 'qa-admin', name: 'QA Admin', email: 'qa-admin@example.invalid', role: 'admin', createdAt: 100 }, '123');
for (let index = 0; index < 22; index++) {
    await service.commit({ id: `qa-user-${index}`, name: `QA User ${index}`, email: `qa-${index}@example.invalid`, phone: `test-phone-${index}`, role: 'user', planID: 'qa-free', createdAt: index }, 'qa-user-password');
}
await db.collection('Plans').doc('qa-free').set({ id: 'qa-free', name: 'Free', level: 0, price: 0 });
await db.collection('Plans').doc('qa-basic').set({ id: 'qa-basic', name: 'Basic', level: 1, price: 79000 });
await db.collection('Plans').doc('qa-plus').set({ id: 'qa-plus', name: 'Plus', level: 2, price: 129000 });
await db.collection('Plans').doc('qa-premium').set({ id: 'qa-premium', name: 'Premium', level: 3, price: 199000 });
const catalog = JSON.parse(await readFile(new URL('../server/seo/catalog.json', import.meta.url), 'utf8')).catalog;
const movie = catalog.Movies.find(item => item.slug === 'van-gioi-doc-ton') || catalog.Movies[0];
await db.collection('Movies').doc(movie.id).set({ ...movie, id: movie.id, planID: 'qa-free', views: 0, endEpisode: 2 });
for (const type of catalog.CategoryTypes || []) await db.collection('CategoryTypes').doc(type.id).set(type);
for (let i = 1; i <= 2; i++) await db.collection('Episodes').doc(`qa-episode-${i}`).set({ id: `qa-episode-${i}`, movieID: movie.id, numberEpisode: i, nameEpisode: String(i), url: 'http://localhost:5173/qa.local/playback.mp4', url2: 'http://localhost:5173/qa.local/playback.mp4?server=2' });
console.log(`Local QA ready: /users; /xem-phim/${movie.slug}?tap=1; fake admin qa-admin@example.invalid`);
await db.terminate();
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
    stdio: 'inherit', env: { ...process.env, VITE_SECURE_ACCOUNTS_ENABLED: 'true', SECURE_ACCOUNTS_ENABLED: 'true', VITE_MFILM_TEST_PROJECT: projectId, MFILM_TEST_PROJECT: projectId, ACCOUNT_ENCRYPTION_KEY: key, VITE_BIGDATA_TELEMETRY_ENABLED: 'false', VITE_POSTGRES_CATALOG_ENABLED: 'false', VITE_RECOMMENDATIONS_ENABLED: 'false' },
});
child.on('exit', code => { process.exitCode = code || 0; });
