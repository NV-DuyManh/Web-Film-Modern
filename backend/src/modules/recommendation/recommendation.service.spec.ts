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

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };
    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
    };
    const mockDbService = {
      query: jest.fn(),
    };
    const mockAnalyticsService = {};
    const mockContentSimilarityService = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: DatabaseService, useValue: mockDbService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: ContentSimilarityService, useValue: mockContentSimilarityService },
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
      // Verify Redis and DB are not called
      expect(redisService.get).not.toHaveBeenCalled();
      expect(redisService.set).not.toHaveBeenCalled();
      expect(dbService.query).not.toHaveBeenCalled();
    });

    it('should call Redis and DB when RECOMMENDATIONS_ENABLED is true', async () => {
      configService.get.mockReturnValue('true');
      redisService.get.mockResolvedValue(null); // Cache miss
      dbService.query.mockResolvedValue({ rows: [] } as any); // Empty popularity fallback

      const result = await service.getRecommendations(null, 10);
      
      expect(result.source).toBe('popularity');
      expect(redisService.get).toHaveBeenCalled();
      expect(dbService.query).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalled();
    });
  });
});
