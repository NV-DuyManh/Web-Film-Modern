import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, PoolConfig } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const dbConfig = this.configService.get('database');

    const poolOptions: PoolConfig = {
      max: 10, // Conservative pool size for Free Tier limits
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    if (dbConfig.url) {
      this.logger.log('Configuring PostgreSQL connection using cloud DATABASE_URL');
      poolOptions.connectionString = dbConfig.url;
      if (dbConfig.ssl) {
        poolOptions.ssl = { rejectUnauthorized: false };
      }
    } else {
      this.logger.log(`Configuring PostgreSQL connection using host: ${dbConfig.host}:${dbConfig.port}`);
      poolOptions.host = dbConfig.host;
      poolOptions.port = dbConfig.port;
      poolOptions.user = dbConfig.user;
      poolOptions.password = dbConfig.password;
      poolOptions.database = dbConfig.name;
      if (dbConfig.ssl) {
        poolOptions.ssl = { rejectUnauthorized: false };
      }
    }

    this.pool = new Pool(poolOptions);

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle PostgreSQL client', err);
    });

    if (process.env.POSTGRES_CATALOG_ENABLED === 'false') {
      this.logger.log('PostgreSQL catalog is explicitly disabled via POSTGRES_CATALOG_ENABLED=false. Skipping initial connection check.');
      return;
    }

    try {
      const client = await this.pool.connect();
      client.release();
      this.logger.log('Connected successfully to PostgreSQL database.');
    } catch (err: any) {
      this.logger.warn(`PostgreSQL initial connect warning: ${err.message}. Will retry on demand.`);
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('PostgreSQL connection pool closed.');
    }
  }

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async isHealthy(): Promise<{ status: string; latencyMs?: number; error?: string }> {
    const start = Date.now();
    try {
      await this.pool.query('SELECT 1');
      return { status: 'healthy', latencyMs: Date.now() - start };
    } catch (err: any) {
      return { status: 'unhealthy', error: err.message };
    }
  }
}
