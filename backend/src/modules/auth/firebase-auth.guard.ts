import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);
  private firebaseInitialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly dbService: DatabaseService,
  ) {
    this.initFirebase();
  }

  private initFirebase() {
    if (getApps().length > 0) {
      this.firebaseInitialized = true;
      return;
    }

    try {
      const projectId = this.configService.get<string>('firebase.projectId') || 'manhfilm-105b3';
      const clientEmail = this.configService.get<string>('firebase.clientEmail');
      const privateKey = this.configService.get<string>('firebase.privateKey');

      if (clientEmail && privateKey) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        this.firebaseInitialized = true;
        this.logger.log(`Firebase Admin initialized with service account for project [${projectId}]`);
      } else {
        initializeApp({ projectId });
        this.firebaseInitialized = true;
        this.logger.log(`Firebase Admin initialized in project ID mode [${projectId}]`);
      }
    } catch (err: any) {
      this.logger.warn(`Firebase Admin initialization deferred: ${err.message}`);
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header with Bearer token is required');
    }

    const token = authHeader.split('Bearer ')[1]?.trim();
    if (!token) {
      throw new UnauthorizedException('Bearer token is empty');
    }

    try {
      let uid = '';
      let email = '';
      let role = 'user';

      if (this.firebaseInitialized) {
        try {
          const auth = getAuth();
          const decoded = await auth.verifyIdToken(token);
          uid = decoded.uid;
          email = decoded.email || '';
          if (decoded.role) role = decoded.role;
          if (decoded.admin) role = 'admin';
        } catch (verifyErr: any) {
          // In local development or testing with mock tokens
          if (process.env.NODE_ENV !== 'production' && token.startsWith('mock_admin_token')) {
            uid = 'mock_admin_uid';
            email = 'admin@mfilm.online';
            role = 'admin';
          } else if (process.env.NODE_ENV !== 'production' && token.startsWith('mock_user_token')) {
            uid = 'mock_user_uid';
            email = 'user@mfilm.online';
            role = 'user';
          } else {
            this.logger.warn(`Token verification failed: ${verifyErr.message}`);
            throw new UnauthorizedException(`Invalid or expired Firebase ID token: ${verifyErr.message}`);
          }
        }
      } else {
        // Fallback for mock environments
        if (token.startsWith('mock_admin_token')) {
          uid = 'mock_admin_uid';
          email = 'admin@mfilm.online';
          role = 'admin';
        } else {
          throw new UnauthorizedException('Firebase Admin is not initialized and token is invalid');
        }
      }

      // Check server-side role resolution from PostgreSQL database
      if (uid && role !== 'admin') {
        try {
          const res = await this.dbService.query(
            'SELECT role FROM users WHERE id = $1 LIMIT 1',
            [uid],
          );
          if (res.rows.length > 0 && res.rows[0].role) {
            role = res.rows[0].role;
          }
        } catch {
          // database lookup failure is non-fatal; retain token role
        }
      }

      request.user = { uid, email, role };
      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException(`Authentication failed: ${err.message}`);
    }
  }
}
