export interface AppConfig {
  port: number;
  nodeEnv: string;
  globalPrefix: string;
  corsOrigins: string[];
  database: {
    url?: string;
    ssl: boolean;
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  redis: {
    enabled: boolean;
    url?: string;
    tls: boolean;
    keyPrefix: string;
    host: string;
    port: number;
    password: string;
  };
  kafka: {
    brokers: string[];
    clientId: string;
    username?: string;
    password?: string;
    caPem?: string;
    ssl: boolean;
    saslMechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    partitions: number;
    topicBehavior: string;
    topicDlq: string;
    topicCatalog: string;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  ai: {
    geminiKeys: string[];
    groqKeys: string[];
  };
  firebase: {
    projectId: string;
    clientEmail?: string;
    privateKey?: string;
  };
  tinybird: {
    apiUrl: string;
    token?: string;
    dailyBudgetLimit: number;
  };
}


export default (): AppConfig => {
  const isProd = process.env.NODE_ENV === 'production';

  const config: AppConfig = {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    globalPrefix: process.env.GLOBAL_PREFIX || 'api/v1',
    corsOrigins: (process.env.CORS_ORIGINS || 'https://mfilm.online,https://www.mfilm.online,https://web-film-modern.vercel.app,http://localhost:5173')
      .split(',')
      .map((s) => s.trim()),
    database: {
      url: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' || (isProd && !!process.env.DATABASE_URL),
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433', 10),
      user: process.env.DB_USER || 'mfilm_user',
      password: process.env.DB_PASSWORD || 'mfilm_password',
      name: process.env.DB_NAME || 'mfilm_db',
    },
    redis: {
      enabled: process.env.VALKEY_ENABLED === 'true',
      url: process.env.VALKEY_URL || process.env.REDIS_URL,
      tls: process.env.REDIS_TLS === 'true' || Boolean(process.env.VALKEY_URL?.startsWith('rediss://')),
      keyPrefix: 'mfilm:',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380', 10),
      password: process.env.REDIS_PASSWORD || 'mfilm_redis_password',
    },
    kafka: {
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9094').split(',').map((b) => b.trim()),
      clientId: process.env.KAFKA_CLIENT_ID || 'mfilm-backend-collector',
      username: process.env.KAFKA_USERNAME,
      password: process.env.KAFKA_PASSWORD,
      caPem: process.env.KAFKA_CA_PEM ? process.env.KAFKA_CA_PEM.replace(/\\n/g, '\n') : undefined,
      ssl: process.env.KAFKA_SSL === 'true' || Boolean(process.env.KAFKA_PASSWORD),
      saslMechanism: ((process.env.KAFKA_SASL_MECHANISM || 'scram-sha-256').toLowerCase()) as any,
      partitions: parseInt(process.env.KAFKA_PARTITIONS || '2', 10),
      topicBehavior: process.env.KAFKA_TOPIC_BEHAVIOR || process.env.KAFKA_TOPIC_EVENTS || 'mfilm.behavior.v1',
      topicDlq: process.env.KAFKA_TOPIC_DLQ || 'mfilm.behavior.dlq',
      topicCatalog: process.env.KAFKA_TOPIC_CATALOG || 'mfilm.catalog.v1',
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dlk5mfjtc',
      apiKey: process.env.CLOUDINARY_API_KEY || '869215743412731',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
    ai: {
      geminiKeys: (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
        .split(',')
        .map((k) => k.trim().replace(/[\r\n\\"]/g, ''))
        .filter(Boolean),
      groqKeys: (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '')
        .split(',')
        .map((k) => k.trim().replace(/[\r\n\\"]/g, ''))
        .filter(Boolean),
    },
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID || 'manhfilm-105b3',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    },
    tinybird: {
      apiUrl: process.env.TINYBIRD_API_URL || 'https://api.tinybird.co',
      token: process.env.TINYBIRD_TOKEN,
      dailyBudgetLimit: parseInt(process.env.TINYBIRD_DAILY_BUDGET || '800', 10),
    },
  };

  // Fail-fast validation for production environments
  if (isProd) {
    if (!config.database.url && !config.database.host) {
      throw new Error('[Configuration Error] Production requires either DATABASE_URL or DB_HOST to be set.');
    }
    if (!config.kafka.brokers || config.kafka.brokers.length === 0) {
      throw new Error('[Configuration Error] Production requires KAFKA_BROKERS to be defined.');
    }
    if (!config.kafka.username || !config.kafka.password) {
      throw new Error('[Configuration Error] Production requires KAFKA_USERNAME and KAFKA_PASSWORD for SASL_SSL authentication.');
    }
    if (!config.kafka.caPem) {
      throw new Error('[Configuration Error] Production requires KAFKA_CA_PEM for secure TLS certificate validation.');
    }
    if (config.kafka.saslMechanism !== 'scram-sha-256') {
      throw new Error('[Configuration Error] Production requires KAFKA_SASL_MECHANISM to be scram-sha-256.');
    }
    if (config.kafka.topicBehavior !== 'mfilm.behavior.v1') {
      throw new Error('[Configuration Error] Production KAFKA_TOPIC_BEHAVIOR must be exactly mfilm.behavior.v1');
    }
  }

  return config;
};
