import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsDateString,
  IsEnum,
  Matches,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

class BirthLocationSubmitDto {
  @ApiProperty({ description: 'City of birth', example: 'New York' })
  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  city: string;

  @ApiProperty({ description: 'Country of birth', example: 'USA' })
  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  country: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate', example: 40.7128 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate', example: -74.006 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Timezone offset', example: -5 })
  @IsOptional()
  @IsNumber()
  timezone?: number;
}

export class SubmitEvaluationFormDto {
  @ApiProperty({
    description: 'Evaluation token received via email',
    example: 'abc123xyz789...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @ApiPropertyOptional({
    description: 'Department ID (if employee needs to select/update)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Job Title/Role ID (if employee needs to select/update)',
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsString()
  jobTitleId?: string;

  @ApiProperty({
    description: 'Date of birth (ISO 8601 format)',
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
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:MM format',
  })
  birthTime?: string;

  @ApiProperty({
    type: BirthLocationSubmitDto,
    description: 'Birth location details',
  })
  @ValidateNested()
  @Type(() => BirthLocationSubmitDto)
  birthLocation: BirthLocationSubmitDto;

  @ApiProperty({
    description: 'Gender',
    enum: Gender,
    example: 'male',
  })
  @IsEnum(Gender, { message: 'Invalid gender selection' })
  @IsNotEmpty({ message: 'Gender is required' })
  gender: Gender;

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

export class GetEmployeeByTokenResponseDto {
  @ApiProperty({ description: 'Employee ID' })
  id: string;

  @ApiProperty({ description: 'Employee first name' })
  firstName: string;

  @ApiProperty({ description: 'Employee last name' })
  lastName: string;

  @ApiProperty({ description: 'Employee email' })
  email: string;

  @ApiPropertyOptional({ description: 'Employee phone' })
  phone?: string;

  @ApiProperty({ description: 'Job role' })
  role: string;

  @ApiProperty({ description: 'Department' })
  department: string;

  @ApiPropertyOptional({ description: 'Existing birth date if any' })
  birthDate?: Date;

  @ApiPropertyOptional({ description: 'Existing birth time if any' })
  birthTime?: string;

  @ApiPropertyOptional({ description: 'Existing birth location if any' })
  birthLocation?: {
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    timezone?: number;
  };

  @ApiPropertyOptional({ description: 'Existing gender if any' })
  gender?: string;

  @ApiPropertyOptional({ description: 'Existing prompt if any' })
  prompt?: string;

  @ApiProperty({ description: 'Evaluation status' })
  evaluationStatus: string;

  @ApiProperty({ description: 'Token expiry date' })
  tokenExpiresAt: Date;
}
