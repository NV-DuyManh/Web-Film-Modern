import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  describe('when VALKEY_ENABLED is false (default / production mode)', () => {
    let service: RedisService;

    beforeEach(async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'redis') {
            return {
              enabled: false,
              host: 'localhost',
              port: 6380,
              keyPrefix: 'mfilm:',
            };
          }
          return undefined;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RedisService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<RedisService>(RedisService);
    });

    it('should not initialize Redis client onModuleInit', () => {
      service.onModuleInit();
      expect(service.getClient()).toBeUndefined();
    });

    it('should return null on get() without errors or connection attempts', async () => {
      service.onModuleInit();
      const val = await service.get('test-key');
      expect(val).toBeNull();
    });

    it('should no-op on set() without throwing errors', async () => {
      service.onModuleInit();
      await expect(service.set('test-key', 'value', 3600)).resolves.not.toThrow();
    });

    it('should no-op on del() without throwing errors', async () => {
      service.onModuleInit();
      await expect(service.del('test-key')).resolves.not.toThrow();
    });

    it('should report status as disabled in isHealthy()', async () => {
      service.onModuleInit();
      const health = await service.isHealthy();
      expect(health.status).toBe('disabled');
      expect(health.message).toContain('VALKEY_ENABLED=false');
    });

    it('should cleanly no-op onModuleDestroy', async () => {
      service.onModuleInit();
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });
});
