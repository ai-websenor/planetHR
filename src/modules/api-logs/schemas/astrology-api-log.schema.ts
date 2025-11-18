import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AstrologyApiLog extends Document {
  @Prop({ required: true, index: true })
  employeeId: string;

  @Prop({ required: true, index: true })
  organization: string;

  @Prop({ required: true })
  endpoint: string;

  @Prop({ type: Object, required: true })
  requestData: {
    day: number;
    month: number;
    year: number;
    hour: number;
    min: number;
    lat: number;
    lon: number;
    tzone: number;
  };

  @Prop({ type: Object })
  birthInfo: {
    city: string;
    country: string;
    birthDate: Date;
    birthTime: string;
  };

  @Prop({ required: true, index: true })
  status: 'success' | 'failed';

  @Prop()
  httpStatus: number;

  @Prop()
  responseTime: number; // milliseconds

  @Prop()
  planetsExtracted: number;

  @Prop()
  housesExtracted: number;

  @Prop({ type: Object })
  errorDetails: {
    message: string;
    code: string;
    apiResponse: any;
  };

  @Prop({ type: Array })
  planetNames: string[];

  @Prop({ type: Object })
  apiMetadata: {
    apiVersion: string;
    subscriptionPlan: string;
    creditsUsed: number;
  };

  @Prop({ index: true })
  requestedAt: Date;

  @Prop()
  completedAt: Date;
}

export const AstrologyApiLogSchema =
  SchemaFactory.createForClass(AstrologyApiLog);

// Create compound indexes for common queries
AstrologyApiLogSchema.index({ employeeId: 1, createdAt: -1 });
AstrologyApiLogSchema.index({ organization: 1, status: 1, createdAt: -1 });
AstrologyApiLogSchema.index({ status: 1, requestedAt: -1 });
