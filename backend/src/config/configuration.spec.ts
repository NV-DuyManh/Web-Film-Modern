import configuration from './configuration';

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should parse escaped KAFKA_CA_PEM correctly', () => {
    process.env.KAFKA_CA_PEM = '-----BEGIN CERTIFICATE-----\\nMII...\\n-----END CERTIFICATE-----';
    const config = configuration();
    expect(config.kafka.caPem).toBe('-----BEGIN CERTIFICATE-----\nMII...\n-----END CERTIFICATE-----');
  });

  it('should throw error in production if KAFKA_CA_PEM is missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgres://fake';
    process.env.KAFKA_BROKERS = 'fake:9092';
    process.env.KAFKA_USERNAME = 'user';
    process.env.KAFKA_PASSWORD = 'password';
    process.env.KAFKA_TOPIC_BEHAVIOR = 'mfilm.behavior.v1';
    delete process.env.KAFKA_CA_PEM;
    
    expect(() => configuration()).toThrow('Production requires KAFKA_CA_PEM for secure TLS certificate validation.');
  });

  it('should pass production validation with all required Kafka config', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgres://fake';
    process.env.KAFKA_BROKERS = 'fake:9092';
    process.env.KAFKA_USERNAME = 'user';
    process.env.KAFKA_PASSWORD = 'password';
    process.env.KAFKA_CA_PEM = 'cert';
    process.env.KAFKA_TOPIC_BEHAVIOR = 'mfilm.behavior.v1';
    process.env.KAFKA_SASL_MECHANISM = 'scram-sha-256';

    expect(() => configuration()).not.toThrow();
  });
});
