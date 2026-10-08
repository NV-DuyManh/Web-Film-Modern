// Keep the cursor at the last displayed match, not the last fetched document;
// otherwise matches in the lookahead chunk disappear from the next page.
export async function scanAdminPage(fetchChunk, matches, cursor = null, size = 20, cancelled = () => false) {
    const rows = [];
    let scanned = cursor;
    let lastVisible = cursor;
    while (!cancelled()) {
        const chunk = await fetchChunk(scanned);
        if (!chunk.length) return { rows, cursor: lastVisible, hasNext: false };
        for (const item of chunk) {
            scanned = item;
            if (await matches(item)) {
                if (rows.length === size) return { rows, cursor: lastVisible, hasNext: true };
                rows.push(item);
                lastVisible = item;
            }
            if (cancelled()) break;
        }
    }
    return { rows, cursor: lastVisible, hasNext: false };
}
