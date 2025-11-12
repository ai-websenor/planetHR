import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('PlanetsHR API')
    .setDescription('AI-Powered HR Analytics Platform Backend API')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Organizations', 'Organization management')
    .addTag('Users', 'User management and profiles')
    .addTag('Employees', 'Employee management and analysis')
    .addTag('Reports', 'Report generation and management')
    .addTag('Payments', 'Subscription and payment management')
    .addTag('Chat', 'AI chat and consultation')
    .addTag('Email', 'Email notifications and communication')
    .addTag('Departments', 'Department management')
    .addTag('Branches', 'Branch management')
    .addTag('Notifications', 'Real-time notifications')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    // Don't apply security globally - let individual endpoints specify via @ApiBearerAuth
    ignoreGlobalPrefix: false,
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
    customfavIcon: '/favicon.ico',
    customSiteTitle: 'PlanetsHR API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b4151; }
    `,
  });

  console.log(`📚 Swagger UI available at: /api/docs`);
}