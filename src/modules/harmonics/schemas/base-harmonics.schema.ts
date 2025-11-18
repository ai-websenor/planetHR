import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface HarmonicScore {
  harmonicNumber: number;
  score: number;
}

export interface NormalizedHarmonic {
  harmonicNumber: number;
  energyCode: string;
  name: string;
  toneTag: string;
  rawScore: number;
  zScore: number;
  percentile: number;
  cluster: string;
  category: string;
  coreExpression: string;
  businessApplication: string;
}

export interface Statistics {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
}

export interface PlanetPosition {
  planetName: string;
  longitude: number;
}

@Schema({ timestamps: true })
export class BaseHarmonics extends Document {
  @Prop({ required: true, unique: true, index: true })
  employeeId: string;

  @Prop({ required: true, index: true })
  organization: string;

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
  natalPositions: PlanetPosition[];

  @Prop({ required: true })
  calculatedAt: Date;
}

export const BaseHarmonicsSchema =
  SchemaFactory.createForClass(BaseHarmonics);

// Indexes for performance
BaseHarmonicsSchema.index({ employeeId: 1 }, { unique: true });
BaseHarmonicsSchema.index({ organization: 1, calculatedAt: -1 });
BaseHarmonicsSchema.index({ 'topHarmonicsByCluster.coreTrait.harmonicNumber': 1 });
