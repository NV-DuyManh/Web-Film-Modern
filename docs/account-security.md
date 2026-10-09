# Account security rollout

## Current status

The implementation is staged. Production account flags and the private backup
workflow are not enabled. The live Firestore rules were inspected on 2026-10-09:
they still allow public reads and writes. The attempted private backup failed with
`RESOURCE_EXHAUSTED: Quota exceeded`; no production accounts were migrated and no
new Firestore rules were published. Never mark this rollout complete until the
real backup, migration, rules and production login checks succeed.

Admin retains the existing password reveal control. Original passwords are
encrypted with AES-256-GCM in a separate server-only collection; scrypt digests
check logins. A verified current administrator may decrypt a selected password,
and the server records an audit entry. Normal sessions, comment avatars and the
admin directory exclude passwords. Losing the recovery key loses decryptability.

PayPal remains the owner's demo. There is no new provider secret requirement or
real payment verification. Demo rental, subscription and deposit records are
marked `paymentMode: demo`, use server product prices and bind transaction IDs to
the account/product. Repeated approvals cannot grant twice. Rentals last 30 days.
This endpoint intentionally grants simulated access; it is not a commerce API.

## Activation order after quota permits reads and writes

1. Keep `VITE_SECURE_ACCOUNTS_ENABLED` and `SECURE_ACCOUNTS_ENABLED` disabled.
   Refresh the authorized Firebase CLI session. Run
   `node scripts/accountBackupLocal.mjs`. A quota error stops the rollout.
   Keep the encrypted snapshot and `private-backups.local/recovery-key.local.json`
   outside Git; keep a second private copy. Do not regenerate encryption keys
   after accounts have been prepared.
2. Configure Vercel server-only `ACCOUNT_ENCRYPTION_KEY`, `PRIVATE_BACKUP_KEY`
   and `CLOUD_WORKER_TOKEN` from the recovery file. Retain the existing Firebase
   Admin certificate variables (`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`,
   `FIREBASE_PROJECT_ID`). Never prefix these secrets with `VITE_`.
3. Run `node scripts/prepareAccountsLocal.mjs --apply --backup=<snapshot file>`.
   This prepares encrypted credentials, bounded directory shards and public
   profiles while retaining legacy password fields for the old client. Finish
   the cutover promptly; production rules are still open at this stage.
4. Set server `SECURE_ACCOUNTS_ENABLED=true` and client
   `VITE_SECURE_ACCOUNTS_ENABLED=true`; deploy. Add the same worker token as a
   GitHub Actions secret. Check the new login and authenticated worker token
   before closing rules. Do not print custom tokens in diagnostics.
5. Publish `firestore.secure.rules` using a dedicated rules config (the emulator
   test config must not be used for production). Verify anonymous Users and
   credential reads are denied. Existing browser sessions may need a reload.
6. As verified admin, call the paged `migrate` action until `complete=true`.
   This removes remaining plaintext fields while preserving recoverable
   passwords and current account data. Check regular login, Google login,
   administrator reveal, blank-password edits, paginated profiles and workers.
7. Set repository variable `SECURE_ACCOUNTS_ENABLED=true`. The scheduled encrypted
   backup runs daily at 02:47 Vietnam time and keeps artifacts seven days.
   Run it once and verify recovery privately before calling backups operational.

## Free plan and backup boundaries

No billing plan upgrade, paid managed backup or TTL feature is enabled. Backup
reads share the existing background quota budget. An export is capped at 5,000
private documents and 3.8 MB of encrypted API response; exceeding either limit
fails visibly instead of publishing a partial snapshot. Extend to streamed,
partitioned exports before growing beyond these limits. Film metadata is covered
by the existing public catalog snapshots, not this private export.

Account read reductions remove the global Users listener in secure mode: regular
visitors load their profile, public comments load only requested public avatars,
and admin loads a directory of at most 256 shards plus the visible page's full
profiles. This cannot bound all project reads or prove the cause of the historical
19 million reads; console traffic, old clients and other queries still count.

## Validation

`firebase.accounts-test.json` restricts tests to local emulators. Start with
`npx firebase-tools@14.22.0 emulators:start --project demo-mfilm-accounts --config firebase.accounts-test.json`.
Run `scripts/testAccounts.mjs` with Firestore host `127.0.0.1:8089` and Auth host
`127.0.0.1:9099`. It resets only the disposable test database, checks access
denials and admin reveal, and restores and compares full encrypted documents.
`scripts/testResumeSync.mjs` verifies two isolated clients, concurrency, offline
retry, logout, seek-backwards and account isolation under the actual rules.

UI checks used a synthetic 90-second video on localhost: admin login/reveal,
directory phone search, server switching, reload/resume and a 390-pixel viewport.
No real money was transferred. A real phone and production end-to-end checks are
still required after activation.
