import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { mastra } from '../../mastra';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { MastraService } from '../mastra/mastra.service';
import { User } from '../../common/decorators/user.decorator';
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
}
