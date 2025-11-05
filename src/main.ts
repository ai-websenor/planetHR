import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe webhooks
  });

  const configService = app.get(ConfigService);

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

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

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
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    }),
  );

  // Specific rate limiting for auth endpoints
  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5, // 5 login attempts per 15 minutes
    }),
  );

  // Swagger documentation
  if (configService.get('features.enableSwagger')) {
    setupSwagger(app);
  }

  // Global prefix
  app.setGlobalPrefix('api');

  // Start server
  const port = configService.get('port') as number || 3000;
  await app.listen(port);

  console.log(`🚀 PlanetsHR API is running on: http://localhost:${port}`);
  if (configService.get('features.enableSwagger')) {
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
