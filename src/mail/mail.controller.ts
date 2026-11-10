import { Controller, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { MAIL_EVENTS } from './mail.events.js';
import type { OtpMailPayload, ProjectInvitationMailPayload, ProjectRemovedMailPayload,ProjectDeletedMailPayload,ProjectAcceptedMailPayload,TaskMentionMailPayload,TaskUpdatedMailPayload } from './mail.events.js';
import { MailerService } from './mailer.service.js';
import { invitationResponseMail, otpMail, projectDeletedMail, projectInvitationMail, projectRemovedMail, taskMentionMail, taskUpdatedMail } from './mail.templates.js';

// Receives "send this email" events from RabbitMQ. Other services never talk to the mail server themselves.
@Controller()
export class MailController {
  private readonly logger = new Logger(MailController.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly configService: ConfigService,
  ) {}

  @EventPattern(MAIL_EVENTS.OTP)
  otp(@Payload() data: OtpMailPayload, @Ctx() context: any) {
    return this.handle(context, MAIL_EVENTS.OTP, () => this.mailer.send(data.email, otpMail(data)));
  }

  @EventPattern(MAIL_EVENTS.PROJECT_INVITATION)
  projectInvitation(@Payload() data: ProjectInvitationMailPayload, @Ctx() context: any) {
    const appUrl = this.configService.getOrThrow<string>('frontendUrl');
    return this.handle(context, MAIL_EVENTS.PROJECT_INVITATION, () =>
      this.mailer.send(data.email, projectInvitationMail(data, appUrl)),
    );
  }

  @EventPattern(MAIL_EVENTS.PROJECT_REMOVED)
  projectRemoved(@Payload() data: ProjectRemovedMailPayload, @Ctx() context: any) {
    return this.handle(context, MAIL_EVENTS.PROJECT_REMOVED, () =>
      this.mailer.send(data.email, projectRemovedMail(data)),
    );
  }
  @EventPattern(MAIL_EVENTS.PROJECT_DELETED)
  projectDeleted(@Payload() data: ProjectDeletedMailPayload, @Ctx() context: any) {
    return this.handle(context, MAIL_EVENTS.PROJECT_DELETED, () =>
      this.mailer.send(data.email, projectDeletedMail(data)),
    );
  }
    @EventPattern(MAIL_EVENTS.PROJECT_ACCEPTED)
  projectAccepted(@Payload() data:ProjectAcceptedMailPayload , @Ctx() context: any) {
    return this.handle(context, MAIL_EVENTS.PROJECT_ACCEPTED, () =>
      this.mailer.send(data.email, invitationResponseMail(data)),
    );
  }

  @EventPattern(MAIL_EVENTS.TASK_UPDATED)
  taskUpdated(@Payload() data: TaskUpdatedMailPayload, @Ctx() context: any) {
    return this.handle(context, MAIL_EVENTS.TASK_UPDATED, () => this.mailer.send(data.email, taskUpdatedMail(data)));
  }

  @EventPattern(MAIL_EVENTS.TASK_MENTION)
  taskMention(@Payload() data: TaskMentionMailPayload, @Ctx() context: any) {
    return this.handle(context, MAIL_EVENTS.TASK_MENTION, () => this.mailer.send(data.email, taskMentionMail(data)));
  }

  // The message is acknowledged only after the email went out. If sending fails it is dropped
  // (not put back), so one bad address can't block the queue; the error is logged.
  private async handle(context: RmqContext, event: string, send: () => Promise<void>) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      await send();
      channel.ack(message);
    } catch (error) {
      this.logger.error(`${event} failed: ${(error as Error).message}`);
      channel.nack(message, false, false);
    }
  }
}
