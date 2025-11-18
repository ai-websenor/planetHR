import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NormalizedHarmonic } from './base-harmonics.schema';

export interface HiddenStrength {
  harmonicNumber: number;
  toneTag: string;
  cluster: string;
}

export interface PromotionReadiness {
  score: number;
  recommendedNextRole: string;
  traitsToNurture: string[];
  timingRecommendation: string;
  hiddenStrengths: HiddenStrength[];
}

@Schema({ timestamps: true })
export class RoleInsights extends Document {
  @Prop({ required: true, index: true })
  employeeId: string;

  @Prop({ required: true, index: true })
  organization: string;

  @Prop({
    required: true,
    index: true,
    enum: ['owner', 'leader', 'manager', 'operational'],
  })
  role: string;

  @Prop({ type: Array, required: true })
  baseInsights: NormalizedHarmonic[];

  @Prop({ type: Array })
  ageInsights: NormalizedHarmonic[];

  @Prop({
    type: {
      score: { type: Number, required: true },
      recommendedNextRole: { type: String, required: true },
      traitsToNurture: { type: [String], required: true },
      timingRecommendation: { type: String, required: true },
      hiddenStrengths: { type: Array, required: true },
    },
    required: true,
  })
  promotionReadiness: PromotionReadiness;

  @Prop({ required: true })
  calculatedAt: Date;
}

export const RoleInsightsSchema = SchemaFactory.createForClass(RoleInsights);

// Indexes for performance
RoleInsightsSchema.index({ employeeId: 1, role: 1 }, { unique: true });
RoleInsightsSchema.index({ organization: 1, role: 1 });
RoleInsightsSchema.index({ 'promotionReadiness.score': -1 });
