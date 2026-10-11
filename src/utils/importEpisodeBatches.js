// Persist the last committed batch so a long series can span quota days.
export async function importEpisodeBatches({ episodes, signature, previous = {}, write, saveProgress, batchSize = 200 }) {
    const sameSource = previous.crawlSourceFingerprint === signature;
    const saved = sameSource ? Math.max(0, Math.floor(Number(previous.crawlEpisodeCursor) || 0)) : 0;
    if (!sameSource) await saveProgress({ crawlSourceFingerprint: signature, crawlEpisodeCursor: 0 });
    for (let offset = Math.min(saved, episodes.length); offset < episodes.length; offset += batchSize) {
        const batch = episodes.slice(offset, offset + batchSize);
        await write(batch);
        await saveProgress({ crawlSourceFingerprint: signature, crawlEpisodeCursor: offset + batch.length });
    }
}
