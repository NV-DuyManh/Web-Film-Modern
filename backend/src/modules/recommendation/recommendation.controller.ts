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
      'Returns personalized Top-K recommendations if user is authenticated with interaction history, content-similar recommendations if sparse history, or trending/popularity baseline if anonymous/cold-start. Cached in Valkey with 3600s TTL.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of recommendations (1-30, default 10)' })
  @ApiResponse({ status: 200, description: 'Recommendation candidates successfully retrieved' })
  async getForYou(
    @Req() req: Request,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<RecommendationResponse> {
    // Resolve user ID: preferred from verified auth token, with fallback to x-user-id header or query param
    const authUid = (req as any).user?.uid;
    const headerUserId = req.headers['x-user-id'];
    const queryUserId = (req.query as any)?.userId;

    let rawUserId = authUid || headerUserId || queryUserId || null;
    if (Array.isArray(rawUserId)) {
      rawUserId = rawUserId[0];
    }
    const safeUserId =
      typeof rawUserId === 'string' && /^[a-zA-Z0-9_\-]{1,128}$/.test(rawUserId.trim())
        ? rawUserId.trim()
        : null;

    const safeLimit = Math.max(1, Math.min(30, limit));

    return this.recommendationService.getRecommendations(safeUserId, safeLimit);
  }
}
