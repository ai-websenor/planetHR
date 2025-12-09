import { IsNotEmpty, IsString, IsEmail, IsOptional, IsDateString, IsNumber, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PersonalInfoDto {
  @ApiProperty({ description: 'Employee first name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Employee last name', example: 'Smith' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Employee email address', example: 'john.smith@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Employee phone number', example: '+1-555-123-4567' })
  @IsOptional()
  @IsString()
  phone?: string;
}

class ProfessionalInfoDto {
  @ApiProperty({ description: 'Job role/title', example: 'Software Engineer' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({ description: 'Department name', example: 'Engineering' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ description: 'Employment start date', example: '2024-01-15' })
  @IsDateString()
  startDate: Date;

  @ApiProperty({ description: 'Employment type', enum: ['full-time', 'part-time', 'contractor'] })
  @IsString()
  @IsNotEmpty()
  employeeType: 'full-time' | 'part-time' | 'contractor';

  @ApiProperty({ description: 'Job level', example: 'Senior' })
  @IsString()
  @IsNotEmpty()
  level: string;
}

class BirthLocationDto {
  @ApiPropertyOptional({ description: 'City of birth', example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Country of birth', example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

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

class BirthDataDto {
  @ApiPropertyOptional({ description: 'Date of birth', example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: Date;

  @ApiPropertyOptional({ description: 'Time of birth (HH:MM format)', example: '14:30' })
  @IsOptional()
  @IsString()
  birthTime?: string;

  @ApiPropertyOptional({ type: BirthLocationDto, description: 'Birth location details' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BirthLocationDto)
  birthLocation?: BirthLocationDto;
}

export class CreateEmployeeDto {
  @ApiProperty({ type: PersonalInfoDto, description: 'Personal information' })
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personalInfo: PersonalInfoDto;

  @ApiProperty({ type: ProfessionalInfoDto, description: 'Professional information' })
  @ValidateNested()
  @Type(() => ProfessionalInfoDto)
  professionalInfo: ProfessionalInfoDto;

  @ApiPropertyOptional({
    type: BirthDataDto,
    description: 'Birth data (optional - can be filled later via evaluation form)'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BirthDataDto)
  birthData?: BirthDataDto;

  @ApiPropertyOptional({
    description: 'Send evaluation form email to employee to fill birth details',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  sendEvaluationEmail?: boolean;
}