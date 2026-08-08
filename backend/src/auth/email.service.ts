import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/** Human-readable label for each role, shown as a badge in the invite email. */
const ROLE_LABEL: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  HR: 'HR',
  FINANCE: 'Finance',
  SALES: 'Sales',
  EMPLOYEE: 'Employee',
  VIEWER: 'Viewer',
};

/** Department phrasing for roles that map to a specific team (HR, Finance, Sales, etc). */
const ROLE_DEPARTMENT: Record<string, string> = {
  OWNER: 'Leadership',
  ADMIN: 'Admin',
  MANAGER: 'Management',
  HR: 'HR',
  FINANCE: 'Finance',
  SALES: 'Sales',
};

/**
 * Outbound transactional email via SendGrid's HTTP API.
 *
 * We use an HTTP API instead of SMTP because Railway (like most PaaS
 * providers on their free/hobby tiers) blocks outbound SMTP ports 465/587
 * entirely to prevent spam abuse - Gmail SMTP will always time out there,
 * no matter how the connection is configured. SendGrid sends over HTTPS
 * (port 443), which is never blocked.
 *
 * Setup: create a free SendGrid account, verify a "Single Sender" (just one
 * email address you own - no domain needed) under Settings -> Sender
 * Authentication, create an API key under Settings -> API Keys, then set
 * SENDGRID_API_KEY and SENDGRID_FROM_EMAIL (the verified sender address) in
 * the backend .env.
 *
 * If those aren't configured, emails are logged instead of sent so local
 * dev / signup never breaks.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private fromEmail: string | null = null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    const fromEmail = this.config.get<string>('SENDGRID_FROM_EMAIL');
    if (apiKey && fromEmail) {
      sgMail.setApiKey(apiKey);
      this.fromEmail = fromEmail;
      this.logger.log(`SendGrid configured - sending as ${fromEmail}`);
    } else {
      this.logger.warn('SENDGRID_API_KEY/SENDGRID_FROM_EMAIL not set - emails will be logged instead of sent');
    }
  }

  /** Returns true if the email was actually handed off to SendGrid successfully. */
  async send(payload: EmailPayload): Promise<boolean> {
    if (!this.fromEmail) {
      this.logger.warn(
        `SendGrid not configured - email NOT sent (to=${payload.to}, subject="${payload.subject}")`,
      );
      this.logger.debug(payload.html);
      return false;
    }

    try {
      await sgMail.send({
        to: payload.to,
        from: { email: this.fromEmail, name: 'AITELLION' },
        replyTo: payload.replyTo,
        subject: payload.subject,
        html: payload.html,
      });
      this.logger.log(`Email sent to=${payload.to} subject="${payload.subject}"`);
      return true;
    } catch (err: any) {
      // SendGrid puts the useful detail (e.g. "sender not verified") in
      // err.response.body, not the top-level error message.
      const detail = err?.response?.body ?? err;
      this.logger.error(`Failed to send email to=${payload.to}`, detail);
      return false;
    }
  }

  async sendVerificationEmail(to: string, token: string, frontendUrl: string) {
    const link = `${frontendUrl}/verify-email?token=${token}`;
    await this.send({
      to,
      subject: 'Verify your AITELLION account',
      html: baseTemplate(`
        <h1 style="margin:0 0 12px;font-size:20px;color:#0b0b12;">Confirm your email</h1>
        <p style="margin:0 0 20px;color:#4b4b57;font-size:14px;line-height:1.6;">
          Welcome to AITELLION. Click below to verify your email and activate your account.
        </p>
        ${button('Verify email', link)}
      `),
    });
  }

  async sendPasswordResetEmail(to: string, token: string, frontendUrl: string) {
    const link = `${frontendUrl}/reset-password?token=${token}`;
    await this.send({
      to,
      subject: 'Reset your AITELLION password',
      html: baseTemplate(`
        <h1 style="margin:0 0 12px;font-size:20px;color:#0b0b12;">Reset your password</h1>
        <p style="margin:0 0 20px;color:#4b4b57;font-size:14px;line-height:1.6;">
          Use the button below to set a new password. This link expires in 1 hour.
          If you didn't request this, you can safely ignore this email.
        </p>
        ${button('Reset password', link)}
      `),
    });
  }

  async sendInviteEmail(
    to: string,
    orgName: string,
    token: string,
    frontendUrl: string,
    inviter: { fullName: string; email: string },
    role: string,
  ): Promise<boolean> {
    const link = `${frontendUrl}/accept-invite?token=${token}`;
    const roleLabel = ROLE_LABEL[role] ?? role;
    const department = ROLE_DEPARTMENT[role];

    // "join the HR team at Acme" for department roles; "join Acme" plainly
    // for EMPLOYEE/VIEWER, which have no specific department to name.
    const destinationPhrase = department ? `the ${department} team at ${orgName}` : orgName;

    return this.send({
      to,
      replyTo: inviter.email,
      subject: `${inviter.fullName} invited you to join ${destinationPhrase} on AITELLION`,
      html: baseTemplate(`
        <p style="margin:0 0 4px;color:#7a5cff;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">
          ${department ? `${department} Team &middot; ` : ''}${orgName}
        </p>
        <h1 style="margin:0 0 12px;font-size:22px;color:#0b0b12;">You're invited to join ${orgName}</h1>
        <p style="margin:0 0 16px;color:#4b4b57;font-size:14px;line-height:1.7;">
          Hi there,<br /><br />
          <b>${inviter.fullName}</b> has invited you to join ${destinationPhrase} on AITELLION — the
          AI operating system that runs CRM, HR, finance and inventory from one workspace.
        </p>
        <p style="margin:0 0 24px;">
          <span style="display:inline-block;background:#f1edff;color:#7a5cff;font-size:12px;font-weight:600;
                       padding:4px 12px;border-radius:999px;">
            Role: ${roleLabel}
          </span>
        </p>
        <p style="margin:0 0 24px;color:#4b4b57;font-size:14px;line-height:1.7;">
          Accept the invite below to create your account and get straight to work.
        </p>
        ${button('Accept invitation', link)}
        <p style="margin:24px 0 0;color:#8a8a96;font-size:12px;line-height:1.6;">
          This invite expires in 7 days. Have a question for ${inviter.fullName} before you join?
          Just reply to this email — it'll go straight to them.
        </p>
      `),
    });
  }
}

function button(label: string, href: string): string {
  return `
    <a href="${href}"
       style="display:inline-block;background:#7a5cff;color:#ffffff;text-decoration:none;
              font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;">
      ${label}
    </a>
    <p style="margin:16px 0 0;color:#8a8a96;font-size:12px;word-break:break-all;">
      Or paste this link into your browser: ${href}
    </p>
  `;
}

function baseTemplate(innerHtml: string): string {
  return `
  <div style="background:#f4f4f7;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:28px 32px 0;">
          <div style="font-weight:800;font-size:18px;letter-spacing:-0.02em;color:#0b0b12;">
            &#9650; AITELLION
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px 32px;">
          ${innerHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px;background:#faf9ff;border-top:1px solid #eeeef4;">
          <p style="margin:0;color:#a3a3ad;font-size:11px;">
            Built with love by Team StackVolt &middot; AITELLION
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;
}