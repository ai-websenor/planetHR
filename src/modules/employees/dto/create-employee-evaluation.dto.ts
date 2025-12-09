import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateEmployeeEvaluationDto {
  @ApiProperty({
    description: 'Employee full name',
    example: 'John Smith',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Employee name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Employee email address',
    example: 'john.smith@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Employee phone number',
    example: '+1-555-123-4567',
  })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{4,6}[-\s\.]?[0-9]{0,6}$/, {
    message: 'Please provide a valid phone number',
  })
  phone: string;

  @ApiPropertyOptional({
    description: 'Organization ID (auto-filled from authenticated user)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  organizationId?: string;
}

export class BulkCreateEmployeeEvaluationDto {
  @ApiProperty({
    description: 'List of employees to create',
    type: [CreateEmployeeEvaluationDto],
  })
  employees: CreateEmployeeEvaluationDto[];
}
