import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration.js';
import { UploadModule } from './upload/upload.module.js';
import { MailModule } from './mail/mail.module.js';
import { ErrorInterceptor } from './Interceptors/error.interceptors.js';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    UploadModule,
    MailModule,
  ],
  // errors are answered as { success: false, error: { code, message } }, like the other services
  providers: [{ provide: APP_INTERCEPTOR, useClass: ErrorInterceptor }],
})
export class AppModule {}
