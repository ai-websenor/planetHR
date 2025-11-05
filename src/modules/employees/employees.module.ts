import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';

import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { EmployeeQueueService } from './services/employee-queue.service';
import { EmployeeOnboardingProcessor } from './processors/employee-onboarding.processor';

import { Employee, EmployeeSchema } from './schemas/employee.schema';
import { Report, ReportSchema } from '../reports/schemas/report.schema';

import { NotificationModule } from '../notifications/notification.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Report.name, schema: ReportSchema },
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