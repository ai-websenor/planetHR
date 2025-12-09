import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { validate } from './config/config.validation';

// Import authentication modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { AuditModule } from './modules/audit/audit.module';

// Import feature modules
import { EmployeesModule } from './modules/employees/employees.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { EmailModule } from './modules/email/email.module';
import { MastraModule } from './modules/mastra/mastra.module';
import { HarmonicsModule } from './modules/harmonics/harmonics.module';
import { ApiLogsModule } from './modules/api-logs/api-logs.module';
import { UploadModule } from './modules/upload/upload.module';
import { JobRolesModule } from './modules/job-roles/job-roles.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DocumentParserModule } from './modules/document-parser/document-parser.module';

// Import guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri:
          process.env.MONGODB_URI || 'mongodb://localhost:27017/planetshr_dev',
      }),
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD,
        },
      }),
    }),
    ScheduleModule.forRoot(),
    // Authentication & Authorization modules
    AuthModule,
    UsersModule,
    OrganizationsModule,
    AuditModule,
    // Feature modules
    EmployeesModule,
    ReportsModule,
    NotificationModule,
    EmailModule,
    MastraModule,
    HarmonicsModule,
    ApiLogsModule,
    UploadModule,
    JobRolesModule,
    OnboardingModule,
    DashboardModule,
    DocumentParserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
