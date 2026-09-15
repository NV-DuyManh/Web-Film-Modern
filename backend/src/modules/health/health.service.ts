import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { KafkaService } from '../kafka/kafka.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
  ) {}

  async check() {
    const [dbHealth, redisHealth, kafkaHealth] = await Promise.all([
      this.dbService.isHealthy(),
      this.redisService.isHealthy(),
      this.kafkaService.isHealthy(),
    ]);

    const isSystemHealthy =
      (process.env.POSTGRES_CATALOG_ENABLED === 'false' || dbHealth.status === 'healthy') &&
      (process.env.RECOMMENDATIONS_ENABLED === 'false' || redisHealth.status === 'healthy') &&
      kafkaHealth.status === 'healthy';

    const memoryUsage = process.memoryUsage();

    return {
      status: isSystemHealthy ? 'ok' : 'degraded',
      backend: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      services: {
        database: dbHealth,
        valkey: redisHealth,
        kafka: kafkaHealth,
      },
      system: {
        heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
        rssMB: (memoryUsage.rss / 1024 / 1024).toFixed(2),
      },
    };
  }

  async isLive() {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  async isReady() {
    const health = await this.check();
    const isReady = health.status === 'ok';
    return {
      status: isReady ? 'ready' : 'not_ready',
      services: health.services,
      timestamp: health.timestamp,
    };
  }
}
