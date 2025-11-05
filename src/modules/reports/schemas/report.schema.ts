import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Report extends Document {
  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true })
  reportType: 'personality' | 'role' | 'department' | 'industry' | 'team' | 'training';

  @Prop({ required: true })
  viewerRole: 'owner' | 'leader' | 'manager';

  @Prop({ required: true, type: String })
  content: string;

  @Prop({ type: Object })
  metadata: {
    wordCount: number;
    estimatedReadTime: number;
    confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    energyCodeBase: string;
    generationTime: number;
    aiModel: string;
    version: string;
  };

  @Prop({ required: true })
  generatedAt: Date;

  @Prop({ required: true })
  validUntil: Date;

  @Prop({ required: true })
  organization: string;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ type: [String], default: [] })
  viewedBy: string[];

  @Prop({ default: false })
  isArchived: boolean;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// Indexes for performance
ReportSchema.index({ employeeId: 1, reportType: 1, viewerRole: 1 }, { unique: true });
ReportSchema.index({ organization: 1, generatedAt: -1 });
ReportSchema.index({ validUntil: 1 });
ReportSchema.index({ isArchived: 1 });