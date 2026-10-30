# Public member badges

Comment badges must describe the author, independently of the viewer's login.
Homepage comments, movie comments, playback comments and replies use
`resolveCommentMember`. The account endpoint's `public-profiles` action works in
both legacy and secure account modes, reading only requested IDs and projecting
public display fields. It does not require an account password encryption key.

The server derives the author's highest active tier from the assigned plan and
successful subscriptions. Pending/cancelled, expired and future subscriptions are
excluded. Legacy rows with no status remain compatible. This same resolver is
used by account/header badges, admin membership displays and playback tier checks.
Public `membership` fields are display-only and never grant playback access.

Server/client caches coalesce identical batches of up to 30 IDs for at most one
minute, shortened at the next subscription boundary. Profile polling pauses for
hidden tabs/offscreen sections. No profile data is persisted to browser storage.
Missing data or lookup failures do not invent a Free label, and old comment
snapshots supply names/avatars only. Selected avatar frames remain independent of
the viewer. Account changes trigger a profile refresh.

The endpoint returns only ID, name, avatar, sex, public role, assigned plan,
selected frame and derived membership. Contact details, account credentials,
payment amounts, transactions and subscription history never leave the server.
No Firestore rules or billing settings are changed.

Validation: `node --test tests/publicMembership.test.js`, existing request/ranking
regressions, ESLint on changed code and the production build.
