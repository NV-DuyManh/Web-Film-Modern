import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationService } from './recommendation.service';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { EventService } from '../event/event.service';
import { ContentSimilarityService, MovieContentProfile, UserPreferenceProfile, normalizeCountry } from './content-similarity.service';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';

describe('RecommendationService', () => {
  let service: RecommendationService;
  let configService: jest.Mocked<ConfigService>;
  let redisService: jest.Mocked<RedisService>;
  let dbService: jest.Mocked<DatabaseService>;
  let contentSimilarityService: any;
  let analyticsService: any;
  let mockEventService: any;

  const sampleMovies: MovieContentProfile[] = [
    {
      id: 'vn_1',
      name: 'Mắt Biếc',
      slug: 'mat-biec',
      imgUrl: 'https://example.com/mat-biec.jpg',
      bannerUrl: 'https://example.com/mat-biec-b.jpg',
      country: 'Việt Nam',
      categories: ['Tình Cảm', 'Chính Kịch'],
      actors: ['Trần Nghĩa', 'Trúc Anh'],
      authors: ['Victor Vũ'],
      views: 5000,
      rating: 8.5,
      isHot: true,
    },
    {
      id: 'vn_2',
      name: 'Bố Già',
      slug: 'bo-gia',
      imgUrl: 'https://example.com/bo-gia.jpg',
      bannerUrl: 'https://example.com/bo-gia-b.jpg',
      country: 'Việt Nam',
      categories: ['Hài Hước', 'Gia Đình'],
      actors: ['Trấn Thành', 'Tuấn Trần'],
      authors: ['Trấn Thành'],
      views: 9500,
      rating: 8.7,
      isHot: true,
    },
    {
      id: 'vn_3',
      name: 'Hai Phượng',
      slug: 'hai-phuong',
      imgUrl: 'https://example.com/hai-phuong.jpg',
      bannerUrl: 'https://example.com/hai-phuong-b.jpg',
      country: 'Việt Nam',
      categories: ['Hành Động', 'Võ Thuật'],
      actors: ['Ngô Thanh Vân'],
      authors: ['Lê Văn Kiệt'],
      views: 7000,
      rating: 8.2,
      isHot: false,
    },
    {
      id: 'jp_1',
      name: 'Doraemon: Stand By Me',
      slug: 'doraemon-stand-by-me',
      imgUrl: 'https://example.com/doraemon.jpg',
      bannerUrl: 'https://example.com/doraemon_b.jpg',
      country: 'Nhật Bản',
      categories: ['Hoạt Hình', 'Gia Đình'],
      actors: ['Wasabi Mizuta'],
      authors: ['Takashi Yamazaki'],
      views: 12000,
      rating: 9.0,
      isHot: true,
    },
    {
      id: 'jp_2',
      name: 'Your Name',
      slug: 'your-name',
      imgUrl: 'https://example.com/your-name.jpg',
      bannerUrl: 'https://example.com/your-name-b.jpg',
      country: 'Nhật Bản',
      categories: ['Hoạt Hình', 'Tình Cảm'],
      actors: ['Ryunosuke Kamiki'],
      authors: ['Makoto Shinkai'],
      views: 15000,
      rating: 9.2,
      isHot: true,
    },
    {
      id: 'kr_1',
      name: 'Parasite',
      slug: 'parasite',
      imgUrl: 'https://example.com/parasite.jpg',
      bannerUrl: 'https://example.com/parasite-b.jpg',
      country: 'Hàn Quốc',
      categories: ['Giật Gân', 'Chính Kịch'],
      actors: ['Song Kang-ho'],
      authors: ['Bong Joon-ho'],
      views: 18000,
      rating: 9.3,
      isHot: true,
    },
    {
      id: 'us_1',
      name: 'Avengers: Endgame',
      slug: 'avengers-endgame',
      imgUrl: 'https://example.com/endgame.jpg',
      bannerUrl: 'https://example.com/endgame-b.jpg',
      country: 'Âu Mỹ',
      categories: ['Hành Động', 'Khoa Học Viễn Tưởng'],
      actors: ['Robert Downey Jr.'],
      authors: ['Russo Brothers'],
      views: 25000,
      rating: 8.9,
      isHot: true,
    },
  ];

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'RECOMMENDATIONS_ENABLED') return 'true';
        if (key === 'POSTGRES_CATALOG_ENABLED') return 'false';
        if (key === 'POSTGRES_USER_STATE_ENABLED') return 'false';
        return undefined;
      }),
    };
    const mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };
    const mockDbService = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };
    analyticsService = {
      getTrendingMovies: jest.fn().mockResolvedValue({ data: [] }),
      getRecentBehaviorSignals: jest.fn().mockResolvedValue([]),
    };
    mockEventService = {
      getRecentInteractions: jest.fn().mockReturnValue([]),
      recordRecentInteraction: jest.fn(),
      processSingleEvent: jest.fn(),
      processBatchEvents: jest.fn(),
    };

    contentSimilarityService = {
      getTopMoviesByViews: jest.fn((limit = 10, excludeIds = new Set()) =>
        sampleMovies.filter((m) => !excludeIds.has(m.id)).slice(0, limit),
      ),
      getMovie: jest.fn((id: string) => sampleMovies.find((m) => m.id === id || m.slug === id)),
      getCanonicalMovieId: jest.fn((id: string) => {
        const m = sampleMovies.find((sm) => sm.id === id || sm.slug === id);
        return m ? m.id : null;
      }),
      getAllMovies: jest.fn(() => sampleMovies),
      getUserFavorites: jest.fn().mockResolvedValue([]),
      computeCosineSimilarity: jest.fn((idA: string, idB: string) => {
        const mA = sampleMovies.find((m) => m.id === idA);
        const mB = sampleMovies.find((m) => m.id === idB);
        if (!mA || !mB) return 0;
        if (idA === idB) return 1.0;

        let dot = 0;
        const sharedCats = mA.categories.filter((c) => mB.categories.includes(c));
        dot += sharedCats.length * 3.0;
        if (mA.country && mA.country === mB.country) dot += 2.0;
        return Number(Math.min(0.95, dot / 12.0).toFixed(4));
      }),
      buildUserPreferenceProfile: jest.fn((userId: string, seedIds: string[]): UserPreferenceProfile => {
        const catWeights = new Map<string, number>();
        const countryWeights = new Map<string, number>();
        const actorWeights = new Map<string, number>();
        const authorWeights = new Map<string, number>();

        let validCount = 0;
        for (const sId of seedIds) {
          const m = sampleMovies.find((x) => x.id === sId);
          if (!m) continue;
          validCount++;
          for (const c of m.categories) {
            catWeights.set(c, (catWeights.get(c) || 0) + 1);
          }
          const country = normalizeCountry(m.country);
          if (country) {
            countryWeights.set(country, (countryWeights.get(country) || 0) + 1);
          }
        }

        const topCategories = Array.from(catWeights.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([k]) => k);

        let dominantCountry: string | null = null;
        let maxCountryCount = 0;
        for (const [c, cnt] of countryWeights.entries()) {
          if (cnt > maxCountryCount) {
            maxCountryCount = cnt;
            dominantCountry = c;
          }
        }

        return {
          userId,
          seedIds,
          categoryWeights: catWeights,
          countryWeights,
          actorWeights,
          authorWeights,
          topCategories,
          dominantCountry,
          countryConcentration: validCount > 0 ? maxCountryCount / validCount : 0,
          totalFavorites: validCount,
        };
      }),
      getCandidatesForProfile: jest.fn((profile: UserPreferenceProfile, excludeIds: Set<string>) => {
        return sampleMovies.filter((m) => !excludeIds.has(m.id));
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: DatabaseService, useValue: mockDbService },
        { provide: AnalyticsService, useValue: analyticsService },
        { provide: ContentSimilarityService, useValue: contentSimilarityService },
        { provide: EventService, useValue: mockEventService },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
    configService = module.get(ConfigService);
    redisService = module.get(RedisService);
    dbService = module.get(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Core Functionality & Error Handling', () => {
    it('should throw ServiceUnavailableException when RECOMMENDATIONS_ENABLED is false', async () => {
      configService.get.mockReturnValue('false');

      await expect(service.getRecommendations('user123', null, 10)).rejects.toThrow(
        ServiceUnavailableException,
      );

      expect(configService.get).toHaveBeenCalledWith('RECOMMENDATIONS_ENABLED');
      expect(redisService.get).not.toHaveBeenCalled();
      expect(dbService.query).not.toHaveBeenCalled();
    });

    it('should bound limit parameter safely within 1 to 30', async () => {
      contentSimilarityService.getUserFavorites.mockResolvedValue(['vn_1']);
      const result = await service.getRecommendations('user_fav', null, 999);
      expect(result.success).toBe(true);
      expect(result.eligible).toBe(true);
      expect(result.items.length).toBeLessThanOrEqual(30);
    });

    it('should survive completely when Redis and PostgreSQL are absent/throwing', async () => {
      contentSimilarityService.getUserFavorites.mockResolvedValue(['vn_1']);
      redisService.get.mockRejectedValue(new Error('Valkey connection refused'));
      redisService.set.mockRejectedValue(new Error('Valkey connection refused'));
      dbService.query.mockRejectedValue(new Error('PostgreSQL connection refused'));

      const result = await service.getRecommendations('user_fav', null, 5);
      expect(result.success).toBe(true);
      expect(result.eligible).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
    });
  });

  describe('Persona Testing: Personas 0 through 8 Deterministic Validation', () => {
    it('Persona 0 — Brand-new Anonymous: no session events yields eligible=false, total=0, source="none"', async () => {
      mockEventService.getRecentInteractions.mockReturnValue([]);

      const result = await service.getRecommendations(null, 'sess_brand_new', 10);

      expect(result.success).toBe(true);
      expect(result.eligible).toBe(false);
      expect(result.userId).toBeNull();
      expect(result.source).toBe('none');
      expect(result.total).toBe(0);
      expect(result.items).toEqual([]);
    });

    it('Persona 1 — Anonymous First Click: one movie_view for movie A yields eligible=true, recommendations related to movie A', async () => {
      // Visitor viewed Doraemon (jp_1)
      mockEventService.getRecentInteractions.mockReturnValue([
        { movieId: 'jp_1', eventType: 'movie_view', timestamp: Date.now(), weight: 1.0 },
      ]);

      const result = await service.getRecommendations(null, 'sess_first_click', 5);

      expect(result.success).toBe(true);
      expect(result.eligible).toBe(true);
      expect(result.source).toBe('behavior');
      expect(result.total).toBeGreaterThan(0);
      // Already viewed seed movie jp_1 must NOT be in recommendations
      expect(result.items.some((i) => i.movieId === 'jp_1')).toBe(false);
      // Recommendations must relate to jp_1 (e.g. jp_2: Your Name), not generic views
      expect(result.items[0].movieId).toBe('jp_2');
      expect(result.items[0].reason).toContain('Vì bạn vừa xem');
    });

    it('Persona 2 — Anonymous Vietnam-Heavy: recent events mainly Vietnamese movies visibly favor Vietnamese films', async () => {
      // Visitor interacted with Mắt Biếc (vn_1) and Bố Già (vn_2)
      mockEventService.getRecentInteractions.mockReturnValue([
        { movieId: 'vn_2', eventType: 'play', timestamp: Date.now(), weight: 2.5 },
        { movieId: 'vn_1', eventType: 'movie_view', timestamp: Date.now() - 3000, weight: 1.0 },
      ]);

      const result = await service.getRecommendations(null, 'sess_vn_heavy', 3);

      expect(result.success).toBe(true);
      expect(result.eligible).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
      // Top candidate must be the remaining Vietnamese movie (Hai Phượng)
      expect(result.items[0].movieId).toBe('vn_3');
      expect(result.items[0].reason).toContain('Việt Nam');
      expect(result.items.some((i) => i.movieId === 'vn_1' || i.movieId === 'vn_2')).toBe(false);
    });

    it('Persona 3 — Authenticated No Data: verified uid with 0 favorites and 0 events yields eligible=false, hidden', async () => {
      contentSimilarityService.getUserFavorites.mockResolvedValue([]);
      mockEventService.getRecentInteractions.mockReturnValue([]);

      const result = await service.getRecommendations('verified_user_no_data', 'sess_123', 10);

      expect(result.success).toBe(true);
      expect(result.eligible).toBe(false);
      expect(result.userId).toBe('verified_user_no_data');
      expect(result.source).toBe('none');
      expect(result.total).toBe(0);
      expect(result.items).toEqual([]);
    });

    it('Persona 4 — Authenticated Favorites: verified uid with favorites yields eligible=true, personalized results', async () => {
      contentSimilarityService.getUserFavorites.mockResolvedValue(['jp_1']);
      mockEventService.getRecentInteractions.mockReturnValue([]);

      const result = await service.getRecommendations('verified_user_favs', null, 3);

      expect(result.success).toBe(true);
      expect(result.eligible).toBe(true);
      expect(result.userId).toBe('verified_user_favs');
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0].movieId).toBe('jp_2');
    });

    it('Persona 5 — Authenticated Behavior Only: verified uid with 0 favorites but viewing events yields eligible=true, behavior-driven', async () => {
      contentSimilarityService.getUserFavorites.mockResolvedValue([]);
      mockEventService.getRecentInteractions.mockReturnValue([
        { movieId: 'vn_1', eventType: 'play', timestamp: Date.now(), weight: 2.5 },
      ]);

      const result = await service.getRecommendations('verified_user_behavior_only', null, 3);

      expect(result.success).toBe(true);
      expect(result.eligible).toBe(true);
      expect(result.source).toBe('behavior');
      expect(result.userId).toBe('verified_user_behavior_only');
      expect(result.items.length).toBeGreaterThan(0);
      expect(['vn_2', 'vn_3']).toContain(result.items[0].movieId);
    });

    it('Persona 6 — Isolation: two auth users and two anon sessions have isolated cache keys without cross-profile leakage', async () => {
      contentSimilarityService.getUserFavorites.mockImplementation((uId: string) => {
        if (uId === 'user_anime') return Promise.resolve(['jp_1']);
        if (uId === 'user_vietnam') return Promise.resolve(['vn_1']);
        return Promise.resolve([]);
      });

      mockEventService.getRecentInteractions.mockImplementation((opts: any) => {
        if (opts.sessionId === 'sess_anime') {
          return [{ movieId: 'jp_1', eventType: 'movie_view', timestamp: 1, weight: 1 }];
        }
        if (opts.sessionId === 'sess_vietnam') {
          return [{ movieId: 'vn_1', eventType: 'movie_view', timestamp: 1, weight: 1 }];
        }
        return [];
      });

      const resAuthA = await service.getRecommendations('user_anime', null, 3);
      const resAuthB = await service.getRecommendations('user_vietnam', null, 3);
      const resAnonA = await service.getRecommendations(null, 'sess_anime', 3);
      const resAnonB = await service.getRecommendations(null, 'sess_vietnam', 3);

      expect(resAuthA.items[0].movieId).toBe('jp_2');
      expect(['vn_2', 'vn_3']).toContain(resAuthB.items[0].movieId);
      expect(resAnonA.items[0].movieId).toBe('jp_2');
      expect(['vn_2', 'vn_3']).toContain(resAnonB.items[0].movieId);
    });

    it('Persona 7 — Spoofing: anonymous request with forged client identity never accesses protected user favorites', async () => {
      mockEventService.getRecentInteractions.mockReturnValue([]);

      // Attacker passes a sessionId that tries to look like a userId without Bearer token
      const result = await service.getRecommendations(null, 'forged_target_user_id', 10);

      // Firestore getUserFavorites must NEVER be called
      expect(contentSimilarityService.getUserFavorites).not.toHaveBeenCalled();
      expect(result.eligible).toBe(false);
      expect(result.userId).toBeNull();
    });

    it('Persona 8 — Cold Generic Homepage: baseline popularity still works for general catalog, but for-you is zero-signal gated', async () => {
      // 1. "Dành cho bạn" for cold anonymous user returns eligible=false, hidden
      mockEventService.getRecentInteractions.mockReturnValue([]);
      const forYouRes = await service.getRecommendations(null, 'sess_cold_visitor', 10);
      expect(forYouRes.eligible).toBe(false);
      expect(forYouRes.total).toBe(0);

      // 2. Other homepage sections (trending / popularity baseline) still work normally
      const baselineRes = await service.buildBaselineRecommendations(null, 5);
      expect(baselineRes.success).toBe(true);
      expect(baselineRes.eligible).toBe(true);
      expect(baselineRes.items.length).toBeGreaterThan(0);
      expect(baselineRes.source).toBe('popularity');
    });

    it('Cache Fingerprinting: User recommendations update immediately when favorites change without waiting 1 hour', async () => {
      contentSimilarityService.getUserFavorites.mockResolvedValue(['jp_1']);
      const res1 = await service.getRecommendations('user_dynamic', null, 3);
      expect(res1.cached).toBe(false);
      expect(res1.items[0].movieId).toBe('jp_2');

      // Second call with same favorites serves from cache
      const res2 = await service.getRecommendations('user_dynamic', null, 3);
      expect(res2.cached).toBe(true);

      // User adds a new favorite (vn_1) -> fingerprint changes!
      contentSimilarityService.getUserFavorites.mockResolvedValue(['jp_1', 'vn_1']);
      const res3 = await service.getRecommendations('user_dynamic', null, 3);
      expect(res3.cached).toBe(false);
    });

    it('Phase 06 Bug Fix — Favorite-Only User: Authenticated user with favorites in Firestore but empty RAM is eligible immediately', async () => {
      // Empty RAM in EventService (e.g. after Render restart)
      mockEventService.getRecentInteractions.mockReturnValue([]);
      // Favorites exist durably in Firestore
      contentSimilarityService.getUserFavorites.mockResolvedValue(['vn_1']);

      const result = await service.getRecommendations('user_fav_only', null, 5);

      expect(result.success).toBe(true);
      expect(result.eligible).toBe(true);
      expect(result.total).toBeGreaterThan(0);
      expect(result.items.length).toBeGreaterThan(0);
      expect(['vn_2', 'vn_3']).toContain(result.items[0].movieId);
    });

    it('Phase 06 Bug Fix — Verified Email Fallback: Maps verified Firebase Auth identity to Firestore customer document', async () => {
      mockEventService.getRecentInteractions.mockReturnValue([]);
      // Doc lookup by uid misses, but email lookup finds favorites
      contentSimilarityService.getUserFavorites.mockImplementation((userId: string, email?: string) => {
        if (email === 'owner@mfilm.online') return Promise.resolve(['jp_1']);
        return Promise.resolve([]);
      });

      const result = await service.getRecommendations(
        'random_firebase_uid_123',
        null,
        5,
        'owner@mfilm.online',
      );

      expect(result.success).toBe(true);
      expect(result.eligible).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0].movieId).toBe('jp_2');
      expect(contentSimilarityService.getUserFavorites).toHaveBeenCalledWith(
        'random_firebase_uid_123',
        'owner@mfilm.online',
      );
    });

    it('Phase 06 Bug Fix — Durable History: Tinybird historical events unlock recommendations when RAM cache is empty', async () => {
      // Empty in-memory events (e.g. after Render restart)
      mockEventService.getRecentInteractions.mockReturnValue([]);
      contentSimilarityService.getUserFavorites.mockResolvedValue([]);

      // Tinybird returns durable historical movie views
      analyticsService.getRecentBehaviorSignals.mockResolvedValue([
        { movieId: 'vn_1', score: 3.0 },
      ]);

      const result = await service.getRecommendations('user_durable_history', null, 5);

      expect(result.success).toBe(true);
      expect(result.eligible).toBe(true);
      expect(result.source).toBe('behavior');
      expect(result.items.length).toBeGreaterThan(0);
      expect(analyticsService.getRecentBehaviorSignals).toHaveBeenCalledWith({
        userId: 'user_durable_history',
        limit: 30,
      });
    });

    it('Phase 06 Bug Fix — Slug Resolution: Seed movie specified by slug correctly resolves to canonical profile', async () => {
      mockEventService.getRecentInteractions.mockReturnValue([]);
      // Seed movie provided as slug 'mat-biec' instead of doc ID 'vn_1'
      contentSimilarityService.getUserFavorites.mockResolvedValue(['mat-biec']);

      const result = await service.getRecommendations('user_slug_seed', null, 5);

      expect(result.success).toBe(true);
      expect(result.eligible).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
    });
  });
});
