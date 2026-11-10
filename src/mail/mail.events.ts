// The queue and event names other services use to ask common-service to send an email.
// Publishers (user-service, project-service) use the same strings.
export const MAIL_QUEUE = 'mail_events';

export const MAIL_EVENTS = {
  OTP: 'mail.otp',
  PROJECT_INVITATION: 'mail.project-invitation',
  PROJECT_REMOVED: 'mail.project-removed',
  PROJECT_DELETED: 'mail.project-deleted',
  PROJECT_ACCEPTED: 'mail.project-accepted',
  TASK_UPDATED: 'mail.task-updated',
  TASK_MENTION: 'mail.task-mention',
} as const;

export interface OtpMailPayload {
  email: string;
  name: string;
  otp: string;
  expiresInMinutes: number;
}

export interface ProjectInvitationMailPayload {
  email: string;
  name: string;
  projectName: string;
  inviterName: string;
  role?: string; // Viewer, Editor, DELETOR or Admin
}

export interface ProjectRemovedMailPayload {
  email: string;
  name: string;
  projectName: string;
}

export interface ProjectDeletedMailPayload {
  email: string;
  name: string;
  projectName: string;
  deletedBy?: string; // not sent yet: the mail then says the project "was deleted"
}

export interface ProjectAcceptedMailPayload {
  email: string;
  name: string;
  projectName: string;
  acceptedBy: string;
  accepted: boolean;
  appUrl: string;
}

// Sent to the assignee when someone else changes (or assigns) their task
export interface TaskUpdatedMailPayload {
  email: string;
  name: string;
  taskTitle: string;
  updatedBy: string;
  changes: string[]; // one readable line per change, e.g. "Status: To Do -> In Progress"
  appUrl: string;
}

// Sent to a user who was @mentioned in a task description or comment
export interface TaskMentionMailPayload {
  email: string;
  name: string;
  taskTitle: string;
  mentionedBy: string;
  where: 'description' | 'comment';
  excerpt: string;
  appUrl: string;
}
