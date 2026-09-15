import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry = new client.Registry();

  public readonly httpRequestsTotal: client.Counter;
  public readonly httpRequestDuration: client.Histogram;
  public readonly eventIngestionTotal: client.Counter;
  public readonly eventIngestionFailedTotal: client.Counter;
  public readonly kafkaPublishTotal: client.Counter;
  public readonly kafkaPublishFailedTotal: client.Counter;
  public readonly kafkaPublishLatency: client.Histogram;

  constructor() {
    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests processed',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Histogram of HTTP request durations in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
      registers: [this.registry],
    });

    this.eventIngestionTotal = new client.Counter({
      name: 'event_ingestion_total',
      help: 'Total number of streaming events ingested',
      labelNames: ['event_type'],
      registers: [this.registry],
    });

    this.eventIngestionFailedTotal = new client.Counter({
      name: 'event_ingestion_failed_total',
      help: 'Total number of failed streaming events',
      labelNames: ['event_type', 'reason'],
      registers: [this.registry],
    });

    this.kafkaPublishTotal = new client.Counter({
      name: 'kafka_publish_total',
      help: 'Total messages published to Kafka',
      labelNames: ['topic'],
      registers: [this.registry],
    });

    this.kafkaPublishFailedTotal = new client.Counter({
      name: 'kafka_publish_failed_total',
      help: 'Total messages that failed publishing to Kafka',
      labelNames: ['topic'],
      registers: [this.registry],
    });

    this.kafkaPublishLatency = new client.Histogram({
      name: 'kafka_publish_latency_ms',
      help: 'Latency of publishing to Kafka broker in milliseconds',
      labelNames: ['topic'],
      buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
      registers: [this.registry],
    });
  }

  onModuleInit() {
    client.collectDefaultMetrics({ register: this.registry, prefix: 'mfilm_' });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
