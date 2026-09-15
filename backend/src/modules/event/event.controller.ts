import { Controller, Post, Body, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { BatchEventDto } from './dto/batch-event.dto';
import { OptionalFirebaseAuthGuard } from '../auth/optional-auth.guard';

@ApiTags('Streaming Events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @UseGuards(OptionalFirebaseAuthGuard)
  @Post()
  @Throttle({
    short: { limit: 100, ttl: 1000 },
    long: { limit: 2500, ttl: 60000 },
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Ingest Single Streaming Event' })
  @ApiResponse({ status: 202, description: 'Event accepted and forwarded to Kafka streaming topic' })
  @ApiResponse({ status: 400, description: 'Invalid event schema or fields' })
  @ApiResponse({ status: 503, description: 'Telemetry bus unavailable' })
  @ApiBody({ type: CreateEventDto })
  async ingestEvent(@Body() dto: CreateEventDto, @Req() req: Request) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = (req.headers['user-agent'] as string) || '';
    const authUserId = (req as any).user?.uid;
    return this.eventService.processSingleEvent(dto, clientIp, userAgent, authUserId);
  }

  @UseGuards(OptionalFirebaseAuthGuard)
  @Post('batch')
  @Throttle({
    short: { limit: 120, ttl: 1000 },
    long: { limit: 3600, ttl: 60000 },
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Ingest Batch of Streaming Events' })
  @ApiResponse({ status: 202, description: 'Batch accepted and forwarded to Kafka streaming topic' })
  @ApiResponse({ status: 400, description: 'Invalid batch format or payload' })
  @ApiResponse({ status: 503, description: 'Telemetry bus unavailable' })
  @ApiBody({ type: BatchEventDto })
  async ingestBatch(@Body() dto: BatchEventDto, @Req() req: Request) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = (req.headers['user-agent'] as string) || '';
    const authUserId = (req as any).user?.uid;
    return this.eventService.processBatchEvents(dto.events, clientIp, userAgent, authUserId);
  }
}
