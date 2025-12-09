import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { JobRolesService } from './job-roles.service';
import { CreateJobRoleDto, UpdateJobRoleDto } from './dto/create-job-role.dto';
import { User } from '../../common/decorators/user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Job Roles')
@ApiBearerAuth('JWT-auth')
@Controller('job-roles')
export class JobRolesController {
  constructor(private readonly jobRolesService: JobRolesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.LEADER)
  @ApiOperation({
    summary: 'Create a new job role',
    description: 'Create a new job role for a department (Owner/Leader only)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Job role created successfully',
  })
  async create(
    @Body() createJobRoleDto: CreateJobRoleDto,
    @User() currentUser: any,
  ) {
    const jobRole = await this.jobRolesService.create(
      createJobRoleDto,
      new Types.ObjectId(currentUser.organizationId),
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Job role created successfully',
      data: jobRole,
    };
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.LEADER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get all job roles',
    description: 'Retrieve all job roles for the organization',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Filter by branch ID',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    description: 'Filter by department ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job roles retrieved successfully',
  })
  async findAll(
    @User() currentUser: any,
    @Query('branchId') branchId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const jobRoles = await this.jobRolesService.findAll(
      new Types.ObjectId(currentUser.organizationId),
      branchId,
      departmentId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Job roles retrieved successfully',
      data: jobRoles,
    };
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.LEADER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get job role by ID',
    description: 'Retrieve a specific job role by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Job Role ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job role retrieved successfully',
  })
  async findOne(
    @Param('id') id: string,
    @User() currentUser: any,
  ) {
    const jobRole = await this.jobRolesService.findById(
      new Types.ObjectId(id),
      new Types.ObjectId(currentUser.organizationId),
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Job role retrieved successfully',
      data: jobRole,
    };
  }

  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.LEADER)
  @ApiOperation({
    summary: 'Update job role',
    description: 'Update an existing job role (Owner/Leader only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Job Role ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job role updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateJobRoleDto: UpdateJobRoleDto,
    @User() currentUser: any,
  ) {
    const jobRole = await this.jobRolesService.update(
      new Types.ObjectId(id),
      updateJobRoleDto,
      new Types.ObjectId(currentUser.organizationId),
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Job role updated successfully',
      data: jobRole,
    };
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.LEADER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete job role',
    description: 'Soft delete a job role (Owner/Leader only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Job Role ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Job role deleted successfully',
  })
  async remove(
    @Param('id') id: string,
    @User() currentUser: any,
  ) {
    await this.jobRolesService.remove(
      new Types.ObjectId(id),
      new Types.ObjectId(currentUser.organizationId),
    );
  }
}
