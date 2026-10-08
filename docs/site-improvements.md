# MFILM: playback, rentals, loading and catalog updates

## Rentals

New successful rentals grant 30 × 24 hours from purchase. A renewal extends a still-active expiry by another 30 days; expired rentals restart from purchase time. Existing purchased expiry dates are preserved. `rentalPolicy.js` is the shared policy. Pages show unavailable prices and payment methods explicitly and prevent zero-value checkout.

## Watch progress

Guests keep progress locally. Signed-in users use their own local account store, without importing guest or other-account history. Cloud progress lives at `Users/{Firebase Auth UID}/WatchProgress/{movieId}`. Updates merge each episode by timestamp in a transaction; deletion markers prevent stale offline devices from restoring removed history. Writes are batched every 15 seconds and flushed on leaving/hiding the page or reconnecting.

Cloud sync starts only when Firebase Auth matches the signed-in account **and** an anonymous read of its cloud progress is denied. Under the current public rules, it intentionally retains local progress and uploads no watch history.

Before enabling cloud sync, apply owner-only Firestore Rules for this namespace. The relevant fragment is:

```text
match /Users/{authUid}/WatchProgress/{movieId} {
  allow read, write: if request.auth != null && request.auth.uid == authUid;
}
```

A broad rule such as `match /{document=**} { allow read, write: if true; }` overrides this protection. The supplied Firebase Rules screenshot confirms this is the current rule. The complete replacement is in `firestore.rules`: it preserves public access to existing root documents and restricts the new nested history to its Firebase Auth owner. The source uses no other nested collections. This is a compatibility change for watch progress, not a full security overhaul of the existing public account/catalog data.

In Firebase Console → Firestore Database → Rules, replace the complete rules with `firestore.rules` and publish. Reload/sign in again after publication. Validate with two devices, account switching, offline progress and deletion before considering cloud sync operational.

The owner confirmed publication on 2026-10-08. A fresh anonymous Firebase SDK check then confirmed that `Movies` remains readable and `Users/privacy-verification/WatchProgress` returns `permission-denied`. Account isolation, timestamp merging and deletion are covered by automated tests; a real authenticated two-device session has not been tested in this workspace.

## Episode updates

The existing GitHub workflow now runs every 30 minutes, queries only recently updated source slugs and updates matching catalog movies. Visitors no longer fetch external catalogs or write synced episodes. Source fields and existing alternate servers are preserved. New episode IDs are deterministic to make retries idempotent.

`Settings/CloudEpisodeSync` contains the shared lock, `lastSuccessAt`, optional `enabled` (default true), `intervalMinutes` (minimum/default 30) and `syncPages` (default 2). These settings are independent of the administrator's `Settings/AutoSync`, which controls a different catalog workflow.

Read-only verification: `node scripts/cloudSync.mjs --dry-run`. Manual repair of older ongoing films: `node scripts/cloudSync.mjs --full`; add `--dry-run` to preview changes. Full scans should remain manual to limit database reads. GitHub schedules can be delayed by the provider.

## Sitemap and loading

`npm run sitemap` generates the static deployment snapshot. `/sitemap.xml` resolves to `/api/sitemap` on Vercel, which serves the snapshot without catalog reads for its first day, caches refreshes for a day and falls back to the previous snapshot on errors. It uses the same complete name-route index as the client and excludes checkout, account and watch-player routes. The sitemap is excluded from PWA precaching.

The home page uses the shared chunk retry loader. Module reloads are guarded once per session/path; persistent failures show retry UI. Catalog failures have a visible loading error. The chatbot module and data are loaded when the chat opens; unused actor/author/comment/review subscriptions have been removed.
