import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { EventModule } from '../event/event.module';
import { ContentSimilarityService } from './content-similarity.service';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { OptionalFirebaseAuthGuard } from '../auth/optional-auth.guard';

@Module({
  imports: [ConfigModule, DatabaseModule, RedisModule, AnalyticsModule, EventModule],
  controllers: [RecommendationController],
  providers: [ContentSimilarityService, RecommendationService, OptionalFirebaseAuthGuard],
  exports: [RecommendationService, ContentSimilarityService],
})
export class RecommendationModule {}
