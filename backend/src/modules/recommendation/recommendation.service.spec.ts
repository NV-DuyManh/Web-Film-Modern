import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationService } from './recommendation.service';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ContentSimilarityService } from './content-similarity.service';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';

describe('RecommendationService', () => {
  let service: RecommendationService;
  let configService: jest.Mocked<ConfigService>;
  let redisService: jest.Mocked<RedisService>;
  let dbService: jest.Mocked<DatabaseService>;
  let contentSimilarityService: any;
  let analyticsService: any;

  const sampleMovies = [
    {
      id: 'm1',
      name: 'Doraemon',
      slug: 'doraemon',
      imgUrl: 'https://example.com/doraemon.jpg',
      bannerUrl: 'https://example.com/doraemon_b.jpg',
      views: 1000,
      rating: 9.0,
      isHot: true,
      categories: ['Hoạt Hình'],
      actors: [],
      authors: [],
    },
    {
      id: 'm2',
      name: 'Conan',
      slug: 'conan',
      imgUrl: 'https://example.com/conan.jpg',
      bannerUrl: 'https://example.com/conan_b.jpg',
      views: 800,
      rating: 8.8,
      isHot: false,
      categories: ['Hoạt Hình', 'Trinh Thám'],
      actors: [],
      authors: [],
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
      getTopMoviesByViews: jest.fn().mockReturnValue(sampleMovies),
      getMovie: jest.fn((id: string) => sampleMovies.find((m) => m.id === id)),
      getUserFavorites: jest.fn().mockResolvedValue([]),
      getRecommendationsForSeeds: jest.fn().mockReturnValue([
        {
          movieId: 'm2',
          name: 'Conan',
          slug: 'conan',
          similarityScore: 0.85,
          reason: 'Vì bạn thích Doraemon',
        },
      ]),
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

  describe('getRecommendations', () => {
    it('should throw ServiceUnavailableException when RECOMMENDATIONS_ENABLED is false', async () => {
      configService.get.mockReturnValue('false');

      await expect(service.getRecommendations('user123', 10)).rejects.toThrow(
        ServiceUnavailableException,
      );

      expect(configService.get).toHaveBeenCalledWith('RECOMMENDATIONS_ENABLED');
      expect(redisService.get).not.toHaveBeenCalled();
      expect(dbService.query).not.toHaveBeenCalled();
    });

    it('should return popularity baseline when user is anonymous and Tinybird is empty', async () => {
      configService.get.mockImplementation((k: string) => (k === 'RECOMMENDATIONS_ENABLED' ? 'true' : 'false'));

      const result = await service.getRecommendations(null, 10);

      expect(result.success).toBe(true);
      expect(result.userId).toBeNull();
      expect(result.source).toBe('popularity');
      expect(result.items.length).toBe(2);
      expect(result.items[0].movieId).toBe('m1');
      expect(result.items[0].reason).toBe('Phim hot được xem nhiều');
    });

    it('should blend Tinybird trending when available for anonymous users', async () => {
      analyticsService.getTrendingMovies.mockResolvedValue({
        data: [{ movieId: 'm1', activeViewers: 12, name: 'Doraemon' }],
      });

      const result = await service.getRecommendations(null, 5);

      expect(result.success).toBe(true);
      expect(result.source).toBe('trending');
      expect(result.items[0].movieId).toBe('m1');
      expect(result.items[0].recommendationSource).toBe('trending');
      expect(result.items[0].reason).toBe('Đang được xem nhiều gần đây');
    });

    it('should return personalized content recommendations for authenticated user with favorites', async () => {
      contentSimilarityService.getUserFavorites.mockResolvedValue(['m1']);

      const result = await service.getRecommendations('auth_user_1', 5);

      expect(result.success).toBe(true);
      expect(result.userId).toBe('auth_user_1');
      expect(result.source).toBe('content_based');
      expect(result.items.length).toBeGreaterThanOrEqual(1);
      expect(result.items[0].movieId).toBe('m2');
      expect(result.items[0].reason).toContain('Vì bạn thích');
    });

    it('should return hybrid recommendations when user has sufficient favorites', async () => {
      contentSimilarityService.getUserFavorites.mockResolvedValue(['m1', 'm2', 'm3', 'm4', 'm5']);

      const result = await service.getRecommendations('power_user_1', 5);

      expect(result.success).toBe(true);
      expect(result.source).toBe('hybrid');
    });

    it('should bound limit parameter safely within 1 to 30', async () => {
      const result = await service.getRecommendations(null, 999);
      expect(result.success).toBe(true);
      // Items bounded by sample catalog length and safe limit (<= 30)
      expect(result.items.length).toBeLessThanOrEqual(30);
    });

    it('should serve from in-memory cache on subsequent requests without querying DB/Redis', async () => {
      // First call (cache miss)
      const res1 = await service.getRecommendations(null, 10);
      expect(res1.cached).toBe(false);

      // Second call (in-memory hit)
      const res2 = await service.getRecommendations(null, 10);
      expect(res2.cached).toBe(true);
      expect(res2.items[0].movieId).toBe(res1.items[0].movieId);
    });

    it('should survive completely when Redis and PostgreSQL are absent/throwing', async () => {
      redisService.get.mockRejectedValue(new Error('Valkey connection refused'));
      redisService.set.mockRejectedValue(new Error('Valkey connection refused'));
      dbService.query.mockRejectedValue(new Error('PostgreSQL connection refused'));

      const result = await service.getRecommendations(null, 10);
      expect(result.success).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
    });
  });
});

