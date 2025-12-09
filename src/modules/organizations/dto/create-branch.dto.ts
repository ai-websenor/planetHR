import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsEnum, MinLength, MaxLength } from 'class-validator';
import { OfficeType } from '../schemas/organization.schema';

export class CreateBranchDto {
  @ApiProperty({
    description: 'Branch name',
    example: 'New York Office',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Office type',
    example: 'Headquarter',
    enum: OfficeType,
  })
  @IsOptional()
  @IsEnum(OfficeType)
  officeType?: OfficeType;

  @ApiPropertyOptional({
    description: 'Branch address',
    example: '123 Main Street',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'New York',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State/Province',
    example: 'NY',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'USA',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'ZIP/Postal code',
    example: '10001',
  })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+1-212-555-0100',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'newyork@acmecorp.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
