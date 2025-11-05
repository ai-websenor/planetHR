import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmployeeNotificationService {
  private readonly logger = new Logger(EmployeeNotificationService.name);
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
}