import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpStatus,
  Res,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { SubmitEvaluationFormDto } from './dto/submit-evaluation.dto';
import { EmailFormSubmissionDto } from './dto/submit-evaluation-form.dto';
import { mastra } from '../../mastra';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { MastraService } from '../mastra/mastra.service';
import { User } from '../../common/decorators/user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../auth/services/auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Employees')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  private readonly logger = new Logger(EmployeesController.name);

  constructor(
    private readonly employeesService: EmployeesService,
    private readonly mastraService: MastraService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add new employee and trigger analysis' })
  @ApiResponse({
    status: 201,
    description: 'Employee created and analysis queued',
  })
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @User() user: JwtPayload,
  ) {
    this.logger.log(
      `[POST /employees] - Received request to create employee: ${JSON.stringify(
        createEmployeeDto,
      )}`,
    );
    this.logger.log(
      `[POST /employees] - Authenticated user: ${user.email} (${user.role}) from organization: ${user.organizationId}`,
    );

    // Create employee record
    const employee = await this.employeesService.create(
      createEmployeeDto,
      user,
    );

    // Run onboarding workflow directly
    this.logger.log(
      `[POST /employees] - Starting onboarding workflow for employee: ${employee.id}`,
    );
    const workflow = mastra.getWorkflow('employeeOnboardingWorkflow');
    if (!workflow) {
      this.logger.error('Employee onboarding workflow not found');
      // Handle error appropriately
    } else {
      // Do not await this, let it run in the background
      const contextMap = this.mastraService.getContext();
      const runtimeContext = new RuntimeContext(
        Array.from(contextMap.entries()),
      );
      workflow.createRunAsync().then((run) => {
        run
          .start({
            inputData: { employeeId: employee.id },
            runtimeContext,
          })
          .then((finalResult) => {
            this.logger.log(
              `[POST /employees] - Workflow completed for employee: ${employee.id}`,
            );
          })
          .catch((error) => {
            this.logger.error(
              `[POST /employees] - Workflow failed for employee: ${employee.id}`,
              error,
            );
          });
      });
    }

    this.logger.log(
      `[POST /employees] - Employee created and analysis started: ${employee.id}`,
    );
    return {
      employee: {
        id: employee.id,
        name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
        department: employee.professionalInfo.department,
        role: employee.professionalInfo.role,
      },
      processing: {
        status: 'processing',
        message: 'Onboarding workflow started directly.',
      },
    };
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get employee processing status' })
  async getEmployeeStatus(@Param('id') id: string) {
    this.logger.log(
      `[GET /employees/${id}/status] - Received request for employee status`,
    );
    const employee = await this.employeesService.findById(id);

    this.logger.log(
      `[GET /employees/${id}/status] - Returning employee status`,
    );
    return {
      employee: {
        id: employee.id,
        name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
      },
      processing: {
        status: employee.processingStatus.status,
        stage: employee.processingStatus.stage,
        progress: employee.processingStatus.progress,
        completedReports: employee.processingStatus.completedReports,
        lastUpdated: employee.processingStatus.lastUpdated,
      },
    };
  }

  @Get(':id/reports')
  @ApiOperation({ summary: 'Get employee reports by role' })
  async getEmployeeReports(@Param('id') id: string, @User() user: JwtPayload) {
    this.logger.log(
      `[GET /employees/${id}/reports] - Received request for employee reports`,
    );
    this.logger.log(`[GET /employees/${id}/reports] - User role: ${user.role}`);

    const reports = await this.employeesService.getReportsByRole(id, user.role);
    this.logger.log(
      `[GET /employees/${id}/reports] - Returning employee reports`,
    );
    return reports;
  }

  // ==========================================
  // PUBLIC EVALUATION FORM ROUTES (No Auth Required)
  // ==========================================

  @Public()
  @Get('evaluate/by-token/:token')
  @ApiOperation({
    summary: 'Get employee data by evaluation token (Public)',
    description: 'Retrieves employee data for the evaluation form. No authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee data retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: HttpStatus.GONE,
    description: 'Token has expired',
  })
  async getEmployeeByEvaluationToken(@Param('token') token: string) {
    this.logger.log(
      `[GET /employees/evaluate/by-token] - Received request for evaluation form`,
    );

    const employeeData = await this.employeesService.getByEvaluationToken(token);

    this.logger.log(
      `[GET /employees/evaluate/by-token] - Returning employee data for ${employeeData.email}`,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Employee data retrieved successfully',
      data: employeeData,
    };
  }

  @Public()
  @Get('evaluate/departments/:token')
  @ApiOperation({
    summary: 'Get departments for evaluation form (Public)',
    description: 'Retrieves departments for the organization based on evaluation token.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Departments retrieved successfully',
  })
  async getDepartmentsForEvaluation(@Param('token') token: string) {
    this.logger.log(
      `[GET /employees/evaluate/departments] - Fetching departments for evaluation form`,
    );

    const departments = await this.employeesService.getDepartmentsByToken(token);

    return {
      statusCode: HttpStatus.OK,
      message: 'Departments retrieved successfully',
      data: departments,
    };
  }

  @Public()
  @Get('evaluate/job-roles/:token')
  @ApiOperation({
    summary: 'Get job roles for evaluation form (Public)',
    description: 'Retrieves job roles for the organization based on evaluation token. Optionally filter by department.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job roles retrieved successfully',
  })
  async getJobRolesForEvaluation(
    @Param('token') token: string,
    @Query('departmentId') departmentId?: string,
  ) {
    this.logger.log(
      `[GET /employees/evaluate/job-roles] - Fetching job roles for evaluation form`,
    );

    const jobRoles = await this.employeesService.getJobRolesByToken(token, departmentId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Job roles retrieved successfully',
      data: jobRoles,
    };
  }

  @Public()
  @Post('evaluate/job-roles/create')
  @ApiOperation({
    summary: 'Create a new job role from evaluation form (Public)',
    description: 'Allows employee to create a new job role if their role is not listed.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Job role created successfully',
  })
  async createJobRoleFromEvaluation(
    @Body() createJobRoleDto: { token: string; departmentId: string; jobRole: string; jobTitle: string },
  ) {
    this.logger.log(
      `[POST /employees/evaluate/job-roles/create] - Creating job role from evaluation form`,
    );

    const jobRole = await this.employeesService.createJobRoleByToken(createJobRoleDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Job role created successfully',
      data: jobRole,
    };
  }

  @Public()
  @Get('evaluate/form/:token')
  @ApiOperation({
    summary: 'Get standalone evaluation form page (Public)',
    description: 'Serves a standalone HTML form page for employees to fill their details. Opens in a new tab from email link.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'HTML form page returned',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invalid or expired token',
  })
  @Header('Content-Type', 'text/html')
  async getEvaluationFormPage(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[GET /employees/evaluate/form] - Serving standalone evaluation form`,
    );

    try {
      // Validate token and get employee data
      const employeeData = await this.employeesService.getByEvaluationToken(token);

      this.logger.log(
        `[GET /employees/evaluate/form] - Rendering form for ${employeeData.email}`,
      );

      // Return the standalone HTML form page
      return res.send(this.getStandaloneFormPage(employeeData, token));
    } catch (error) {
      this.logger.error(
        `[GET /employees/evaluate/form] - Failed to load form: ${error.message}`,
      );

      return res.status(HttpStatus.BAD_REQUEST).send(this.getErrorHtmlPage(error.message));
    }
  }

  @Public()
  @Post('evaluate/submit')
  @ApiOperation({
    summary: 'Submit evaluation form (Public)',
    description: 'Submits the employee evaluation form with birth data. No authentication required.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evaluation form submitted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid form data or missing token',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invalid or expired token',
  })
  @ApiResponse({
    status: HttpStatus.GONE,
    description: 'Token has expired',
  })
  async submitEvaluationForm(@Body() submitDto: SubmitEvaluationFormDto) {
    this.logger.log(
      `[POST /employees/evaluate/submit] - Received evaluation form submission`,
    );

    const result = await this.employeesService.submitEvaluationForm(submitDto);

    this.logger.log(
      `[POST /employees/evaluate/submit] - Form submitted successfully for ${result.email}`,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Your evaluation form has been submitted successfully!',
      data: result,
    };
  }

  /**
   * Handle email form submission (HTML form POST)
   * Returns an HTML response page
   */
  @Public()
  @Post('submit-evaluation')
  @ApiOperation({
    summary: 'Submit evaluation form from email (Public)',
    description: 'Handles HTML form submission from embedded email form. Returns HTML response.',
  })
  @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Form submitted successfully - returns HTML page',
  })
  @Header('Content-Type', 'text/html')
  async submitEmailForm(
    @Body() formData: EmailFormSubmissionDto,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[POST /employees/submit-evaluation] - Received email form submission`,
    );

    try {
      // Parse birthPlace into city and country
      const birthPlaceParts = formData.birthPlace.split(',').map(s => s.trim());
      const city = birthPlaceParts[0] || formData.birthPlace;
      const country = birthPlaceParts[1] || '';

      // Call the service to process the submission
      const result = await this.employeesService.submitEmailFormEvaluation({
        token: formData.token,
        birthDate: formData.birthDate,
        birthTime: formData.birthTime,
        birthLocation: { city, country },
        gender: formData.gender,
      });

      this.logger.log(
        `[POST /employees/submit-evaluation] - Form submitted successfully for ${result.email}`,
      );

      // Return success HTML page
      return res.send(this.getSuccessHtmlPage(result.firstName));
    } catch (error) {
      this.logger.error(
        `[POST /employees/submit-evaluation] - Form submission failed: ${error.message}`,
      );

      // Return error HTML page
      return res.status(HttpStatus.BAD_REQUEST).send(this.getErrorHtmlPage(error.message));
    }
  }

  private getSuccessHtmlPage(employeeName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Submission Successful - PlanetsHR</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f4f4f7 0%, #e8e8eb 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            padding: 50px;
            text-align: center;
            max-width: 500px;
            width: 100%;
          }
          .success-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
          }
          .success-icon svg {
            width: 40px;
            height: 40px;
            stroke: white;
            stroke-width: 3;
          }
          h1 {
            color: #1a1a2e;
            font-size: 28px;
            margin-bottom: 15px;
          }
          p {
            color: #6b6b80;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .highlight { color: #1E40AF; font-weight: 600; }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #9898a8;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1>Thank You, ${employeeName}!</h1>
          <p>Your details have been submitted successfully.</p>
          <p>Our team will now process your information and generate your personalized <span class="highlight">PlanetsHR</span> profile.</p>
          <p>You may close this window now.</p>
          <div class="footer">
            © ${new Date().getFullYear()} PlanetsHR. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getStandaloneFormPage(employeeData: any, token: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your Profile - PlanetsHR</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f4f4f7 0%, #e8e8eb 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 100%;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.5px;
          }
          .header p {
            margin-top: 10px;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
          }
          .content {
            padding: 40px;
          }
          .welcome {
            margin-bottom: 30px;
          }
          .welcome h2 {
            font-size: 24px;
            font-weight: 600;
            color: #1a1a2e;
            margin-bottom: 15px;
          }
          .welcome p {
            font-size: 16px;
            line-height: 1.6;
            color: #4a4a68;
          }
          .info-box {
            background-color: #f8f9fc;
            border-radius: 10px;
            border-left: 4px solid #1E40AF;
            padding: 25px;
            margin-bottom: 30px;
          }
          .info-box h3 {
            font-size: 14px;
            font-weight: 600;
            color: #1E40AF;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-item:last-child { margin-bottom: 0; }
          .info-label {
            font-size: 13px;
            color: #6b6b80;
          }
          .info-value {
            font-size: 14px;
            color: #1a1a2e;
            font-weight: 600;
            margin-left: 10px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          .form-group label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #1a1a2e;
            margin-bottom: 8px;
          }
          .form-group label .required {
            color: #DC2626;
          }
          .form-group label .optional {
            font-size: 12px;
            color: #6b6b80;
            font-weight: 400;
          }
          .form-group input,
          .form-group select {
            width: 100%;
            padding: 12px 16px;
            font-size: 14px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background-color: #ffffff;
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          .form-group input:focus,
          .form-group select:focus {
            outline: none;
            border-color: #1E40AF;
            box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
          }
          .submit-btn {
            display: block;
            width: 100%;
            background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
            color: #ffffff;
            font-size: 16px;
            font-weight: 600;
            padding: 16px 40px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(30, 64, 175, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(30, 64, 175, 0.5);
          }
          .submit-btn:active {
            transform: translateY(0);
          }
          .submit-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
          }
          .footer {
            background-color: #f8f9fc;
            padding: 30px 40px;
            text-align: center;
          }
          .footer p {
            color: #9898a8;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PlanetsHR</h1>
            <p>Employee Onboarding</p>
          </div>

          <div class="content">
            <div class="welcome">
              <h2>Welcome, ${employeeData.firstName}!</h2>
              <p>
                You've been added to <strong>PlanetsHR</strong> as a <strong>${employeeData.role || 'Team Member'}</strong>
                in the <strong>${employeeData.department || 'Organization'}</strong> department.
                Please fill out your personal details below to complete your profile.
              </p>
            </div>

            <div class="info-box">
              <h3>Your Information</h3>
              <div class="info-item">
                <span class="info-label">Name:</span>
                <span class="info-value">${employeeData.firstName} ${employeeData.lastName || ''}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${employeeData.email}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Role:</span>
                <span class="info-value">${employeeData.role || 'Team Member'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Department:</span>
                <span class="info-value">${employeeData.department || 'Organization'}</span>
              </div>
            </div>

            <form action="/api/employees/submit-evaluation" method="POST" id="evaluationForm">
              <input type="hidden" name="token" value="${token}" />

              <div class="form-group">
                <label>Date of Birth <span class="required">*</span></label>
                <input type="date" name="birthDate" required />
              </div>

              <div class="form-group">
                <label>Time of Birth <span class="optional">(if known)</span></label>
                <input type="time" name="birthTime" />
              </div>

              <div class="form-group">
                <label>Place of Birth <span class="required">*</span></label>
                <input type="text" name="birthPlace" required placeholder="City, Country" />
              </div>

              <div class="form-group">
                <label>Gender <span class="required">*</span></label>
                <select name="gender" required>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <button type="submit" class="submit-btn" id="submitBtn">
                Submit Your Details
              </button>
            </form>
          </div>

          <div class="footer">
            <p>Need help? Contact our support team</p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} PlanetsHR. All rights reserved.</p>
          </div>
        </div>

        <script>
          document.getElementById('evaluationForm').addEventListener('submit', function(e) {
            var btn = document.getElementById('submitBtn');
            btn.disabled = true;
            btn.textContent = 'Submitting...';
          });
        </script>
      </body>
      </html>
    `;
  }

  private getErrorHtmlPage(errorMessage: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Submission Error - PlanetsHR</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f4f4f7 0%, #e8e8eb 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            padding: 50px;
            text-align: center;
            max-width: 500px;
            width: 100%;
          }
          .error-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
          }
          .error-icon svg {
            width: 40px;
            height: 40px;
            stroke: white;
            stroke-width: 3;
          }
          h1 {
            color: #1a1a2e;
            font-size: 28px;
            margin-bottom: 15px;
          }
          p {
            color: #6b6b80;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .error-message {
            background: #FEF2F2;
            border: 1px solid #FECACA;
            border-radius: 8px;
            padding: 15px;
            color: #991B1B;
            font-size: 14px;
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #9898a8;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          <h1>Submission Failed</h1>
          <p>We encountered an issue while processing your submission.</p>
          <div class="error-message">${errorMessage}</div>
          <p>Please try again or contact support if the issue persists.</p>
          <div class="footer">
            © ${new Date().getFullYear()} PlanetsHR. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ==========================================
  // ADMIN EVALUATION MANAGEMENT ROUTES
  // ==========================================

  @Post(':id/resend-evaluation-email')
  @ApiOperation({ summary: 'Resend evaluation form email to employee' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evaluation email resent successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Employee not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Employee has already completed the evaluation',
  })
  async resendEvaluationEmail(
    @Param('id') id: string,
    @User() user: JwtPayload,
  ) {
    this.logger.log(
      `[POST /employees/${id}/resend-evaluation-email] - Resending evaluation email`,
    );

    const result = await this.employeesService.resendEvaluationEmail(id, user);

    this.logger.log(
      `[POST /employees/${id}/resend-evaluation-email] - Email resent successfully`,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Evaluation email resent successfully',
      data: result,
    };
  }
}
