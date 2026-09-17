import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { RecommendationService, RecommendationResponse } from './recommendation.service';
import { OptionalFirebaseAuthGuard } from '../auth/optional-auth.guard';

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('for-you')
  @UseGuards(OptionalFirebaseAuthGuard)
  @ApiOperation({
    summary: 'Personalized "Dành Cho Bạn" Multi-Stage Recommendation Endpoint',
    description:
      'Returns personalized Top-K recommendations for authenticated users (verified via Bearer token) or anonymous visitors (correlated via pseudonymous sessionId). Zero-signal users receive eligible=false with empty list.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of recommendations (1-30, default 10)' })
  @ApiQuery({ name: 'sessionId', required: false, type: String, description: 'Anonymous session ID for public event-driven recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendation candidates successfully retrieved' })
  async getForYou(
    @Req() req: Request,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<RecommendationResponse> {
    // 1. Authenticated identity: STRICTLY from cryptographically verified Bearer token
    const authUid = typeof (req as any).user?.uid === 'string' ? (req as any).user.uid.trim() : null;
    const authEmail = typeof (req as any).user?.email === 'string' ? (req as any).user.email.trim() : null;

    // 2. Anonymous session identifier: strictly pseudonymous telemetry correlation key (never an auth identity)
    let rawSessionId = req.headers['x-session-id'] || (req.query as any)?.sessionId || null;
    if (Array.isArray(rawSessionId)) {
      rawSessionId = rawSessionId[0];
    }
    const safeSessionId =
      typeof rawSessionId === 'string' && /^[a-zA-Z0-9_\-:]{1,128}$/.test(rawSessionId.trim())
        ? rawSessionId.trim()
        : null;

    const safeLimit = Math.max(1, Math.min(30, limit));

    return this.recommendationService.getRecommendations(authUid, safeSessionId, safeLimit, authEmail);
  }
}
