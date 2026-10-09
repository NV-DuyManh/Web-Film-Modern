import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { localAdminDatabase } from './lib/privateAdmin.mjs';
import { collectBackup, sealBackup, openBackup } from '../server/accounts/backup.js';

const keyPath = 'private-backups.local/recovery-key.local.json';
await mkdir('private-backups.local', { recursive: true });
let keys;
try { keys = JSON.parse(await readFile(keyPath, 'utf8')); }
catch (error) {
    if (error.code !== 'ENOENT') throw error;
    keys = { PRIVATE_BACKUP_KEY: randomBytes(32).toString('base64'), ACCOUNT_ENCRYPTION_KEY: randomBytes(32).toString('base64'), CLOUD_WORKER_TOKEN: randomBytes(48).toString('base64url') };
    await writeFile(keyPath, JSON.stringify(keys), { flag: 'wx', mode: 0o600 });
}
const db = await localAdminDatabase();
const snapshot = await collectBackup(db);
snapshot.accountEncryptionKey = keys.ACCOUNT_ENCRYPTION_KEY;
const envelope = sealBackup(snapshot, keys.PRIVATE_BACKUP_KEY);
const opened = openBackup(envelope, keys.PRIVATE_BACKUP_KEY);
if (JSON.stringify(opened) !== JSON.stringify(snapshot)) throw new Error('Backup round-trip verification failed');
const file = `private-backups.local/before-account-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.encrypted.json`;
await writeFile(file, JSON.stringify(envelope), { mode: 0o600 });
console.log(JSON.stringify({ file, documents: snapshot.documents.length, authenticatedEncryptionVerified: true, collections: Object.fromEntries([...new Set(snapshot.documents.map(item => item.path.split('/')[0]))].map(name => [name, snapshot.documents.filter(item => item.path.startsWith(name + '/')).length])) }));
await db.terminate();
