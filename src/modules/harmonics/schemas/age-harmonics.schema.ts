import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type {
  HarmonicScore,
  NormalizedHarmonic,
  Statistics,
  PlanetPosition,
} from './base-harmonics.schema';

@Schema({ timestamps: true })
export class AgeHarmonics extends Document {
  @Prop({ required: true, index: true })
  employeeId: string;

  @Prop({ required: true, index: true })
  organization: string;

  @Prop({ required: true, index: true })
  calculatedForDate: Date;

  @Prop({ required: true })
  decimalAge: number;

  @Prop({ type: Array, required: true })
  rawScores: HarmonicScore[];

  @Prop({ type: Object, required: true })
  statistics: Statistics;

  @Prop({ type: Array, required: true })
  normalizedScores: NormalizedHarmonic[];

  @Prop({
    type: {
      coreTrait: { type: Array, required: true },
      highTrait: { type: Array, required: true },
      supportTrait: { type: Array, required: true },
      neutralTrait: { type: Array, required: true },
      suppressedTrait: { type: Array, required: true },
      latentTrait: { type: Array, required: true },
    },
    required: true,
  })
  topHarmonicsByCluster: {
    coreTrait: NormalizedHarmonic[];
    highTrait: NormalizedHarmonic[];
    supportTrait: NormalizedHarmonic[];
    neutralTrait: NormalizedHarmonic[];
    suppressedTrait: NormalizedHarmonic[];
    latentTrait: NormalizedHarmonic[];
  };

  @Prop({ type: Array, required: true })
  progressedPositions: PlanetPosition[];

  @Prop({ required: true })
  calculatedAt: Date;
}

export const AgeHarmonicsSchema = SchemaFactory.createForClass(AgeHarmonics);

// Indexes for performance
AgeHarmonicsSchema.index({ employeeId: 1, calculatedForDate: -1 });
AgeHarmonicsSchema.index({ organization: 1, calculatedForDate: -1 });
AgeHarmonicsSchema.index({ employeeId: 1, decimalAge: 1 });
