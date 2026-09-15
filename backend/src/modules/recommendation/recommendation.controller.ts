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
    // Resolve user ID strictly from cryptographically verified token; never from body or query params (IDOR protection)
    const userId = (req as any).user?.uid || null;
    const safeLimit = Math.max(1, Math.min(30, limit));

    return this.recommendationService.getRecommendations(userId, safeLimit);
  }
}
