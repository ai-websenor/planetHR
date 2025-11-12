import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Req,
  Ip,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './services/auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register new organization owner',
    description: 'Create a new organization and owner account. Returns access and refresh tokens.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration successful',
    schema: {
      example: {
        statusCode: 201,
        message: 'Registration successful',
        data: {
          user: {
            id: '507f1f77bcf86cd799439011',
            email: 'owner@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'OWNER',
          },
          organization: {
            id: '507f1f77bcf86cd799439012',
            name: 'Acme Corporation',
          },
          tokens: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or weak password',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const result = await this.authService.register(
      registerDto,
      ipAddress,
      userAgent || 'unknown',
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Registration successful',
      data: result,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate with email and password. Returns JWT tokens.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    schema: {
      example: {
        statusCode: 200,
        message: 'Login successful',
        data: {
          user: {
            id: '507f1f77bcf86cd799439011',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'MANAGER',
          },
          tokens: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or account locked',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const result = await this.authService.login(
      loginDto,
      ipAddress,
      userAgent || 'unknown',
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: result,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'User logout',
    description: 'Invalidate current session and blacklist access token.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Logout successful',
  })
  async logout(@User() user: any, @Req() request: Request) {
    const token = request.headers.authorization?.replace('Bearer ', '') || '';
    await this.authService.logout(user.sub, user.sessionId, token);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get new access and refresh tokens using a valid refresh token.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refresh successful',
    schema: {
      example: {
        statusCode: 200,
        message: 'Token refreshed successfully',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const tokens = await this.authService.refreshToken(
      refreshTokenDto.refreshToken,
      ipAddress,
      userAgent || 'unknown',
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Token refreshed successfully',
      data: tokens,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve authenticated user information.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'User profile retrieved successfully',
        data: {
          id: '507f1f77bcf86cd799439011',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'MANAGER',
          organizationId: '507f1f77bcf86cd799439012',
          assignedBranches: ['507f1f77bcf86cd799439013'],
          assignedDepartments: ['507f1f77bcf86cd799439014'],
        },
      },
    },
  })
  async getCurrentUser(@User() user: any) {
    return {
      statusCode: HttpStatus.OK,
      message: 'User profile retrieved successfully',
      data: {
        userId: user.sub,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        assignedBranches: user.assignedBranches,
        assignedDepartments: user.assignedDepartments,
      },
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset email to user. Always returns success to prevent email enumeration.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent (if email exists)',
    schema: {
      example: {
        statusCode: 200,
        message: 'If the email exists, a password reset link will be sent',
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);

    // Always return success to prevent email enumeration
    return {
      statusCode: HttpStatus.OK,
      message: 'If the email exists, a password reset link will be sent',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset password using token from email.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successful',
    schema: {
      example: {
        statusCode: 200,
        message: 'Password reset successful',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired reset token',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Password reset successful',
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password',
    description: 'Change password for authenticated user. Requires current password.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Password changed successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Current password is incorrect',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'New password does not meet requirements or matches recent password',
  })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @User() user: any,
  ) {
    await this.authService.changePassword(
      user.sub,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Password changed successfully',
    };
  }
}
