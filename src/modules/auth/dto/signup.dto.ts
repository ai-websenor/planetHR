import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'matchPassword', async: false })
export class MatchPasswordConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const object = args.object as SignupDto;
    return confirmPassword === object.password;
  }

  defaultMessage() {
    return 'Passwords do not match';
  }
}

export class SignupDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Phone number without country code',
    example: '9876543210',
  })
  @IsString()
  @Matches(/^[0-9]{10,15}$/, { message: 'Phone number must be 10-15 digits' })
  phone: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @ApiProperty({
    description: 'Password (min 8 chars, must include uppercase, lowercase, number, and special character)',
    example: 'Password@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @ApiProperty({
    description: 'Confirm password - must match password',
    example: 'Password@123',
  })
  @IsString()
  @Validate(MatchPasswordConstraint)
  confirm_password: string;

  @ApiProperty({
    description: 'User must accept terms and conditions',
    example: true,
  })
  @IsBoolean()
  termsAccepted: boolean;

  @ApiProperty({
    description: 'Country dialing code',
    example: '+91',
  })
  @IsString()
  @Matches(/^\+[0-9]{1,4}$/, { message: 'Invalid dialing code format (e.g., +91)' })
  dialing_code: string;
}
