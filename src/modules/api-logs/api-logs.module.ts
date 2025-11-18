import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiLogsService } from './api-logs.service';
import { ApiLogsController } from './api-logs.controller';
import {
  AstrologyApiLog,
  AstrologyApiLogSchema,
} from './schemas/astrology-api-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AstrologyApiLog.name, schema: AstrologyApiLogSchema },
    ]),
  ],
  controllers: [ApiLogsController],
  providers: [ApiLogsService],
  exports: [ApiLogsService, MongooseModule],
})
export class ApiLogsModule {}
