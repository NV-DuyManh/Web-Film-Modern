import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventService } from './event.service';
import { KafkaService } from '../kafka/kafka.service';
import { EventType } from './dto/create-event.dto';

describe('EventService', () => {
  let service: EventService;
  let kafkaService: Partial<KafkaService>;

  beforeEach(async () => {
    kafkaService = {
      produceEvent: jest.fn().mockResolvedValue([]),
      produceBatch: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: KafkaService,
          useValue: kafkaService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mfilm.streaming.events'),
          },
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('A. authenticated event: trusted auth user -> userId populated', () => {
    const enriched = service.enrichEvent(
      {
        eventType: EventType.PLAY,
        sessionId: 'sess_1',
        movieId: 'm_1',
      },
      '127.0.0.1',
      'Mozilla/5.0',
      'auth_user_123'
    );
    expect(enriched.userId).toBe('auth_user_123');
    expect(enriched.eventVersion).toBe('1');
  });

  it('B. anonymous event: userId populated from anonymous identifier', () => {
    const enriched = service.enrichEvent(
      {
        eventType: EventType.PLAY,
        anonymousId: 'anon_abc',
        sessionId: 'sess_1',
        movieId: 'm_1',
      },
      '127.0.0.1'
    );
    expect(enriched.userId).toBe('anon:anon_abc');
    expect(enriched.eventVersion).toBe('1');
  });

  it('C. anonymous event with sessionId only: safe non-null fallback', () => {
    const enriched = service.enrichEvent(
      {
        eventType: EventType.PLAY,
        sessionId: 'sess_fallback',
        movieId: 'm_1',
      }
    );
    expect(enriched.userId).toBe('session:sess_fallback');
  });

  it('D. no PII leakage and H. metadata is stringified', () => {
    const enriched = service.enrichEvent(
      {
        eventType: EventType.PLAY,
        sessionId: 'sess_1',
        movieId: 'm_1',
        metadata: {
          progress: 10,
          password: 'secret_password',
          email: 'test@example.com'
        }
      }
    );
    expect(typeof enriched.metadata).toBe('string');
    const parsed = JSON.parse(enriched.metadata);
    expect(parsed.progress).toBe(10);
    expect(parsed.password).toBeUndefined();
    expect(parsed.email).toBeUndefined();
  });

  it('E. eventVersion remains "1"', () => {
    const enriched = service.enrichEvent({ eventType: EventType.PLAY, sessionId: 's', movieId: 'm' });
    expect(enriched.eventVersion).toBe('1');
  });

  it('F. processSingleEvent should process and call kafka produceEvent', async () => {
    const result = await service.processSingleEvent({
      eventType: EventType.WATCH_PROGRESS,
      userId: 'usr_test',
      sessionId: 'sess_test',
      movieId: 'movie_123',
      metadata: { progress: 45 },
    });

    expect(result.success).toBe(true);
    expect(kafkaService.produceEvent).toHaveBeenCalledTimes(1);
  });

  it('G. should throw ServiceUnavailableException if kafka fails', async () => {
    kafkaService.produceEvent = jest.fn().mockRejectedValue(new Error('Kafka down'));

    await expect(
      service.processSingleEvent({
        eventType: EventType.PLAY,
        userId: 'usr_test',
        sessionId: 'sess_test',
        movieId: 'movie_123',
      }),
    ).rejects.toThrow('Telemetry bus unavailable');
  });
});
