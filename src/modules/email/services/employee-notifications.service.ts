import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmployeeNotificationService {
  private readonly logger = new Logger(EmployeeNotificationService.name);
  private transporter: nodemailer.Transporter;
  private readonly maxRetries = 3;
  private readonly baseDelayMs = 1000;

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

  /**
   * Helper to send email with retry logic for rate limiting
   */
  private async sendMailWithRetry(mailOptions: nodemailer.SendMailOptions): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.transporter.sendMail(mailOptions);
        return;
      } catch (error) {
        lastError = error;
        const isRateLimit = error.message?.includes('Too many emails') ||
                           error.message?.includes('550 5.7.0');

        if (isRateLimit && attempt < this.maxRetries) {
          const delay = this.baseDelayMs * Math.pow(2, attempt - 1);
          this.logger.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
          await this.delay(delay);
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async sendEmployeeProcessingStart(
    recipientEmail: string,
    data: {
      employeeName: string;
      estimatedTime: string;
      reportTypes: string[];
    }
  ) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM', 'noreply@planetshr.com'),
        to: recipientEmail,
        subject: `Employee Analysis Started - ${data.employeeName}`,
        html: this.getProcessingStartTemplate(data),
      });

      this.logger.log(`Processing start email sent to ${recipientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send processing start email to ${recipientEmail}:`, error);
    }
  }

  async sendEmployeeProcessingComplete(
    recipientEmail: string,
    data: {
      employeeId: string;
      employeeName: string;
      totalReports: number;
      successfulReports: number;
      completionTime: string;
    }
  ) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM', 'noreply@planetshr.com'),
        to: recipientEmail,
        subject: `Employee Analysis Complete - ${data.employeeName}`,
        html: this.getProcessingCompleteTemplate(data),
      });

      this.logger.log(`Processing complete email sent to ${recipientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send processing complete email to ${recipientEmail}:`, error);
    }
  }

  async sendEmployeeProcessingError(
    recipientEmail: string,
    employeeId: string,
    errorMessage: string
  ) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM', 'noreply@planetshr.com'),
        to: recipientEmail,
        subject: 'Employee Analysis Failed - Action Required',
        html: this.getProcessingErrorTemplate(employeeId, errorMessage),
      });

      this.logger.log(`Processing error email sent to ${recipientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send processing error email to ${recipientEmail}:`, error);
    }
  }

  async sendQuarterlyUpdateNotification(
    recipientEmail: string,
    data: {
      employeeCount: number;
      updatedEmployees: string[];
      organizationName: string;
    }
  ) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM', 'noreply@planetshr.com'),
        to: recipientEmail,
        subject: `Quarterly Employee Analysis Update - ${data.organizationName}`,
        html: this.getQuarterlyUpdateTemplate(data),
      });

      this.logger.log(`Quarterly update email sent to ${recipientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send quarterly update email to ${recipientEmail}:`, error);
    }
  }

  /**
   * Send evaluation form email to employee
   * This email contains an embedded form for the employee to fill their birth details
   */
  async sendEvaluationFormEmail(data: {
    recipientEmail: string;
    employeeName: string;
    employeeEmail: string;
    employeePhone: string;
    formUrl: string; // API submission URL
    expiryDate: string;
    role: string;
    department: string;
    token: string;
  }) {
    try {
      await this.sendMailWithRetry({
        from: this.configService.get('EMAIL_FROM', 'noreply@planetshr.com'),
        to: data.recipientEmail,
        subject: `Complete Your Employee Profile - PlanetsHR`,
        html: this.getEvaluationFormTemplate(data),
        text: this.getEvaluationFormPlainText(data),
      });

      this.logger.log(`Evaluation form email sent to ${data.recipientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send evaluation form email to ${data.recipientEmail}:`, error);
      throw error;
    }
  }

  private getProcessingStartTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Employee Analysis Started</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1E40AF;">PlanetsHR</h1>
          </div>
          
          <h2>Employee Analysis Started</h2>
          
          <p>Hello,</p>
          
          <p>We've started processing the personality analysis for <strong>${data.employeeName}</strong>.</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Processing Details:</h3>
            <ul>
              <li><strong>Employee:</strong> ${data.employeeName}</li>
              <li><strong>Estimated Time:</strong> ${data.estimatedTime}</li>
              <li><strong>Report Types:</strong> ${data.reportTypes.join(', ')}</li>
            </ul>
          </div>
          
          <p>You'll receive another notification when the analysis is complete. You can also check the progress in real-time on your dashboard.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.configService.get('FRONTEND_URL')}/dashboard" 
               style="background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              View Dashboard
            </a>
          </div>
          
          <p>Best regards,<br>The PlanetsHR Team</p>
        </div>
      </body>
      </html>
    `;
  }

  private getProcessingCompleteTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Employee Analysis Complete</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1E40AF;">PlanetsHR</h1>
          </div>
          
          <h2>✅ Employee Analysis Complete</h2>
          
          <p>Great news! The personality analysis for <strong>${data.employeeName}</strong> has been completed successfully.</p>
          
          <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #1E40AF;">
            <h3>Results Summary:</h3>
            <ul>
              <li><strong>Total Reports Generated:</strong> ${data.successfulReports}/${data.totalReports}</li>
              <li><strong>Completion Time:</strong> ${new Date(data.completionTime).toLocaleString()}</li>
              <li><strong>Status:</strong> Ready for Review</li>
            </ul>
          </div>
          
          <p>All reports are now available in your dashboard. You can view role-specific insights, personality analysis, and development recommendations.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.configService.get('FRONTEND_URL')}/employees/${data.employeeId}/reports" 
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
              View Reports
            </a>
            <a href="${this.configService.get('FRONTEND_URL')}/dashboard" 
               style="background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Dashboard
            </a>
          </div>
          
          <p>Best regards,<br>The PlanetsHR Team</p>
        </div>
      </body>
      </html>
    `;
  }

  private getProcessingErrorTemplate(employeeId: string, errorMessage: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Employee Analysis Failed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1E40AF;">PlanetsHR</h1>
          </div>
          
          <h2 style="color: #DC2626;">⚠️ Employee Analysis Failed</h2>
          
          <p>We encountered an issue while processing the employee analysis.</p>
          
          <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #DC2626;">
            <h3>Error Details:</h3>
            <p><strong>Employee ID:</strong> ${employeeId}</p>
            <p><strong>Error:</strong> ${errorMessage}</p>
          </div>
          
          <p>Our team has been notified and will investigate the issue. You can try the following:</p>
          
          <ul>
            <li>Check that all employee information is complete and accurate</li>
            <li>Retry the analysis process</li>
            <li>Contact support if the issue persists</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.configService.get('FRONTEND_URL')}/employees/${employeeId}/retry" 
               style="background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
              Retry Analysis
            </a>
            <a href="${this.configService.get('FRONTEND_URL')}/support" 
               style="background: #6B7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Contact Support
            </a>
          </div>
          
          <p>Best regards,<br>The PlanetsHR Team</p>
        </div>
      </body>
      </html>
    `;
  }

  private getQuarterlyUpdateTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Quarterly Employee Analysis Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1E40AF;">PlanetsHR</h1>
          </div>

          <h2>📊 Quarterly Analysis Update</h2>

          <p>Your quarterly employee analysis update for <strong>${data.organizationName}</strong> has been completed.</p>

          <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Update Summary:</h3>
            <ul>
              <li><strong>Employees Updated:</strong> ${data.employeeCount}</li>
              <li><strong>Reports Regenerated:</strong> ${data.employeeCount * 18}</li>
              <li><strong>Status:</strong> All updates complete</li>
            </ul>
          </div>

          <p>The quarterly updates include refreshed personality analyses based on harmonic energy progressions, ensuring your insights remain current and accurate.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.configService.get('FRONTEND_URL')}/reports/quarterly"
               style="background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              View Updated Reports
            </a>
          </div>

          <p>Best regards,<br>The PlanetsHR Team</p>
        </div>
      </body>
      </html>
    `;
  }

  private getEvaluationFormTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your Employee Profile - PlanetsHR</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f7;">
          <tr>
            <td align="center" style="padding: 40px 10px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                      PlanetsHR
                    </h1>
                    <p style="margin: 10px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">
                      Employee Onboarding
                    </p>
                  </td>
                </tr>

                <!-- Welcome Section -->
                <tr>
                  <td style="padding: 40px 40px 20px;">
                    <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1a1a2e;">
                      Welcome, ${data.employeeName}!
                    </h2>
                    <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.6; color: #4a4a68;">
                      You've been added to <strong>PlanetsHR</strong> as a <strong>${data.role}</strong> in the <strong>${data.department}</strong> department.
                      Please fill out your personal details below to complete your profile.
                    </p>
                  </td>
                </tr>

                <!-- Your Information Box -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fc; border-radius: 10px; border-left: 4px solid #1E40AF;">
                      <tr>
                        <td style="padding: 25px;">
                          <h3 style="margin: 0 0 15px; font-size: 14px; font-weight: 600; color: #1E40AF; text-transform: uppercase; letter-spacing: 1px;">
                            Your Information
                          </h3>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding-bottom: 10px;">
                                <span style="font-size: 13px; color: #6b6b80;">Name:</span>
                                <span style="font-size: 14px; color: #1a1a2e; font-weight: 600; margin-left: 10px;">${data.employeeName}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom: 10px;">
                                <span style="font-size: 13px; color: #6b6b80;">Email:</span>
                                <span style="font-size: 14px; color: #1a1a2e; font-weight: 600; margin-left: 10px;">${data.employeeEmail}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom: 10px;">
                                <span style="font-size: 13px; color: #6b6b80;">Role:</span>
                                <span style="font-size: 14px; color: #1a1a2e; font-weight: 600; margin-left: 10px;">${data.role}</span>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <span style="font-size: 13px; color: #6b6b80;">Department:</span>
                                <span style="font-size: 14px; color: #1a1a2e; font-weight: 600; margin-left: 10px;">${data.department}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Complete Profile Button -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4a4a68; text-align: center;">
                            Click the button below to open the form and complete your profile:
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="text-align: center;">
                          <a href="${data.formUrl}" target="_blank"
                            style="display: inline-block; background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(30, 64, 175, 0.4);">
                            Complete Your Profile
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px;">
                          <p style="margin: 0; font-size: 13px; color: #6b6b80; text-align: center;">
                            Or copy this link to your browser:<br/>
                            <a href="${data.formUrl}" style="color: #1E40AF; word-break: break-all;">${data.formUrl}</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Expiry Warning -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fff8e6; border-radius: 8px; border: 1px solid #ffd966;">
                      <tr>
                        <td style="padding: 15px 20px;">
                          <p style="margin: 0; font-size: 13px; color: #8a6d3b;">
                            <strong>Important:</strong> Please complete this form before <strong>${data.expiryDate}</strong>.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fc; padding: 30px 40px; border-radius: 0 0 12px 12px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center;">
                          <p style="margin: 0 0 10px; font-size: 14px; color: #6b6b80;">
                            Need help? Contact our support team
                          </p>
                          <p style="margin: 0; font-size: 12px; color: #c0c0cc;">
                            © ${new Date().getFullYear()} PlanetsHR. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private getEvaluationFormPlainText(data: any): string {
    return `
Hello ${data.employeeName},

You've been added to PlanetsHR as a ${data.role} in the ${data.department} department.

Your Details:
- Name: ${data.employeeName}
- Email: ${data.employeeEmail}
- Role: ${data.role}
- Department: ${data.department}

To complete your profile, please fill out your personal details (Date of Birth, Time of Birth, Place of Birth, and Gender).

Click the link below to open the form in your browser:
${data.formUrl}

This link will expire on ${data.expiryDate}.

Best regards,
The PlanetsHR Team
    `;
  }
}