import {
  Injectable,
  NotFoundException,
  GoneException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Employee } from './schemas/employee.schema';
import { Report } from '../reports/schemas/report.schema';
import { Organization } from '../organizations/schemas/organization.schema';
import { JobRole } from '../job-roles/schemas/job-role.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { SubmitEvaluationFormDto } from './dto/submit-evaluation.dto';
import { EmployeeNotificationService } from '../email/services/employee-notifications.service';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(Organization.name) private organizationModel: Model<Organization>,
    @InjectModel(JobRole.name) private jobRoleModel: Model<JobRole>,
    private readonly configService: ConfigService,
    private readonly emailService: EmployeeNotificationService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto, user: any): Promise<Employee> {
    this.logger.log(`[create] - Creating employee for organization ${user.organizationId} by user ${user.email}`);

    const sendEvaluationEmail = createEmployeeDto.sendEvaluationEmail !== false;
    const hasBirthData = createEmployeeDto.birthData?.birthDate && createEmployeeDto.birthData?.birthLocation?.city;

    const employee = new this.employeeModel({
      ...createEmployeeDto,
      organization: user.organizationId,
      addedBy: {
        userId: user.sub,
        role: user.role,
        timestamp: new Date(),
      },
      processingStatus: {
        status: 'pending',
        stage: 'created',
        progress: 0,
        lastUpdated: new Date(),
        completedReports: [],
      },
      // If birth data is not provided, set evaluationStatus to pending
      evaluationStatus: hasBirthData ? 'completed' : 'pending',
    });

    // Generate evaluation token if birth data is not provided
    if (!hasBirthData) {
      (employee as any).generateEvaluationToken();
    }

    await employee.save();

    // Send evaluation email if birth data not provided and email is enabled
    if (!hasBirthData && sendEvaluationEmail) {
      try {
        await this.sendEvaluationEmail(employee);
        employee.evaluationStatus = 'email_sent';
        employee.evaluationEmailSentAt = new Date();
        employee.evaluationEmailCount = 1;
        await employee.save();
        this.logger.log(`[create] - Evaluation email sent to ${employee.personalInfo.email}`);
      } catch (emailError) {
        this.logger.error(`[create] - Failed to send evaluation email: ${emailError.message}`);
        // Don't fail the request, employee is created
      }
    }

    return employee;
  }

  /**
   * Send evaluation form email to employee
   * The email contains a link to open the standalone form page in a new tab
   */
  async sendEvaluationEmail(employee: Employee): Promise<void> {
    const port = this.configService.get('port', 3003);
    const baseUrl = this.configService.get('app.frontendUrl', `http://localhost:${port}`);
    // Link to standalone form page that opens in a new tab
    const formUrl = `${baseUrl}/api/employees/evaluate/form/${employee.evaluationToken}`;
    const expiryDate = employee.tokenExpiresAt?.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) || 'N/A';

    await this.emailService.sendEvaluationFormEmail({
      recipientEmail: employee.personalInfo.email,
      employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
      employeeEmail: employee.personalInfo.email,
      employeePhone: employee.personalInfo.phone || '',
      formUrl,
      expiryDate,
      role: employee.professionalInfo.role,
      department: employee.professionalInfo.department,
      token: employee.evaluationToken || '',
    });
  }

  /**
   * GET EMPLOYEE BY EVALUATION TOKEN (Public - No Auth Required)
   */
  async getByEvaluationToken(token: string): Promise<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    department: string;
    birthDate?: Date;
    birthTime?: string;
    birthLocation?: any;
    gender?: string;
    prompt?: string;
    evaluationStatus: string;
    tokenExpiresAt?: Date;
  }> {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const employee = await this.employeeModel.findOne({
      evaluationToken: token,
      evaluationStatus: { $ne: 'completed' },
    });

    if (!employee) {
      throw new NotFoundException(
        'Invalid or expired token. This form may have already been submitted or the link has expired.',
      );
    }

    // Check if token is expired
    if (!(employee as any).isTokenValid()) {
      throw new GoneException(
        'This link has expired. Please contact your administrator for a new link.',
      );
    }

    // Update status to form_opened if email_sent
    if (employee.evaluationStatus === 'email_sent') {
      employee.evaluationStatus = 'form_opened';
      await employee.save();
    }

    return {
      id: (employee._id as any).toString(),
      firstName: employee.personalInfo.firstName,
      lastName: employee.personalInfo.lastName,
      email: employee.personalInfo.email,
      phone: employee.personalInfo.phone,
      role: employee.professionalInfo.role,
      department: employee.professionalInfo.department,
      birthDate: employee.birthData?.birthDate,
      birthTime: employee.birthData?.birthTime,
      birthLocation: employee.birthData?.birthLocation,
      gender: employee.gender || '',
      prompt: employee.prompt || '',
      evaluationStatus: employee.evaluationStatus,
      tokenExpiresAt: employee.tokenExpiresAt,
    };
  }

  /**
   * SUBMIT EVALUATION FORM (Public - Token Required)
   */
  async submitEvaluationForm(submitDto: SubmitEvaluationFormDto): Promise<{
    id: string;
    name: string;
    email: string;
    status: string;
    submittedAt?: Date;
  }> {
    const { token, birthDate, birthTime, birthLocation, gender, prompt, departmentId, jobTitleId } = submitDto;

    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const employee = await this.employeeModel.findOne({
      evaluationToken: token,
      evaluationStatus: { $ne: 'completed' },
    });

    if (!employee) {
      throw new NotFoundException(
        'Invalid or expired token. This form may have already been submitted.',
      );
    }

    if (!(employee as any).isTokenValid()) {
      throw new GoneException(
        'This link has expired. Please contact your administrator.',
      );
    }

    // Update department if provided
    if (departmentId) {
      const organization = await this.organizationModel.findById(employee.organization);
      if (organization) {
        for (const branch of organization.branches) {
          const dept = branch.departments.find(
            (d) => d._id.toString() === departmentId && d.isActive,
          );
          if (dept) {
            employee.professionalInfo.department = dept.name;
            break;
          }
        }
      }
    }

    // Update job title if provided
    if (jobTitleId) {
      const jobRole = await this.jobRoleModel.findById(jobTitleId);
      if (jobRole) {
        employee.professionalInfo.role = jobRole.jobTitle;
      }
    }

    // Update employee with birth data
    employee.birthData = {
      birthDate: new Date(birthDate),
      birthTime: birthTime || '',
      birthLocation: {
        city: birthLocation.city,
        country: birthLocation.country,
        latitude: birthLocation.latitude,
        longitude: birthLocation.longitude,
        timezone: birthLocation.timezone,
      },
    };
    employee.gender = gender as any;
    employee.prompt = prompt || '';

    // Mark as completed
    (employee as any).markEvaluationCompleted();

    await employee.save();

    this.logger.log(
      `[submitEvaluationForm] - Form submitted for ${employee.personalInfo.email}`,
    );

    return {
      id: (employee._id as any).toString(),
      name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
      email: employee.personalInfo.email,
      status: employee.evaluationStatus,
      submittedAt: employee.evaluationFormSubmittedAt,
    };
  }

  /**
   * SUBMIT EMAIL FORM EVALUATION (Simplified - from embedded email form)
   * This is a simplified version for the HTML form embedded in emails
   */
  async submitEmailFormEvaluation(data: {
    token: string;
    birthDate: string;
    birthTime?: string;
    birthLocation: { city: string; country: string };
    gender: string;
  }): Promise<{
    firstName: string;
    email: string;
    status: string;
  }> {
    const { token, birthDate, birthTime, birthLocation, gender } = data;

    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const employee = await this.employeeModel.findOne({
      evaluationToken: token,
      evaluationStatus: { $ne: 'completed' },
    });

    if (!employee) {
      throw new NotFoundException(
        'Invalid or expired token. This form may have already been submitted.',
      );
    }

    if (!(employee as any).isTokenValid()) {
      throw new GoneException(
        'This link has expired. Please contact your administrator.',
      );
    }

    // Update employee with birth data
    employee.birthData = {
      birthDate: new Date(birthDate),
      birthTime: birthTime || '',
      birthLocation: {
        city: birthLocation.city,
        country: birthLocation.country,
      },
    };
    employee.gender = gender as any;

    // Mark as completed
    (employee as any).markEvaluationCompleted();

    await employee.save();

    this.logger.log(
      `[submitEmailFormEvaluation] - Form submitted from email for ${employee.personalInfo.email}`,
    );

    return {
      firstName: employee.personalInfo.firstName,
      email: employee.personalInfo.email,
      status: employee.evaluationStatus,
    };
  }

  /**
   * RESEND EVALUATION EMAIL (Admin Action)
   */
  async resendEvaluationEmail(
    employeeId: string,
    user: any,
  ): Promise<{
    emailSentCount: number;
    tokenExpiresAt?: Date;
  }> {
    const employee = await this.employeeModel.findOne({
      _id: employeeId,
      organization: user.organizationId,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.evaluationStatus === 'completed') {
      throw new BadRequestException(
        'Employee has already completed the evaluation form',
      );
    }

    // Generate new token
    (employee as any).generateEvaluationToken();
    employee.evaluationStatus = 'pending';

    await employee.save();

    // Send email
    await this.sendEvaluationEmail(employee);
    employee.evaluationStatus = 'email_sent';
    employee.evaluationEmailSentAt = new Date();
    employee.evaluationEmailCount = (employee.evaluationEmailCount || 0) + 1;
    await employee.save();

    this.logger.log(
      `[resendEvaluationEmail] - Email resent to ${employee.personalInfo.email} (count: ${employee.evaluationEmailCount})`,
    );

    return {
      emailSentCount: employee.evaluationEmailCount,
      tokenExpiresAt: employee.tokenExpiresAt,
    };
  }

  async findById(id: string): Promise<Employee> {
    const employee = await this.employeeModel.findById(id).exec();
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  async findByOrganization(organizationId: string): Promise<Employee[]> {
    return this.employeeModel
      .find({ organization: organizationId, isActive: true })
      .exec();
  }

  async updateProcessingStatus(
    employeeId: string,
    status: any
  ): Promise<Employee | null> {
    return this.employeeModel
      .findByIdAndUpdate(
        employeeId,
        {
          $set: {
            'processingStatus.status': status.status,
            'processingStatus.stage': status.stage,
            'processingStatus.progress': status.progress,
            'processingStatus.lastUpdated': new Date(),
            'processingStatus.jobId': status.jobId,
          },
        },
        { new: true }
      )
      .exec();
  }

  async updateEnergyCode(employeeId: string, energyCode: any): Promise<Employee | null> {
    return this.employeeModel
      .findByIdAndUpdate(
        employeeId,
        { $set: { energyCode } },
        { new: true }
      )
      .exec();
  }

  async getReportsByRole(employeeId: string, viewerRole: string): Promise<Report[]> {
    return this.reportModel
      .find({
        employeeId,
        viewerRole,
        isArchived: false,
      })
      .sort({ generatedAt: -1 })
      .exec();
  }

  async findQuarterlyUpdatesDue(date: Date): Promise<Employee[]> {
    return this.employeeModel
      .find({
        'energyCode.nextUpdate': { $lte: date },
        isActive: true,
      })
      .exec();
  }

  async updateNextQuarterlyDate(employeeId: string, nextUpdate: Date): Promise<Employee | null> {
    return this.employeeModel
      .findByIdAndUpdate(
        employeeId,
        { $set: { 'energyCode.nextUpdate': nextUpdate } },
        { new: true }
      )
      .exec();
  }

  // ==========================================
  // PUBLIC EVALUATION FORM HELPER METHODS
  // ==========================================

  /**
   * Get employee by token (helper for validation)
   */
  private async getEmployeeByTokenForValidation(token: string): Promise<Employee> {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const employee = await this.employeeModel.findOne({
      evaluationToken: token,
      evaluationStatus: { $ne: 'completed' },
    });

    if (!employee) {
      throw new NotFoundException(
        'Invalid or expired token. This form may have already been submitted.',
      );
    }

    if (!(employee as any).isTokenValid()) {
      throw new GoneException(
        'This link has expired. Please contact your administrator.',
      );
    }

    return employee;
  }

  /**
   * GET DEPARTMENTS BY EVALUATION TOKEN (Public)
   * Returns all departments for the employee's organization
   */
  async getDepartmentsByToken(token: string): Promise<any[]> {
    const employee = await this.getEmployeeByTokenForValidation(token);

    const organization = await this.organizationModel.findById(employee.organization);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Flatten all departments from all branches
    const departments: any[] = [];
    for (const branch of organization.branches) {
      if (branch.isActive) {
        for (const dept of branch.departments) {
          if (dept.isActive) {
            departments.push({
              _id: dept._id.toString(),
              name: dept.name,
              description: dept.description,
              branchId: branch._id.toString(),
              branchName: branch.name,
            });
          }
        }
      }
    }

    return departments;
  }

  /**
   * GET JOB ROLES BY EVALUATION TOKEN (Public)
   * Returns job roles, optionally filtered by department
   */
  async getJobRolesByToken(token: string, departmentId?: string): Promise<any[]> {
    const employee = await this.getEmployeeByTokenForValidation(token);

    const query: any = {
      organizationId: new Types.ObjectId(employee.organization),
      isActive: true,
      deletedAt: null,
    };

    if (departmentId) {
      query.departmentId = new Types.ObjectId(departmentId);
    }

    const jobRoles = await this.jobRoleModel.find(query).sort({ jobTitle: 1 }).exec();

    return jobRoles.map((jr) => ({
      _id: (jr._id as any).toString(),
      jobRole: jr.jobRole,
      jobTitle: jr.jobTitle,
      departmentId: (jr.departmentId as any).toString(),
      branchId: (jr.branchId as any).toString(),
      description: jr.description,
    }));
  }

  /**
   * CREATE JOB ROLE BY EVALUATION TOKEN (Public)
   * Allows employee to create a new job role if not listed
   */
  async createJobRoleByToken(createDto: {
    token: string;
    departmentId: string;
    jobRole: string;
    jobTitle: string;
  }): Promise<any> {
    const { token, departmentId, jobRole, jobTitle } = createDto;

    const employee = await this.getEmployeeByTokenForValidation(token);

    const organization = await this.organizationModel.findById(employee.organization);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Find the branch that contains this department
    let branchId: Types.ObjectId | null = null;
    for (const branch of organization.branches) {
      const dept = branch.departments.find(
        (d) => d._id.toString() === departmentId && d.isActive,
      );
      if (dept) {
        branchId = branch._id;
        break;
      }
    }

    if (!branchId) {
      throw new NotFoundException('Department not found');
    }

    // Create the new job role
    const newJobRole = new this.jobRoleModel({
      organizationId: new Types.ObjectId(employee.organization),
      branchId: branchId,
      departmentId: new Types.ObjectId(departmentId),
      jobRole,
      jobTitle,
      isActive: true,
    });

    await newJobRole.save();

    this.logger.log(
      `[createJobRoleByToken] - Created job role "${jobTitle}" for organization ${employee.organization}`,
    );

    return {
      _id: (newJobRole._id as any).toString(),
      jobRole: newJobRole.jobRole,
      jobTitle: newJobRole.jobTitle,
      departmentId: (newJobRole.departmentId as any).toString(),
      branchId: (newJobRole.branchId as any).toString(),
    };
  }
}