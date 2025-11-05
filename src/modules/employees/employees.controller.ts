import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { EmployeeQueueService } from './services/employee-queue.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly employeeQueueService: EmployeeQueueService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add new employee and trigger analysis' })
  @ApiResponse({
    status: 201,
    description: 'Employee created and analysis queued',
  })
  async createEmployee(@Body() createEmployeeDto: CreateEmployeeDto) {
    // Mock user data for now - this would come from JWT in real implementation
    const user = {
      sub: 'mock-user-id',
      email: 'test@example.com',
      role: 'owner',
      organizationId: 'mock-org-id',
    };

    // Create employee record
    const employee = await this.employeesService.create(
      createEmployeeDto,
      user,
    );

    // Queue onboarding workflow
    const queueResult = await this.employeeQueueService.queueEmployeeOnboarding(
      employee.id,
      {
        userId: user.sub,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    );

    return {
      employee: {
        id: employee.id,
        name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
        department: employee.professionalInfo.department,
        role: employee.professionalInfo.role,
      },
      processing: queueResult,
    };
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get employee processing status' })
  async getEmployeeStatus(@Param('id') id: string) {
    const employee = await this.employeesService.findById(id);

    // Get queue job status if available
    let jobStatus: any = null;
    if (employee.processingStatus.jobId) {
      jobStatus = await this.employeeQueueService.getJobStatus(
        employee.processingStatus.jobId,
      );
    }

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
      job: jobStatus,
    };
  }

  @Get(':id/reports')
  @ApiOperation({ summary: 'Get employee reports by role' })
  async getEmployeeReports(@Param('id') id: string) {
    // Mock user role for now
    const userRole = 'owner';

    return this.employeesService.getReportsByRole(id, userRole);
  }

  @Get('queue/stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  async getQueueStats() {
    return this.employeeQueueService.getQueueStats();
  }
}
