import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'job_roles',
})
export class JobRole extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  departmentId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  jobRole: string;

  @Prop({ required: true, trim: true })
  jobTitle: string;

  @Prop({ trim: true })
  reportingTo: string;

  @Prop({ trim: true })
  criticalAttribute: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

export const JobRoleSchema = SchemaFactory.createForClass(JobRole);

// Indexes
JobRoleSchema.index({ organizationId: 1, branchId: 1, departmentId: 1 });
JobRoleSchema.index({ jobRole: 1, organizationId: 1 });
JobRoleSchema.index({ deletedAt: 1 });

// Enable virtuals in JSON
JobRoleSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});

JobRoleSchema.set('toObject', { virtuals: true });
