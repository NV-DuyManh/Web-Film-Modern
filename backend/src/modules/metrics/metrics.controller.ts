import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

@ApiTags('Observability')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Prometheus Scraping Endpoint' })
  @ApiResponse({ status: 200, description: 'Prometheus plain-text formatted metrics' })
  async getMetrics(@Res() res: Response) {
    res.setHeader('Content-Type', this.metricsService.getContentType());
    const metrics = await this.metricsService.getMetrics();
    res.send(metrics);
  }
}
