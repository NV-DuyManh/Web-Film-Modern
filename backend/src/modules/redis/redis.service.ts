import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client?: Redis;
  private enabled = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisConfig = this.configService.get('redis');
    this.enabled = redisConfig?.enabled ?? (process.env.VALKEY_ENABLED === 'true');

    if (!this.enabled) {
      this.logger.log('Valkey/Redis is explicitly disabled (VALKEY_ENABLED!=true). Skipping client connection.');
      return;
    }

    const redisOptions: RedisOptions = {
      keyPrefix: redisConfig.keyPrefix || 'mfilm:',
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 150, 3000),
      lazyConnect: true,
    };

    if (redisConfig.url) {
      this.logger.log('Configuring Valkey/Redis connection using cloud URL');
      if (redisConfig.tls || redisConfig.url.startsWith('rediss://')) {
        redisOptions.tls = { rejectUnauthorized: false };
      }
      this.client = new Redis(redisConfig.url, redisOptions);
    } else {
      this.logger.log(`Configuring Redis connection using host: ${redisConfig.host}:${redisConfig.port}`);
      redisOptions.host = redisConfig.host;
      redisOptions.port = redisConfig.port;
      redisOptions.password = redisConfig.password || undefined;
      if (redisConfig.tls) {
        redisOptions.tls = { rejectUnauthorized: false };
      }
      this.client = new Redis(redisOptions);
    }

    this.client.on('error', (err) => {
      this.logger.warn(`Valkey/Redis error: ${err.message}`);
    });

    this.client.connect().then(() => {
      this.logger.log('Connected successfully to Valkey/Redis store.');
    }).catch((err) => {
      this.logger.warn(`Valkey/Redis initial connect warning: ${err.message}. Connection will retry.`);
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Valkey/Redis connection closed.');
    }
  }

  getClient(): Redis | undefined {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (!this.enabled || !this.client) {
      return null;
    }
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (err: any) {
      this.logger.warn(`Valkey/Redis set failed for key ${key}: ${err.message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }
    try {
      await this.client.del(key);
    } catch (err: any) {
      this.logger.warn(`Valkey/Redis del failed for key ${key}: ${err.message}`);
    }
  }

  async isHealthy(): Promise<{ status: string; latencyMs?: number; error?: string; message?: string }> {
    if (!this.enabled || !this.client) {
      return { status: 'disabled', message: 'Disabled via VALKEY_ENABLED=false' };
    }
    const start = Date.now();
    try {
      const pong = await this.client.ping();
      if (pong === 'PONG') {
        return { status: 'healthy', latencyMs: Date.now() - start };
      }
      return { status: 'degraded', latencyMs: Date.now() - start };
    } catch (err: any) {
      return { status: 'unhealthy', error: err.message };
    }
  }
}
