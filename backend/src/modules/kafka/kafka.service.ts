import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Admin, logLevel, RecordMetadata, SASLOptions } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private admin: Admin;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const kafkaConfig = this.configService.get('kafka');

    let saslConfig: SASLOptions | undefined = undefined;
    if (kafkaConfig.username && kafkaConfig.password) {
      this.logger.log(`Configuring Kafka SASL authentication (${kafkaConfig.saslMechanism}) for cloud broker`);
      saslConfig = {
        mechanism: kafkaConfig.saslMechanism || 'scram-sha-256',
        username: kafkaConfig.username,
        password: kafkaConfig.password,
      } as SASLOptions;
    }

    this.kafka = new Kafka({
      clientId: kafkaConfig.clientId,
      brokers: kafkaConfig.brokers,
      ssl: kafkaConfig.ssl 
        ? { 
            rejectUnauthorized: true, 
            ca: kafkaConfig.caPem ? [kafkaConfig.caPem] : undefined 
          } 
        : false,
      sasl: saslConfig,
      logLevel: logLevel.WARN,
      retry: {
        initialRetryTime: 300,
        retries: 5,
      },
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      idempotent: false,
    });

    this.admin = this.kafka.admin();

    this.connect().catch((err) => {
      this.logger.warn(`Initial Kafka connection warning: ${err.message}. Producer will retry when broker is ready.`);
    });
  }

  async connect() {
    if (this.isConnected) return;
    try {
      await this.producer.connect();
      await this.admin.connect();
      this.isConnected = true;
      const kafkaConfig = this.configService.get('kafka');
      this.logger.log(`Connected successfully to Kafka at ${kafkaConfig.brokers.join(', ')}`);

      // Ensure topics exist with configurable partition count (e.g. 2 for Aiven Free)
      const topicBehavior = kafkaConfig.topicBehavior || 'mfilm.behavior.v1';
      const topicDlq = kafkaConfig.topicDlq || 'mfilm.behavior.dlq';
      const partitions = kafkaConfig.partitions || 2;

      const topics = await this.admin.listTopics();
      const topicsToCreate = [];

      if (!topics.includes(topicBehavior)) {
        topicsToCreate.push({
          topic: topicBehavior,
          numPartitions: partitions,
          replicationFactor: 1,
        });
      }
      if (!topics.includes(topicDlq)) {
        topicsToCreate.push({
          topic: topicDlq,
          numPartitions: 1,
          replicationFactor: 1,
        });
      }

      if (topicsToCreate.length > 0) {
        await this.admin.createTopics({ topics: topicsToCreate });
        this.logger.log(`Created Kafka topics: ${topicsToCreate.map((t) => `${t.topic} (${t.numPartitions}p)`).join(', ')}`);
      }
    } catch (err: any) {
      this.isConnected = false;
      throw err;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.producer) await this.producer.disconnect();
      if (this.admin) await this.admin.disconnect();
      this.logger.log('Kafka producer and admin disconnected.');
    } catch (err: any) {
      this.logger.warn(`Error during Kafka disconnect: ${err.message}`);
    }
  }

  async produceEvent(topic: string, key: string, payload: any): Promise<RecordMetadata[]> {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.producer.send({
      topic,
      messages: [
        {
          key,
          value: typeof payload === 'string' ? payload : JSON.stringify(payload),
          timestamp: payload.occurredAt ? new Date(payload.occurredAt).getTime().toString() : Date.now().toString(),
        },
      ],
    });
  }

  async produceBatch(topic: string, messages: Array<{ key: string; value: any }>): Promise<RecordMetadata[]> {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.producer.send({
      topic,
      messages: messages.map((m) => ({
        key: m.key,
        value: typeof m.value === 'string' ? m.value : JSON.stringify(m.value),
        timestamp: m.value.occurredAt ? new Date(m.value.occurredAt).getTime().toString() : Date.now().toString(),
      })),
    });
  }

  async isHealthy(): Promise<{ status: string; latencyMs?: number; error?: string }> {
    const start = Date.now();
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      await this.admin.listTopics();
      return { status: 'healthy', latencyMs: Date.now() - start };
    } catch (err: any) {
      return { status: 'unhealthy', error: err.message };
    }
  }
}
