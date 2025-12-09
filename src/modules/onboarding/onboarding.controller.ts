import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { OnboardingService } from './onboarding.service';
import { OnboardingStep1Dto } from './dto/step-1.dto';
import { OnboardingStep2Dto } from './dto/step-2.dto';
import { OnboardingStep3Dto } from './dto/step-3.dto';
import { OnboardingStep4Dto } from './dto/step-4.dto';
import { User } from '../../common/decorators/user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Onboarding')
@ApiBearerAuth('JWT-auth')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary: 'Get onboarding status',
    description: 'Get current onboarding progress for the organization. Use this to determine which step to show the user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Onboarding status retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Onboarding status retrieved',
        data: {
          currentStep: 2,
          isCompleted: false,
          organization: {
            name: 'Tech Innovations Pvt Ltd',
            industry: 'Software Development',
            branchCount: 1,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getStatus(@User() currentUser: any) {
    const status = await this.onboardingService.getStatus(
      new Types.ObjectId(currentUser.organizationId),
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Onboarding status retrieved',
      data: status,
    };
  }

  @Post('step-1')
  @Roles(UserRole.OWNER)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'registration_document', maxCount: 1 },
      { name: 'company_profile_document', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Complete Step 1 - Company Details',
    description: 'Submit company details including business category, industry, turnover, employee size, and optional documents (registration & company profile).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Step 1 completed successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Step 1 completed successfully',
        data: {
          nextStep: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation Error',
    schema: {
      example: {
        statusCode: 400,
        error: 'Validation Error',
        message: ['company_name must be at least 2 characters long'],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async step1(
    @Body() step1Dto: OnboardingStep1Dto,
    @User() currentUser: any,
    @UploadedFiles()
    files: {
      registration_document?: Express.Multer.File[];
      company_profile_document?: Express.Multer.File[];
    },
  ) {
    const result = await this.onboardingService.processStep1(
      new Types.ObjectId(currentUser.organizationId),
      step1Dto,
      files?.registration_document?.[0],
      files?.company_profile_document?.[0],
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: { nextStep: result.nextStep },
    };
  }

  @Post('step-2')
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary: 'Complete Step 2 - Office/Branch Details',
    description: 'Add first office/branch for the organization. Requires Step 1 to be completed first.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Step 2 completed successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Step 2 completed successfully',
        data: {
          nextStep: 3,
          branchIds: { 'Head Office': '507f1f77bcf86cd799439011' },
          totalBranches: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation Error or Step 1 not completed',
    schema: {
      example: {
        statusCode: 400,
        message: 'Please complete step 1 first',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async step2(
    @Body() step2Dto: OnboardingStep2Dto,
    @User() currentUser: any,
  ) {
    const result = await this.onboardingService.processStep2(
      new Types.ObjectId(currentUser.organizationId),
      step2Dto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: {
        nextStep: result.nextStep,
        branchIds: result.branchIds,
        totalBranches: result.totalBranches,
      },
    };
  }

  @Post('step-3')
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary: 'Complete Step 3 - Department Details',
    description: 'Add first department to a branch. Requires Step 2 to be completed first. Use the branchId returned from Step 2.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Step 3 completed successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Step 3 completed successfully',
        data: {
          nextStep: 4,
          departmentIds: { 'Engineering': '507f1f77bcf86cd799439012' },
          totalDepartments: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation Error or Step 2 not completed',
    schema: {
      example: {
        statusCode: 400,
        message: 'Please complete step 2 first',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Branch not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async step3(
    @Body() step3Dto: OnboardingStep3Dto,
    @User() currentUser: any,
  ) {
    const result = await this.onboardingService.processStep3(
      new Types.ObjectId(currentUser.organizationId),
      step3Dto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: {
        nextStep: result.nextStep,
        departmentIds: result.departmentIds,
        totalDepartments: result.totalDepartments,
      },
    };
  }

  @Post('step-4')
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary: 'Complete Step 4 - Job Role Details',
    description: 'Add first job role to complete onboarding. This is the final step. Use branchId from Step 2 and departmentId from Step 3.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Onboarding completed successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Onboarding completed successfully',
        data: {
          isCompleted: true,
          jobRoleIds: { 'Software Engineer': '507f1f77bcf86cd799439013' },
          totalJobRoles: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation Error or Step 3 not completed',
    schema: {
      example: {
        statusCode: 400,
        message: 'Please complete step 3 first',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Branch or Department not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async step4(
    @Body() step4Dto: OnboardingStep4Dto,
    @User() currentUser: any,
  ) {
    const result = await this.onboardingService.processStep4(
      new Types.ObjectId(currentUser.organizationId),
      step4Dto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      data: {
        isCompleted: result.isCompleted,
        jobRoleIds: result.jobRoleIds,
        totalJobRoles: result.totalJobRoles,
      },
    };
  }
}
