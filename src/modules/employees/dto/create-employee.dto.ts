import { IsNotEmpty, IsString, IsEmail, IsOptional, IsDateString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class PersonalInfoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

class ProfessionalInfoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty()
  @IsDateString()
  startDate: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  employeeType: 'full-time' | 'part-time' | 'contractor';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  level: string;
}

class BirthLocationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty()
  @IsNumber()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  longitude: number;

  @ApiProperty()
  @IsNumber()
  timezone: number;
}

class BirthDataDto {
  @ApiProperty()
  @IsDateString()
  birthDate: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  birthTime?: string;

  @ApiProperty({ type: BirthLocationDto })
  @ValidateNested()
  @Type(() => BirthLocationDto)
  birthLocation: BirthLocationDto;
}

export class CreateEmployeeDto {
  @ApiProperty({ type: PersonalInfoDto })
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personalInfo: PersonalInfoDto;

  @ApiProperty({ type: ProfessionalInfoDto })
  @ValidateNested()
  @Type(() => ProfessionalInfoDto)
  professionalInfo: ProfessionalInfoDto;

  @ApiProperty({ type: BirthDataDto })
  @ValidateNested()
  @Type(() => BirthDataDto)
  birthData: BirthDataDto;
}