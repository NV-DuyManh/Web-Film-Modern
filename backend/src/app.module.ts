import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { HealthModule } from './modules/health/health.module';
import { EventModule } from './modules/event/event.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { AuthModule } from './modules/auth/auth.module';
import { MediaModule } from './modules/media/media.module';
import { AiModule } from './modules/ai/ai.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UserStateModule } from './modules/user-state/user-state.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 100, // 100 requests per second per IP
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 2400, // 2,400 requests per minute per IP
      },
    ]),
    DatabaseModule,
    RedisModule,
    KafkaModule,
    HealthModule,
    EventModule,
    MetricsModule,
    AuthModule,
    MediaModule,
    AiModule,
    CatalogModule,
    AnalyticsModule,
    UserStateModule,
    RecommendationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
