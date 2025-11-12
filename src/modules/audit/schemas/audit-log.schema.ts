import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',

  // Authorization events
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SCOPE_VIOLATION = 'SCOPE_VIOLATION',

  // User management events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_SCOPE_CHANGED = 'USER_SCOPE_CHANGED',

  // Organization management
  ORGANIZATION_CREATED = 'ORGANIZATION_CREATED',
  ORGANIZATION_UPDATED = 'ORGANIZATION_UPDATED',
  BRANCH_CREATED = 'BRANCH_CREATED',
  BRANCH_UPDATED = 'BRANCH_UPDATED',
  DEPARTMENT_CREATED = 'DEPARTMENT_CREATED',
  DEPARTMENT_UPDATED = 'DEPARTMENT_UPDATED',

  // Data access events
  EMPLOYEE_VIEWED = 'EMPLOYEE_VIEWED',
  EMPLOYEE_CREATED = 'EMPLOYEE_CREATED',
  EMPLOYEE_UPDATED = 'EMPLOYEE_UPDATED',
  EMPLOYEE_DELETED = 'EMPLOYEE_DELETED',
  REPORT_GENERATED = 'REPORT_GENERATED',
  REPORT_VIEWED = 'REPORT_VIEWED',
  AI_CHAT_USED = 'AI_CHAT_USED',

  // Security events
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  SESSION_HIJACKING_DETECTED = 'SESSION_HIJACKING_DETECTED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ResourceType {
  USER = 'USER',
  ORGANIZATION = 'ORGANIZATION',
  BRANCH = 'BRANCH',
  DEPARTMENT = 'DEPARTMENT',
  EMPLOYEE = 'EMPLOYEE',
  REPORT = 'REPORT',
  AI_CHAT = 'AI_CHAT',
  SESSION = 'SESSION',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'audit_logs',
})
export class AuditLog extends Document {
  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ index: true })
  userEmail: string;

  @Prop()
  userRole: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch' })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId: Types.ObjectId;

  @Prop({ required: true, enum: AuditEventType, index: true })
  eventType: AuditEventType;

  @Prop({ required: true })
  actionName: string;

  @Prop({ enum: ResourceType })
  resourceType: ResourceType;

  @Prop({ type: Types.ObjectId })
  resourceId: Types.ObjectId;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ required: true, default: true })
  success: boolean;

  @Prop({ required: true, enum: AuditSeverity, default: AuditSeverity.LOW })
  severity: AuditSeverity;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop()
  errorMessage: string;

  @Prop()
  requestPath: string;

  @Prop()
  requestMethod: string;

  @Prop()
  responseStatusCode: number;

  @Prop()
  requestId: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Indexes for efficient querying
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ organizationId: 1, timestamp: -1 });
AuditLogSchema.index({ eventType: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ severity: 1, timestamp: -1 });
AuditLogSchema.index({ success: 1, timestamp: -1 });

// TTL index for 2-year retention (63072000 seconds = 2 years)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

// Enable virtuals in JSON
AuditLogSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});

AuditLogSchema.set('toObject', { virtuals: true });
