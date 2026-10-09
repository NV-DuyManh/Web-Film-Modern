# Public catalog and daily KKPhim import

The public site uses versioned CDN files generated from `server/seo/catalog.json`.
Account, payment, watch progress and AI memory data are never exported there.

- Home loads a fixed set of featured films rather than every movie document.
- Public lists and header search use paginated catalog responses. Search covers the complete catalog; header suggestions return up to 100 results.
- Movie identity and admin search use a compact name/slug index. Admin movie rows subscribe only to the visible document IDs and their related people.
- Detail, playback and rental screens still read the selected live movie. Cached plan labels never determine access or payment prices.
- Confirmed admin name changes and deletions remain visible locally while the next CDN publication catches up.

## Scheduled work

GitHub Actions runs `daily-kkphim-import.yml` around **01:23 Vietnam time** every day. GitHub schedules may be delayed.
It checks KKPhim pages **1–5** (normally about 120 recently updated source listings), imports missing films and preserves the plan and rental price of films already present.
New imports use the existing plan-based rental pricing; Free films have no rental charge.
Actual source timestamps control recency, so importing an older page later does not move those films ahead of newer source films.

The import cursor lives in `Settings/DailyKkphimCrawler`. The existing background worker resumes this queue after the admin queue.
Only one daily discovery job is queued per Vietnam day. Unfinished jobs resume rather than being replaced.
Set that document's `enabled` field to `false` to disable automatic discovery. Manual crawler jobs remain available.
The existing episode sync continues updating episodes of known films independently.

At around **02:23 Vietnam time**, catalog maintenance audits at most 250 movies and refreshes the CDN snapshot incrementally:

1. Application edits atomically update the public entity and its `CatalogChanges` marker.
2. The refresh reads at most 1,000 changed entities per run, resuming its timestamp/document-ID cursor from the committed Git snapshot.
3. Deletes remove the cached entity; pending imports stay unpublished until complete.
4. A rotating audit of at most 100 records also picks up direct Firebase Console additions/edits and view counts. Direct Console deletions need a tracked application delete or a deliberate full snapshot refresh.
5. The workflow commits the public snapshot and sitemap; the existing Vercel Git integration publishes them.

The import, episode sync and maintenance workflows share the `episode-cloud-sync` concurrency group and background quota meter.
The meter reserves room within **20,000 reads / 6,000 writes per Pacific day** for these jobs and their checkpoints. Change markers count as extra writes.
It measures only these serialized jobs, not visitor, admin or Firebase Console usage. Exhausted jobs wait for reset and resume.

## Capacity and cost

No paid service or billing upgrade is introduced. GitHub Actions runs in the existing public repository, and the current hosting/Firebase configuration stays in place.
Tests cover pagination and search over a synthetic 10,000-film catalog, bounded homepage data, daily queue deduplication and interrupted incremental refreshes.
This is not a claim of unlimited free storage or traffic: movie documents, episodes and change markers still consume Firestore storage, and live user operations still consume its free quota.
Inspect actual Firestore usage as the catalog and traffic grow. Avoid full collection refreshes in routine scheduled jobs.
