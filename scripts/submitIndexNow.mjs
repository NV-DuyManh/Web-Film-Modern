import { readFile } from 'node:fs/promises';
import { SITE_ORIGIN } from '../src/utils/seo.js';

const key = (await readFile(new URL('../public/indexnow-key.txt', import.meta.url), 'utf8')).trim();
let xml = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
const recent = process.argv.includes('--recent');
if (recent) {
    const sitemap = await fetch(`${SITE_ORIGIN}/sitemap.xml`, { signal: AbortSignal.timeout(30000) });
    if (!sitemap.ok) throw new Error(`Sitemap HTTP ${sitemap.status}`);
    xml = await sitemap.text();
    if (!xml.includes('<urlset')) throw new Error('Invalid deployed sitemap');
}
const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .filter(match => !recent || Date.parse(match[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]) >= Date.now() - 36 * 3600000)
    .map(match => match[1].match(/<loc>([^<]+)<\/loc>/)?.[1]?.replace(/&amp;/g, '&')).filter(Boolean);
if (recent && urls.length) urls.push(`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/film-new`);
if (!/^[a-zA-Z0-9-]{8,128}$/.test(key) || urls.some(url => new URL(url).origin !== SITE_ORIGIN)) throw new Error('Invalid IndexNow key or sitemap host');
console.log(`IndexNow: ${urls.length} public canonical URLs on ${new URL(SITE_ORIGIN).host}.`);
if (!process.argv.includes('--submit')) { console.log('Dry run. Add --submit after deployment to notify participating search engines.'); process.exit(0); }
if (!urls.length) { console.log('No recent catalog changes to submit.'); process.exit(0); }
const verification = await fetch(`${SITE_ORIGIN}/indexnow-key.txt`, { signal: AbortSignal.timeout(15000) });
if (!verification.ok || (await verification.text()).trim() !== key) throw new Error('Deploy the ownership key before submitting URLs');
for (let i = 0; i < urls.length; i += 10000) {
    const response = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: new URL(SITE_ORIGIN).host, key, keyLocation: `${SITE_ORIGIN}/indexnow-key.txt`, urlList: urls.slice(i, i + 10000) }), signal: AbortSignal.timeout(30000) });
    if (![200, 202].includes(response.status)) throw new Error(`IndexNow returned HTTP ${response.status}: ${(await response.text()).slice(0, 250)}`);
    console.log(`IndexNow received batch ${i / 10000 + 1}: HTTP ${response.status}. Indexing is decided by each search engine.`);
}
