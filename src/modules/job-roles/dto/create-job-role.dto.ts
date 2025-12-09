import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsMongoId, MinLength, MaxLength } from 'class-validator';

export class CreateJobRoleDto {
  @ApiProperty({
    description: 'Branch/Office ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  branchId: string;

  @ApiProperty({
    description: 'Department ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  departmentId: string;

  @ApiProperty({
    description: 'Job role name',
    example: 'Frontend Developer',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  jobRole: string;

  @ApiProperty({
    description: 'Job title',
    example: 'React.js Developer',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  jobTitle: string;

  @ApiPropertyOptional({
    description: 'Reporting to (manager/supervisor title)',
    example: 'Engineering Manager',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reportingTo?: string;

  @ApiPropertyOptional({
    description: 'Critical attributes required for this role',
    example: 'Strong problem solving and JavaScript expertise',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  criticalAttribute?: string;

  @ApiPropertyOptional({
    description: 'Job role description',
    example: 'Responsible for developing client-side features using React.js',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateJobRoleDto {
  @ApiPropertyOptional({
    description: 'Job role name',
    example: 'Senior Frontend Developer',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  jobRole?: string;

  @ApiPropertyOptional({
    description: 'Job title',
    example: 'Senior React.js Developer',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  jobTitle?: string;

  @ApiPropertyOptional({
    description: 'Reporting to (manager/supervisor title)',
    example: 'VP of Engineering',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reportingTo?: string;

  @ApiPropertyOptional({
    description: 'Critical attributes required for this role',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  criticalAttribute?: string;

  @ApiPropertyOptional({
    description: 'Job role description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
