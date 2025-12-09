import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsOptional,
  IsDateString,
  IsEnum,
  Matches,
} from 'class-validator';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export class SubmitEvaluationFormDto {
  @ApiProperty({
    description: 'Evaluation token received via email',
    example: 'abc123xyz789...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @ApiProperty({
    description: 'Job department',
    example: 'Engineering',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty({ message: 'Job department is required' })
  @MinLength(2, { message: 'Department must be at least 2 characters' })
  @MaxLength(100, { message: 'Department cannot exceed 100 characters' })
  jobDepartment: string;

  @ApiProperty({
    description: 'Job title',
    example: 'Senior Software Engineer',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty({ message: 'Job title is required' })
  @MinLength(2, { message: 'Job title must be at least 2 characters' })
  @MaxLength(100, { message: 'Job title cannot exceed 100 characters' })
  jobTitle: string;

  @ApiPropertyOptional({
    description: 'Job description and responsibilities',
    example: 'Leading the frontend development team, implementing new features...',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Job description cannot exceed 2000 characters' })
  jobDescription?: string;

  @ApiPropertyOptional({
    description: 'Office location',
    example: 'San Francisco, CA',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Office location cannot exceed 200 characters' })
  officeLocation?: string;

  @ApiPropertyOptional({
    description: 'Date of birth (ISO 8601 format)',
    example: '1990-05-15',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid date' })
  dob?: string;

  @ApiPropertyOptional({
    description: 'Time of birth (HH:MM format)',
    example: '14:30',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:MM format',
  })
  tob?: string;

  @ApiPropertyOptional({
    description: 'Place of birth',
    example: 'Los Angeles, California, USA',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Place of birth cannot exceed 200 characters' })
  placeOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: Gender,
    example: 'male',
  })
  @IsOptional()
  @IsEnum(Gender, { message: 'Invalid gender selection' })
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Additional notes or prompt',
    example: 'Excited to join the team! I have 8 years of experience...',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Prompt cannot exceed 5000 characters' })
  prompt?: string;
}

/**
 * DTO for email form submission (HTML form POST)
 * This is a simplified version for the embedded email form
 */
export class EmailFormSubmissionDto {
  @ApiProperty({
    description: 'Evaluation token received via email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @ApiProperty({
    description: 'Date of birth (YYYY-MM-DD format)',
    example: '1990-05-15',
  })
  @IsDateString({}, { message: 'Date of birth must be a valid date' })
  @IsNotEmpty({ message: 'Date of birth is required' })
  birthDate: string;

  @ApiPropertyOptional({
    description: 'Time of birth (HH:MM format)',
    example: '14:30',
  })
  @IsOptional()
  @IsString()
  birthTime?: string;

  @ApiProperty({
    description: 'Place of birth (City, Country)',
    example: 'New York, USA',
  })
  @IsString()
  @IsNotEmpty({ message: 'Place of birth is required' })
  @MaxLength(200)
  birthPlace: string;

  @ApiProperty({
    description: 'Gender',
    enum: Gender,
  })
  @IsEnum(Gender, { message: 'Invalid gender selection' })
  @IsNotEmpty({ message: 'Gender is required' })
  gender: Gender;
}

export class GetEmployeeByTokenDto {
  @ApiProperty({
    description: 'Evaluation token received via email',
    example: 'abc123xyz789...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;
}
