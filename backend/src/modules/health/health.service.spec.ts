import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { KafkaService } from '../kafka/kafka.service';

describe('HealthService', () => {
  let service: HealthService;
  let mockDbService: any;
  let mockRedisService: any;
  let mockKafkaService: any;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    delete process.env.VALKEY_ENABLED;
    process.env.POSTGRES_CATALOG_ENABLED = 'false';

    mockDbService = {
      isHealthy: jest.fn().mockResolvedValue({ status: 'healthy' }),
    };
    mockRedisService = {
      isHealthy: jest.fn().mockResolvedValue({ status: 'healthy', latencyMs: 2 }),
    };
    mockKafkaService = {
      isHealthy: jest.fn().mockResolvedValue({ status: 'healthy', latencyMs: 15 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: DatabaseService, useValue: mockDbService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: KafkaService, useValue: mockKafkaService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should report valkey as disabled and overall system ready when VALKEY_ENABLED is not true', async () => {
    process.env.VALKEY_ENABLED = 'false';
    const res = await service.isReady();

    expect(res.status).toBe('ready');
    expect(res.services.valkey.status).toBe('disabled');
    expect(res.services.kafka.status).toBe('healthy');
    expect(mockRedisService.isHealthy).not.toHaveBeenCalled();
  });

  it('should call redisService.isHealthy when VALKEY_ENABLED=true', async () => {
    process.env.VALKEY_ENABLED = 'true';
    const res = await service.isReady();

    expect(mockRedisService.isHealthy).toHaveBeenCalled();
    expect(res.services.valkey.status).toBe('healthy');
    expect(res.status).toBe('ready');
  });

  it('should fail readiness when Kafka is unhealthy, preserving Kafka criticality', async () => {
    process.env.VALKEY_ENABLED = 'false';
    mockKafkaService.isHealthy.mockResolvedValue({ status: 'unhealthy', error: 'Broker unreachable' });

    const res = await service.isReady();

    expect(res.status).toBe('not_ready');
    expect(res.services.kafka.status).toBe('unhealthy');
    expect(res.services.valkey.status).toBe('disabled');
  });
});
