import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockRedisStorage = new Map<string, string>();

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'tinybird.dailyBudgetLimit') return 800;
      if (key === 'tinybird.apiUrl') return 'https://api.tinybird.co';
      if (key === 'tinybird.token') return 'mock_token';
      return null;
    }),
  };

  const mockDbService = {
    query: jest.fn().mockResolvedValue({
      rows: [
        {
          movie_id: 'm1',
          name: 'One Piece',
          slug: 'one-piece',
          img_url: 'https://img.com/op.jpg',
          views: 5000,
          rating: 9.2,
          score: 2920,
        },
      ],
    }),
  };

  const mockRedisService = {
    get: jest.fn(async (key: string) => mockRedisStorage.get(key) || null),
    set: jest.fn(async (key: string, val: string) => {
      mockRedisStorage.set(key, val);
      return 'OK';
    }),
  };

  beforeEach(async () => {
    mockRedisStorage.clear();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DatabaseService, useValue: mockDbService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should enforce 800 daily request budget', async () => {
    const statusBefore = await service.getBudgetStatus();
    expect(statusBefore.limit).toBe(800);
    expect(statusBefore.used).toBe(0);
    expect(statusBefore.exhausted).toBe(false);

    // Increment budget
    const allowed = await service.checkAndIncrementBudget();
    expect(allowed).toBe(true);

    const statusAfter = await service.getBudgetStatus();
    expect(statusAfter.used).toBe(1);
    expect(statusAfter.remaining).toBe(799);
  });

  it('should block requests when budget reaches 800', async () => {
    const today = (service as any).getTodayBudgetParam();
    mockRedisStorage.set(`tinybird:budget:${today}`, '800');

    const allowed = await service.checkAndIncrementBudget();
    expect(allowed).toBe(false);

    const status = await service.getBudgetStatus();
    expect(status.exhausted).toBe(true);
    expect(status.remaining).toBe(0);
  });

  it('should serve cached trending movies with valid TTL structure', async () => {
    const trending = await service.getTrendingMovies(5);
    expect(trending).toBeDefined();
    expect(trending.expiresInSeconds).toBe(180);
    expect(trending.data.length).toBeGreaterThan(0);
  });
});
