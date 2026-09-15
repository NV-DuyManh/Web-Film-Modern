import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EventType {
  SEARCH = 'search',
  MOVIE_VIEW = 'movie_view',
  PLAY = 'play',
  PAUSE = 'pause',
  SEEK = 'seek',
  WATCH_PROGRESS = 'watch_progress',
  COMPLETE = 'complete',
  FAVORITE = 'favorite',
  RATING = 'rating',
  COMMENT = 'comment',
  RECOMMENDATION_VIEW = 'recommendation_view',
  RECOMMENDATION_CLICK = 'recommendation_click',
  BUFFER_START = 'buffer_start',
  BUFFER_END = 'buffer_end',
}

export class CreateEventDto {
  @ApiPropertyOptional({ description: 'Unique Event ID (UUIDv4). Auto-generated if not provided.', example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiProperty({ description: 'Event category type', enum: EventType, example: EventType.PLAY })
  @IsEnum(EventType, { message: `eventType must be one of: ${Object.values(EventType).join(', ')}` })
  eventType: EventType;

  @ApiPropertyOptional({ description: 'Event schema version', example: '1', default: '1' })
  @IsOptional()
  @IsString()
  @IsIn(['1'], { message: 'eventVersion must be "1"' })
  eventVersion?: string = '1';

  @ApiPropertyOptional({ description: 'Client timestamp when event occurred (ISO string or epoch ms)', example: '2026-09-13T06:30:00.000Z' })
  @IsOptional()
  occurredAt?: string | number;

  @ApiPropertyOptional({ description: 'User ID if authenticated', example: 'usr_abc123' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Anonymous browser identifier', example: 'anon_abc123' })
  @IsOptional()
  @IsString()
  anonymousId?: string;

  @ApiProperty({ description: 'Client session ID', example: 'sess_998877' })
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @ApiPropertyOptional({ description: 'Device type', example: 'desktop' })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({ description: 'Platform', example: 'web' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiProperty({ description: 'Target Movie ID or Slug', example: 'dao-hai-tac-one-piece' })
  @IsNotEmpty()
  @IsString()
  movieId: string;

  @ApiPropertyOptional({ description: 'Target Episode ID if applicable', example: 'ep_01' })
  @IsOptional()
  @IsString()
  episodeId?: string;

  @ApiPropertyOptional({ description: 'Arbitrary event metadata (e.g. progress, query, rating, duration)', example: { progress: 120, duration: 1420 } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any> = {};
}
