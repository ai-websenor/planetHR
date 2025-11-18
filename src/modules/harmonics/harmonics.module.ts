import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BaseHarmonics,
  BaseHarmonicsSchema,
} from './schemas/base-harmonics.schema';
import {
  AgeHarmonics,
  AgeHarmonicsSchema,
} from './schemas/age-harmonics.schema';
import {
  RoleInsights,
  RoleInsightsSchema,
} from './schemas/role-insights.schema';
import { HarmonicsService } from './harmonics.service';
import { HarmonicsController } from './harmonics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BaseHarmonics.name, schema: BaseHarmonicsSchema },
      { name: AgeHarmonics.name, schema: AgeHarmonicsSchema },
      { name: RoleInsights.name, schema: RoleInsightsSchema },
    ]),
  ],
  controllers: [HarmonicsController],
  providers: [HarmonicsService],
  exports: [HarmonicsService, MongooseModule],
})
export class HarmonicsModule {}
