# KKPhim background crawler

The admin's **Start Cloud Crawl** stores one durable request in
`Settings/KkphimCrawler`. Importing takes place in the GitHub workflow
`kkphim-background-crawler.yml`, independently of the browser. Scheduled workers
check the queue approximately every five minutes; GitHub can delay scheduled runs.
`workflow_dispatch` can also start a worker. An idle worker does not import films.

The worker traverses the requested pages in descending order and reverses each
page's items. `sourceUpdatedAt` retains KKPhim's modification time; homepage,
new-film lists, admin and server-rendered discovery pages sort by that timestamp
before falling back to existing local timestamps. `createdAt` remains the import
date. Existing films receive the source timestamp without rerolling their plan,
rental price, or overwriting their artwork and metadata.

Page snapshots, item cursor, statistics and bounded logs are persisted after each
film. Pause/stop take effect between films. Resume uses the saved cursor. A ten
minute worker slice queues the remaining work for the next run. A twenty minute
lease protects against retry during an interrupted process. All catalog-writing
workflows share the `episode-cloud-sync` concurrency group.

New movie IDs and episode IDs are deterministic. A pending movie can recover after
a failed episode batch instead of being silently skipped. An item is retried up to
three times; exhausted retries are visible in job failures/logs. A malformed page
response fails the job visibly. A new request can be started after a terminal job.

Verification:

```sh
node --test src/utils/crawlerJob.test.js
node scripts/crawlKkphim.mjs --dry-run
```

The dry run only reads the current job; it never queues or imports films. Local
writes are refused: use the serialized cloud workflow. This feature uses the
project's existing Firebase access policy, without changing roles or rules.

## Free-quota protection

Scheduled catalog writers share `Settings/BackgroundQuota` with a daily budget of
20,000 document reads and 6,000 writes. This meters the jobs' own SDK operations;
it is not Firebase Console usage, and excludes visitor/admin traffic and billing
from other existing services. Pacific-time midnight (including DST) resets the
budget. A crawler reaching the budget saves its cursor and waits until reset.
Episode batches also save their own cursor, so a series longer than the daily
write allowance resumes after its last saved batch instead of starting again.
The allowances leave headroom below Firestore's free daily limits, but cannot
guarantee unlimited traffic or storage on a free project.

Crawler matching uses the deployment snapshot and bounded lookups instead of
scanning all movies/actors/authors. Episode sync hashes the source list and skips
episode reads when it has not changed. Browser tabs do not launch another
automatic episode writer; automatic sync remains in the cloud.

Public discovery pages use 28-row cached API pages; the shared public catalog is
generated into 250-row static CDN chunks during builds. Scheduled refreshes and
incremental crawl publication update those snapshots. Page visits never trigger a
full Firestore catalog scan. Root credentials, accounts, rentals, subscriptions
and answer memory are excluded from public exports. Purchase/playback decisions
still use a targeted live movie document and the current account's private data.

Episode numbers/names use public memory/CDN and application-managed Firestore
metadata caches; stream URLs are omitted and only the selected, permitted episode
is read by the player. This does not enable a paid TTL/backup feature or a new
service. No Firebase/Vercel/GitHub billing plan is changed by this implementation.
