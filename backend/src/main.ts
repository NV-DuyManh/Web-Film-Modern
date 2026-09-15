import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 4000;
  const globalPrefix = configService.get<string>('globalPrefix') || 'api/v1';
  const nodeEnv = configService.get<string>('nodeEnv') || 'development';
  const corsOrigins = configService.get<string[]>('corsOrigins') || ['*'];

  // Global Prefix
  app.setGlobalPrefix(globalPrefix);

  // Security Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI to render correctly
    }),
  );

  // Payload size constraints (defensive against memory attacks on free tier)
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  // CORS Configuration
  app.enableCors({
    origin: corsOrigins.length === 1 && corsOrigins[0] === '*' ? '*' : corsOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation (Can be enabled or disabled per environment)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MFILM Cloud-First Big Data & Streaming API')
    .setDescription('Enterprise Streaming Event Collector, Real-time Ingestion & Business Services ($0 Free Tier)')
    .setVersion('1.5')
    .addTag('Health', 'System status and connection monitors')
    .addTag('Streaming Events', 'High-throughput real-time event ingestion')
    .addTag('Observability', 'Prometheus and Grafana Cloud metrics')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 MFILM Backend running in [${nodeEnv.toUpperCase()}] on port ${port}`);
  logger.log(`🔗 API Base: http://localhost:${port}/${globalPrefix}`);
  logger.log(`📚 Swagger Docs: http://localhost:${port}/docs`);
}

bootstrap();
