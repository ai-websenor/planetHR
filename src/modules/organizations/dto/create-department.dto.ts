import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsMongoId, MinLength, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'Department name',
    example: 'Engineering',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Department description',
    example: 'Software development and engineering team',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Department culture',
    example: 'Agile and research-oriented environment',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  culture?: string;

  @ApiPropertyOptional({
    description: 'Department goals',
    example: 'Improve automation, deliver scalable software solutions',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  goals?: string;

  @ApiPropertyOptional({
    description: 'Manager user ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  managerId?: string;
}
