import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthEmailService {
  private readonly logger = new Logger(AuthEmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendOtpEmail(
    recipientEmail: string,
    data: {
      userName: string;
      otp: string;
      expiryMinutes: number;
    },
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM', 'noreply@planetshr.com'),
        to: recipientEmail,
        subject: 'Verify Your Email - PlanetsHR',
        html: this.getOtpTemplate(data),
      });

      this.logger.log(`OTP email sent to ${recipientEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${recipientEmail}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(
    recipientEmail: string,
    data: {
      userName: string;
    },
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM', 'noreply@planetshr.com'),
        to: recipientEmail,
        subject: 'Welcome to PlanetsHR!',
        html: this.getWelcomeTemplate(data),
      });

      this.logger.log(`Welcome email sent to ${recipientEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${recipientEmail}:`, error);
      return false;
    }
  }

  private getOtpTemplate(data: { userName: string; otp: string; expiryMinutes: number }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1E40AF;">PlanetsHR</h1>
          </div>

          <h2>Verify Your Email Address</h2>

          <p>Hello ${data.userName},</p>

          <p>Thank you for signing up with PlanetsHR! Please use the following OTP to verify your email address:</p>

          <div style="background: #f0f9ff; padding: 30px; border-radius: 10px; margin: 30px 0; text-align: center; border: 2px dashed #1E40AF;">
            <h1 style="font-size: 42px; letter-spacing: 8px; color: #1E40AF; margin: 0;">${data.otp}</h1>
          </div>

          <p style="color: #666; font-size: 14px;">This OTP is valid for <strong>${data.expiryMinutes} minutes</strong>. Please do not share this code with anyone.</p>

          <p>If you didn't request this verification, please ignore this email.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated email from PlanetsHR. Please do not reply to this email.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeTemplate(data: { userName: string }): string {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to PlanetsHR</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1E40AF;">PlanetsHR</h1>
          </div>

          <h2>Welcome to PlanetsHR!</h2>

          <p>Hello ${data.userName},</p>

          <p>Congratulations! Your email has been verified and your account is now active.</p>

          <p>You're now ready to set up your organization and start using our AI-powered HR analytics platform.</p>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 30px 0;">
            <h3>Next Steps:</h3>
            <ol>
              <li>Complete your organization profile</li>
              <li>Add your office locations</li>
              <li>Set up departments and job roles</li>
              <li>Start adding employees for AI analysis</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/onboarding"
               style="background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Complete Your Setup
            </a>
          </div>

          <p>Best regards,<br>The PlanetsHR Team</p>
        </div>
      </body>
      </html>
    `;
  }
}
