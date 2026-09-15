import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Comprehensive System & Infrastructure Health Check' })
  @ApiResponse({ status: 200, description: 'Overall system health and connection statuses' })
  async getHealth() {
    return this.healthService.check();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness Probe (Render / Kubernetes)' })
  @ApiResponse({ status: 200, description: 'Backend process is running' })
  async getLive() {
    return this.healthService.isLive();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness Probe (Postgres, Valkey, Kafka)' })
  @ApiResponse({ status: 200, description: 'Backend is ready to accept user and streaming traffic' })
  @ApiResponse({ status: 503, description: 'One or more required infrastructure dependencies are unavailable' })
  async getReady() {
    const res = await this.healthService.isReady();
    if (res.status !== 'ready') {
      throw new ServiceUnavailableException(res);
    }
    return res;
  }
}
