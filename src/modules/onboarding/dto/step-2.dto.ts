import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

export enum OfficeTypeEnum {
  HEADQUARTER = 'Headquarter',
  BRANCH_OFFICE = 'Branch Office',
  REGIONAL_OFFICE = 'Regional Office',
  SATELLITE_OFFICE = 'Satellite Office',
}

// Single location item
export class LocationItemDto {
  @ApiProperty({
    description: 'Office/Branch name',
    example: 'Corporate Head Office',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  office_name: string;

  @ApiProperty({
    description: 'Office type',
    example: 'Headquarter',
    enum: OfficeTypeEnum,
  })
  @IsEnum(OfficeTypeEnum)
  office_type: OfficeTypeEnum;

  @ApiProperty({
    description: 'Country',
    example: 'India',
  })
  @IsString()
  @MaxLength(100)
  country: string;

  @ApiProperty({
    description: 'State',
    example: 'Rajasthan',
  })
  @IsString()
  @MaxLength(100)
  state: string;

  @ApiProperty({
    description: 'City',
    example: 'Udaipur',
  })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({
    description: 'Full address',
    example: '123 City Center Road, Udaipur, Rajasthan',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}

// Main DTO that accepts array of locations
export class OnboardingStep2Dto {
  @ApiProperty({
    description: 'Array of office locations',
    type: [LocationItemDto],
    example: [
      {
        office_name: 'Corporate Head Office',
        office_type: 'Headquarter',
        country: 'India',
        state: 'Rajasthan',
        city: 'Udaipur',
        address: '123 City Center Road',
      },
      {
        office_name: 'Branch Office Mumbai',
        office_type: 'Branch Office',
        country: 'India',
        state: 'Maharashtra',
        city: 'Mumbai',
        address: '456 Business Park',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => LocationItemDto)
  locations: LocationItemDto[];
}
