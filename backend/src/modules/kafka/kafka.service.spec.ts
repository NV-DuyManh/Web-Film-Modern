import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from './kafka.service';
import { ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';

jest.mock('kafkajs', () => {
  return {
    Kafka: jest.fn().mockImplementation(() => {
      return {
        producer: jest.fn().mockReturnValue({
          connect: jest.fn(),
          send: jest.fn(),
          disconnect: jest.fn(),
        }),
        admin: jest.fn().mockReturnValue({
          connect: jest.fn(),
          listTopics: jest.fn().mockResolvedValue([]),
          createTopics: jest.fn(),
          disconnect: jest.fn(),
        }),
      };
    }),
    logLevel: { WARN: 4 },
  };
});

describe('KafkaService', () => {
  let service: KafkaService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'kafka') {
                return {
                  clientId: 'test-client',
                  brokers: ['fake-broker:9092'],
                  ssl: true,
                  caPem: 'fake-cert',
                  username: 'testuser',
                  password: 'testpassword',
                  saslMechanism: 'scram-sha-256',
                  partitions: 1,
                  topicBehavior: 'mfilm.behavior.v1',
                  topicDlq: 'mfilm.behavior.dlq',
                  topicCatalog: 'mfilm.catalog.v1',
                };
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<KafkaService>(KafkaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should verify production TLS settings pass rejectUnauthorized: true', async () => {
    await service.onModuleInit();
    expect(Kafka).toHaveBeenCalledWith(expect.objectContaining({
      ssl: {
        rejectUnauthorized: true,
        ca: ['fake-cert'],
      },
    }));
  });

  it('should not log credentials', () => {
    const loggerSpy = jest.spyOn(service['logger'], 'log');
    service.onModuleInit();
    const calls = loggerSpy.mock.calls.map(c => c[0]);
    const hasPassword = calls.some(msg => msg.includes('testpassword'));
    expect(hasPassword).toBe(false);
  });
});
