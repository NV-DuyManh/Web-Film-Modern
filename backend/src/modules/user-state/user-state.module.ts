import { Module } from '@nestjs/common';
import { UserStateController } from './user-state.controller';
import { UserStateService } from './user-state.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [UserStateController],
  providers: [UserStateService],
  exports: [UserStateService],
})
export class UserStateModule {}
