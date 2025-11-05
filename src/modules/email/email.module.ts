import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmployeeNotificationService } from './services/employee-notifications.service';

@Module({
  imports: [ConfigModule],
  providers: [EmployeeNotificationService],
  exports: [EmployeeNotificationService],
})
export class EmailModule {}