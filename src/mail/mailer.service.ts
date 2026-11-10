import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { Mail } from './mail.templates.js';

// The only place in the system that talks to the mail server.
// Uses Resend's HTTP API instead of SMTP: Render blocks outbound SMTP ports (25/465/587)
// on its free tier, so a socket-based mailer like nodemailer times out there.
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.getOrThrow<string>('resend.apiKey'));
    this.from = this.configService.get<string>('resend.from')!;
  }

  async send(to: string, mail: Mail) {
    const { error } = await this.resend.emails.send({ from: this.from, to, subject: mail.subject, text: mail.text, html: mail.html });
    if (error) throw new Error(error.message);
    this.logger.log(`sent "${mail.subject}" to ${to}`);
  }
}
