jest.mock('../auth/optional-auth.guard', () => ({
  OptionalFirebaseAuthGuard: class {
    canActivate() {
      return true;
    }
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { ConfigService } from '@nestjs/config';

describe('RecommendationController Security & Identity Tests', () => {
  let controller: RecommendationController;
  let recommendationService: any;

  beforeEach(async () => {
    recommendationService = {
      getRecommendations: jest.fn().mockResolvedValue({
        success: true,
        eligible: false,
        userId: null,
        source: 'none',
        cached: false,
        total: 0,
        items: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationController],
      providers: [
        { provide: RecommendationService, useValue: recommendationService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<RecommendationController>(RecommendationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Persona 7 (Spoofing): Ignores forged x-user-id and query userId when unauthenticated', async () => {
    const mockReq = {
      headers: {
        'x-user-id': 'forged_victim_user_123',
        'x-session-id': 'sess_safe_telemetry_abc',
      },
      query: {
        userId: 'forged_query_uid_456',
      },
      user: null, // No cryptographically verified Bearer token
    } as any;

    await controller.getForYou(mockReq, 10);

    // Verified authUid MUST be null! The controller must never pass the forged x-user-id or query userId as authUid
    expect(recommendationService.getRecommendations).toHaveBeenCalledWith(
      null, // authUid
      'sess_safe_telemetry_abc', // sanitized sessionId
      10, // safeLimit
    );
  });

  it('Authenticated User: Correctly passes verified req.user.uid from Bearer token', async () => {
    const mockReq = {
      headers: {
        'x-session-id': 'sess_auth_session',
      },
      query: {},
      user: {
        uid: 'verified_firebase_uid_999',
        email: 'user@example.com',
      },
    } as any;

    await controller.getForYou(mockReq, 15);

    expect(recommendationService.getRecommendations).toHaveBeenCalledWith(
      'verified_firebase_uid_999',
      'sess_auth_session',
      15,
    );
  });
});
