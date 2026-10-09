import { readFile } from 'node:fs/promises';
import { localAdminDatabase } from './lib/privateAdmin.mjs';
import { openBackup } from '../server/accounts/backup.js';
import { createAccountService } from '../server/accounts/service.js';

// Preparation keeps the legacy password field until the client and rules cutover.
// It cannot run without a complete authenticated private backup from this project.
const file = process.argv.find(arg => arg.startsWith('--backup='))?.slice(9);
if (!file || !process.argv.includes('--apply')) throw new Error('Explicit --apply and --backup=<encrypted local file> required');
const keys = JSON.parse(await readFile('private-backups.local/recovery-key.local.json', 'utf8'));
const backup = openBackup(JSON.parse(await readFile(file, 'utf8')), keys.PRIVATE_BACKUP_KEY);
if (!backup.complete || backup.projectId !== 'manhfilm-105b3' || backup.accountEncryptionKey !== keys.ACCOUNT_ENCRYPTION_KEY) throw new Error('Complete matching project backup required');
if (Date.now() - new Date(backup.createdAt).getTime() > 3600_000) throw new Error('Take a fresh backup before account preparation');
const db = await localAdminDatabase();
const service = createAccountService({ db, encryptionKey: keys.ACCOUNT_ENCRYPTION_KEY });
let cursor, count = 0;
try {
    while (true) {
        let query = db.collection('Users').orderBy('__name__').limit(25);
        if (cursor) query = query.startAfter(cursor);
        const page = await query.get();
        for (const doc of page.docs) {
            const user = doc.data();
            await service.commit({ id: doc.id }, typeof user.password === 'string' && user.password ? user.password : undefined, undefined, { preserveLegacyPassword: true });
            count++;
        }
        cursor = page.docs.at(-1);
        if (page.size < 25) break;
    }
    console.log(JSON.stringify({ prepared: count, legacyLoginPreserved: true, secureCutoverStillRequired: true }));
} finally { await db.terminate(); }
