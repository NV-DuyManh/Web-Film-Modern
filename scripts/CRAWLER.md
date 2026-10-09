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
