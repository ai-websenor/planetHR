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

// Single department item
export class DepartmentItemDto {
  @ApiProperty({
    description: 'Office/Branch name (must match a location created in step 2)',
    example: 'Corporate Head Office',
  })
  @IsString()
  @MaxLength(100)
  office_name: string;

  @ApiProperty({
    description: 'Department name',
    example: 'Technology Department',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  department_name: string;

  @ApiPropertyOptional({
    description: 'Department culture',
    example: 'Agile and research-oriented environment',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  department_culture?: string;

  @ApiPropertyOptional({
    description: 'Department goals',
    example: 'Improve automation, deliver scalable software solutions',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  department_goals?: string;
}

// Main DTO that accepts array of departments
export class OnboardingStep3Dto {
  @ApiProperty({
    description: 'Array of departments',
    type: [DepartmentItemDto],
    example: [
      {
        office_name: 'Corporate Head Office',
        department_name: 'Technology Department',
        department_culture: 'Agile and research-oriented',
        department_goals: 'Deliver scalable software solutions',
      },
      {
        office_name: 'Corporate Head Office',
        department_name: 'HR Department',
        department_culture: 'People-first approach',
        department_goals: 'Build strong company culture',
      },
      {
        office_name: 'Branch Office Mumbai',
        department_name: 'Sales Department',
        department_culture: 'Customer-centric',
        department_goals: 'Increase market share',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => DepartmentItemDto)
  departments: DepartmentItemDto[];
}
