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
    const isDbEnabled = process.env.POSTGRES_CATALOG_ENABLED !== 'false';
    const isValkeyEnabled = process.env.RECOMMENDATIONS_ENABLED !== 'false';

    const [dbHealth, redisHealth, kafkaHealth] = await Promise.all([
      isDbEnabled ? this.dbService.isHealthy() : Promise.resolve({ status: 'disabled', message: 'Disabled via POSTGRES_CATALOG_ENABLED=false' }),
      isValkeyEnabled ? this.redisService.isHealthy() : Promise.resolve({ status: 'disabled', message: 'Disabled via RECOMMENDATIONS_ENABLED=false' }),
      this.kafkaService.isHealthy(),
    ]);

    const isSystemHealthy =
      (dbHealth.status === 'healthy' || dbHealth.status === 'disabled') &&
      (redisHealth.status === 'healthy' || redisHealth.status === 'disabled') &&
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
