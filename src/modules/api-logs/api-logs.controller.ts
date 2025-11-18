import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiLogsService } from './api-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('API Logs')
@Controller('api-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ApiLogsController {
  constructor(private readonly apiLogsService: ApiLogsService) {}

  @Get('astrology/employee/:employeeId')
  @Roles(UserRole.OWNER, UserRole.LEADER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get astrology API logs for an employee' })
  async getEmployeeLogs(
    @Param('employeeId') employeeId: string,
    @Query('limit') limit?: number,
  ) {
    return await this.apiLogsService.getLogsByEmployee(
      employeeId,
      limit || 10,
    );
  }

  @Get('astrology/organization/:organization')
  @Roles(UserRole.OWNER, UserRole.LEADER)
  @ApiOperation({ summary: 'Get astrology API logs for an organization' })
  async getOrganizationLogs(
    @Param('organization') organization: string,
    @Query('limit') limit?: number,
  ) {
    return await this.apiLogsService.getLogsByOrganization(
      organization,
      limit || 50,
    );
  }

  @Get('astrology/failed')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Get failed astrology API calls' })
  async getFailedLogs(@Query('limit') limit?: number) {
    return await this.apiLogsService.getFailedLogs(limit || 20);
  }

  @Get('astrology/stats')
  @Roles(UserRole.OWNER, UserRole.LEADER)
  @ApiOperation({ summary: 'Get astrology API statistics' })
  async getApiStats(@Query('organization') organization?: string) {
    return await this.apiLogsService.getApiStats(organization);
  }

  @Get('astrology/recent')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Get recent astrology API activity' })
  async getRecentActivity(@Query('hours') hours?: number) {
    return await this.apiLogsService.getRecentActivity(hours || 24);
  }
}
