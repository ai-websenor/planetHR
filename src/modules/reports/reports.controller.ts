import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User } from '../../common/decorators/user.decorator';
import { UserRole } from '../users/schemas/user.schema';
import type { JwtPayload } from '../auth/services/auth.service';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate/:employeeId')
  @Roles(UserRole.OWNER, UserRole.LEADER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Generate reports for an employee',
    description:
      'Triggers the report generation workflow for a specific employee. ' +
      'This process runs in the background and generates 18 reports (6 types × 3 viewer roles). ' +
      'The reports include: personality, role compatibility, department fit, industry alignment, ' +
      'team integration, and training recommendations.',
  })
  @ApiParam({
    name: 'employeeId',
    description: 'The ID of the employee to generate reports for',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report generation started successfully',
    schema: {
      example: {
        employeeId: '691cd3fa90533f447f83f5fd',
        status: 'processing',
        message: 'Report generation started successfully',
        triggeredBy: 'owner@acmecorp.com',
        triggeredAt: '2025-11-19T01:45:54.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Employee not found or workflow not configured',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to generate reports',
  })
  async generateReports(
    @Param('employeeId') employeeId: string,
    @User() user: JwtPayload,
  ) {
    this.logger.log(
      `[POST /reports/generate/${employeeId}] - Request from user ${user.email} (${user.role})`,
    );

    return await this.reportsService.generateReports(employeeId, user);
  }

  @Get('employee/:employeeId')
  @Roles(UserRole.OWNER, UserRole.LEADER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get reports for an employee filtered by viewer role',
    description:
      'Retrieves all reports for a specific employee that match the authenticated user\'s role. ' +
      'Only non-archived reports are returned.',
  })
  @ApiParam({
    name: 'employeeId',
    description: 'The ID of the employee to get reports for',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reports retrieved successfully',
    schema: {
      example: {
        employeeId: '691cd3fa90533f447f83f5fd',
        viewerRole: 'owner',
        totalReports: 6,
        reports: [
          {
            id: '691cd3fa90533f447f83f5fe',
            reportType: 'personality',
            content: {
              executiveSummary: '...',
              detailedAnalysis: '...',
              strengths: ['...'],
              developmentAreas: ['...'],
            },
            metadata: {
              wordCount: 1500,
              estimatedReadTime: 6,
              confidenceLevel: 'HIGH',
            },
            generatedAt: '2025-11-19T01:45:54.000Z',
            validUntil: '2026-02-17T01:45:54.000Z',
            confidenceLevel: 'HIGH',
            version: '1.0',
          },
        ],
      },
    },
  })
  async getEmployeeReports(
    @Param('employeeId') employeeId: string,
    @User() user: JwtPayload,
  ) {
    this.logger.log(
      `[GET /reports/employee/${employeeId}] - Request from user ${user.email} (${user.role})`,
    );

    return await this.reportsService.getReportsByEmployee(
      employeeId,
      user.role.toLowerCase(),
    );
  }

  @Get('employee/:employeeId/all')
  @Roles(UserRole.OWNER, UserRole.LEADER)
  @ApiOperation({
    summary: 'Get all reports for an employee (all viewer roles)',
    description:
      'Retrieves all reports for a specific employee grouped by report type and viewer role. ' +
      'Only available to OWNER and LEADER roles.',
  })
  @ApiParam({
    name: 'employeeId',
    description: 'The ID of the employee to get all reports for',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All reports retrieved successfully',
    schema: {
      example: {
        employeeId: '691cd3fa90533f447f83f5fd',
        totalReports: 18,
        reports: {
          personality: {
            owner: { id: '...', content: {}, metadata: {} },
            leader: { id: '...', content: {}, metadata: {} },
            manager: { id: '...', content: {}, metadata: {} },
          },
          role: {
            owner: null,
            leader: null,
            manager: null,
          },
          // ... other report types
        },
      },
    },
  })
  async getAllEmployeeReports(@Param('employeeId') employeeId: string) {
    this.logger.log(`[GET /reports/employee/${employeeId}/all] - Request received`);

    return await this.reportsService.getAllReportsForEmployee(employeeId);
  }
}
