import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '../kafka/kafka.service';
import { CreateEventDto } from './dto/create-event.dto';
import { v4 as uuidv4 } from 'uuid';

export interface EnrichedStreamingEvent {
  eventId: string;
  eventType: string;
  eventVersion: string;
  occurredAt: string;
  receivedAt: string;
  userId: string;
  anonymousId?: string;
  sessionId: string;
  movieId: string;
  episodeId: string;
  deviceType?: string;
  platform?: string;
  metadata: string;
  clientIp?: string;
  userAgent?: string;
}

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  private readonly topic: string;

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
  ) {
    this.topic = this.configService.get('kafka.topicBehavior') || this.configService.get('kafka.topicEvents') || 'mfilm.behavior.v1';
  }

  private sanitizeMetadata(metadata: any): Record<string, any> {
    if (!metadata || typeof metadata !== 'object') return {};
    
    // Cap metadata size (e.g. stringified size < 2048 bytes)
    let str = JSON.stringify(metadata);
    if (str.length > 2048) {
      this.logger.warn(`Metadata size exceeded 2048 bytes. Truncating.`);
      return { _error: 'metadata_too_large' };
    }

    const sanitized = { ...metadata };
    const blockedKeys = ['password', 'token', 'accesstoken', 'refreshtoken', 'card', 'secret', 'email'];
    for (const key of Object.keys(sanitized)) {
      if (blockedKeys.some((b) => key.toLowerCase().includes(b))) {
        delete sanitized[key];
      }
    }
    return sanitized;
  }

  enrichEvent(dto: CreateEventDto, clientIp?: string, userAgent?: string, authUserId?: string): EnrichedStreamingEvent {
    let occurredAtIso: string;
    if (!dto.occurredAt) {
      occurredAtIso = new Date().toISOString();
    } else if (typeof dto.occurredAt === 'number') {
      occurredAtIso = new Date(dto.occurredAt).toISOString();
    } else {
      // Basic validation for ISO string parsing
      const parsed = new Date(dto.occurredAt);
      occurredAtIso = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    }

    let finalUserId = authUserId;
    if (!finalUserId) {
      if (dto.userId) {
        finalUserId = dto.userId;
      } else if (dto.anonymousId) {
        finalUserId = dto.anonymousId.startsWith('anon:') ? dto.anonymousId : `anon:${dto.anonymousId}`;
      } else if (dto.sessionId) {
        finalUserId = dto.sessionId.startsWith('session:') ? dto.sessionId : `session:${dto.sessionId}`;
      } else {
        finalUserId = `anon:unknown`;
      }
    }

    return {
      eventId: dto.eventId || uuidv4(),
      eventType: dto.eventType,
      eventVersion: dto.eventVersion || '1',
      occurredAt: occurredAtIso,
      receivedAt: new Date().toISOString(),
      userId: finalUserId,
      anonymousId: dto.anonymousId,
      sessionId: dto.sessionId || 'unknown',
      movieId: dto.movieId,
      episodeId: dto.episodeId || '',
      deviceType: dto.deviceType || 'unknown',
      platform: dto.platform || 'web',
      metadata: JSON.stringify(this.sanitizeMetadata(dto.metadata)),
      clientIp: clientIp || '',
      userAgent: userAgent || '',
    };
  }

  async processSingleEvent(dto: CreateEventDto, clientIp?: string, userAgent?: string, authUserId?: string) {
    const event = this.enrichEvent(dto, clientIp, userAgent, authUserId);
    // Key by userId, anonymousId, or sessionId to preserve sequential order across partitions
    const partitionKey = event.userId || event.anonymousId || event.sessionId;

    try {
      await this.kafkaService.produceEvent(this.topic, partitionKey, event);
    } catch (error) {
      this.logger.error(`Failed to produce event to Kafka: ${error.message}`, error.stack);
      throw new ServiceUnavailableException('Telemetry bus unavailable');
    }

    return {
      success: true,
      eventId: event.eventId,
      eventType: event.eventType,
      receivedAt: event.receivedAt,
    };
  }

  async processBatchEvents(dtos: CreateEventDto[], clientIp?: string, userAgent?: string, authUserId?: string) {
    const enrichedEvents = dtos.map((dto) => this.enrichEvent(dto, clientIp, userAgent, authUserId));

    const messages = enrichedEvents.map((event) => ({
      key: event.userId || event.anonymousId || event.sessionId,
      value: event,
    }));

    try {
      await this.kafkaService.produceBatch(this.topic, messages);
    } catch (error) {
      this.logger.error(`Failed to produce batch to Kafka: ${error.message}`, error.stack);
      throw new ServiceUnavailableException('Telemetry bus unavailable');
    }

    return {
      success: true,
      count: enrichedEvents.length,
      receivedAt: new Date().toISOString(),
    };
  }
}
