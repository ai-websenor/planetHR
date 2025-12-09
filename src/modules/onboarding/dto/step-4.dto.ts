import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

// Single job role item
export class JobRoleItemDto {
  @ApiProperty({
    description: 'Office/Branch name (must match a location from step 2)',
    example: 'Corporate Head Office',
  })
  @IsString()
  @MaxLength(100)
  office_name: string;

  @ApiProperty({
    description: 'Department name (must match a department from step 3)',
    example: 'Technology Department',
  })
  @IsString()
  @MaxLength(100)
  department_name: string;

  @ApiProperty({
    description: 'Job role type',
    example: 'owner',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  job_role: string;

  @ApiProperty({
    description: 'Job title',
    example: 'Chief Technology Officer',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  job_title: string;

  @ApiPropertyOptional({
    description: 'Reporting to (manager/supervisor)',
    example: 'owner',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reporting_to?: string;

  @ApiPropertyOptional({
    description: 'Critical attributes for the role',
    example: 'Strong problem solving and JavaScript expertise',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  critical_attribute?: string;

  @ApiPropertyOptional({
    description: 'Job description',
    example: 'Responsible for developing client-side features using React.js',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

// Main DTO that accepts array of job roles
export class OnboardingStep4Dto {
  @ApiProperty({
    description: 'Array of job roles',
    type: [JobRoleItemDto],
    example: [
      {
        office_name: 'Corporate Head Office',
        department_name: 'Technology Department',
        job_role: 'owner',
        job_title: 'Chief Technology Officer',
        reporting_to: 'owner',
        critical_attribute: 'Leadership and technical expertise',
        description: 'Leads all technology initiatives',
      },
      {
        office_name: 'Corporate Head Office',
        department_name: 'Technology Department',
        job_role: 'manager',
        job_title: 'Engineering Manager',
        reporting_to: 'chief technology officer',
        critical_attribute: 'Team management and technical skills',
        description: 'Manages the engineering team',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => JobRoleItemDto)
  job_roles: JobRoleItemDto[];
}
