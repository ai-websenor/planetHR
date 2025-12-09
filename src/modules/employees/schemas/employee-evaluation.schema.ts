import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as crypto from 'crypto';

export type EvaluationStatus = 'pending' | 'in_progress' | 'completed' | 'expired';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say' | '';

@Schema({ timestamps: true })
export class EmployeeEvaluation extends Document {
  // ==========================================
  // ADMIN-CREATED FIELDS (Initial Creation)
  // ==========================================
  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    match: /^\S+@\S+\.\S+$/
  })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  // ==========================================
  // TOKEN & STATUS MANAGEMENT
  // ==========================================
  @Prop({ type: String, unique: true, sparse: true })
  evaluationToken: string;

  @Prop({ type: Date })
  tokenExpiresAt: Date;

  @Prop({
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'expired'],
    default: 'pending'
  })
  status: EvaluationStatus;

  // ==========================================
  // EMPLOYEE-SUBMITTED FIELDS (From Form)
  // ==========================================
  @Prop({ trim: true })
  jobDepartment: string;

  @Prop({ trim: true })
  jobTitle: string;

  @Prop({ trim: true, maxlength: 2000 })
  jobDescription: string;

  @Prop({ trim: true })
  officeLocation: string;

  // Personal Information
  @Prop({ type: Date })
  dob: Date;

  @Prop({ trim: true }) // Time of birth (HH:MM format)
  tob: string;

  @Prop({ trim: true })
  placeOfBirth: string;

  @Prop({
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say', ''],
    default: ''
  })
  gender: Gender;

  // Custom Prompt/Notes
  @Prop({ trim: true, maxlength: 5000 })
  prompt: string;

  // ==========================================
  // METADATA
  // ==========================================
  @Prop({ type: Date })
  formSubmittedAt: Date;

  @Prop({ type: Date })
  emailSentAt: Date;

  @Prop({ type: Number, default: 0 })
  emailSentCount: number;

  // Organization reference
  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  // ==========================================
  // METHODS (defined in schema factory)
  // ==========================================
}

export const EmployeeEvaluationSchema = SchemaFactory.createForClass(EmployeeEvaluation);

// ==========================================
// INDEXES
// ==========================================
EmployeeEvaluationSchema.index({ email: 1 });
EmployeeEvaluationSchema.index({ evaluationToken: 1 });
EmployeeEvaluationSchema.index({ status: 1 });
EmployeeEvaluationSchema.index({ organizationId: 1 });
EmployeeEvaluationSchema.index({ createdBy: 1 });

// ==========================================
// INSTANCE METHODS
// ==========================================

// Generate unique evaluation token
EmployeeEvaluationSchema.methods.generateEvaluationToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.evaluationToken = token;
  this.tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return token;
};

// Check if token is valid
EmployeeEvaluationSchema.methods.isTokenValid = function(): boolean {
  if (!this.evaluationToken || !this.tokenExpiresAt) {
    return false;
  }
  return new Date() < this.tokenExpiresAt;
};

// Mark form as completed
EmployeeEvaluationSchema.methods.markAsCompleted = function(): void {
  this.status = 'completed';
  this.formSubmittedAt = new Date();
};

// ==========================================
// STATICS
// ==========================================

// Find employee by token
EmployeeEvaluationSchema.statics.findByToken = async function(token: string) {
  return this.findOne({
    evaluationToken: token,
    status: { $ne: 'completed' }
  });
};

// ==========================================
// PRE-SAVE HOOKS
// ==========================================
EmployeeEvaluationSchema.pre('save', function(next) {
  // Auto-expire old tokens
  if (this.tokenExpiresAt && new Date() > this.tokenExpiresAt && this.status !== 'completed') {
    this.status = 'expired';
  }
  next();
});
