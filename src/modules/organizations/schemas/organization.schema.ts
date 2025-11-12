import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TRIAL = 'TRIAL',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
}

@Schema({ _id: true })
export class Department {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  managerId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

@Schema({ _id: true })
export class Branch {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  address: string;

  @Prop({ trim: true })
  city: string;

  @Prop({ trim: true })
  state: string;

  @Prop({ trim: true })
  country: string;

  @Prop({ trim: true })
  zipCode: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ type: [DepartmentSchema], default: [] })
  departments: Department[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);

@Schema({
  timestamps: true,
  collection: 'organizations',
})
export class Organization extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  industry: string;

  @Prop({ trim: true })
  website: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ trim: true })
  logo: string;

  @Prop({ type: [BranchSchema], default: [] })
  branches: Branch[];

  @Prop({ required: true, enum: SubscriptionPlan, default: SubscriptionPlan.FREE })
  subscriptionPlan: SubscriptionPlan;

  @Prop({ required: true, enum: SubscriptionStatus, default: SubscriptionStatus.TRIAL })
  subscriptionStatus: SubscriptionStatus;

  @Prop({ type: String })
  stripeCustomerId: string;

  @Prop({ type: String })
  stripeSubscriptionId: string;

  @Prop({ type: Date })
  subscriptionStartDate: Date;

  @Prop({ type: Date })
  subscriptionEndDate: Date;

  @Prop({ type: Date })
  trialEndsAt: Date;

  @Prop({ default: 0 })
  employeeCount: number;

  @Prop({ default: 0 })
  reportGenerationCount: number;

  @Prop({ default: 0 })
  aiChatUsageCount: number;

  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

// Indexes
OrganizationSchema.index({ name: 1 });
OrganizationSchema.index({ subscriptionStatus: 1 });
OrganizationSchema.index({ isActive: 1 });
OrganizationSchema.index({ deletedAt: 1 });
OrganizationSchema.index({ 'branches._id': 1 });
OrganizationSchema.index({ 'branches.departments._id': 1 });

// Enable virtuals in JSON
OrganizationSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});

OrganizationSchema.set('toObject', { virtuals: true });
