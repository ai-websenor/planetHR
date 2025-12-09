import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User as CurrentUser } from '../../common/decorators/user.decorator';
import { User } from '../users/schemas/user.schema';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('master-data')
  @ApiOperation({
    summary: 'Get master data for dashboard',
    description: 'Fetches all dashboard data in a single call. Returns branches, departments, employees, and access configuration based on user role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Master data fetched successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Master data fetched successfully' },
        data: {
          type: 'object',
          properties: {
            user: { type: 'object' },
            organization: { type: 'object' },
            branches: { type: 'array' },
            departments: { type: 'array' },
            employees: { type: 'array' },
            statistics: { type: 'object' },
            accessConfig: {
              type: 'object',
              properties: {
                canSwitchBranch: { type: 'boolean' },
                visibleBranchIds: { type: 'array', items: { type: 'string' } },
                visibleDepartmentIds: { type: 'array', items: { type: 'string' } },
                visibleEmployeeIds: { type: 'array', items: { type: 'string' } },
                dashboardFeatures: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  })
  async getMasterData(@CurrentUser() user: User) {
    const data = await this.dashboardService.getMasterData(user);

    return {
      statusCode: 200,
      message: 'Master data fetched successfully',
      data,
    };
  }
}
