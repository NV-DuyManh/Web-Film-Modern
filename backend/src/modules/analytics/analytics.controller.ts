import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('trending')
  @ApiOperation({ summary: 'Get Real-Time Trending Movies (rolling 15m window)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTrending(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.analyticsService.getTrendingMovies(limit);
  }

  @Get('qoe')
  @ApiOperation({ summary: 'Get Streaming QoE Analytics (Buffer ratio, completion rate)' })
  async getQoE() {
    return this.analyticsService.getQoEAnalytics();
  }

  @Get('budget')
  @ApiOperation({ summary: 'Inspect Tinybird daily request quota budget status' })
  async getBudget() {
    return this.analyticsService.getBudgetStatus();
  }
}
