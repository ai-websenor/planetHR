import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as crypto from 'crypto';

export type EvaluationStatus = 'pending' | 'email_sent' | 'form_opened' | 'completed';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say' | '';

@Schema({ timestamps: true })
export class Employee extends Document {
  @Prop({
    type: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: false }
    },
    required: true
  })
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };

  @Prop({
    type: {
      role: { type: String, required: true },
      department: { type: String, required: true },
      startDate: { type: Date, required: true },
      employeeType: { type: String, enum: ['full-time', 'part-time', 'contractor'], required: true },
      level: { type: String, required: true }
    },
    required: true
  })
  professionalInfo: {
    role: string;
    department: string;
    startDate: Date;
    employeeType: 'full-time' | 'part-time' | 'contractor';
    level: string;
  };

  // Birth data - now optional, to be filled by employee via evaluation form
  @Prop({
    type: {
      birthDate: { type: Date, required: false },
      birthTime: { type: String, required: false },
      birthLocation: {
        city: { type: String, required: false },
        country: { type: String, required: false },
        latitude: { type: Number, required: false },
        longitude: { type: Number, required: false },
        timezone: { type: Number, required: false }
      }
    },
    required: false
  })
  birthData?: {
    birthDate?: Date;
    birthTime?: string;
    birthLocation?: {
      city?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      timezone?: number;
    };
  };

  // Gender - to be filled by employee via evaluation form
  @Prop({
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say', ''],
    default: ''
  })
  gender: Gender;

  // Additional prompt/notes from employee
  @Prop({ type: String, maxlength: 5000 })
  prompt?: string;

  // ==========================================
  // EVALUATION TOKEN & STATUS
  // ==========================================
  @Prop({ type: String, unique: true, sparse: true })
  evaluationToken?: string;

  @Prop({ type: Date })
  tokenExpiresAt?: Date;

  @Prop({
    type: String,
    enum: ['pending', 'email_sent', 'form_opened', 'completed'],
    default: 'pending'
  })
  evaluationStatus: EvaluationStatus;

  @Prop({ type: Date })
  evaluationEmailSentAt?: Date;

  @Prop({ type: Number, default: 0 })
  evaluationEmailCount: number;

  @Prop({ type: Date })
  evaluationFormSubmittedAt?: Date;

  @Prop({ type: Object })
  energyCode: {
    astrologicalData: {
      planets: Record<string, any>;
      houses: any[];
      aspects: any[];
    };
    harmonicReferences: {
      hasBaseHarmonics: boolean;
      hasAgeHarmonics: boolean;
      lastCalculated: Date;
      nextUpdate: Date;
    };
    quickInsights: {
      topEnergyCodes: string[];
      dominantCluster: string;
      currentRole: string;
    };
    traits: string[];
    harmonicFrequency: string[];
  };

  @Prop({ type: Object })
  processingStatus: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    stage: string;
    progress: number;
    lastUpdated: Date;
    completedReports: string[];
    jobId?: string;
  };

  @Prop({ required: true })
  organization: string;

  @Prop({ 
    type: {
      userId: { type: String, required: true },
      role: { type: String, required: true },
      timestamp: { type: Date, required: true }
    },
    required: true 
  })
  addedBy: {
    userId: string;
    role: string;
    timestamp: Date;
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);

// Indexes for performance
EmployeeSchema.index({ organization: 1, isActive: 1 });
EmployeeSchema.index({ 'addedBy.userId': 1 });
EmployeeSchema.index({ 'processingStatus.status': 1 });
EmployeeSchema.index({ 'energyCode.harmonicReferences.nextUpdate': 1 });
EmployeeSchema.index({ evaluationToken: 1 });
EmployeeSchema.index({ evaluationStatus: 1 });
EmployeeSchema.index({ 'personalInfo.email': 1 });

// ==========================================
// INSTANCE METHODS
// ==========================================

// Generate unique evaluation token
EmployeeSchema.methods.generateEvaluationToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.evaluationToken = token;
  this.tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return token;
};

// Check if token is valid
EmployeeSchema.methods.isTokenValid = function(): boolean {
  if (!this.evaluationToken || !this.tokenExpiresAt) {
    return false;
  }
  return new Date() < this.tokenExpiresAt;
};

// Mark evaluation as completed
EmployeeSchema.methods.markEvaluationCompleted = function(): void {
  this.evaluationStatus = 'completed';
  this.evaluationFormSubmittedAt = new Date();
  this.evaluationToken = null; // Clear token after use
};

// ==========================================
// STATICS
// ==========================================

// Find employee by evaluation token
EmployeeSchema.statics.findByEvaluationToken = async function(token: string) {
  return this.findOne({
    evaluationToken: token,
    evaluationStatus: { $ne: 'completed' }
  });
};