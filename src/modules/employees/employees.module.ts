import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { EmployeeQueueService } from './services/employee-queue.service';
import { EmployeeOnboardingProcessor } from './processors/employee-onboarding.processor';

import { Employee, EmployeeSchema } from './schemas/employee.schema';
import { Report, ReportSchema } from '../reports/schemas/report.schema';
import { Organization, OrganizationSchema } from '../organizations/schemas/organization.schema';
import { JobRole, JobRoleSchema } from '../job-roles/schemas/job-role.schema';

import { NotificationModule } from '../notifications/notification.module';
import { EmailModule } from '../email/email.module';
import { MastraModule } from '../mastra/mastra.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: JobRole.name, schema: JobRoleSchema },
    ]),
    BullModule.registerQueue({
      name: 'employee-onboarding',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    NotificationModule,
    EmailModule,
    MastraModule,
  ],
  controllers: [EmployeesController],
  providers: [
    EmployeesService,
    EmployeeQueueService,
    EmployeeOnboardingProcessor,
  ],
  exports: [EmployeesService, EmployeeQueueService],
})
export class EmployeesModule {}