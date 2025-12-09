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

export enum CompanyType {
  SOLE_PROPRIETORSHIP = 'Sole Proprietorship',
  PARTNERSHIP = 'Partnership',
  LLP = 'Limited Liability Partnership (LLP)',
  PRIVATE_LIMITED = 'Private Limited Company (Pvt Ltd)',
  PUBLIC_LIMITED = 'Public Limited Company',
  OPC = 'One Person Company (OPC)',
  SECTION_8 = 'Section 8 Company (Non-Profit)',
  HUF = 'Hindu Undivided Family (HUF)',
}

@Schema({ _id: true })
export class Department {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ trim: true })
  culture: string;

  @Prop({ trim: true })
  goals: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  managerId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

export enum OfficeType {
  HEADQUARTER = 'Headquarter',
  BRANCH_OFFICE = 'Branch Office',
  REGIONAL_OFFICE = 'Regional Office',
  SATELLITE_OFFICE = 'Satellite Office',
}

@Schema({ _id: true })
export class Branch {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ enum: OfficeType, default: OfficeType.BRANCH_OFFICE })
  officeType: OfficeType;

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
  businessCategory: string;

  @Prop({ trim: true })
  industry: string;

  @Prop({ trim: true })
  subIndustry: string;

  @Prop({ trim: true })
  companyTurnover: string;

  @Prop({ trim: true })
  employeeSize: string;

  @Prop({ trim: true })
  companyCulture: string;

  @Prop({ enum: CompanyType, trim: true })
  companyType: CompanyType;

  @Prop({ trim: true })
  website: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ trim: true })
  logo: string;

  @Prop({ trim: true })
  registrationDocumentUrl: string;

  @Prop({ trim: true })
  companyProfileDocumentUrl: string;

  @Prop({ type: Number, default: 0 })
  onboardingStep: number;

  @Prop({ type: Boolean, default: false })
  onboardingCompleted: boolean;

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

  @Prop({ type: [Types.ObjectId], ref: 'ParsedDocument', default: [] })
  parsedDocuments: Types.ObjectId[];

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
