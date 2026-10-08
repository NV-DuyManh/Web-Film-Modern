# Watch progress integration check

Run from the repository root with Node.js and Java installed:

```sh
npx firebase-tools emulators:exec --only auth,firestore --project demo-mfilm-sync --config firebase.test.json "node scripts/testResumeSync.mjs"
```

If the emulators are already running on ports 9099 and 8089, run `node scripts/testResumeSync.mjs`.

The check uses the actual Firestore rules and resume sync service against a demo project. Two independent worker clients have separate storage, authentication and module state. It verifies concurrent progress, backward seeks, offline deletion, retry, page hiding, logout, cached startup and account isolation. It never writes to the production Firebase project. Real phone playback and browser lifecycle behavior still require a device check.
