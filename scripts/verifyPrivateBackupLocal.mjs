import { readFile, writeFile } from 'node:fs/promises';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { openBackup, restoreBackup } from '../server/accounts/backup.js';

// Recover into a separate local emulator namespace, never a live database.
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8089') throw new Error('Local Firestore emulator on port 8089 required');
const file = process.argv.find(value => value.startsWith('--backup='))?.slice(9);
if (!file?.startsWith('private-backups.local/') || !file.endsWith('.encrypted.json')) throw new Error('Explicit private encrypted backup required');
const keys = JSON.parse(await readFile('private-backups.local/recovery-key.local.json', 'utf8'));
const snapshot = openBackup(JSON.parse(await readFile(file, 'utf8')), keys.PRIVATE_BACKUP_KEY);
if (snapshot.projectId !== 'manhfilm-105b3') throw new Error('Unexpected source project');
const projectId = 'demo-mfilm-private-restore';
const app = initializeApp({ projectId }, 'private-restore-verifier');
const db = getFirestore(app);
try {
    const result = await restoreBackup(db, snapshot, { verifyIncomplete: process.argv.includes('--verify-incomplete') });
    const report = { sourceFile: file, sourceProject: snapshot.projectId, targetProject: projectId, emulator: true, verifiedDocuments: result.verified, complete: snapshot.complete, omissions: snapshot.omissions || [], fullNestedPayloadsCompared: true, verifiedAt: new Date().toISOString() };
    await writeFile('private-backups.local/restore-verification.local.json', JSON.stringify(report, null, 2), { mode: 0o600 });
    console.log(JSON.stringify(report));
} finally { await db.terminate(); await deleteApp(app); }
