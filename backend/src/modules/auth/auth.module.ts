import { Module, Global } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { RolesGuard } from './roles.guard';
import { DatabaseModule } from '../database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [FirebaseAuthGuard, RolesGuard],
  exports: [FirebaseAuthGuard, RolesGuard],
})
export class AuthModule {}
