import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mail } from './mail.templates.js';

// The only place in the system that talks to the mail server.
// Uses Brevo's HTTP API instead of SMTP: Render blocks outbound SMTP ports (25/465/587)
// on its free tier, so a socket-based mailer like nodemailer times out there. Unlike
// Resend, Brevo lets a verified sender address (no owned domain needed) mail anyone.
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('brevo.apiKey');
    this.fromEmail = this.configService.getOrThrow<string>('brevo.fromEmail');
    this.fromName = this.configService.get<string>('brevo.fromName')!;
  }

  async send(to: string, mail: Mail) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': this.apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: this.fromEmail, name: this.fromName },
        to: [{ email: to }],
        subject: mail.subject,
        textContent: mail.text,
        htmlContent: mail.html,
      }),
    });
    if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
    this.logger.log(`sent "${mail.subject}" to ${to}`);
  }
}
