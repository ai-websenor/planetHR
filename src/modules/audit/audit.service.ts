import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AuditLog,
  AuditEventType,
  AuditSeverity,
  ResourceType,
} from './schemas/audit-log.schema';

export interface CreateAuditLogDto {
  userId?: Types.ObjectId;
  userEmail?: string;
  userRole?: string;
  organizationId: Types.ObjectId;
  branchId?: Types.ObjectId;
  departmentId?: Types.ObjectId;
  eventType: AuditEventType;
  actionName: string;
  resourceType?: ResourceType;
  resourceId?: Types.ObjectId;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
  errorMessage?: string;
  requestPath?: string;
  requestMethod?: string;
  responseStatusCode?: number;
  requestId?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
  ) {}

  /**
   * Create audit log entry
   */
  async log(logData: CreateAuditLogDto): Promise<void> {
    try {
      const auditLog = new this.auditLogModel({
        ...logData,
        timestamp: new Date(),
        severity: logData.severity || this.determineSeverity(logData),
      });

      // Fire and forget - don't await to avoid blocking
      auditLog.save().catch((error) => {
        console.error('Failed to save audit log:', error);
      });
    } catch (error) {
      // Don't let audit logging failures affect the main operation
      console.error('Error creating audit log:', error);
    }
  }

  /**
   * Log authentication event
   */
  async logAuth(
    eventType: AuditEventType,
    email: string,
    organizationId: Types.ObjectId | null,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    errorMessage?: string,
  ): Promise<void> {
    await this.log({
      userEmail: email,
      organizationId: organizationId || new Types.ObjectId(), // Temporary for registration
      eventType,
      actionName: eventType,
      ipAddress,
      userAgent,
      success,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      errorMessage,
    });
  }

  /**
   * Log user management event
   */
  async logUserManagement(
    eventType: AuditEventType,
    performedBy: {
      userId: Types.ObjectId;
      email: string;
      role: string;
    },
    targetUserId: Types.ObjectId,
    organizationId: Types.ObjectId,
    ipAddress: string,
    userAgent: string,
    success: boolean,
  ): Promise<void> {
    await this.log({
      userId: performedBy.userId,
      userEmail: performedBy.email,
      userRole: performedBy.role,
      organizationId,
      eventType,
      actionName: eventType,
      resourceType: ResourceType.USER,
      resourceId: targetUserId,
      ipAddress,
      userAgent,
      success,
      severity: AuditSeverity.MEDIUM,
    });
  }

  /**
   * Determine severity based on event data
   */
  private determineSeverity(logData: CreateAuditLogDto): AuditSeverity {
    // Failed login attempts
    if (
      !logData.success &&
      (logData.eventType === AuditEventType.LOGIN_FAILURE ||
        logData.eventType === AuditEventType.PERMISSION_DENIED)
    ) {
      return AuditSeverity.MEDIUM;
    }

    // Security events
    if (
      logData.eventType === AuditEventType.ACCOUNT_LOCKED ||
      logData.eventType === AuditEventType.SESSION_HIJACKING_DETECTED ||
      logData.eventType === AuditEventType.SUSPICIOUS_ACTIVITY
    ) {
      return AuditSeverity.HIGH;
    }

    // Critical events
    if (
      logData.eventType === AuditEventType.USER_ROLE_CHANGED ||
      logData.eventType === AuditEventType.USER_DELETED
    ) {
      return AuditSeverity.HIGH;
    }

    return AuditSeverity.LOW;
  }

  /**
   * Query audit logs with filters
   */
  async query(filters: {
    organizationId: Types.ObjectId;
    userId?: Types.ObjectId;
    eventType?: AuditEventType;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50, ...queryFilters } = filters;

    const query: any = { organizationId: filters.organizationId };

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.eventType) {
      query.eventType = filters.eventType;
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.timestamp.$lte = filters.endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.auditLogModel.countDocuments(query),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
