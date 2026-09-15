import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogMutationService } from './catalog-mutation.service';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [DatabaseModule, RedisModule, KafkaModule],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogMutationService],
  exports: [CatalogService, CatalogMutationService],
})
export class CatalogModule {}
