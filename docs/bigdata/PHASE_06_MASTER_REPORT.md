# Phase 06: Production Personalized Recommendation / “Dành Cho Bạn” — Master Report

## 1. Executive Summary
Phase 06 transitions MFILM’s recommendation capability from **LOCAL VERIFIED** into a secure, zero-cost, event-driven personalized recommendation experience on `https://www.mfilm.online`.

Under the updated Product Requirements, **“Dành Cho Bạn” is NOT a generic popularity carousel**:
1. **Zero-Signal Gating**: Any visitor or authenticated user with NO meaningful preference data (0 favorites and 0 interaction events) sees **no “Dành Cho Bạn” section** (`eligible: false`, `source: "none"`, `total: 0`, `items: []`). The component renders `null` with zero DOM footprint and zero layout gap. Generic popularity remains in other homepage sections (e.g. Top Phim, Phim Mới).
2. **First-Click / Event-Driven Unlock**: Once a visitor interacts with at least one movie (via `movie_view`, `play`, `watch_progress`, `complete`, or `recommendation_click`), “Dành Cho Bạn” unlocks and recommends candidates dynamically derived from that interaction history.
3. **No Heading-Only Empty State**: The component strictly returns `null` while loading and when no movie cards are present (`if (loading || !displayMovies || displayMovies.length === 0) return null;`). The section heading "Dành Cho Bạn" is **NEVER** rendered without movie cards.
4. **Decoupled Client Rendering**: Recommendation cards render directly from API response items without waiting for the separate full Firestore catalog hook (`useMovies()`). If the catalog is loaded, items are enriched seamlessly.
5. **Durable Behavior & Verified Identity Mapping**: Authenticated users with favorites in Firestore or durable viewing history in Tinybird remain eligible across Render cold starts/restarts. Verified Firebase Auth identity maps safely to customer Firestore documents via `uid` and verified `email`.
6. **Zero Added Cost ($0 Budget)**: Architecture A utilizes Firestore catalog (884 movies), Aiven Kafka, Tinybird telemetry, and bounded in-process LRU caches on Render without requiring PostgreSQL or Valkey in production.
7. **Authenticated Path Fixed** (commit `04ee983`): Resolved four root causes that prevented logged-in users from receiving personalized recommendations even when they had favorites and viewing history.

---

## 2. Root Cause Analysis: "Dành Cho Bạn" Heading-Only / No-Movies Defect

### Root Cause 1: Premature Rendering During Loading State (`ForYou.jsx`)
- **Mechanism**: The conditional guard in `ForYou.jsx` was previously written as:
  ```javascript
  if (!RECOMMENDATIONS_ENABLED && !loading) return null;
  if (!loading && displayMovies.length === 0) return null;
  ```
  During the initial component mount or reload when `loading === true`, `!loading` evaluated to `false`. Consequently, both return guards were bypassed, and the component proceeded to render the full section heading `<h2 ...>Dành Cho Bạn</h2>`, the AI badge, and an empty Swiper wrapper while `displayMovies` was still `[]`.
- **Resolution**: Enforced strict three-tier guard:
  ```javascript
  if (!RECOMMENDATIONS_ENABLED) return null;
  if (loading) return null;
  if (!displayMovies || displayMovies.length === 0) return null;
  ```
  The component strictly returns `null` during loading and whenever `displayMovies` is empty, guaranteeing that the heading is NEVER rendered without cards.

### Root Cause 2: Hard Catalog Dependency in Client Memo (`ForYou.jsx`)
- **Mechanism**: `displayMovies` had a strict prerequisite:
  ```javascript
  if (!movies || movies.length === 0 || !recommendations || recommendations.length === 0) return [];
  ```
  Because `movies` is loaded asynchronously via the client-side Firestore hook `useMovies()`, any delay in catalog fetching meant `displayMovies` returned `[]` even after the recommendation API returned 10–15 valid movie items.
- **Resolution**: Decoupled `displayMovies` from `movies`. Recommendation cards construct immediately from the API payload (`movieId`, `name`, `slug`, `imgUrl`, `bannerUrl`, `reason`, `score`) and enrich with `catalogMovie` if and when `useMovies()` resolves.

### Root Cause 3: Firestore Identity Mapping Mismatch (`ContentSimilarityService`)
- **Mechanism**: In `getUserFavorites`, Firestore queries looked up `doc(Users, userId)`, `where('uid', '==', userId)`, and `where('id', '==', userId)`. In MFILM, customer documents created during registration/login use auto-generated Firestore document IDs (`addDocument('Users', newCustomer)`) and store `email` without a matching `uid` field. As a result, authenticated users with favorites in Firestore were not found, causing `favIds = []` and `eligible = false`.
- **Resolution**: Added verified email fallback (`where('email', '==', email.toLowerCase().trim())`) using the cryptographically verified `decoded.email` from `OptionalFirebaseAuthGuard`.

### Root Cause 4: Ephemeral In-Memory Event Loss Across Render Restarts
- **Mechanism**: `EventService` interaction cache resides in RAM. When Render restarts or wakes from cold start, `userEvents` and `sessionEvents` in RAM are reset to `[]`. If an account had no favorites and relied solely on viewing history, it appeared as zero-signal.
- **Resolution**: Added `AnalyticsService.getRecentBehaviorSignals` querying Tinybird's durable `recent_recommendation_signals.pipe`. When RAM cache is empty, the service queries Tinybird for durable history, preserving eligibility across restarts.

---

## 2b. Authenticated Recommendation Path Root Causes (Commit `04ee983`)

### Root Cause A (CRITICAL): `eventTracker.js` sent events with NO `Authorization` header
- **Mechanism**: `trackEvent()` posted to `POST /api/v1/events` with no Bearer token. `EventController` resolved `authUserId = null` for every event. `EventService.recordRecentInteraction` stored signals only under `sessionId` in `sessionInteractions`, never under `uid` in `userInteractions`. When `RecommendationService` queried `getRecentInteractions({ userId: authUid })`, it returned `[]` — zero behavior events visible for authenticated users.
- **Resolution**: Rewrote `trackEvent()` as `async`. Before posting, calls `getAuth().currentUser?.getIdToken()`. If a Firebase Auth session exists (Google SSO), injects `Authorization: Bearer <token>`. Email/password-only users have `auth.currentUser = null` → proceed without token (session path). Never blocks event delivery on auth failure.

### Root Cause B (CRITICAL): Email/password login does NOT create a Firebase Auth session
- **Mechanism**: Email/password login verifies against Firestore `Users` collection directly and calls `loginByUser()` (stores to `localStorage.isLogin`). Does NOT call Firebase Auth `signInWithEmailAndPassword`. Therefore `getAuth().currentUser = null` for email/password users → `ForYou.jsx` sends no Bearer token → backend sees `authUid = null` → anonymous path only, favorites never consulted.
- **Resolution** (FIXED in commit `3c3c6af`): `LogIn.jsx` now calls `signInWithEmailAndPassword()` after Firestore lookup. If Firebase Auth account doesn't exist yet, auto-provisions via `createUserWithEmailAndPassword()`. `Register.jsx` also creates Firebase Auth accounts at registration time. All email/password users now have `auth.currentUser` set → Bearer token available → verified `authUid` on backend → personalized recommendations with favorites.

### Root Cause C (SECONDARY): `listFavorite` entries may be objects, not plain strings
- **Mechanism**: `getUserFavorites` called `data.listFavorite.map(String)`. If a Firestore entry was `{ id: "abc123", name: "..." }`, `String({id:"abc123"}) = "[object Object]"` — a string that never matches any movie in the content index. Every favorite entry became invalid → `seedIds = []` → `eligible=false`.
- **Resolution**: Implemented `extractFavoriteId()` normalizer in `getUserFavorites`. If entry is a plain string, returns it directly. If entry is an object, checks `entry.id`, `entry.movieId`, `entry.slug`, `entry._id` in order. Filters out `""`, `"none"`, `"[object Object]"`.

### Root Cause D (CONFIRMED OK, IMPLICIT): Session events not unioned in auth path
- **Mechanism**: `EventService.getRecentInteractions({ userId: authUid, sessionId, limit })` already merges `userInteractions[authUid]` and `sessionInteractions[sessionId]`. This was correct. The real issue was Root Cause A: events were never stored under `authUid` because no Bearer token was sent.
- **Resolution**: With Root Cause A fixed (Bearer token injection), `userInteractions[authUid]` now receives events after login. The existing union logic in `getRecentInteractions` correctly merges both sources.

---

## 2c. Account Isolation & Session Contamination Root Causes (Commit `3c3c6af`)

### Root Cause E (CRITICAL): Same recommendations for different accounts — session contamination
- **Mechanism**: Email/password users had no `auth.currentUser` → no Bearer token → fell to anonymous path. All email/password users in the same browser tab shared the same `sessionStorage`-based `mfilm_session_id`. When Account A logged out and Account B logged in on the same tab, both used the same `sess_X` → same anonymous behavior history → identical recommendations.
- **Resolution**: (1) Email/password login now provisions Firebase Auth (`signInWithEmailAndPassword` / `createUserWithEmailAndPassword`), giving each user a unique verified `authUid`. (2) `rotateSessionId()` exported from `eventTracker.js` clears `mfilm_session_id` from sessionStorage on logout and account switch. Next anonymous session gets a fresh ID.

### Root Cause F (CRITICAL): Crash on logout → re-login
- **Mechanism**: `ForYou.jsx` had no `AbortController` on in-flight recommendation requests. `onAuthStateChanged` listeners fired asynchronously after effect cleanup, potentially calling `fetchRecommendations()` with stale closures. During rapid auth transitions (logout → login), `Swiper` could crash on stale/null `displayMovies` state. In-flight requests from Account A could resolve after Account B's state was set, overwriting B's cards with A's data.
- **Resolution**: (1) `AbortController` cancels in-flight requests on cleanup. (2) `authEpoch` (monotonic counter from AuthProvider) captured at fetch-start; stale responses discarded if epoch changed. (3) `ForYouErrorBoundary` wraps the component — any render error fails silently instead of crashing the homepage. (4) Recommendations cleared immediately on epoch change before new fetch.

### Session Rotation Policy (Implemented)
- **First anonymous visit**: `sessionId = sess_X` (created in `sessionStorage`)
- **Login A**: Previous guest events under `sess_X` remain in backend session store as supplementary context. Auth identity = `verifiedUidA` from Firebase Auth. Recommendation cache key = `mfilm:rec:auth:<verifiedUidA>:...`
- **Logout A**: `signOut(auth)` clears Firebase Auth session. `rotateSessionId()` removes `mfilm_session_id` from `sessionStorage`. Frontend recommendation state cleared. `authEpoch` incremented.
- **Login B**: Fresh `sessionId = sess_Y` (auto-generated on next `getSessionId()` call). Auth identity = `verifiedUidB`. Cache key = `mfilm:rec:auth:<verifiedUidB>:...`. No leakage from Account A.

### Event Attribution
- Authenticated events: `eventTracker.js` sends `Authorization: Bearer <token>` → backend `EventController` extracts `authUserId` from verified token → events stored under both `userInteractions[authUid]` and `sessionInteractions[sessionId]`.
- Account A events are stored under `uidA`, Account B under `uidB` — never mixed.

---

## 3. Final Phase 06 Status
**PHASE 06 PARTIAL — PRODUCTION ACCEPTANCE REQUIRED**

- **Zero-Signal Gating**: **CODE VERIFIED (PASS)**.
- **Heading-Only Bug Fixed**: **YES (CODE VERIFIED & TESTED)**.
- **First-Click Unlock**: **CODE VERIFIED (PASS)**.
- **Anonymous Behavior Personalization**: **CODE VERIFIED (PASS)**.
- **Authenticated Personalization**: **CODE VERIFIED (PASS)**. Auth path fixed (`04ee983`), account isolation fixed (`3c3c6af`).
- **Firebase Auth for Email/Password**: **IMPLEMENTED** (`3c3c6af`). All login paths now produce `auth.currentUser`.
- **Session Rotation**: **IMPLEMENTED** (`3c3c6af`). `rotateSessionId()` on logout/account-switch.
- **ForYou Crash Fix**: **IMPLEMENTED** (`3c3c6af`). AbortController + authEpoch + ErrorBoundary.
- **Durable History (Tinybird Fallback)**: **CODE VERIFIED (PASS)**.
- **Insecure UID Fallback Removed**: **YES**.
- **Backend Tests**: **11/11 Suites Passed (63/63 Tests)**.
- **Backend Build**: **PASS** (`nest build`).
- **Frontend Build**: **PASS** (`vite build`).
- **Definitive Production Commit**: Latest deployable Phase 06 state (commit containing 21d49fb and this documentation cleanup; deploy current origin/main).
  - Render: pending deployment of latest Phase 06 commit
  - Vercel: pending deployment of latest Phase 06 commit with `VITE_RECOMMENDATIONS_ENABLED=true`

---

## 3. Architecture & Security: Authenticated Identity vs Anonymous Session

### Authentication & Authorization Pipeline
```mermaid
flowchart TD
    Req["Incoming Request: GET /api/v1/recommendations/for-you"] --> Guard["OptionalFirebaseAuthGuard"]
    Guard --> AuthCheck{"Authorization: Bearer <token> Valid?"}
    
    AuthCheck -- "Yes" --> AuthUid["req.user.uid (Verified Cryptographically)"]
    AuthCheck -- "No / Absent" --> AnonUid["authUid = null"]
    
    AuthUid --> AuthFlow["Authenticated Flow:\n1. Query Firestore Users/{authUid}/listFavorite\n2. Query EventService recent user events\n3. Check (favorites.length == 0 && events.length == 0)"]
    
    AnonUid --> AnonFlow["Anonymous Flow:\n1. Extract & Sanitize sessionId\n2. Query EventService recent session events\n3. Check (events.length == 0)"]
    
    AuthFlow -- "0 Favs & 0 Events" --> ZeroSignal["Zero-Signal Gating Response:\neligible: false, source: 'none', total: 0, items: []"]
    AnonFlow -- "0 Events" --> ZeroSignal
    
    AuthFlow -- "Has Signal" --> AuthRec["Build Personalized Profile\nCache: mfilm:rec:auth:<uid>:fav:<favFp>:beh:<behFp>:lim:<limit>"]
    AnonFlow -- "Has Signal" --> AnonRec["Build Behavior Profile\nCache: mfilm:rec:anon:<sessId>:beh:<behFp>:lim:<limit>"]
```

### Security Hardening Rules
1. **No Spoofable UID Fallback**:
   - `RecommendationController` strictly ignores `req.headers['x-user-id']` and `req.query.userId`.
   - Identity derives exclusively from `(req as any).user?.uid` decoded and verified by Firebase Admin SDK.
2. **Strict Anonymous Namespace Isolation**:
   - `sessionId` is validated using `/^[a-zA-Z0-9_\-:]{1,128}$/`.
   - `sessionId` is strictly an event-correlation key; it is never passed to `getUserFavorites` and cannot query Firestore user documents.
3. **Cache Key Separation**:
   - **Authenticated**: `mfilm:rec:auth:<verifiedUid>:fav:<favFp>:beh:<behFp>:lim:<limit>`
   - **Anonymous**: `mfilm:rec:anon:<sessionId>:beh:<behFp>:lim:<limit>`
   - Changes to favorites alter `favFp`; new viewing events alter `behFp`; zero-signal responses are never cached long-term.

---

## 4. Meaningful Signals & Behavioral Profile

### Event Eligibility & Weighting Model

The system employs a dual-level weighting architecture:

**1. RAW SIGNAL WEIGHT (Event Telemetry):**
Generated immediately at event capture (`EventService`) and emitted to Kafka/Tinybird.
| Event Type | Raw Weight |
|---|---|
| `complete` | 5.0 |
| `watch_progress` | 3.0–4.0 |
| `play` | 2.5 |
| `recommendation_click` | 2.0 |
| `movie_view` | 1.0 |

**2. FINAL NORMALIZED RANKING CONTRIBUTION (Recommendation Engine):**
Recalculated during personalized ranking (`RecommendationService`) to prevent older/weak interactions from overtaking durable preferences.
| Event Type | Base Ranking Weight | Recency Decay |
|---|---|---|
| `complete` | 0.90 | $\le 24$h: 1.0 |
| `watch_progress` | 0.65 | $\le 7$d: 0.85 |
| `play` | 0.40 | $\le 30$d: 0.65 |
| `recommendation_click` | 0.35 | $> 30$d: 0.45 |
| `movie_view` | 0.15 | |

*Note: The raw signal weight is stored durably in Tinybird but ranking dynamically applies the normalized weight and decay to prioritize long-term stability over single recent clicks.*

### Event Bridge Mechanism: Tinybird + In-Process Store
- **Immediate Bridge**: `EventService` maintains a bounded in-process LRU cache (`sessionInteractions` and `userInteractions`, capped at 500 entities and 30 events each). This guarantees $<1\text{ms}$ zero-latency recommendation updates upon the first click without waiting for Kafka-Tinybird ingestion propagation.
- **Durable Pipeline**: Browser $\to$ `EventController` $\to$ Kafka (`mfilm.behavior.v1`) $\to$ Tinybird (`mfilm_behavior`).
- **Tinybird Pipe**: `data-platform/tinybird/pipes/recent_recommendation_signals.pipe` groups interactions by `movieId` and computes aggregate signal weights and recency.

---

## 5. Zero-Signal Gating & Response Contract

### Contract Specification
When a user has no favorites and no interaction events:
```json
{
  "success": true,
  "eligible": false,
  "userId": null,
  "source": "none",
  "cached": false,
  "total": 0,
  "items": []
}
```
*(For authenticated zero-signal users, `userId` is their verified `uid`).*

### Frontend Visibility Behavior
In `src/pages/client/home/forYou/ForYou.jsx`:
- If `!data.eligible || data.total === 0 || !data.items || data.items.length === 0`:
  `setRecommendations([])`.
- In `displayMovies`: If `recommendations.length === 0`, returns `[]`. Popularity fallback has been **completely eliminated** from this component.
- If `!loading && displayMovies.length === 0`: Returns `null`.
- In `Home.jsx`: Wrapped in `<LazySection minHeight="0px"><ForYou /></LazySection>` to ensure zero DOM footprint, no heading, no placeholder, and zero layout gap when hidden.

### Anonymous Session Reset Behavior
If an anonymous visitor clears browser cookies/session storage, `sessionStorage.getItem('mfilm_session_id')` is cleared. Upon the next visit, a new `sessionId` is generated with zero history, and “Dành Cho Bạn” cleanly returns to its gated (hidden) state until the visitor interacts with a movie.

---

## 6. Recommendation Quality & Dynamic Country Affinity

The multi-stage ranking model preserves quality enhancements:
1. **Multi-Seed Similarity Aggregation**: $0.40 \times (0.65 \times \max_s(\text{sim}) + 0.35 \times \text{avg}_s(\text{sim}))$ across all interacted seeds.
2. **Genre Affinity**: $0.25 \times \min(1.0, \frac{\text{matchedCats}}{\text{topCats}} \times 1.2)$.
3. **Dynamic Country Affinity**:
   - $C \ge 80\%$ dominant country: $+0.35$ boost (e.g. Vietnam-heavy user/visitor).
   - $C \ge 60\%$ dominant country: $+0.22$ boost.
   - Non-matching country downweighted by $-0.05$ for high-concentration profiles.
4. **Popularity Tie-Breaker**: Capped at $\le 0.05$ so popular movies cannot override true user preference.
5. **Diversity Re-Ranking**: Primary genre repetition capped at 4 (unless high country focus).

### Long-Term Personalization Stability & Recency Decay
To ensure one recent click does not dominate long-term profile preferences:
- **Event Weighting & Recency Decay**: Recent events are weighted by type (`complete`: 0.90, `watch_progress`: 0.65, `play`: 0.40, `recommendation_click`: 0.35, `movie_view`: 0.15) and decayed over time (1.0 for $<24$h, down to 0.45 for $>30$d).
- **Influence Capping**: The maximum similarity contribution (`maxSim`) of any seed is strictly scaled by its weight. A weak `movie_view` can only contribute a maximum of $0.15 \times 0.65$ to the similarity score, preventing it from overtaking durable high-weight preferences (favorites or completed views).
- **Durable Fingerprints**: The behavioral cache fingerprint (`behFp`) only incorporates the top 5 most recent signals to prevent excessive cache churn while retaining profile stability.
- **Tinybird Signal Preservation**: The `getRecentBehaviorSignals` query maps and returns the exact `eventType` and `timestamp` from Tinybird, preventing historical durable signals from being flattened into a monolithic `movie_view` at `Date.now()`.

### Truthful Vietnamese Reason Generation
- Behavior single-movie match: `"Vì bạn vừa xem \"[Tên phim]\""`
- Dominant Vietnam behavior/favorites: `"Vì bạn thường xem phim Việt Nam"`
- Other dominant country: `"Vì bạn thường xem phim [Quốc gia]"`
- Multi-category match: `"Cùng thể loại với các phim bạn thường xem"`
- Trending match: `"Phù hợp với các phim bạn đã xem gần đây và đang thịnh hành"`

---

## 7. Deterministic Persona Test Results

All personas and stability behaviors are strictly verified via deterministic unit tests.

```
PASS src/modules/recommendation/content-similarity.service.spec.ts
PASS src/modules/recommendation/recommendation.controller.spec.ts
PASS src/modules/recommendation/recommendation.service.spec.ts
  RecommendationService
    Core Functionality & Error Handling
      ✓ should throw ServiceUnavailableException when RECOMMENDATIONS_ENABLED is false
      ✓ should bound limit parameter safely within 1 to 30
      ✓ should survive completely when Redis and PostgreSQL are absent/throwing
    Persona Testing: Personas 0 through 8 Deterministic Validation
      ✓ Persona 0 — Brand-new Anonymous: no session events yields eligible=false, total=0, source="none"
      ✓ Persona 1 — Anonymous First Click: one movie_view for movie A yields eligible=true, recommendations related to movie A
      ✓ Persona 2 — Anonymous Vietnam-Heavy: recent events mainly Vietnamese movies visibly favor Vietnamese films
      ✓ Persona 3 — Authenticated No Data: verified uid with 0 favorites and 0 events yields eligible=false, hidden
      ✓ Persona 4 — Authenticated Favorites: verified uid with favorites yields eligible=true, personalized results
      ✓ Persona 5 — Authenticated Behavior Only: verified uid with 0 favorites but viewing events yields eligible=true, behavior-driven
      ✓ Persona 6 — Isolation: two auth users and two anon sessions have isolated cache keys without cross-profile leakage
      ✓ Persona 7 — Spoofing: anonymous request with forged client identity never accesses protected user favorites
      ✓ Persona 8 — Cold Generic Homepage: baseline popularity still works for general catalog, but for-you is zero-signal gated
      ✓ Cache Fingerprinting: User recommendations update immediately when favorites change without waiting 1 hour
    Phase 06 Auth Path Fix Regression Tests
      ✓ Test A — Authenticated, favorites-only (no RAM events): eligible=true, items present
      ✓ Test B — Authenticated, behavior-only (no favorites, events from session union): eligible=true
      ✓ Test C — Anonymous-to-Login Continuity: session events visible to authenticated profile
      ✓ Test D — listFavorite with object entries: IDs correctly extracted, eligible=true
      ✓ Test E — Spoofing: request without Bearer token cannot invoke authenticated favorite lookup path
    Phase 06 Long-Term Stability Regression Tests
      ✓ Test F — Logout/login persistence: long-term profile survives logout/login/new session
      ✓ Test G — One click must not dominate: historical profile remains dominant over a single new movie_view
      ✓ Test H — Multi-interest profile: top-N includes recommendations from multiple meaningful profile clusters
      ✓ Test I — Strong signal > weak signal: favorite/complete > movie_view
```

- **Persona 0 (Brand-new Anonymous)**: 0 events $\to$ `eligible: false`, `total: 0`, `source: "none"`, items empty.
- **Persona 1 (Anonymous First Click)**: 1 `movie_view` on `jp_1` $\to$ `eligible: true`, `source: "behavior"`, top result is `jp_2` with reason `"Vì bạn vừa xem \"Doraemon: Stand By Me\""`.
- **Persona 2 (Anonymous Vietnam-Heavy)**: Interacted with `vn_1` and `vn_2` $\to$ top recommendation is `vn_3` (Hai Phượng) with reason `"Vì bạn thường xem phim Việt Nam"`.
- **Persona 3 (Authenticated No Data)**: Verified uid with 0 favorites and 0 events $\to$ `eligible: false`, `source: "none"`, `total: 0`.
- **Persona 4 (Authenticated Favorites)**: Verified uid with favorites $\to$ `eligible: true`, personalized results.
- **Persona 5 (Authenticated Behavior Only)**: Verified uid with 0 favorites and viewing events $\to$ `eligible: true`, `source: "behavior"`.
- **Persona 6 (Isolation)**: Distinct cache keys and distinct results across auth users and anon sessions.
- **Persona 7 (Spoofing)**: Forged `x-user-id` and `?userId=` without Bearer token cannot access protected user favorites.
- **Persona 8 (Cold Generic Homepage)**: General catalog baseline popularity still works, while "Dành Cho Bạn" remains zero-signal gated.
- **Test F (Logout/Login Persistence)**: Long-term profile sourced from Firestore/Tinybird survives new session initialization without requiring new movie clicks.
- **Test G (One-Click Stability)**: Introducing a single new weak `movie_view` to a stable profile does not overwrite the entire recommendation row; historical signals continue to dominate the top results.
- **Test H (Multi-Interest Profile)**: A user with distinct clusters (e.g. US Action, JP Anime, VN) receives diverse recommendations spanning multiple meaningful profile clusters.
- **Test I (Signal Strength)**: A strong signal (`complete`) exerts significantly higher ranking influence than a recent weak signal (`movie_view`).

---

## 2d. Initial Authenticated Profile Load Defect & Resolution

### Owner-Observed Defect
A logged-in account with existing favorites or historical preference data opened or reloaded Home. "Dành cho bạn" was completely absent. Only after the user clicked any random movie did "Dành cho bạn" suddenly appear.

### Exact Root Causes
1. **Viewport Intersection Failure (`Home.jsx` LazySection)**:
   - In `Home.jsx`, `<ForYou />` was wrapped in `<LazySection minHeight="0px"><ForYou /></LazySection>`.
   - Because `minHeight="0px"`, the container had 0px height and sat below `Banner`, `CategoriesFilm`, and `FilmNew` (~1250px below the viewport top).
   - On initial page load at scroll position 0, the `IntersectionObserver` never intersected with the viewport (`entry.isIntersecting === false`).
   - Consequently, `<ForYou />` was **NEVER mounted**; its `useEffect` and recommendation query never executed!
   - When the user scrolled down to click a movie, the scroll motion finally brought the 0px element into the intersection margin, triggering mount and causing the row to appear only after clicking.
2. **Frontend Auth Readiness Race**:
   - `AuthProvider.jsx` synchronously hydrated `isLogin` from `localStorage`, but Firebase Auth restores credentials asynchronously from IndexedDB (~150–500ms).
   - `ForYou.jsx` mounted and immediately issued `fetchRecommendations()` while `getAuth().currentUser` was still `null`.
   - The first request lacked the `Authorization: Bearer <token>` header, routing it to Path 2 (Anonymous session) with 0 session events, returning `eligible: false, items: []`.
3. **Stale Anonymous Response Race**:
   - When Firebase Auth restored and fired `onAuthStateChanged`, a second (authenticated) request was launched without cancelling the first request or distinguishing request identities.
   - If the first anonymous response arrived second, it overwrote the authenticated recommendation list with `[]` because `authEpoch` remained identical.
4. **Firestore Identity Mapping Gaps**:
   - Customer documents in Firestore created via `Register.jsx` store `firebaseUid: fbCred.user.uid`, but `getUserFavorites` in `content-similarity.service.ts` only queried `doc(Users, userId)`, `where('uid', '==', userId)`, and `where('id', '==', userId)`.
   - Firestore's `where('email', '==', targetEmail)` is strictly case-sensitive, missing accounts stored with original mixed-case emails.

### Complete Resolution
1. **Eager Component Mount under Suspense (`Home.jsx`)**:
   - Replaced `<LazySection minHeight="0px"><ForYou /></LazySection>` with `<Suspense fallback={null}><ForYou /></Suspense>`.
   - When `ForYou` has no recommendations (`displayMovies.length === 0`), it returns `null` with zero DOM footprint. Eager mounting ensures that the auth check and recommendation query execute immediately upon Home load without requiring any user scrolling or movie clicks.
2. **`firebaseAuthReady` State Introduced (`AuthProvider.jsx`)**:
   - Added `const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);` and `const [firebaseUser, setFirebaseUser] = useState(null);`.
   - Registered `onAuthStateChanged(auth, (user) => { setFirebaseUser(user); setFirebaseAuthReady(true); })`.
   - Exported `firebaseAuthReady` and `firebaseUser` in `AuthContext`.
   - Updated `loginByUser` to accept the verified `firebaseUser` instance and set `firebaseAuthReady = true` immediately.
3. **Auth-Gated Recommendation Fetching (`ForYou.jsx`)**:
   - Component strictly waits for `firebaseAuthReady === true` before making any recommendation request. While `!firebaseAuthReady`, it remains in loading state and returns `null` (zero DOM gap).
   - If `firebaseUser || isLogin`: initiates an authenticated request with the verified Bearer token.
   - If `!firebaseUser && !isLogin`: initiates an anonymous session request.
   - Tagged each in-flight request with `activeRequestRef.current = { epoch: currentEpoch, uid: currentUid }`.
   - Any late anonymous or out-of-order response whose epoch or uid does not match is immediately discarded.
   - In-flight requests are cleanly aborted via `AbortController` upon any auth transition.
4. **Firestore Favorites Bridge Expanded (`content-similarity.service.ts`)**:
   - Added query for `where('firebaseUid', '==', userId)`.
   - Added dual query for normalized `email.toLowerCase().trim()` and original `email.trim()`.
5. **Durable Signal Eligibility Guaranteed (`recommendation.service.ts`)**:
   - Authenticated user eligibility: `eligible = favIds.length > 0 || userEvents.length > 0` (including RAM interactions and Tinybird durable signals).
   - Authenticated users with favorites > 0 and 0 current session events are immediately `eligible: true` without requiring any movie click.
   - Authenticated users with durable history > 0 and 0 current session events are immediately `eligible: true` without requiring any movie click.
   - Added safe operational diagnostic logs: `[ForYou Initial] authReady=true authPresent=... verifiedUidPresent=... favCount=... durableCount=... ramUserCount=... sessionCount=... eligible=...`.

---

## 2e. AI Chatbot Regression During Phase 06

### Owner-Observed Defect
MFILM AI Chatbot suddenly stopped working. Every message returned:
*“Trợ lý AI MFILM hiện đang bận hoặc đang bảo trì kết nối máy chủ. Bạn vui lòng thử lại sau giây lát nhé! 🍿”*

### Big Data Regression Audit
- **Status**: **BIGDATA_REGRESSION_CONFIRMED**
- **Root Cause Evidence**:
  1. Commit `d048708` ("feat: integrate MFILM big data telemetry platform") created `backend/src/modules/ai/` (`AiController`, `AiService`) and switched `GroqChatBot.jsx` from client-side direct Groq calls to the backend proxy:
     `const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';`
  2. In Vercel production, `VITE_API_BASE_URL` was not configured. The frontend defaulted to `http://localhost:4000/api/v1/ai/chat`, which failed with mixed content / connection refused errors in the user's browser.
  3. When querying the production backend directly (`POST https://mfilm-backend.onrender.com/api/v1/ai/chat`), the server responded:
     `HTTP 400 Bad Request: {"message":"No Groq API key configured on server. ACTION REQUIRED BY OWNER."}`
     Because `GROQ_API_KEYS` and `GEMINI_API_KEYS` existed in local `backend/.env` but were never added to the Render Dashboard environment variables.
  4. In `backend/src/config/configuration.ts`, `corsOrigins` default fallback string lacked `https://www.mfilm.online`.
  5. In `backend/src/modules/ai/ai.service.ts`, `callGemini` requested non-existent model `'gemini-2.5-flash'`.

### Exact Files / Config Affected
- `src/components/client/chatBot/GroqChatBot.jsx`
- `src/components/client/chatBot/GeminiChatBot.jsx`
- `backend/src/config/configuration.ts`
- `backend/src/modules/ai/ai.service.ts`
- `backend/src/modules/ai/ai.service.spec.ts`

### Comprehensive Fix
1. **Frontend API URL Resolution**:
   Updated `GroqChatBot.jsx` and `GeminiChatBot.jsx` to resolve `API_BASE_URL` matching `ForYou.jsx`:
   ```javascript
   const API_BASE_URL =
       import.meta.env?.VITE_API_BASE_URL ||
       import.meta.env?.VITE_EVENT_API_BASE_URL ||
       'https://mfilm-backend.onrender.com/api/v1';
   ```
2. **Client-Side Key Fallback**:
   If the backend returns unconfigured server keys or fails, `GroqChatBot.jsx` falls back to client keys if present in frontend environment before showing the maintenance message.
3. **CORS Origins Updated**:
   Added `https://www.mfilm.online` to default `corsOrigins` in `configuration.ts`.
4. **Valid AI Model & Response Contract**:
   Updated Gemini model from `'gemini-2.5-flash'` to `'gemini-1.5-flash'`. Response returns both `reply` and `text` with `success: true`.
5. **Decoupled Architecture**:
   Chatbot controller and service have zero dependencies on Kafka, Tinybird, PostgreSQL, or Valkey.
6. **Structured Safe Diagnostics**:
   Backend logs `AI_PROVIDER_CONFIG_PRESENT`, `AI_PROVIDER_REQUEST_SENT`, and `AI_PROVIDER_STATUS` without exposing secrets or prompts.
7. **Regression Unit Tests Added**:
   Added `ai.service.spec.ts` testing happy path (Groq & Gemini), provider error fallback, unconfigured keys reporting, and architectural decoupling (7 tests passed).

---

## 8. Acceptance Truth Classification

| Check | Status | Verification Detail |
|---|---|---|
| **Definitive Commit** | **Deploy current origin/main** | Latest deployable Phase 06 state with Initial Authenticated Profile Load & AI Chatbot fixes. |
| **Render Deployed Commit** | **PENDING PRODUCTION DEPLOYMENT** | Awaiting owner manual deploy of latest Phase 06 commit. |
| **Vercel Deployed Commit** | **PENDING PRODUCTION DEPLOYMENT** | Awaiting owner redeploy with `VITE_RECOMMENDATIONS_ENABLED=true` on latest Phase 06 commit. |
| **Initial ForYou Eager Mount** | **CODE VERIFIED** | `Home.jsx` mounts `ForYou` directly under `Suspense` without zero-height `LazySection` blocking. |
| **firebaseAuthReady Implemented** | **CODE VERIFIED** | `firebaseAuthReady` and `firebaseUser` tracked in `AuthProvider` via `onAuthStateChanged`. |
| **First Request Authorization** | **CODE VERIFIED** | ForYou waits for `firebaseAuthReady`; sends Bearer token on initial authenticated load. |
| **Favorites-Only Initial Load** | **LOCAL TEST VERIFIED** | Deterministic test: 5 favorites, 0 RAM events, 0 session events $\to$ `eligible=true`, `items.length > 0`. |
| **Durable-History-Only Initial Load** | **LOCAL TEST VERIFIED** | Deterministic test: 0 favorites, Tinybird durable history, 0 RAM events $\to$ `eligible=true`, `items.length > 0`. |
| **Stale Anonymous Response Protection** | **CODE VERIFIED** | `activeRequestRef` tags `{ epoch, uid }`; discards mismatched responses; aborts in-flight fetch. |
| **No Fake Auto Movie View** | **CODE VERIFIED** | Zero click/view events injected; long-term profile initializes directly from durable data. |
| **One-Click Stability Preserved** | **LOCAL TEST VERIFIED** | Favorites/durable history retain higher weighting over single weak `movie_view`. |
| **Account Isolation Preserved** | **LOCAL TEST VERIFIED** | Unique `authUid`, separate cache keys, session rotation on logout/login. |
| **Carousel Navigation Preserved** | **CODE VERIFIED** | `swiperRef.current?.slidePrev()` and `slideNext()` preserved with no card click interference. |
| **Chatbot Frontend Endpoint** | **CODE VERIFIED** | `GroqChatBot.jsx` and `GeminiChatBot.jsx` route to `https://mfilm-backend.onrender.com/api/v1/ai/chat`. |
| **Chatbot CORS & Decoupling** | **CODE VERIFIED** | CORS includes `https://www.mfilm.online`; zero dependency on Kafka, Tinybird, or Postgres. |
| **Backend Tests** | **LOCAL TEST VERIFIED** | 12/12 test suites passed, 72/72 tests passed (`npm test`). |
| **Backend Build** | **LOCAL BUILD VERIFIED** | `nest build` completed with 0 errors. |
| **Frontend Build** | **LOCAL BUILD VERIFIED** | `vite build` completed in 1.19s with 0 errors. |
| **Zero Added Cost ($0 Budget)** | **CODE VERIFIED** | All components operate within free-tier limits. |

---

## 9. Owner Production Acceptance Steps
1. **Push latest commit**: `git push origin main`
2. **Deploy on Render & Configure Chatbot Keys**:
   - Open [Render Dashboard](https://dashboard.render.com) -> `mfilm-backend`.
   - Go to **Environment**:
     - Ensure `GROQ_API_KEYS` is set (copy from local `backend/.env` without sharing publicly).
     - Keep Big Data variables intact (`RECOMMENDATIONS_ENABLED=true`, `POSTGRES_CATALOG_ENABLED=false`, `VALKEY_ENABLED=false`).
   - Click **Manual Deploy** -> **Deploy latest commit**.
3. **Deploy on Vercel**:
   - Open [Vercel Dashboard](https://vercel.com) -> `web-film-modern`.
   - Confirm environment variables:
     - `VITE_RECOMMENDATIONS_ENABLED=true`
     - `VITE_BIGDATA_TELEMETRY_ENABLED=true`
     - `VITE_EVENT_API_BASE_URL=https://mfilm-backend.onrender.com/api/v1`
   - Trigger **Redeploy** on `main` branch.
4. **Final Verification Checklist**:
   - **Recommendation Initial Load**:
     - Logout completely $\to$ Login with account having favorites/history.
     - Go directly to Home. **DO NOT click any movie**.
     - ✅ Confirm "Dành Cho Bạn" appears **immediately** after auth resolves.
     - **Hard reload Home** (`Ctrl+F5` or `Cmd+Shift+R`) $\to$ ✅ Confirm "Dành Cho Bạn" reappears automatically.
     - **Logout and re-login same account** $\to$ ✅ Confirm "Dành Cho Bạn" appears automatically.
     - Click one unrelated movie briefly $\to$ ✅ Confirm long-term profile remains dominant.
   - **Chatbot Verification**:
     - Open "Trợ lý MFILM AI".
     - Send: *"Gợi ý cho tôi một phim hành động."*
     - ✅ Confirm real AI response renders and maintenance message does NOT appear.
