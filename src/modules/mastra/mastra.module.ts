import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MastraService } from './mastra.service';
import {
  Employee,
  EmployeeSchema,
} from '../employees/schemas/employee.schema';
import { Report, ReportSchema } from '../reports/schemas/report.schema';
import { HarmonicsModule } from '../harmonics/harmonics.module';
import { ApiLogsModule } from '../api-logs/api-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Report.name, schema: ReportSchema },
    ]),
    HarmonicsModule,
    ApiLogsModule,
  ],
  providers: [MastraService],
  exports: [MastraService],
})
export class MastraModule {}