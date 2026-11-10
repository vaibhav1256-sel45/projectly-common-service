import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import { Mail } from './mail.templates.js';

// The only place in the system that talks to the mail server.
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: Transporter;
  private readonly from?: string;

  constructor(private readonly configService: ConfigService) {
    this.from = this.configService.get<string>('email.user');
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: this.from, pass: this.configService.get<string>('email.password') },
    });
  }

  async send(to: string, mail: Mail) {
    await this.transporter.sendMail({ from: this.from, to, subject: mail.subject, text: mail.text, html: mail.html });
    this.logger.log(`sent "${mail.subject}" to ${to}`);
  }
}
