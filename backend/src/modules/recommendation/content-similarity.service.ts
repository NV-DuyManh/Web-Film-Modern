import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, query, where, Firestore } from 'firebase/firestore';

export function normalizeCountry(raw?: string): string {
  if (!raw) return '';
  const s = raw.toLowerCase().trim();
  if (s === 'vietnam' || s === 'việt nam' || s === 'viet nam' || s === 'vn') return 'Việt Nam';
  if (s === 'japan' || s === 'nhật bản' || s === 'nhat ban' || s === 'jp') return 'Nhật Bản';
  if (s === 'south korea' || s === 'korea' || s === 'hàn quốc' || s === 'han quoc' || s === 'kr') return 'Hàn Quốc';
  if (s === 'china' || s === 'trung quốc' || s === 'trung quoc' || s === 'cn') return 'Trung Quốc';
  if (s === 'united states' || s === 'usa' || s === 'mỹ' || s === 'my' || s === 'us') return 'Âu Mỹ';
  if (s === 'hong kong' || s === 'hongkong' || s === 'hồng kông') return 'Hồng Kông';
  if (s === 'thailand' || s === 'thái lan' || s === 'thai lan' || s === 'th') return 'Thái Lan';
  return raw.trim();
}

export interface MovieContentProfile {
  id: string;
  name: string;
  slug: string;
  imgUrl?: string;
  bannerUrl?: string;
  country?: string;
  categories: string[];
  actors: string[];
  authors: string[];
  description?: string;
  views: number;
  rating: number;
  isHot: boolean;
}

export interface UserPreferenceProfile {
  userId: string;
  seedIds: string[];
  categoryWeights: Map<string, number>;
  countryWeights: Map<string, number>;
  actorWeights: Map<string, number>;
  authorWeights: Map<string, number>;
  topCategories: string[];
  dominantCountry: string | null;
  countryConcentration: number;
  totalFavorites: number;
}

export interface SimilarMovieCandidate {
  movieId: string;
  name: string;
  slug: string;
  imgUrl?: string;
  bannerUrl?: string;
  similarityScore: number;
  reason: string;
  sharedCategories: string[];
  sharedActors: string[];
}

const FIREBASE_CONFIG = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyB2Ond6N_MfRlTIWj8nWD5VZm5BQQGh5xk',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'manhfilm-105b3.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'manhfilm-105b3',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'manhfilm-105b3.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '812294175210',
  appId: process.env.FIREBASE_APP_ID || '1:812294175210:web:9f8795c9cbfa2b486ada93',
};

@Injectable()
export class ContentSimilarityService implements OnModuleInit {
  private readonly logger = new Logger(ContentSimilarityService.name);
  private moviesMap = new Map<string, MovieContentProfile>();
  private slugToIdMap = new Map<string, string>();
  private movieVectors = new Map<string, Map<string, number>>();
  private movieVectorNorms = new Map<string, number>();
  private invertedIndex = new Map<string, Array<{ movieId: string; weight: number }>>();
  private isInitialized = false;
  private firestoreDb: Firestore | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    this.initFirestore();
  }

  private initFirestore() {
    try {
      const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
      this.firestoreDb = getFirestore(app);
    } catch (err: any) {
      this.logger.warn(`Firestore initialization deferred: ${err.message}`);
    }
  }

  async onModuleInit() {
    const isRecommendationsEnabled = this.configService.get<string>('RECOMMENDATIONS_ENABLED') !== 'false';
    if (!isRecommendationsEnabled) {
      this.logger.log('[ContentSimilarity] Recommendations disabled. Skipping catalog index refresh.');
      return;
    }
    await this.refreshCatalogIndex();
  }

  /**
   * Refreshes the in-memory content-based index.
   * Order:
   * 1. If POSTGRES_CATALOG_ENABLED=true and DB returns data (local dev / testing), use PostgreSQL.
   * 2. Otherwise ($0 Production on Render), fetch directly from Firebase Firestore.
   */
  async refreshCatalogIndex(): Promise<number> {
    const t0 = Date.now();
    const isPostgresEnabled = this.configService.get<string>('POSTGRES_CATALOG_ENABLED') === 'true';

    // Path 1: PostgreSQL (if explicitly enabled)
    if (isPostgresEnabled) {
      try {
        const pgProfiles = await this.fetchFromPostgres();
        if (pgProfiles.length > 0) {
          this.buildIndex(pgProfiles);
          this.logger.log(`[ContentSimilarity] Indexed ${pgProfiles.length} movies from PostgreSQL in ${Date.now() - t0}ms`);
          return pgProfiles.length;
        }
      } catch (err: any) {
        this.logger.warn(`[ContentSimilarity] PostgreSQL catalog fetch failed: ${err.message}. Falling back to Firestore.`);
      }
    }

    // Path 2: Firebase Firestore ($0 Cloud Production Source of Truth)
    try {
      const firestoreProfiles = await this.fetchFromFirestore();
      if (firestoreProfiles.length > 0) {
        this.buildIndex(firestoreProfiles);
        this.logger.log(`[ContentSimilarity] Indexed ${firestoreProfiles.length} movies from Firestore in ${Date.now() - t0}ms`);
        return firestoreProfiles.length;
      }
    } catch (err: any) {
      this.logger.error(`[ContentSimilarity] Firestore catalog fetch failed: ${err.message}`);
    }

    this.logger.warn('[ContentSimilarity] No movies indexed from any source.');
    return 0;
  }

  private async fetchFromPostgres(): Promise<MovieContentProfile[]> {
    const query = `
      SELECT 
        m.id, 
        m.name, 
        m.slug, 
        m.description, 
        m.img_url, 
        m.banner_url, 
        m.views, 
        m.rating, 
        m.is_hot,
        co.name as country,
        COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), ARRAY[]::text[]) as categories,
        COALESCE(array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL), ARRAY[]::text[]) as actors,
        COALESCE(array_agg(DISTINCT au.name) FILTER (WHERE au.name IS NOT NULL), ARRAY[]::text[]) as authors
      FROM movies m
      LEFT JOIN countries co ON m.country_id = co.id
      LEFT JOIN movie_categories mc ON m.id = mc.movie_id
      LEFT JOIN categories c ON mc.category_id = c.id
      LEFT JOIN movie_actors ma ON m.id = ma.movie_id
      LEFT JOIN actors a ON ma.actor_id = a.id
      LEFT JOIN movie_authors mau ON m.id = mau.movie_id
      LEFT JOIN authors au ON mau.author_id = au.id
      GROUP BY m.id, co.name;
    `;
    const result = await this.db.query(query);
    return (result.rows || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      imgUrl: r.img_url,
      bannerUrl: r.banner_url,
      country: normalizeCountry(r.country || ''),
      categories: r.categories || [],
      actors: r.actors || [],
      authors: r.authors || [],
      description: r.description || '',
      views: parseInt(r.views || '0', 10),
      rating: parseFloat(r.rating || '0'),
      isHot: Boolean(r.is_hot),
    }));
  }

  private async fetchFromFirestore(): Promise<MovieContentProfile[]> {
    if (!this.firestoreDb) {
      this.initFirestore();
      if (!this.firestoreDb) return [];
    }

    // Parallel fetch for Category, Actor, Author name dictionaries
    const [catSnap, actorSnap, authorSnap, movieSnap] = await Promise.all([
      getDocs(collection(this.firestoreDb, 'Categories')).catch(() => null),
      getDocs(collection(this.firestoreDb, 'Actors')).catch(() => null),
      getDocs(collection(this.firestoreDb, 'Authors')).catch(() => null),
      getDocs(collection(this.firestoreDb, 'Movies')),
    ]);

    const catMap = new Map<string, string>();
    if (catSnap) {
      catSnap.forEach((d) => catMap.set(d.id, d.data().name || d.id));
    }

    const actorMap = new Map<string, string>();
    if (actorSnap) {
      actorSnap.forEach((d) => actorMap.set(d.id, d.data().name || d.id));
    }

    const authorMap = new Map<string, string>();
    if (authorSnap) {
      authorSnap.forEach((d) => authorMap.set(d.id, d.data().name || d.id));
    }

    const profiles: MovieContentProfile[] = [];
    movieSnap.forEach((docSnap) => {
      const d = docSnap.data();
      const rawCategories: string[] = Array.isArray(d.listCategory) ? d.listCategory : [];
      const rawActors: string[] = Array.isArray(d.listActor) ? d.listActor : [];
      const rawAuthors: string[] = Array.isArray(d.listAuthor) ? d.listAuthor : [];

      const categories = rawCategories.map((id) => catMap.get(id) || id).filter(Boolean);
      const actors = rawActors.map((id) => actorMap.get(id) || id).filter(Boolean);
      const authors = rawAuthors.map((id) => authorMap.get(id) || id).filter(Boolean);

      profiles.push({
        id: docSnap.id,
        name: d.name || d.otherName || 'Phim MFILM',
        slug: d.slug || docSnap.id,
        imgUrl: d.imgUrl || '',
        bannerUrl: d.bannerUrl || '',
        country: normalizeCountry(d.countriesID || d.country || ''),
        categories: categories.length > 0 ? categories : (d.categories || []),
        actors: actors.length > 0 ? actors : (d.actors || []),
        authors: authors.length > 0 ? authors : (d.authors || []),
        description: d.description || '',
        views: parseInt(d.views || '0', 10),
        rating: parseFloat(d.rating || '0'),
        isHot: Boolean(d.isHot),
      });
    });

    return profiles;
  }

  /**
   * Builds TF-IDF style vector representations and inverted postings index.
   */
  private buildIndex(profiles: MovieContentProfile[]) {
    this.moviesMap.clear();
    this.slugToIdMap.clear();
    this.movieVectors.clear();
    this.movieVectorNorms.clear();
    this.invertedIndex.clear();

    for (const profile of profiles) {
      this.moviesMap.set(profile.id, profile);
      if (profile.slug) {
        this.slugToIdMap.set(profile.slug.toLowerCase().trim(), profile.id);
      }

      const vector = new Map<string, number>();

      // Category features (Weight 3.0)
      for (const cat of profile.categories) {
        const key = `cat:${String(cat).toLowerCase().trim()}`;
        vector.set(key, (vector.get(key) || 0) + 3.0);
      }

      // Actor features (Weight 2.0)
      for (const actor of profile.actors) {
        const key = `actor:${String(actor).toLowerCase().trim()}`;
        vector.set(key, (vector.get(key) || 0) + 2.0);
      }

      // Author / Director features (Weight 2.5)
      for (const author of profile.authors) {
        const key = `author:${String(author).toLowerCase().trim()}`;
        vector.set(key, (vector.get(key) || 0) + 2.5);
      }

      // Country feature (Weight 1.5)
      if (profile.country) {
        const key = `country:${String(profile.country).toLowerCase().trim()}`;
        vector.set(key, (vector.get(key) || 0) + 1.5);
      }

      // Title token features (Weight 1.0)
      const tokens = this.tokenizeText(`${profile.name} ${profile.description || ''}`.slice(0, 300));
      for (const token of tokens) {
        const key = `token:${token}`;
        vector.set(key, (vector.get(key) || 0) + 1.0);
      }

      let sumSq = 0;
      for (const w of vector.values()) {
        sumSq += w * w;
      }
      const norm = Math.sqrt(sumSq) || 1.0;

      this.movieVectors.set(profile.id, vector);
      this.movieVectorNorms.set(profile.id, norm);

      for (const [featKey, w] of vector.entries()) {
        if (!this.invertedIndex.has(featKey)) {
          this.invertedIndex.set(featKey, []);
        }
        this.invertedIndex.get(featKey)!.push({ movieId: profile.id, weight: w });
      }
    }

    this.isInitialized = true;
  }

  /**
   * Get top movies sorted by popularity (views, rating, hot status), excluding specified IDs.
   */
  getTopMoviesByViews(limit = 10, excludeIds: Set<string> = new Set()): MovieContentProfile[] {
    return Array.from(this.moviesMap.values())
      .filter((m) => !excludeIds.has(m.id))
      .sort((a, b) => {
        const scoreA = (a.views || 0) * 0.5 + (a.rating || 0) * 100 + (a.isHot ? 1000 : 0);
        const scoreB = (b.views || 0) * 0.5 + (b.rating || 0) * 100 + (b.isHot ? 1000 : 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Get a movie profile by document ID or slug.
   */
  getMovie(idOrSlug: string): MovieContentProfile | undefined {
    if (!idOrSlug) return undefined;
    const direct = this.moviesMap.get(idOrSlug);
    if (direct) return direct;
    const mappedId = this.slugToIdMap.get(idOrSlug.toLowerCase().trim());
    if (mappedId) return this.moviesMap.get(mappedId);
    return undefined;
  }

  /**
   * Resolves an ID or slug to the canonical indexed movie ID.
   */
  getCanonicalMovieId(idOrSlug: string): string | null {
    if (!idOrSlug) return null;
    if (this.moviesMap.has(idOrSlug)) return idOrSlug;
    const mappedId = this.slugToIdMap.get(idOrSlug.toLowerCase().trim());
    if (mappedId && this.moviesMap.has(mappedId)) return mappedId;
    return null;
  }

  /**
   * Retrieve user favorite movie IDs from Firestore Users collection.
   * Supports direct document ID lookup, query fallbacks (uid, id), and verified email matching.
   */
  async getUserFavorites(userId: string, email?: string | null): Promise<string[]> {
    if (!this.firestoreDb) {
      this.initFirestore();
      if (!this.firestoreDb) return [];
    }

    /**
     * Normalize a single listFavorite entry to a canonical movie ID string.
     * Firestore listFavorite may contain:
     * - Plain string: "abc123"
     * - Object reference: { id: "abc123", name: "..." } or { movieId: "abc123" } or { slug: "..." }
     * Never return "[object Object]" — such entries are silently dropped.
     */
    const extractFavoriteId = (entry: unknown): string => {
      if (!entry) return '';
      if (typeof entry === 'string') return entry.trim();
      if (typeof entry === 'number') return String(entry).trim();
      if (typeof entry === 'object' && entry !== null) {
        const e = entry as Record<string, unknown>;
        const raw = e['id'] ?? e['movieId'] ?? e['slug'] ?? e['_id'] ?? '';
        return typeof raw === 'string' ? raw.trim() : typeof raw === 'number' ? String(raw).trim() : '';
      }
      return '';
    };

    const normalizeList = (raw: unknown[]): string[] =>
      raw
        .map(extractFavoriteId)
        .filter((id) => id.length > 0 && id !== 'none' && id !== '[object Object]');

    try {
      // 1. Direct document lookup by doc ID
      const userRef = doc(this.firestoreDb, 'Users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.listFavorite) && data.listFavorite.length > 0) {
          const ids = normalizeList(data.listFavorite);
          if (ids.length > 0) return ids;
        }
      }

      // 2. Query collection if doc ID misses (e.g. Firebase Auth UID)
      const usersCol = collection(this.firestoreDb, 'Users');
      const qUid = query(usersCol, where('uid', '==', userId));
      const snapUid = await getDocs(qUid);
      if (!snapUid.empty) {
        const data = snapUid.docs[0].data();
        if (Array.isArray(data?.listFavorite) && data.listFavorite.length > 0) {
          const ids = normalizeList(data.listFavorite);
          if (ids.length > 0) return ids;
        }
      }

      const qId = query(usersCol, where('id', '==', userId));
      const snapId = await getDocs(qId);
      if (!snapId.empty) {
        const data = snapId.docs[0].data();
        if (Array.isArray(data?.listFavorite) && data.listFavorite.length > 0) {
          const ids = normalizeList(data.listFavorite);
          if (ids.length > 0) return ids;
        }
      }

      // 3. Verified email fallback (safely maps verified Firebase Auth identity to Firestore customer document)
      if (email && typeof email === 'string' && email.includes('@')) {
        const targetEmail = email.toLowerCase().trim();
        const qEmail = query(usersCol, where('email', '==', targetEmail));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) {
          const data = snapEmail.docs[0].data();
          if (Array.isArray(data?.listFavorite) && data.listFavorite.length > 0) {
            const ids = normalizeList(data.listFavorite);
            if (ids.length > 0) return ids;
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch favorites for user ${userId}: ${err.message}`);
    }
    return [];
  }

  /**
   * Build an interpretable UserPreferenceProfile from favorite movie IDs.
   * Generates category/country/talent histograms and calculates dynamic country concentration.
   */
  buildUserPreferenceProfile(userId: string, seedIds: string[]): UserPreferenceProfile {
    const categoryWeights = new Map<string, number>();
    const countryWeights = new Map<string, number>();
    const actorWeights = new Map<string, number>();
    const authorWeights = new Map<string, number>();

    let validFavorites = 0;

    for (const seedId of seedIds) {
      const movie = this.getMovie(seedId);
      if (!movie) continue;
      validFavorites++;

      // Category counts
      for (const cat of movie.categories) {
        const cKey = String(cat).trim();
        categoryWeights.set(cKey, (categoryWeights.get(cKey) || 0) + 1);
      }

      // Country counts
      const country = normalizeCountry(movie.country);
      if (country) {
        countryWeights.set(country, (countryWeights.get(country) || 0) + 1);
      }

      // Actors
      for (const actor of movie.actors) {
        const aKey = String(actor).trim();
        actorWeights.set(aKey, (actorWeights.get(aKey) || 0) + 1);
      }

      // Authors
      for (const author of movie.authors) {
        const auKey = String(author).trim();
        authorWeights.set(auKey, (authorWeights.get(auKey) || 0) + 1);
      }
    }

    // Top categories (sorted by frequency descending)
    const topCategories = Array.from(categoryWeights.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat)
      .slice(0, 4);

    // Dominant country & concentration ratio
    let dominantCountry: string | null = null;
    let maxCountryCount = 0;
    for (const [country, count] of countryWeights.entries()) {
      if (count > maxCountryCount) {
        maxCountryCount = count;
        dominantCountry = country;
      }
    }

    const countryConcentration = validFavorites > 0 ? maxCountryCount / validFavorites : 0;

    return {
      userId,
      seedIds,
      categoryWeights,
      countryWeights,
      actorWeights,
      authorWeights,
      topCategories,
      dominantCountry,
      countryConcentration,
      totalFavorites: validFavorites,
    };
  }

  /**
   * Fast cosine similarity between two indexed movies.
   */
  computeCosineSimilarity(movieIdA: string, movieIdB: string): number {
    const canonicalA = this.getCanonicalMovieId(movieIdA);
    const canonicalB = this.getCanonicalMovieId(movieIdB);
    if (!canonicalA || !canonicalB) return 0;
    const vecA = this.movieVectors.get(canonicalA);
    const vecB = this.movieVectors.get(canonicalB);
    if (!vecA || !vecB) return 0;

    let dot = 0;
    const [smaller, larger] = vecA.size <= vecB.size ? [vecA, vecB] : [vecB, vecA];
    for (const [key, weightA] of smaller.entries()) {
      const weightB = larger.get(key);
      if (weightB) {
        dot += weightA * weightB;
      }
    }

    const normA = this.movieVectorNorms.get(canonicalA) || 1.0;
    const normB = this.movieVectorNorms.get(canonicalB) || 1.0;
    return Number((dot / (normA * normB)).toFixed(4));
  }

  /**
   * Generates candidate pool for warm users from:
   * 1. Multi-seed similar movies
   * 2. Top-genre matches
   * 3. Dominant country matches (especially if concentration >= 50%)
   */
  getCandidatesForProfile(
    profile: UserPreferenceProfile,
    excludeIds: Set<string>,
    limit = 60,
  ): MovieContentProfile[] {
    const candidateMap = new Map<string, MovieContentProfile>();

    // 1. Seed-based similarity candidates (up to 20 similar movies per seed)
    for (const seedId of profile.seedIds) {
      const canonicalSeed = this.getCanonicalMovieId(seedId) || seedId;
      const similar = this.getSimilarMovies(canonicalSeed, 20);
      for (const s of similar) {
        if (excludeIds.has(s.movieId) || candidateMap.has(s.movieId)) continue;
        const m = this.moviesMap.get(s.movieId);
        if (m) candidateMap.set(s.movieId, m);
      }
    }

    // 2. Genre-based candidates matching top categories
    if (profile.topCategories.length > 0) {
      for (const m of this.moviesMap.values()) {
        if (excludeIds.has(m.id) || candidateMap.has(m.id)) continue;
        const matchesCategory = m.categories.some((c) => profile.topCategories.includes(c));
        if (matchesCategory) {
          candidateMap.set(m.id, m);
        }
      }
    }

    // 3. Country-based candidates if dominant country concentration >= 0.50
    if (profile.dominantCountry && profile.countryConcentration >= 0.50) {
      for (const m of this.moviesMap.values()) {
        if (excludeIds.has(m.id) || candidateMap.has(m.id)) continue;
        if (normalizeCountry(m.country) === profile.dominantCountry) {
          candidateMap.set(m.id, m);
        }
      }
    }

    return Array.from(candidateMap.values()).slice(0, Math.max(limit, 100));
  }

  /**
   * Find Top-K similar movies to a given target movie.
   */
  getSimilarMovies(movieId: string, limit = 10): SimilarMovieCandidate[] {
    const canonicalId = this.getCanonicalMovieId(movieId);
    if (!this.isInitialized || !canonicalId || !this.moviesMap.has(canonicalId)) {
      return [];
    }

    const targetMovie = this.moviesMap.get(canonicalId)!;
    const targetVector = this.movieVectors.get(canonicalId)!;
    const targetNorm = this.movieVectorNorms.get(canonicalId)!;

    // Accumulate dot products across matching features using inverted index
    const dotProducts = new Map<string, number>();

    for (const [featKey, targetWeight] of targetVector.entries()) {
      const postings = this.invertedIndex.get(featKey) || [];
      for (const posting of postings) {
        if (posting.movieId === canonicalId) continue; // Skip self
        dotProducts.set(
          posting.movieId,
          (dotProducts.get(posting.movieId) || 0) + (targetWeight * posting.weight),
        );
      }
    }

    const candidates: SimilarMovieCandidate[] = [];

    for (const [candidateId, dot] of dotProducts.entries()) {
      const candidateMovie = this.moviesMap.get(candidateId);
      if (!candidateMovie) continue;

      const candNorm = this.movieVectorNorms.get(candidateId) || 1.0;
      const cosineSim = dot / (targetNorm * candNorm);

      if (cosineSim < 0.05) continue; // Ignore negligible similarity

      // Derive explanation
      const sharedCategories = targetMovie.categories.filter((c) =>
        candidateMovie.categories.includes(c),
      );
      const sharedActors = targetMovie.actors.filter((a) =>
        candidateMovie.actors.includes(a),
      );

      let reason = 'Gợi ý tương tự';
      if (sharedCategories.length >= 2) {
        reason = `Cùng thể loại ${sharedCategories.slice(0, 2).join(', ')}`;
      } else if (sharedCategories.length === 1) {
        reason = `Cùng thể loại ${sharedCategories[0]}`;
      } else if (sharedActors.length > 0) {
        reason = `Cùng diễn viên ${sharedActors[0]}`;
      } else if (targetMovie.country && targetMovie.country === candidateMovie.country) {
        reason = `Phim ${targetMovie.country} đặc sắc`;
      }

      candidates.push({
        movieId: candidateId,
        name: candidateMovie.name,
        slug: candidateMovie.slug,
        imgUrl: candidateMovie.imgUrl,
        bannerUrl: candidateMovie.bannerUrl,
        similarityScore: Number(cosineSim.toFixed(4)),
        reason,
        sharedCategories,
        sharedActors,
      });
    }

    // Sort descending by similarity score
    candidates.sort((a, b) => b.similarityScore - a.similarityScore);
    return candidates.slice(0, limit);
  }

  /**
   * Find Top-K recommendations for a set of seed movie IDs (e.g. user favorites/views).
   */
  getRecommendationsForSeeds(
    seedMovieIds: string[],
    excludeMovieIds: Set<string> = new Set(),
    limit = 10,
  ): SimilarMovieCandidate[] {
    const aggregateScores = new Map<string, { candidate: SimilarMovieCandidate; totalScore: number }>();

    for (const seedId of seedMovieIds) {
      const similar = this.getSimilarMovies(seedId, 15);
      for (const item of similar) {
        if (excludeMovieIds.has(item.movieId)) continue;

        if (!aggregateScores.has(item.movieId)) {
          aggregateScores.set(item.movieId, { candidate: item, totalScore: item.similarityScore });
        } else {
          const curr = aggregateScores.get(item.movieId)!;
          curr.totalScore += item.similarityScore;
        }
      }
    }

    const results = Array.from(aggregateScores.values())
      .map(({ candidate, totalScore }) => ({
        ...candidate,
        similarityScore: Number(totalScore.toFixed(4)),
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore);

    return results.slice(0, limit);
  }

  getAllMovies(): MovieContentProfile[] {
    return Array.from(this.moviesMap.values());
  }

  private tokenizeText(text: string): string[] {
    const stopwords = new Set([
      'la', 'va', 'cua', 'cho', 'trong', 'tren', 'voi', 'mot', 'cac', 'nhung',
      'the', 'and', 'of', 'to', 'in', 'is', 'that', 'with', 'for', 'by', 'an',
    ]);
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopwords.has(w))
      .slice(0, 30); // Max 30 keywords
  }
}
