# Top 10 phim hot hôm nay

The homepage ranks all movies using activity from 00:00–24:00 in Vietnam
(`Asia/Ho_Chi_Minh`), independently of lifetime `Movies.views` and admin `isHot`.
Scores are `click + 2 × open + 5 × watch`. A watch requires 30 seconds of actual
playback; seeking and paused time do not qualify. The public eye badge is today's
qualified watch count, without a fabricated offset. Movies without activity are
not padded into the top ten. A new installation starts collecting from deployment.

Guests and members use the same anonymous browser identifier. No account, email,
authentication token or raw IP is stored in activity records. The server hashes
the browser ID and request IP for a receipt, deduplicating each movie/signal for
30 minutes across tabs and function instances. Calendar changes permit new
signals immediately. This limits refresh spam; it is not a guarantee against
determined automated traffic or cleared browser storage.

Client events are batched, nonblocking, retryable and flushed on page hide. The
server validates catalog IDs/slugs, event kinds, origin and timestamps. It ignores
recognized bots, limits batch sizes and bounds each browser/IP receipt to 300
accepted signals per day. Only server transactions update counters. The nested
`MovieActivity/private/Visitors` and `MovieActivity/private/Days/{date}/Shards`
collections are not accessible through the application's root-collection rules.

Each batch writes one receipt plus at most one shard per affected day, rather
than editing movie metadata per view. Eight counter shards avoid one global hot
document. Homepage reads use a shared 60-second server cache and CDN cache; a
visible tab refreshes each minute, so changes normally appear within two minutes.
Midnight limits both cache lifetime and client state. Failures show an unavailable
state rather than lifetime scores labelled as today's activity.

Firestore's existing free quotas still apply. Counter documents and anonymous
receipts persist; no paid TTL feature or billing upgrade is enabled. Receipts
overwrite a returning browser's previous day. Old daily shards are small but may
be deleted later by a separate retention job if storage requires it.

`/api/daily-ranking` rewrites to the existing chat rankings function with
`type=daily`, keeping the current Vercel Hobby function count. The independent
daily handler also runs through Vite's development middleware.

Validation: `node --test tests/dailyMovieRanking.test.js`, ESLint changed files,
and `npm run build`.
