import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

const ROLE_DEPARTMENT_LABEL: Record<string, string> = {
  OWNER: 'Leadership',
  ADMIN: 'Admin',
  MANAGER: 'Management',
  HR: 'HR',
  FINANCE: 'Finance',
  SALES: 'Sales',
  EMPLOYEE: 'Team',
  VIEWER: 'Team',
};

/**
 * Outbound transactional email via Gmail SMTP (nodemailer). Gmail works
 * without owning a custom domain - the only realistic zero-cost option for
 * a project on vercel.app/railway.app subdomains, since providers like
 * Resend/SendGrid require a verified sending domain to mail arbitrary
 * recipients on their free tiers.
 *
 * Setup: a Gmail account with 2-Step Verification on, then an "App
 * Password" (Google Account -> Security -> App Passwords) - NOT the normal
 * Gmail password. Set SMTP_USER / SMTP_PASS in the backend .env.
 *
 * If those aren't configured, emails are logged instead of sent so local
 * dev / signup never breaks.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        family: 4, // Railway's network can't reach Gmail's IPv6 address (ENETUNREACH) - force IPv4
        auth: { user, pass },
        // Fail fast instead of hanging for a long time on a bad network/
        // credential - without these, a stuck connection can silently
        // block the invite request for a minute or more.
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 10_000,
      });

      // Verify the SMTP credentials once at startup so a bad App Password
      // shows up clearly in the logs immediately, not only when someone
      // tries to send an invite.
      this.transporter.verify((err) => {
        if (err) this.logger.error('SMTP connection failed - check SMTP_USER/SMTP_PASS', err);
        else this.logger.log('SMTP connection verified - ready to send email');
      });
    } else {
      this.logger.warn('SMTP_USER/SMTP_PASS not set - emails will be logged instead of sent');
    }
  }

  /** Returns true if the email was actually handed off to Gmail successfully. */
  async send(payload: EmailPayload): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP_USER/SMTP_PASS not configured - email NOT sent (to=${payload.to}, subject="${payload.subject}")`,
      );
      this.logger.debug(payload.html);
      return false;
    }

    const fromAddress = this.config.get<string>('SMTP_USER');
    try {
      await this.transporter.sendMail({
        from: `"AITELLION" <${fromAddress}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        replyTo: payload.replyTo,
      });
      this.logger.log(`Email sent to=${payload.to} subject="${payload.subject}"`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send email to=${payload.to}`, err instanceof Error ? err.stack : err);
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
    const department = ROLE_DEPARTMENT_LABEL[role] ?? 'Team';

    return this.send({
      to,
      replyTo: inviter.email,
      subject: `${inviter.fullName} invited you to join the ${department} team at ${orgName}`,
      html: baseTemplate(`
        <p style="margin:0 0 4px;color:#7a5cff;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">
          ${department} Team &middot; ${orgName}
        </p>
        <h1 style="margin:0 0 12px;font-size:22px;color:#0b0b12;">You're invited to join ${orgName}</h1>
        <p style="margin:0 0 16px;color:#4b4b57;font-size:14px;line-height:1.7;">
          Hi there,<br /><br />
          <b>${inviter.fullName}</b> has invited you to join the <b>${department} team</b> at
          <b>${orgName}</b> on AITELLION — the AI operating system that runs their CRM, HR, finance
          and inventory from one workspace.
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