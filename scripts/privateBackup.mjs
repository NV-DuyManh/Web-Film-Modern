import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

if (!process.env.CLOUD_WORKER_TOKEN) throw new Error('Private backup worker credential missing');
const response = await fetch(`${process.env.MFILM_ORIGIN || 'https://www.mfilm.online'}/api/accounts`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Mfilm-Worker': process.env.CLOUD_WORKER_TOKEN },
    body: JSON.stringify({ action: 'worker-backup' }),
});
const result = await response.json();
if (!response.ok || !result.data?.envelope) throw new Error(`Private backup failed (${response.status}); no partial backup saved`);
const output = JSON.stringify(result.data.envelope);
await mkdir('private-backups.local', { recursive: true });
const file = `private-backups.local/accounts-${new Date().toISOString().slice(0, 10)}.encrypted.json`;
await writeFile(file, output, { mode: 0o600 });
console.log(`Encrypted backup saved: ${result.data.count} documents; SHA256 ${createHash('sha256').update(output).digest('hex')}`);
