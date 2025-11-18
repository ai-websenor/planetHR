import {
  Controller,
  Get,
  Param,
  Query,
  Logger,
  ParseFloatPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HarmonicsService } from './harmonics.service';

@ApiTags('Harmonics')
@ApiBearerAuth('JWT-auth')
@Controller('harmonics')
export class HarmonicsController {
  private readonly logger = new Logger(HarmonicsController.name);

  constructor(private readonly harmonicsService: HarmonicsService) {}

  // ============================================================================
  // BASE HARMONICS ENDPOINTS
  // ============================================================================

  @Get('employee/:employeeId/base')
  @ApiOperation({ summary: 'Get complete base harmonic data for employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({
    status: 200,
    description: 'Base harmonics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Base harmonics not found' })
  async getBaseHarmonics(@Param('employeeId') employeeId: string) {
    this.logger.log(
      `[GET /harmonics/employee/${employeeId}/base] - Fetching base harmonics`,
    );
    return this.harmonicsService.getBaseHarmonics(employeeId);
  }

  @Get('employee/:employeeId/base/cluster/:cluster')
  @ApiOperation({
    summary: 'Get top harmonics for specific cluster (coreTrait, highTrait, etc.)',
  })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiParam({
    name: 'cluster',
    description:
      'Cluster name: coreTrait, highTrait, supportTrait, neutralTrait, suppressedTrait, latentTrait',
    enum: [
      'coreTrait',
      'highTrait',
      'supportTrait',
      'neutralTrait',
      'suppressedTrait',
      'latentTrait',
    ],
  })
  @ApiResponse({
    status: 200,
    description: 'Top harmonics for cluster retrieved successfully',
  })
  async getTopHarmonicsByCluster(
    @Param('employeeId') employeeId: string,
    @Param('cluster') cluster: string,
  ) {
    this.logger.log(
      `[GET /harmonics/employee/${employeeId}/base/cluster/${cluster}] - Fetching cluster harmonics`,
    );
    return this.harmonicsService.getTopHarmonicsByCluster(employeeId, cluster);
  }

  @Get('employee/:employeeId/base/clusters/all')
  @ApiOperation({ summary: 'Get all top harmonics by cluster' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({
    status: 200,
    description: 'All cluster harmonics retrieved successfully',
  })
  async getAllTopHarmonicsByCluster(@Param('employeeId') employeeId: string) {
    this.logger.log(
      `[GET /harmonics/employee/${employeeId}/base/clusters/all] - Fetching all clusters`,
    );
    return this.harmonicsService.getAllTopHarmonicsByCluster(employeeId);
  }

  @Get('employee/:employeeId/base/statistics')
  @ApiOperation({
    summary: 'Get statistical summary (mean, stdDev, min, max) of base harmonics',
  })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getBaseHarmonicsStatistics(@Param('employeeId') employeeId: string) {
    this.logger.log(
      `[GET /harmonics/employee/${employeeId}/base/statistics] - Fetching statistics`,
    );
    return this.harmonicsService.getBaseHarmonicsStatistics(employeeId);
  }

  // ============================================================================
  // AGE HARMONICS ENDPOINTS
  // ============================================================================

  @Get('employee/:employeeId/age/latest')
  @ApiOperation({ summary: 'Get latest age harmonic calculation for employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({
    status: 200,
    description: 'Latest age harmonics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Age harmonics not found' })
  async getLatestAgeHarmonics(@Param('employeeId') employeeId: string) {
    this.logger.log(
      `[GET /harmonics/employee/${employeeId}/age/latest] - Fetching latest age harmonics`,
    );
    return this.harmonicsService.getLatestAgeHarmonics(employeeId);
  }

  @Get('employee/:employeeId/age/date/:date')
  @ApiOperation({ summary: 'Get age harmonics for specific date' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiParam({
    name: 'date',
    description: 'Date in ISO format (YYYY-MM-DD)',
    example: '2025-01-18',
  })
  @ApiResponse({
    status: 200,
    description: 'Age harmonics for date retrieved successfully',
  })
  async getAgeHarmonicsForDate(
    @Param('employeeId') employeeId: string,
    @Param('date') date: string,
  ) {
    this.logger.log(
      `[GET /harmonics/employee/${employeeId}/age/date/${date}] - Fetching age harmonics`,
    );
    const targetDate = new Date(date);
    return this.harmonicsService.getAgeHarmonicsForDate(employeeId, targetDate);
  }

  @Get('employee/:employeeId/age/all')
  @ApiOperation({
    summary: 'Get all age harmonic calculations (last 10) for employee',
  })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({
    status: 200,
    description: 'All age harmonics retrieved successfully',
  })
  async getAllAgeHarmonics(@Param('employeeId') employeeId: string) {
    this.logger.log(
      `[GET /harmonics/employee/${employeeId}/age/all] - Fetching all age harmonics`,
    );
    return this.harmonicsService.getAllAgeHarmonics(employeeId);
  }

  // ============================================================================
  // ROLE INSIGHTS ENDPOINTS
  // ============================================================================

  @Get('employee/:employeeId/role/:role')
  @ApiOperation({ summary: 'Get role-filtered harmonic insights' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiParam({
    name: 'role',
    description: 'Role type',
    enum: ['owner', 'leader', 'manager', 'operational'],
  })
  @ApiResponse({
    status: 200,
    description: 'Role insights retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Role insights not found' })
  async getRoleInsights(
    @Param('employeeId') employeeId: string,
    @Param('role') role: string,
  ) {
    this.logger.log(
      `[GET /harmonics/employee/${employeeId}/role/${role}] - Fetching role insights`,
    );
    return this.harmonicsService.getRoleInsights(employeeId, role);
  }

  @Get('employee/:employeeId/roles/all')
  @ApiOperation({ summary: 'Get insights for all roles' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({
    status: 200,
    description: 'All role insights retrieved successfully',
  })
  async getAllRoleInsights(@Param('employeeId') employeeId: string) {
    this.logger.log(
      `[GET /harmonics/employee/${employeeId}/roles/all] - Fetching all role insights`,
    );
    return this.harmonicsService.getAllRoleInsights(employeeId);
  }

  @Get('employee/:employeeId/promotion-readiness')
  @ApiOperation({ summary: 'Get promotion readiness score and recommendations' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiQuery({
    name: 'role',
    description: 'Current role of employee',
    required: true,
    enum: ['operational', 'manager', 'leader'],
  })
  @ApiResponse({
    status: 200,
    description: 'Promotion readiness retrieved successfully',
  })
  async getPromotionReadiness(
    @Param('employeeId') employeeId: string,
    @Query('role') role: string,
  ) {
    this.logger.log(
      `[GET /harmonics/employee/${employeeId}/promotion-readiness?role=${role}] - Fetching promotion readiness`,
    );
    return this.harmonicsService.getPromotionReadiness(employeeId, role);
  }

  // ============================================================================
  // ORGANIZATION-WIDE ANALYTICS
  // ============================================================================

  @Get('organization/:orgId/high-potential')
  @ApiOperation({
    summary: 'Get high-potential employees in organization sorted by promotion readiness',
  })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiQuery({
    name: 'minScore',
    description: 'Minimum promotion readiness score (0-1)',
    required: false,
    type: Number,
    example: 0.75,
  })
  @ApiResponse({
    status: 200,
    description: 'High-potential employees retrieved successfully',
  })
  async getHighPotentialEmployees(
    @Param('orgId') orgId: string,
    @Query('minScore', new DefaultValuePipe(0.75), ParseFloatPipe)
    minScore: number,
  ) {
    this.logger.log(
      `[GET /harmonics/organization/${orgId}/high-potential?minScore=${minScore}] - Fetching high-potential employees`,
    );
    return this.harmonicsService.getHighPotentialEmployees(orgId, minScore);
  }

  @Get('organization/:orgId/cluster/:cluster')
  @ApiOperation({ summary: 'Get employees with strong harmonics in specific cluster' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({
    name: 'cluster',
    description: 'Cluster name',
    enum: [
      'coreTrait',
      'highTrait',
      'supportTrait',
      'neutralTrait',
      'suppressedTrait',
      'latentTrait',
    ],
  })
  @ApiQuery({
    name: 'minHarmonics',
    description: 'Minimum number of harmonics in cluster',
    required: false,
    type: Number,
    example: 3,
  })
  @ApiResponse({
    status: 200,
    description: 'Employees by cluster retrieved successfully',
  })
  async getEmployeesByCluster(
    @Param('orgId') orgId: string,
    @Param('cluster') cluster: string,
    @Query('minHarmonics', new DefaultValuePipe(3), ParseFloatPipe)
    minHarmonics: number,
  ) {
    this.logger.log(
      `[GET /harmonics/organization/${orgId}/cluster/${cluster}?minHarmonics=${minHarmonics}] - Fetching employees by cluster`,
    );
    return this.harmonicsService.getEmployeesByCluster(
      orgId,
      cluster,
      minHarmonics,
    );
  }

  // ============================================================================
  // UTILITY ENDPOINTS
  // ============================================================================

  @Get('employee/:employeeId/summary')
  @ApiOperation({
    summary: 'Get summary of available harmonic data for employee',
  })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({
    status: 200,
    description: 'Harmonic data summary retrieved successfully',
  })
  async getHarmonicsSummary(@Param('employeeId') employeeId: string) {
    this.logger.log(
      `[GET /harmonics/employee/${employeeId}/summary] - Fetching summary`,
    );
    return this.harmonicsService.getHarmonicsSummary(employeeId);
  }
}
