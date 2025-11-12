import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
  OWNER = 'OWNER',
  LEADER = 'LEADER',
  MANAGER = 'MANAGER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, enum: UserRole, index: true })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, enum: UserStatus, default: UserStatus.PENDING_VERIFICATION })
  status: UserStatus;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Branch' }], default: [] })
  assignedBranches: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Department' }], default: [] })
  assignedDepartments: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Date })
  lastLoginAt: Date;

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop({ type: Date })
  lockedUntil: Date;

  @Prop({ select: false })
  emailVerificationToken: string;

  @Prop({ type: Date, select: false })
  emailVerificationExpires: Date;

  @Prop({ select: false })
  passwordResetToken: string;

  @Prop({ type: Date, select: false })
  passwordResetExpires: Date;

  @Prop({ type: [String], default: [], select: false })
  passwordHistory: string[];

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  // Virtual for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Virtual to check if account is locked
  get isLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  // Virtual to check if email is verified
  get isEmailVerified(): boolean {
    return this.status !== UserStatus.PENDING_VERIFICATION;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1, organizationId: 1 });
UserSchema.index({ role: 1, organizationId: 1 });
UserSchema.index({ deletedAt: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual fields
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('isLocked').get(function () {
  return this.lockedUntil && this.lockedUntil > new Date();
});

UserSchema.virtual('isEmailVerified').get(function () {
  return this.status !== UserStatus.PENDING_VERIFICATION;
});

// Enable virtuals in JSON
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).passwordHash;
    delete (ret as any).emailVerificationToken;
    delete (ret as any).emailVerificationExpires;
    delete (ret as any).passwordResetToken;
    delete (ret as any).passwordResetExpires;
    delete (ret as any).passwordHistory;
    delete (ret as any).__v;
    return ret;
  },
});

UserSchema.set('toObject', { virtuals: true });
