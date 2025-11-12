import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { User as UserDecorator } from '../../common/decorators/user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.LEADER)
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Create a new Leader or Manager. OWNER can create both, LEADER can only create MANAGERs.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or role-specific requirements not met',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions to create this user role',
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @UserDecorator() currentUser: any,
  ) {
    // Validate that LEADER can only create MANAGER
    if (currentUser.role === UserRole.LEADER && createUserDto.role !== UserRole.MANAGER) {
      throw new Error('Leaders can only create Managers');
    }

    const user = await this.usersService.create(
      createUserDto,
      new Types.ObjectId(currentUser.userId),
      new Types.ObjectId(currentUser.organizationId),
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.LEADER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve paginated list of users with filters. Results are scoped based on user role.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
  })
  async findAll(
    @Query() queryDto: QueryUsersDto,
    @UserDecorator() currentUser: any,
  ) {
    const result = await this.usersService.findAll(
      queryDto,
      new Types.ObjectId(currentUser.organizationId),
      currentUser.role,
      currentUser.assignedBranches?.map((id: string) => new Types.ObjectId(id)) || [],
      currentUser.assignedDepartments?.map((id: string) => new Types.ObjectId(id)) || [],
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully',
      ...result,
    };
  }

  @Get(':userId')
  @Roles(UserRole.OWNER, UserRole.LEADER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve detailed information about a specific user',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async findOne(@Param('userId') userId: string) {
    const user = await this.usersService.findById(new Types.ObjectId(userId));

    return {
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @Put(':userId')
  @Roles(UserRole.OWNER, UserRole.LEADER)
  @ApiOperation({
    summary: 'Update user',
    description: 'Update user information. Cannot update own account or change role through this endpoint.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot update own account',
  })
  async update(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @UserDecorator() currentUser: any,
  ) {
    const user = await this.usersService.update(
      new Types.ObjectId(userId),
      updateUserDto,
      new Types.ObjectId(currentUser.userId),
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'User updated successfully',
      data: user,
    };
  }

  @Delete(':userId')
  @Roles(UserRole.OWNER, UserRole.LEADER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Soft delete a user. Cannot delete own account.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete own account',
  })
  async remove(
    @Param('userId') userId: string,
    @UserDecorator() currentUser: any,
  ) {
    await this.usersService.remove(
      new Types.ObjectId(userId),
      new Types.ObjectId(currentUser.userId),
    );
  }
}
