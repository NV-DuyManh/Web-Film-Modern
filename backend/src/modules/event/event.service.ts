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

export interface InteractionSignal {
  movieId: string;
  eventType: string;
  timestamp: number;
  weight: number;
}

export const MEANINGFUL_SIGNAL_EVENTS = new Set([
  'movie_view',
  'play',
  'watch_progress',
  'complete',
  'recommendation_click',
]);

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  private readonly topic: string;
  private readonly sessionInteractions = new Map<string, InteractionSignal[]>();
  private readonly userInteractions = new Map<string, InteractionSignal[]>();
  private readonly MAX_TRACKED_ENTITIES = 500;
  private readonly MAX_EVENTS_PER_ENTITY = 30;

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

  private calculateSignalWeight(eventType: string, metadata?: any): number {
    switch (eventType) {
      case 'complete':
        return 5.0;
      case 'watch_progress': {
        const percent = Number(metadata?.percent) || 0;
        return percent >= 70 ? 4.0 : 3.0;
      }
      case 'play':
        return 2.5;
      case 'recommendation_click':
        return 2.0;
      case 'movie_view':
      default:
        return 1.0;
    }
  }

  recordRecentInteraction(event: EnrichedStreamingEvent, authUserId?: string) {
    if (!MEANINGFUL_SIGNAL_EVENTS.has(event.eventType)) return;
    const movieId = String(event.movieId || '').trim();
    if (!movieId || movieId === 'none') return;

    let parsedMeta: any = {};
    try {
      if (typeof event.metadata === 'string') {
        parsedMeta = JSON.parse(event.metadata);
      }
    } catch {}

    const signal: InteractionSignal = {
      movieId,
      eventType: event.eventType,
      timestamp: new Date(event.occurredAt || event.receivedAt).getTime(),
      weight: this.calculateSignalWeight(event.eventType, parsedMeta),
    };

    // 1. Record for anonymous sessionId
    const sessionId = String(event.sessionId || '').trim();
    if (sessionId && sessionId !== 'unknown') {
      this.pushToBoundedMap(this.sessionInteractions, sessionId, signal);
    }

    // 2. Record for verified auth user or non-anon userId
    const targetUserId = authUserId || (event.userId && !event.userId.startsWith('anon:') && !event.userId.startsWith('session:') ? event.userId : null);
    if (targetUserId) {
      this.pushToBoundedMap(this.userInteractions, targetUserId, signal);
    }
  }

  private pushToBoundedMap(map: Map<string, InteractionSignal[]>, key: string, signal: InteractionSignal) {
    let list = map.get(key);
    if (!list) {
      if (map.size >= this.MAX_TRACKED_ENTITIES) {
        const oldest = map.keys().next().value;
        if (oldest) map.delete(oldest);
      }
      list = [];
      map.set(key, list);
    }
    const existingIdx = list.findIndex((s) => s.movieId === signal.movieId);
    if (existingIdx >= 0) {
      const existing = list[existingIdx];
      list[existingIdx] = {
        movieId: signal.movieId,
        eventType: signal.weight >= existing.weight ? signal.eventType : existing.eventType,
        timestamp: Math.max(signal.timestamp, existing.timestamp),
        weight: Math.max(signal.weight, existing.weight),
      };
    } else {
      list.unshift(signal);
    }
    if (list.length > this.MAX_EVENTS_PER_ENTITY) {
      list.length = this.MAX_EVENTS_PER_ENTITY;
    }
  }

  /**
   * Retrieves recent interaction signals for anonymous session or verified user.
   * Provides immediate zero-latency (<1ms) bridge before/during Kafka-Tinybird ingestion.
   */
  getRecentInteractions(opts: { sessionId?: string | null; userId?: string | null; limit?: number }): InteractionSignal[] {
    const limit = Math.max(1, Math.min(50, opts.limit || 20));
    const results: InteractionSignal[] = [];
    const seen = new Set<string>();

    if (opts.userId) {
      const userList = this.userInteractions.get(opts.userId) || [];
      for (const s of userList) {
        if (!seen.has(s.movieId)) {
          seen.add(s.movieId);
          results.push(s);
        }
      }
    }

    if (opts.sessionId) {
      const sessList = this.sessionInteractions.get(opts.sessionId) || [];
      for (const s of sessList) {
        if (!seen.has(s.movieId)) {
          seen.add(s.movieId);
          results.push(s);
        }
      }
    }

    results.sort((a, b) => b.timestamp - a.timestamp);
    return results.slice(0, limit);
  }

  async processSingleEvent(dto: CreateEventDto, clientIp?: string, userAgent?: string, authUserId?: string) {
    const event = this.enrichEvent(dto, clientIp, userAgent, authUserId);
    // Record into recent interaction store for instant recommendation responsiveness
    this.recordRecentInteraction(event, authUserId);

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
    for (const event of enrichedEvents) {
      this.recordRecentInteraction(event, authUserId);
    }

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
