import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmployeeNotificationService } from './services/employee-notifications.service';
import { AuthEmailService } from './services/auth-email.service';

@Module({
  imports: [ConfigModule],
  providers: [EmployeeNotificationService, AuthEmailService],
  exports: [EmployeeNotificationService, AuthEmailService],
})
export class EmailModule {}