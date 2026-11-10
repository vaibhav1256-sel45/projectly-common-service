import type { OtpMailPayload, ProjectAcceptedMailPayload, ProjectDeletedMailPayload, ProjectInvitationMailPayload, ProjectRemovedMailPayload, TaskMentionMailPayload, TaskUpdatedMailPayload } from './mail.events.js';

export interface Mail {
  subject: string;
  text: string;
  html: string;
}

// names and project titles are typed by users, so they are escaped before going into HTML
const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// One look for every email, matching the app: ink header with the lime mark, white card on warm paper.
// Tables and inline styles, so it renders the same in Gmail and Outlook.
const C = { paper: '#f4f3ee', card: '#ffffff', ink: '#111214', text: '#3d3e44', muted: '#74757c', line: '#e6e5df', lime: '#c6f432', limeEdge: '#9bce12', limeSoft: '#edf7d4', soft: '#f8f7f3' };
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "'SFMono-Regular',Menlo,Consolas,monospace";

const strong = (value: unknown) => `<strong style="color:${C.ink};">${esc(value)}</strong>`;

const layout = (o: { preview: string; eyebrow: string; heading: string; body: string; button?: { label: string; url: string } }) => `<!doctype html>
<html><body style="margin:0;padding:0;background:${C.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(o.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper};padding:32px 12px;font-family:${FONT};">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${C.card};border:1px solid ${C.line};border-radius:16px;overflow:hidden;">
    <tr><td style="background:${C.ink};padding:18px 28px;">
      <span style="display:inline-block;width:22px;height:22px;border-radius:6px;background:${C.lime};vertical-align:middle;"></span>
      <span style="margin-left:9px;font-size:17px;font-weight:700;color:#ffffff;vertical-align:middle;letter-spacing:-0.3px;">Projectly</span>
    </td></tr>
    <tr><td style="padding:28px 28px 30px;">
      <p style="margin:0 0 10px;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};">${esc(o.eyebrow)}</p>
      <h1 style="margin:0 0 14px;font-size:23px;line-height:1.25;color:${C.ink};letter-spacing:-0.4px;">${esc(o.heading)}</h1>
      <div style="font-size:15px;line-height:1.65;color:${C.text};">${o.body}</div>
      ${o.button ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr><td style="background:${C.ink};border-radius:10px;">
        <a href="${esc(o.button.url)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${esc(o.button.label)} &rarr;</a>
      </td></tr></table>` : ''}
    </td></tr>
  </table>
  <p style="max-width:520px;margin:16px auto 0;font-size:12px;line-height:1.5;color:${C.muted};text-align:center;">You're receiving this because of activity on your Projectly account.</p>
</td></tr>
</table>
</body></html>`;

// a highlighted block for codes, quotes and lists of changes; lime when it holds the point of the email
const panel = (inner: string, accent = false) =>
  `<div style="margin:16px 0 0;padding:14px 16px;background:${accent ? C.limeSoft : C.soft};border:1px solid ${C.line};border-left:3px solid ${accent ? C.limeEdge : C.ink};border-radius:10px;">${inner}</div>`;

export const otpMail = ({ name, otp, expiresInMinutes }: OtpMailPayload): Mail => ({
  subject: `${otp} is your Projectly login code`,
  text: `Hi ${name},\n\nYour Projectly login code is ${otp}. It expires in ${expiresInMinutes} minutes.\n\nIf you didn't try to log in, you can ignore this email; your account is safe.\n`,
  html: layout({
    preview: `Your login code is ${otp}`,
    eyebrow: 'Login code',
    heading: 'Here is your login code',
    body: `<p style="margin:0;">Hi ${esc(name)}, enter this code to finish logging in:</p>
      ${panel(`<p style="margin:0;font-family:${MONO};font-size:32px;font-weight:700;letter-spacing:10px;color:${C.ink};">${esc(otp)}</p>`, true)}
      <p style="margin:16px 0 0;">It expires in ${esc(expiresInMinutes)} minutes and works only once. If you didn't try to log in, you can ignore this email; your account is safe.</p>`,
  }),
});

// What each role can do, in the words the invitation uses
const ROLE_ACCESS: Record<string, string> = {
  Viewer: 'see the board, tasks and dashboard',
  Editor: 'create and edit tasks, comment and add files',
  Deletor: 'see everything, cancel tasks and remove files',
  Admin: 'do everything, including managing the team',
};

export const projectInvitationMail = ({ name, projectName, inviterName, role = 'Editor' }: ProjectInvitationMailPayload, appUrl: string): Mail => {
  const access = ROLE_ACCESS[role] ?? ROLE_ACCESS.Viewer;
  return {
    subject: `${inviterName} invited you to "${projectName}"`,
    text: `Hi ${name},\n\n${inviterName} invited you to join "${projectName}" on Projectly as ${role}. As ${role} you can ${access}.\n\nLog in to accept or decline the invitation: ${appUrl}\n`,
    html: layout({
      preview: `Join ${projectName} as ${role}`,
      eyebrow: 'Project invitation',
      heading: `Join ${projectName}`,
      body: `<p style="margin:0;">Hi ${esc(name)}, ${strong(inviterName)} invited you to work on ${strong(projectName)}.</p>
        ${panel(`<p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};">Your role</p>
          <p style="margin:4px 0 0;font-size:17px;font-weight:700;color:${C.ink};">${esc(role)}</p>
          <p style="margin:4px 0 0;">You'll be able to ${esc(access)}.</p>`, true)}
        <p style="margin:16px 0 0;">Log in to accept or decline. The invitation is at the top of your projects.</p>`,
      button: { label: 'View invitation', url: appUrl },
    }),
  };
};

export const projectRemovedMail = ({ name, projectName }: ProjectRemovedMailPayload): Mail => ({
  subject: `You no longer have access to "${projectName}"`,
  text: `Hi ${name},\n\nYou were removed from the project "${projectName}", so it no longer appears in your projects. If you think this is a mistake, ask the project owner to invite you again.\n`,
  html: layout({
    preview: `You were removed from ${projectName}`,
    eyebrow: 'Project access',
    heading: `You were removed from ${projectName}`,
    body: `<p style="margin:0;">Hi ${esc(name)}, you no longer have access to ${strong(projectName)}, so it won't appear in your projects anymore.</p>
      <p style="margin:12px 0 0;">If you think this is a mistake, ask the project owner to invite you again.</p>`,
  }),
});

export const projectDeletedMail = ({ name, projectName, deletedBy }: ProjectDeletedMailPayload): Mail => ({
  subject: `"${projectName}" was deleted`,
  text: `Hi ${name},\n\n${deletedBy ? `${deletedBy} deleted the project "${projectName}".` : `The project "${projectName}" was deleted.`} Its open tasks were cancelled and it can no longer be opened.\n`,
  html: layout({
    preview: `${projectName} was deleted`,
    eyebrow: 'Project deleted',
    heading: `${projectName} was deleted`,
    body: `<p style="margin:0;">Hi ${esc(name)}, ${deletedBy ? `${strong(deletedBy)} deleted the project ${strong(projectName)}.` : `the project ${strong(projectName)} was deleted.`}</p>
      <p style="margin:12px 0 0;">Its open tasks were cancelled and the project can no longer be opened.</p>`,
  }),
});

// Sent to the project owner when someone answers their invitation: one template for accept and decline
export const invitationResponseMail = (data: ProjectAcceptedMailPayload): Mail => {
  const { name, projectName, acceptedBy: memberName, accepted, appUrl } = data;
  const verb = accepted ? 'accepted' : 'declined';
  const next = accepted ? "They're now on the team and can be assigned tasks." : 'You can invite someone else from the project settings.';
  return {
    subject: `${memberName} ${verb} your invitation to "${projectName}"`,
    text: `Hi ${name},\n\n${memberName} ${verb} your invitation to "${projectName}". ${next}\n${accepted && appUrl ? `\nOpen the project: ${appUrl}\n` : ''}`,
    html: layout({
      preview: `${memberName} ${verb} your invitation`,
      eyebrow: accepted ? 'New team member' : 'Invitation declined',
      heading: accepted ? `${memberName} joined ${projectName}` : `${memberName} won't be joining`,
      body: `<p style="margin:0;">Hi ${esc(name)}, ${strong(memberName)} ${verb} your invitation to ${strong(projectName)}.</p>
        <p style="margin:12px 0 0;">${next}</p>`,
      button: accepted && appUrl ? { label: 'Open project', url: appUrl } : undefined,
    }),
  };
};

export const taskUpdatedMail = ({ name, taskTitle, updatedBy, changes, appUrl }: TaskUpdatedMailPayload): Mail => ({
  subject: `${updatedBy} updated "${taskTitle}"`,
  text: `Hi ${name},\n\n${updatedBy} made changes to your task "${taskTitle}":\n${changes.map((c) => `- ${c}`).join('\n')}\n\nOpen the task: ${appUrl}\n`,
  html: layout({
    preview: `${changes.length} change${changes.length === 1 ? '' : 's'} on ${taskTitle}`,
    eyebrow: 'Task updated',
    heading: taskTitle,
    body: `<p style="margin:0;">Hi ${esc(name)}, ${strong(updatedBy)} made changes to a task assigned to you:</p>
      ${panel(changes.map((c, i) => `<p style="margin:${i ? '8px' : '0'} 0 0;">${esc(c)}</p>`).join(''))}`,
    button: { label: 'Open task', url: appUrl },
  }),
});

export const taskMentionMail = ({ name, taskTitle, mentionedBy, where, excerpt, appUrl }: TaskMentionMailPayload): Mail => {
  const place = where === 'comment' ? 'a comment on' : 'the description of';
  const quote = excerpt.length > 240 ? `${excerpt.slice(0, 240)}…` : excerpt;
  return {
    subject: `${mentionedBy} mentioned you in "${taskTitle}"`,
    text: `Hi ${name},\n\n${mentionedBy} mentioned you in ${place} "${taskTitle}":\n\n"${quote}"\n\nOpen the task: ${appUrl}\n`,
    html: layout({
      preview: `${mentionedBy}: ${quote.slice(0, 80)}`,
      eyebrow: 'You were mentioned',
      heading: taskTitle,
      body: `<p style="margin:0;">Hi ${esc(name)}, ${strong(mentionedBy)} mentioned you in ${place} this task:</p>
        ${panel(`<p style="margin:0;white-space:pre-wrap;color:${C.ink};">${esc(quote)}</p>`, true)}`,
      button: { label: where === 'comment' ? 'Reply in the task' : 'Open task', url: appUrl },
    }),
  };
};
