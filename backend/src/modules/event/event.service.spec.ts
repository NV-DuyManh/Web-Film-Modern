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

  it('should enrich event with defaults and UUID', () => {
    const enriched = service.enrichEvent(
      {
        eventType: EventType.PLAY,
        userId: 'usr_1',
        sessionId: 'sess_1',
        movieId: 'm_1',
      },
      '127.0.0.1',
      'Mozilla/5.0',
    );

    expect(enriched.eventId).toBeDefined();
    expect(enriched.eventType).toBe(EventType.PLAY);
    expect(enriched.userId).toBe('usr_1');
    expect(enriched.clientIp).toBe('127.0.0.1');
    expect(enriched.userAgent).toBe('Mozilla/5.0');
    expect(enriched.receivedAt).toBeDefined();
  });

  it('should process single event and call kafka produceEvent', async () => {
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

  it('should throw ServiceUnavailableException if kafka fails', async () => {
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
