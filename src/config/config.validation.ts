import { plainToClass } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsNumber()
  PORT: number;

  @IsString()
  MONGODB_URI: string;

  @IsString()
  JWT_SECRET: string;

  @IsOptional()
  @IsString()
  OPENAI_API_KEY?: string;

  @IsOptional()
  @IsString()
  MASTRA_API_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_SECRET_KEY?: string;

  @IsString()
  SMTP_HOST: string;

  @IsOptional()
  @IsBoolean()
  ENABLE_SWAGGER?: boolean;

  @IsOptional()
  @IsBoolean()
  ENABLE_CORS?: boolean;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation error: ${errors.map((e) => Object.values(e.constraints || {})).join(', ')}`,
    );
  }

  return validatedConfig;
}
