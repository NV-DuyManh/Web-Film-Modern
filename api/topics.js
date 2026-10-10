import { loadTopicControls } from '../server/topics/controls.js';

export const config = { maxDuration: 15 };
export default async function handler(req, res) {
    if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).end();
    const items = await loadTopicControls();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, must-revalidate');
    res.setHeader('X-Robots-Tag', 'noindex');
    return res.status(200).end(req.method === 'HEAD' ? '' : JSON.stringify({ items }));
}
