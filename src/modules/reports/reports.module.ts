import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './schemas/report.schema';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { MastraModule } from '../mastra/mastra.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
    ]),
    forwardRef(() => MastraModule),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [MongooseModule, ReportsService],
})
export class ReportsModule {}