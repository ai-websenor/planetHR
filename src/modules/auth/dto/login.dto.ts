import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsBoolean, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional({
    description: 'Remember me for extended session (30 days)',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  remember_me?: boolean;
}
