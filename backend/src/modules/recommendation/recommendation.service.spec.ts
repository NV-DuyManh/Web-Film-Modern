import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationService } from './recommendation.service';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { AnalyticsService } from '../analytics/analytics.service';
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
    };

    contentSimilarityService = {
      getTopMoviesByViews: jest.fn((limit = 10, excludeIds = new Set()) =>
        sampleMovies.filter((m) => !excludeIds.has(m.id)).slice(0, limit),
      ),
      getMovie: jest.fn((id: string) => sampleMovies.find((m) => m.id === id)),
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

      await expect(service.getRecommendations('user123', 10)).rejects.toThrow(
        ServiceUnavailableException,
      );

      expect(configService.get).toHaveBeenCalledWith('RECOMMENDATIONS_ENABLED');
      expect(redisService.get).not.toHaveBeenCalled();
      expect(dbService.query).not.toHaveBeenCalled();
    });

    it('should bound limit parameter safely within 1 to 30', async () => {
      const result = await service.getRecommendations(null, 999);
      expect(result.success).toBe(true);
      expect(result.items.length).toBeLessThanOrEqual(30);
    });

    it('should survive completely when Redis and PostgreSQL are absent/throwing', async () => {
      redisService.get.mockRejectedValue(new Error('Valkey connection refused'));
      redisService.set.mockRejectedValue(new Error('Valkey connection refused'));
      dbService.query.mockRejectedValue(new Error('PostgreSQL connection refused'));

      const result = await service.getRecommendations(null, 5);
      expect(result.success).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
    });
  });

  describe('Persona Testing: Recommendation Quality & Personalization', () => {
    it('Persona C (Cold Start): Anonymous or zero-favorites user receives baseline popularity', async () => {
      contentSimilarityService.getUserFavorites.mockResolvedValue([]);

      const result = await service.getRecommendations(null, 5);

      expect(result.success).toBe(true);
      expect(result.userId).toBeNull();
      expect(result.source).toBe('popularity');
      expect(result.items.length).toBeGreaterThanOrEqual(1);
      expect(result.items[0].recommendationSource).toBe('popularity');
    });

    it('Persona B (Vietnam-Heavy): User with exclusively Vietnamese favorites receives Vietnamese recommendations', async () => {
      // User favorited 2 Vietnamese films (Mắt Biếc, Bố Già)
      contentSimilarityService.getUserFavorites.mockResolvedValue(['vn_1', 'vn_2']);

      const result = await service.getRecommendations('user_vietnam_lover', 3);

      expect(result.success).toBe(true);
      expect(result.userId).toBe('user_vietnam_lover');
      expect(result.source).toBe('content_based');
      expect(result.items.length).toBeGreaterThanOrEqual(1);

      // Top candidate must be the remaining Vietnamese movie (Hai Phượng), not foreign high-view movies
      const topMovie = result.items[0];
      expect(topMovie.movieId).toBe('vn_3');
      expect(topMovie.reason).toContain('Vì bạn yêu thích nhiều phim Việt Nam');
      // Already-favorited movies vn_1 and vn_2 must be excluded
      expect(result.items.some((i) => i.movieId === 'vn_1' || i.movieId === 'vn_2')).toBe(false);
    });

    it('Persona A (Broad/Mixed): User with diverse favorites receives multi-cluster recommendations', async () => {
      // User favorited anime (jp_1) and action (us_1)
      contentSimilarityService.getUserFavorites.mockResolvedValue(['jp_1', 'us_1']);

      const result = await service.getRecommendations('user_broad_mixed', 4);

      expect(result.success).toBe(true);
      expect(result.userId).toBe('user_broad_mixed');
      // Should not contain the seeds themselves
      expect(result.items.some((i) => i.movieId === 'jp_1' || i.movieId === 'us_1')).toBe(false);
      // Results should contain related anime or action (e.g. jp_2 or vn_3)
      const movieIds = result.items.map((i) => i.movieId);
      expect(movieIds).toContain('jp_2');
    });

    it('Persona D (Different Users & Cache Isolation): Two users with different favorites receive distinct results', async () => {
      // User 1: Loves Anime
      contentSimilarityService.getUserFavorites.mockImplementation((uId: string) => {
        if (uId === 'user_anime') return Promise.resolve(['jp_1']);
        if (uId === 'user_vietnam') return Promise.resolve(['vn_1']);
        return Promise.resolve([]);
      });

      const resAnime = await service.getRecommendations('user_anime', 3);
      const resVietnam = await service.getRecommendations('user_vietnam', 3);

      expect(resAnime.items[0].movieId).not.toBe(resVietnam.items[0].movieId);
      // Anime lover gets anime top result
      expect(resAnime.items[0].movieId).toBe('jp_2');
      // Vietnam lover gets Vietnamese movie top result
      expect(['vn_2', 'vn_3']).toContain(resVietnam.items[0].movieId);
    });

    it('Cache Fingerprinting: User recommendations update immediately when favorites change without waiting 1 hour', async () => {
      // Step 1: User has 1 favorite
      contentSimilarityService.getUserFavorites.mockResolvedValue(['jp_1']);
      const res1 = await service.getRecommendations('user_dynamic', 3);
      expect(res1.cached).toBe(false);
      expect(res1.items[0].movieId).toBe('jp_2');

      // Second call with same favorites serves from cache
      const res2 = await service.getRecommendations('user_dynamic', 3);
      expect(res2.cached).toBe(true);

      // Step 2: User adds a new favorite (vn_1) -> fingerprint changes!
      contentSimilarityService.getUserFavorites.mockResolvedValue(['jp_1', 'vn_1']);
      const res3 = await service.getRecommendations('user_dynamic', 3);
      // Must generate fresh result, not return old cached res2!
      expect(res3.cached).toBe(false);
    });
  });
});
