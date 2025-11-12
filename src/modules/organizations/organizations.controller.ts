import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { OrganizationsService } from './organizations.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { User } from '../../common/decorators/user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Organizations')
@ApiBearerAuth('JWT-auth')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.LEADER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get current organization',
    description: 'Retrieve the authenticated user\'s organization details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization retrieved successfully',
  })
  async getCurrentOrganization(@User() currentUser: any) {
    const organization = await this.organizationsService.findById(
      new Types.ObjectId(currentUser.organizationId),
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Organization retrieved successfully',
      data: organization,
    };
  }

  @Post('branches')
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary: 'Create a new branch',
    description: 'Add a new branch to the organization (Owner only)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Branch created successfully',
  })
  async createBranch(
    @Body() createBranchDto: CreateBranchDto,
    @User() currentUser: any,
  ) {
    const organization = await this.organizationsService.addBranch(
      new Types.ObjectId(currentUser.organizationId),
      createBranchDto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Branch created successfully',
      data: organization,
    };
  }

  @Put('branches/:branchId')
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary: 'Update branch',
    description: 'Update branch information (Owner only)',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Branch ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Branch updated successfully',
  })
  async updateBranch(
    @Param('branchId') branchId: string,
    @Body() updateData: Partial<CreateBranchDto>,
    @User() currentUser: any,
  ) {
    const organization = await this.organizationsService.updateBranch(
      new Types.ObjectId(currentUser.organizationId),
      new Types.ObjectId(branchId),
      updateData,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Branch updated successfully',
      data: organization,
    };
  }

  @Delete('branches/:branchId')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete branch',
    description: 'Soft delete a branch (Owner only)',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Branch ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Branch deleted successfully',
  })
  async deleteBranch(
    @Param('branchId') branchId: string,
    @User() currentUser: any,
  ) {
    await this.organizationsService.deleteBranch(
      new Types.ObjectId(currentUser.organizationId),
      new Types.ObjectId(branchId),
    );
  }

  @Post('branches/:branchId/departments')
  @Roles(UserRole.OWNER, UserRole.LEADER)
  @ApiOperation({
    summary: 'Create department',
    description: 'Add a new department to a branch',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Branch ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Department created successfully',
  })
  async createDepartment(
    @Param('branchId') branchId: string,
    @Body() createDepartmentDto: CreateDepartmentDto,
    @User() currentUser: any,
  ) {
    const organization = await this.organizationsService.addDepartment(
      new Types.ObjectId(currentUser.organizationId),
      new Types.ObjectId(branchId),
      createDepartmentDto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Department created successfully',
      data: organization,
    };
  }

  @Put('branches/:branchId/departments/:departmentId')
  @Roles(UserRole.OWNER, UserRole.LEADER)
  @ApiOperation({
    summary: 'Update department',
    description: 'Update department information',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Branch ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'departmentId',
    description: 'Department ID',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Department updated successfully',
  })
  async updateDepartment(
    @Param('branchId') branchId: string,
    @Param('departmentId') departmentId: string,
    @Body() updateData: Partial<CreateDepartmentDto>,
    @User() currentUser: any,
  ) {
    // Convert string to ObjectId if managerId exists
    const updateDataConverted: any = { ...updateData };
    if (updateData.managerId) {
      updateDataConverted.managerId = new Types.ObjectId(updateData.managerId);
    }

    const organization = await this.organizationsService.updateDepartment(
      new Types.ObjectId(currentUser.organizationId),
      new Types.ObjectId(branchId),
      new Types.ObjectId(departmentId),
      updateDataConverted,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Department updated successfully',
      data: organization,
    };
  }

  @Delete('branches/:branchId/departments/:departmentId')
  @Roles(UserRole.OWNER, UserRole.LEADER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete department',
    description: 'Soft delete a department',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Branch ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'departmentId',
    description: 'Department ID',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Department deleted successfully',
  })
  async deleteDepartment(
    @Param('branchId') branchId: string,
    @Param('departmentId') departmentId: string,
    @User() currentUser: any,
  ) {
    await this.organizationsService.deleteDepartment(
      new Types.ObjectId(currentUser.organizationId),
      new Types.ObjectId(branchId),
      new Types.ObjectId(departmentId),
    );
  }
}
