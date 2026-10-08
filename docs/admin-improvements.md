# Admin improvements (items 2–8)

The authentication/security proposal (item 1) is deliberately excluded. Existing logos, icons, plan rules, rental pricing and schedules are retained.

- Revenue includes only successful/paid/completed payments, filtered by date in Vietnam time. USD and VND are separate; legacy records without a currency retain the existing USD convention. No exchange rate is inferred.
- Admin deletes save original documents to AdminTrash before removing them in atomic batches. Movie episodes, showtimes, comments and reviews are grouped with the movie. Restore checks existing IDs and preserves fields, including Firestore timestamps. An interrupted multi-batch operation can restore its completed parts. Client folders/history keep their original deletion behavior.
- AdminActivity records future create/update/trash/restore operations with actor, entity and changed field names. It never records passwords or changed field values.
- Movie lists filter by plan, genre, year, status, import source and missing image/episodes/paid rental price. Free movies do not require a rental price.
- Movies, actors, directors and characters load with Firestore cursors. Related entities load only for the visible movies. Sparse searches/combined filters scan additional chunks on demand. This preserves accent-insensitive substring search, which Firestore does not index. Full totals are optional; quota errors from aggregation do not block next/previous pages.
- Operations shows scheduled jobs, latest success/error, result counts and estimated next run. Existing daily catalog maintenance and episode-sync schedules are unchanged. Error telemetry is written on future runs.
- Forms warn before closing with unsaved changes. Admin notifications, labels, action tooltips, loading/error/empty states use Vietnamese. Existing decorative header icons remain visible.

Recovery/history start with this release; previous permanent deletions cannot be reconstructed. Avoid editing or reimporting the same records while restoring a trash group.

## Validation

- All Node test files in src, server and api: 122 tests pass.
- scripts/integration/testAdminOperations.mjs: isolated disposable QA fixture, archive, conflict refusal, exact restoration including timestamps, cleanup.
- scripts/integration/testAdminQueries.mjs: read-only cursor pages and plan/status/year/genre filters; optional aggregation can be unavailable under quota.
- Production build and ESLint on new modules pass. Existing lint findings in legacy files are compared against HEAD; no new errors introduced.
