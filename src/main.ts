import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { join } from 'path';
import { AppModule } from './app.module.js';
import { MAIL_QUEUE } from './mail/mail.events.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const configService = app.get(ConfigService);

  app.connectMicroservice({
    transport: Transport.GRPC,
    options: {
      package: 'common',
      protoPath: join(import.meta.dirname, './proto/common.proto'),
      url: configService.getOrThrow<string>('grpcUrl'),
      loader: { keepCase: true },
    },
  });

  // listens for "send this email" events from the other services
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow<string>('rabbitmq.url')],
      queue: MAIL_QUEUE,
      noAck: false, // acknowledge only after the email was sent
      queueOptions: { durable: true },
    },
  });

  const config = new DocumentBuilder()
    .setTitle('Common API')
    .setDescription('Shared services (file uploads, emails)')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

  await app.startAllMicroservices();
     app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });
  // Health check: answered by the HTTP adapter itself, so no auth guard or response wrapper is involved.
  app.getHttpAdapter().get('/health', (_req: any, res: any) =>
    res.status(200).json({ status: 'ok', service: 'common-service', uptime: Math.round(process.uptime()) }),
  );

  // Graceful shutdown: on SIGTERM / SIGINT the app stops taking requests, closes the gRPC and
  // RabbitMQ listeners, and lets the database / Redis connections close before the process exits.
  app.enableShutdownHooks();

  await app.listen(configService.getOrThrow<number>('port'));
}
await bootstrap();
