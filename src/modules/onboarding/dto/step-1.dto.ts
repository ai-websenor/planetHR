import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsEnum } from 'class-validator';
import { CompanyType } from '../../organizations/schemas/organization.schema';

export class OnboardingStep1Dto {
  @ApiProperty({
    description: 'Company name',
    example: 'Tech Innovations Pvt Ltd',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  company_name: string;

  @ApiProperty({
    description: 'Business category',
    example: 'IT Services',
  })
  @IsString()
  @MaxLength(100)
  business_category: string;

  @ApiProperty({
    description: 'Industry',
    example: 'Software Development',
  })
  @IsString()
  @MaxLength(100)
  industry: string;

  @ApiPropertyOptional({
    description: 'Sub-industry',
    example: 'AI & Automation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sub_industry?: string;

  @ApiPropertyOptional({
    description: 'Company annual turnover',
    example: '10-50 Crore',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  company_turnover?: string;

  @ApiPropertyOptional({
    description: 'Employee size range',
    example: '200-500',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employee_size?: string;

  @ApiPropertyOptional({
    description: 'Company culture description',
    example: 'Innovative and collaborative',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  company_culture?: string;

  @ApiPropertyOptional({
    description: 'Company type',
    example: 'Private Limited Company (Pvt Ltd)',
    enum: CompanyType,
  })
  @IsOptional()
  @IsEnum(CompanyType)
  company_type?: CompanyType;
}
