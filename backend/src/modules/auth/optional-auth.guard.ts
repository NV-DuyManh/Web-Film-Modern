import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OptionalFirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalFirebaseAuthGuard.name);
  private firebaseInitialized = false;

  constructor(private readonly configService: ConfigService) {
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
          credential: cert({ projectId, clientEmail, privateKey }),
        });
      } else {
        initializeApp({ projectId });
      }
      this.firebaseInitialized = true;
    } catch (err: any) {
      this.logger.warn(`Firebase Admin optional init deferred: ${err.message}`);
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return true;
    }

    const token = authHeader.split('Bearer ')[1]?.trim();
    if (!token) {
      req.user = null;
      return true;
    }

    try {
      if (this.firebaseInitialized) {
        const decoded = await getAuth().verifyIdToken(token);
        req.user = {
          uid: decoded.uid,
          email: decoded.email,
        };
      } else {
        req.user = null;
      }
    } catch (err: any) {
      // In optional auth, invalid token is treated as unauthenticated rather than throwing 401
      req.user = null;
    }

    return true;
  }
}
