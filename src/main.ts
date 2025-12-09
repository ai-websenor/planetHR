import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { ValidationError } from 'class-validator';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe webhooks
  });

  const configService = app.get(ConfigService);

  // Global request logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Security middleware (relaxed for Swagger in development)
  const isDevelopment = configService.get('NODE_ENV') === 'development';

  if (isDevelopment) {
    // Minimal security for development to allow Swagger UI
    app.use(helmet({
      contentSecurityPolicy: false,
      hsts: false,
    }));
  } else {
    // Production security
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
    }));
  }

  app.use(compression());

  // Global validation pipe with custom error formatting
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints;
          if (constraints) {
            // Return only the first constraint message for each field
            return Object.values(constraints)[0];
          }
          return `${error.property} has invalid value`;
        });
        return new BadRequestException(messages);
      },
    }),
  );

  // Global exception filter for validation errors
  app.useGlobalFilters(new ValidationExceptionFilter());

  // CORS configuration
  if (configService.get('features.enableCors')) {
    app.enableCors({
      origin: configService.get('app.allowedOrigins') as string[],
      credentials: true,
    });
  }

  // Rate limiting
  app.use(
    '/api',
    rateLimit({
      windowMs: 1500 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      validate: { xForwardedForHeader: false }, // Disable X-Forwarded-For validation
    }),
  );

  // Specific rate limiting for auth endpoints
  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 100 * 60 * 1000,
      max: isDevelopment ? 100 : 100, // More lenient in development
      message: 'Too many auth requests, please try again later.',
      validate: { xForwardedForHeader: false }, // Disable X-Forwarded-For validation
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  if (configService.get('features.enableSwagger')) {
    setupSwagger(app);
  }

  // Start server
  const port = configService.get('port') as number || 3003;
  await app.listen(port);

  console.log(`🚀 PlanetsHR API is running on: http://localhost:${port}`);
  if (configService.get('features.enableSwagger')) {
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
