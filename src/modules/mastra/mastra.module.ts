import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MastraService } from './mastra.service';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { Report, ReportSchema } from '../reports/schemas/report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Report.name, schema: ReportSchema },
    ]),
  ],
  providers: [MastraService],
  exports: [MastraService],
})
export class MastraModule {}