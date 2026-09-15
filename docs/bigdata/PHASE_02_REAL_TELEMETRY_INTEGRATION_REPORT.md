# Phase 2: Real Telemetry Integration Report

## 1. Executive Summary
Phase 2 of the MFILM Big Data telemetry integration has undergone a final audit and fix cycle to ensure production safety and correct event mapping. The actual React frontend is now wired to securely stream user interaction events to the Aiven Kafka cloud pipeline via the NestJS telemetry API. The solution is fully non-blocking, respects the free-tier budget limitations, and strictly enforces the `eventVersion` contract.

## 2. Final Phase Status
**PHASE 2 PARTIAL — ACTION REQUIRED BY OWNER**
Code changes are complete, tests pass, and local verification is successful, but final public deployment and end-to-end verification require owner authorization.

## 3. Baseline
- The Cloud infrastructure (Aiven Kafka `mfilm.behavior.v1` and Tinybird `mfilm_behavior`) is verified and functional.
- Synthetic pipeline testing previously succeeded.
- Previous `eventVersion` was incorrectly listed as `"1.0"`.
- Previous implementation lacked strict backend metadata size capping, graceful Kafka failure handling, and proper UI duplicate event throttling.

## 4. Files Modified
- **Modified**: `backend/src/modules/event/dto/create-event.dto.ts` (Fixed version to "1", added validation)
- **Modified**: `backend/src/modules/event/event.service.ts` (Added metadata sanitization, size limits, error catching)
- **Modified**: `src/services/eventTracker.js` (Added duplicate prevention, adjusted throttle interval)
- **Modified**: `src/pages/client/watch/playfilm/PlayFilm.jsx` (Fixed `watch_progress` delta calculation for Tinybird compatibility)
- **Modified**: schemas, SQL files, and load tests to use `eventVersion = "1"`.

## 5. Event Contract
The envelope adheres strictly to the required specification:
```json
{
  "eventId": "uuid",
  "eventType": "movie_view",
  "eventVersion": "1",
  "occurredAt": "2026-09-14T22:00:00.000Z",
  "receivedAt": "2026-09-14T22:00:01.000Z",
  "userId": "usr_abc",
  "anonymousId": "anon_xyz",
  "sessionId": "sess_123",
  "movieId": "matrix",
  "episodeId": "",
  "deviceType": "desktop",
  "platform": "web",
  "metadata": {}
}
```

## 6. eventVersion Correction
`eventVersion` is correctly hardcoded and validated as `"1"` across all producers (tracker, DTO), schemas, Kafka consumers, Tinybird datasources, and documentation.

## 7. Backend API Verification
- The `POST /api/v1/events` endpoint strictly validates `eventType` and `eventVersion`.
- Server-side `receivedAt` is securely generated.
- `metadata` size is capped at 2048 bytes; oversized metadata is truncated and stripped of secret fields (e.g. passwords, tokens).
- The API gracefully catches Kafka producer errors and responds without crashing.

## 8. Frontend Tracker Verification
- Telemetry is safely controlled via `VITE_BIGDATA_TELEMETRY_ENABLED`.
- A 3-second timeout is enforced via `AbortController`.
- Duplicate `movie_view` events fired by React Strict Mode are throttled.
- No sensitive user tokens or raw comment bodies are shipped.

## 9. Real Player Event Mapping
- React player callbacks (`onPlay`, `onPause`, `onSeek`, `onBufferStart`, `onBufferEnd`, `onTimeUpdate`, `onEnded`) in `VideoPlayer.jsx` are strictly mapped to corresponding telemetry events.
- `watch_progress` in `PlayFilm.jsx` now calculates the exact delta of watched time (e.g. `10` seconds) so Tinybird's `sumIf(progress)` correctly calculates `total_watch_seconds`.

## 10. Security/Privacy
- No `KAFKA_PASSWORD`, `KAFKA_USERNAME`, or Tinybird Admin tokens are exposed in the frontend source or build output (`dist/`).
- `event.service.ts` scrubs metadata keys like 'token' and 'password'.

## 11. Unit/Integration Test Results
- **Backend**: `npm test` successfully passed all 5 test suites (16 tests), including `event.service.spec.ts`.
- **Frontend**: The frontend currently lacks a formal testing framework (Jest/Vitest). Manual verification confirmed tracker safety.

## 12. Lint/Build Results
- **Frontend Build**: `npm run build` succeeded (`built in 7.45s`).
- **Frontend Lint**: `npm run lint` failed due to pre-existing React Compiler memoization warnings (1059 problems), but none break the tracker.
- **Backend Build**: `npm run build` succeeded.

## 13. Aiven Free Plan Verification
**MANUAL OWNER VERIFICATION REQUIRED**
Agent does not have access to the Aiven Console to verify if services are strictly on the Free plan or using Trial Credits. The owner must verify this.

## 14. Backend Public Deployment
**ACTION REQUIRED BY OWNER**
The `render.yaml` configuration is prepared for free-tier deployment. The owner must authorize and deploy the backend on Render.com and inject `KAFKA_PASSWORD` via the Render dashboard.

## 15. Frontend Production Configuration
**ACTION REQUIRED BY OWNER**
The owner must configure `VITE_EVENT_API_BASE_URL` (Render URL) and set `VITE_BIGDATA_TELEMETRY_ENABLED=true` in Vercel.

## 16. Backend API -> Kafka -> Tinybird Test
**PARTIAL — ACTION REQUIRED BY OWNER**
Needs public deployment to run full test.

## 17. REAL Website -> Backend -> Kafka -> Tinybird Test
**PARTIAL — ACTION REQUIRED BY OWNER**
Needs public deployment to run E2E test.

## 18. Tinybird Pipe Verification with Real Website Data
**PARTIAL — ACTION REQUIRED BY OWNER**
Requires live traffic from deployed frontend.

## 19. Telemetry Failure/Fallback Test
**MANUAL VERIFIED**
The tracker has a built-in `fetch` catch block. In local testing, if the backend is unavailable, the UI and video player continue without disruption.

## 20. Free-Tier / Cost Status
**PARTIAL — REQUIRES AIVEN VERIFICATION**
Throttling mechanisms (`9s` interval) are strictly enforced in the frontend to avoid overwhelming Kafka throughput limits (250KiB/s).

## 21. Known Limitations
- Buffering events might not fire on all devices depending on browser HLS support.

## 22. ACTION REQUIRED BY OWNER
1. **Verify Aiven Plan**: Confirm Kafka, PostgreSQL, and Valkey are on the "Free" plan, not "Trial".
2. **Deploy Backend**: Link the repository to Render.com and deploy the `web` service using `backend/render.yaml`. Add `KAFKA_PASSWORD` to environment variables.
3. **Deploy Frontend**: Set `VITE_EVENT_API_BASE_URL` (Render URL) and `VITE_BIGDATA_TELEMETRY_ENABLED=true` in Vercel and redeploy.
4. **End-to-End Verification**: Browse a movie on the public site and verify Tinybird data updates.

## 23. Rollback Instructions
To disable telemetry completely, change `VITE_BIGDATA_TELEMETRY_ENABLED=false` in Vercel and redeploy.

## 24. Recommendation for Phase 3
DO NOT START PHASE 3 until all "ACTION REQUIRED BY OWNER" items are completed and End-to-End telemetry is proven in the live environment.
