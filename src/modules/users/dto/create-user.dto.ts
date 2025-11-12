import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsMongoId,
} from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @ApiProperty({
    description: 'User password (min 8 chars, must include uppercase, lowercase, number, and special character)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    description: 'User role in the organization',
    enum: UserRole,
    example: UserRole.MANAGER,
  })
  @IsEnum(UserRole, { message: 'Invalid user role' })
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Array of branch IDs the user has access to (required for LEADER role)',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  assignedBranches?: string[];

  @ApiPropertyOptional({
    description: 'Array of department IDs the user has access to (required for MANAGER role)',
    type: [String],
    example: ['507f1f77bcf86cd799439013'],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  assignedDepartments?: string[];
}
