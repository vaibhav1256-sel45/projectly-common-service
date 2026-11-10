import { Module } from '@nestjs/common';
import { MailController } from './mail.controller.js';
import { MailerService } from './mailer.service.js';

@Module({
  controllers: [MailController],
  providers: [MailerService],
})
export class MailModule {}
