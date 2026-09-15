import { Test, TestingModule } from '@nestjs/testing';
import { CatalogMutationService } from './catalog-mutation.service';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { KafkaService } from '../kafka/kafka.service';
import { ConfigService } from '@nestjs/config';

describe('CatalogMutationService (Dual-Write Engine)', () => {
  let service: CatalogMutationService;
  let mockDb: any;
  let mockRedis: any;
  let mockKafka: any;
  let mockConfig: any;

  beforeEach(async () => {
    mockDb = {
      query: jest.fn(),
    };
    mockRedis = {
      del: jest.fn().mockResolvedValue(1),
    };
    mockKafka = {
      produceEvent: jest.fn().mockResolvedValue([{ partition: 0, offset: '1' }]),
    };
    mockConfig = {
      get: jest.fn().mockReturnValue('mfilm.catalog.v1'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogMutationService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: RedisService, useValue: mockRedis },
        { provide: KafkaService, useValue: mockKafka },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<CatalogMutationService>(CatalogMutationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully execute dual-write mutation on movie (happy path)', async () => {
    // 1. Idempotency check returns empty (not processed yet)
    mockDb.query
      .mockResolvedValueOnce({ rows: [] }) // Idempotency check
      .mockResolvedValueOnce({ rowCount: 1 }) // Insert replication job
      .mockResolvedValueOnce({ rowCount: 1 }) // Insert movie
      .mockResolvedValueOnce({ rowCount: 1 }); // Update replication job to committed

    const result = await service.mutateMovie(
      'INSERT',
      'test-movie-1',
      {
        name: 'Test Movie',
        slug: 'test-movie',
        views: 100,
      },
      'mutation-uuid-1',
    );

    expect(result.success).toBe(true);
    expect(result.firestore).toBe('committed');
    expect(result.postgres).toBe('committed');
    expect(result.mutationId).toBe('mutation-uuid-1');
    expect(mockRedis.del).toHaveBeenCalled();
    expect(mockKafka.produceEvent).toHaveBeenCalledWith('mfilm.catalog.v1', 'test-movie-1', expect.any(Object));
  });

  it('should handle idempotency when mutationId was already committed', async () => {
    // Return existing committed job
    mockDb.query.mockResolvedValueOnce({
      rows: [
        {
          mutation_id: 'mutation-uuid-2',
          postgres_status: 'committed',
        },
      ],
    });

    const result = await service.mutateMovie(
      'UPDATE',
      'test-movie-1',
      { name: 'Updated' },
      'mutation-uuid-2',
    );

    expect(result.success).toBe(true);
    expect(result.postgres).toBe('committed');
    expect(result.mutationId).toBe('mutation-uuid-2');
    // PostgreSQL write was skipped due to idempotency
    expect(mockDb.query).toHaveBeenCalledTimes(1);
  });

  it('should mark job as pending_reconciliation when PostgreSQL replication fails', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [] }) // Idempotency check
      .mockResolvedValueOnce({ rowCount: 1 }) // Insert replication job
      .mockRejectedValueOnce(new Error('Connection timeout')) // Insert movie FAILS
      .mockResolvedValueOnce({ rowCount: 1 }); // Update job with error

    const result = await service.mutateMovie(
      'INSERT',
      'test-movie-fail',
      { name: 'Fail Movie' },
      'mutation-uuid-fail',
    );

    expect(result.success).toBe(true);
    expect(result.firestore).toBe('committed');
    expect(result.postgres).toBe('pending_reconciliation');
    expect(result.error).toBe('Connection timeout');
  });
});
