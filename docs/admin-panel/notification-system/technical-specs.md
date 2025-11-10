# Technical Specifications - Notification System

## Architecture Overview

This module is part of a monolithic application architecture with well-defined internal modules and layers.

The Notification System is implemented as an internal module cluster within the PlanetsHR monolithic NestJS application. It follows a modular architecture pattern with three core services working in concert: email-service for external communications, notification-service for in-app alerts, and event-dispatcher-service for event orchestration and routing.

The system uses an event-driven architecture where business events (report generation, quarterly updates, subscription changes) are captured by the event-dispatcher-service and routed to appropriate notification channels based on user preferences, role permissions, and notification type. BullMQ queues ensure reliable, asynchronous delivery of notifications with retry mechanisms and rate limiting to prevent system overload.

Multi-channel delivery is supported through:
- SMTP-based email delivery via Nodemailer
- WebSocket real-time push for in-app notifications
- MongoDB persistence for notification history and audit trails
- Redis-backed queues for reliable message delivery

The architecture supports role-based notification filtering where notifications are automatically scoped to user permissions (Owner sees all, Leader sees department-specific, Manager sees team-specific). Template-based rendering allows dynamic content generation with support for internationalization and personalization.

## Application Modules

### email-service

**Responsibility:**
Handles all external email communications including transactional emails, report delivery, system alerts, and subscription notifications. Manages email templates, SMTP configuration, delivery tracking, and retry logic for failed deliveries.

**Layer:** Business Logic / Infrastructure

**Dependencies:**
- `notification-service` - Retrieves notification preferences and delivery settings
- `users` module - User contact information and role verification
- `organizations` module - Company branding and email configuration
- `reports` module - Report download links and metadata
- `payments` module - Subscription status and renewal information
- `config` module - SMTP credentials and email service configuration
- External: Nodemailer, SMTP provider (SendGrid/AWS SES/Mailgun)

**Exposed APIs:**
```typescript
// Internal service methods
async sendEmail(recipient: string, template: string, data: any): Promise<EmailResult>
async sendBulkEmail(recipients: string[], template: string, data: any): Promise<BulkEmailResult>
async sendReportGeneratedEmail(reportId: string, userId: string): Promise<void>
async sendQuarterlyUpdateEmail(organizationId: string, affectedUsers: string[]): Promise<void>
async sendSubscriptionReminderEmail(organizationId: string, daysUntilExpiry: number): Promise<void>
async trackEmailDelivery(emailId: string, status: DeliveryStatus): Promise<void>
async retryFailedEmail(emailId: string): Promise<void>
```

### notification-service

**Responsibility:**
Manages in-app notifications, notification preferences, delivery history, read/unread status, and real-time WebSocket push notifications. Implements role-based filtering and notification aggregation logic.

**Layer:** Business Logic / Presentation

**Dependencies:**
- `chat` module - WebSocket gateway for real-time delivery
- `users` module - User preferences and role information
- `organizations` module - Organization-level notification settings
- `event-dispatcher-service` - Receives events for notification creation
- `auth` module - JWT validation for WebSocket connections
- MongoDB - Notification persistence
- Redis - Real-time notification queue

**Exposed APIs:**
```typescript
// Internal service methods
async createNotification(userId: string, type: NotificationType, data: any): Promise<Notification>
async getNotifications(userId: string, filters: NotificationFilters): Promise<Notification[]>
async markAsRead(notificationId: string, userId: string): Promise<void>
async markAllAsRead(userId: string): Promise<void>
async deleteNotification(notificationId: string, userId: string): Promise<void>
async getUserPreferences(userId: string): Promise<NotificationPreferences>
async updateUserPreferences(userId: string, preferences: NotificationPreferences): Promise<void>
async pushRealTimeNotification(userId: string, notification: Notification): Promise<void>

// REST API endpoints (exposed to frontend)
GET    /api/v1/notifications - List user notifications
POST   /api/v1/notifications/:id/read - Mark notification as read
POST   /api/v1/notifications/read-all - Mark all as read
DELETE /api/v1/notifications/:id - Delete notification
GET    /api/v1/notifications/preferences - Get preferences
PUT    /api/v1/notifications/preferences - Update preferences
GET    /api/v1/notifications/unread-count - Get unread count
```

### event-dispatcher-service

**Responsibility:**
Central event orchestration service that captures business events from across the application and routes them to appropriate notification channels. Implements event-to-notification mapping, role-based filtering logic, and notification scheduling.

**Layer:** Business Logic / Integration

**Dependencies:**
- `email-service` - Triggers email notifications
- `notification-service` - Creates in-app notifications
- `reports` module - Report generation events
- `employees` module - Employee data change events
- `payments` module - Subscription events
- `cron` module - Quarterly update events
- BullMQ - Event queue management
- Redis - Event deduplication cache

**Exposed APIs:**
```typescript
// Internal service methods (called by other modules)
async dispatchReportGeneratedEvent(reportId: string, employeeId: string, generatedBy: string): Promise<void>
async dispatchQuarterlyUpdateEvent(organizationId: string, affectedEmployees: string[]): Promise<void>
async dispatchSubscriptionRenewalEvent(organizationId: string, subscriptionDetails: any): Promise<void>
async dispatchEmployeeAddedEvent(employeeId: string, departmentId: string, addedBy: string): Promise<void>
async dispatchSystemAlertEvent(severity: AlertSeverity, message: string, affectedUsers: string[]): Promise<void>

// Event handlers (internal processing)
@OnEvent('report.generated')
async handleReportGenerated(event: ReportGeneratedEvent): Promise<void>

@OnEvent('quarterly.update.completed')
async handleQuarterlyUpdate(event: QuarterlyUpdateEvent): Promise<void>

@OnEvent('subscription.expiring')
async handleSubscriptionExpiring(event: SubscriptionExpiringEvent): Promise<void>

@OnEvent('employee.added')
async handleEmployeeAdded(event: EmployeeAddedEvent): Promise<void>
```

## Layered Architecture

### Presentation Layer

**Components:**
- REST API endpoints in notification-service (`notifications.controller.ts`)
- WebSocket gateway for real-time push (`notification.gateway.ts`)
- Request validation DTOs (`create-notification.dto.ts`, `update-preferences.dto.ts`)
- API response transformers and serializers
- Swagger/OpenAPI documentation decorators
- JWT authentication guards for protected endpoints
- Role-based authorization guards

**Responsibilities:**
- HTTP request/response handling
- WebSocket connection management and authentication
- Input validation and sanitization
- Response formatting and pagination
- API versioning and deprecation handling
- Rate limiting on public endpoints
- CORS configuration for notification endpoints

**Technologies:**
- NestJS Controllers and Guards
- class-validator for DTO validation
- Swagger decorators for API docs
- WebSocket (ws library via NestJS gateway)

### Business Logic Layer

**Components:**
- Notification creation and filtering logic (`notification-business.service.ts`)
- Email template rendering engine (`email-template.service.ts`)
- Event-to-notification mapping service (`event-mapper.service.ts`)
- Role-based notification scoping (`notification-scope.service.ts`)
- Notification preference evaluation (`preference-evaluator.service.ts`)
- Delivery scheduling and batching logic (`notification-scheduler.service.ts`)
- Notification aggregation and summarization (`notification-aggregator.service.ts`)

**Responsibilities:**
- Business rule enforcement (who can receive what notifications)
- Notification type classification and prioritization
- Template selection and dynamic content rendering
- User preference evaluation and channel selection
- Role-based filtering (Owner/Leader/Manager scopes)
- Notification batching and digest creation
- Retry logic and exponential backoff for failures
- Deduplication of redundant notifications
- Notification lifecycle management (creation → delivery → archival)

**Key Business Rules:**
```typescript
// Role-based notification scoping
- Owner: Receives all organizational notifications
- Leader: Receives notifications for assigned departments only
- Manager: Receives notifications for assigned department only
- Employees: No platform notifications (email only for training)

// Notification priority levels
- CRITICAL: Subscription expiration, system failures
- HIGH: Report generation completion, quarterly updates
- MEDIUM: Employee additions, training recommendations
- LOW: System announcements, feature updates

// Delivery channel selection
- Critical alerts: Email + In-app + (optional SMS)
- Report completion: In-app + (optional Email)
- Quarterly updates: Email + In-app
- System announcements: In-app only (unless user opts in for email)

// Batching rules
- Batch notifications for same event type within 5-minute window
- Maximum batch size: 50 notifications per batch
- Digest emails: Daily summary for non-critical notifications
```

### Data Access Layer

**Components:**
- Notification repository (`notification.repository.ts`)
- Email delivery log repository (`email-log.repository.ts`)
- User preferences repository (`notification-preferences.repository.ts`)
- Template repository (`template.repository.ts`)
- MongoDB schemas and models
- Redis cache service for preferences and templates
- BullMQ queue processors for async delivery

**Responsibilities:**
- Database CRUD operations
- Query optimization and indexing
- Transaction management for multi-collection updates
- Cache invalidation strategies
- Queue message persistence and retrieval
- Notification archival and cleanup (30-day retention)
- Delivery status tracking and analytics
- Database connection pooling and error handling

**Data Models:**
```typescript
// NotificationSchema
{
  _id: ObjectId
  userId: ObjectId (ref: User)
  organizationId: ObjectId (ref: Organization)
  type: NotificationType (enum)
  category: NotificationCategory (enum)
  priority: PriorityLevel (enum)
  title: string
  message: string
  metadata: object (flexible JSON)
  channels: string[] (email, in-app, sms)
  status: DeliveryStatus (enum)
  readAt: Date | null
  deliveredAt: Date | null
  createdAt: Date
  expiresAt: Date
  actionUrl: string | null
  actionLabel: string | null
}

// EmailLogSchema
{
  _id: ObjectId
  notificationId: ObjectId (ref: Notification)
  recipient: string
  subject: string
  template: string
  status: EmailStatus (enum)
  sentAt: Date
  deliveredAt: Date | null
  openedAt: Date | null
  clickedAt: Date | null
  errorMessage: string | null
  retryCount: number
  metadata: object
}

// NotificationPreferencesSchema
{
  _id: ObjectId
  userId: ObjectId (ref: User, unique)
  emailEnabled: boolean
  inAppEnabled: boolean
  reportGeneration: ChannelPreferences
  quarterlyUpdates: ChannelPreferences
  subscriptionAlerts: ChannelPreferences
  systemAnnouncements: ChannelPreferences
  digestFrequency: DigestFrequency (enum)
  quietHoursStart: string (HH:mm)
  quietHoursEnd: string (HH:mm)
  timezone: string
  updatedAt: Date
}
```

## API Endpoints

### Public REST API (notification-service)

```typescript
/**
 * Get paginated list of notifications for authenticated user
 * Permissions: Authenticated users only
 */
GET /api/v1/notifications
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20, max: 100)
  - type: NotificationType (optional filter)
  - category: NotificationCategory (optional filter)
  - unreadOnly: boolean (default: false)
  - startDate: ISO date string (optional)
  - endDate: ISO date string (optional)
Response: 200 OK
{
  data: Notification[],
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    unreadCount: number
  }
}

/**
 * Get unread notification count
 * Permissions: Authenticated users only
 */
GET /api/v1/notifications/unread-count
Response: 200 OK
{
  count: number
}

/**
 * Mark notification as read
 * Permissions: Notification owner only
 */
POST /api/v1/notifications/:id/read
Response: 200 OK
{
  success: true,
  notification: Notification
}

/**
 * Mark all notifications as read
 * Permissions: Authenticated users only
 */
POST /api/v1/notifications/read-all
Response: 200 OK
{
  success: true,
  markedCount: number
}

/**
 * Delete specific notification
 * Permissions: Notification owner only
 */
DELETE /api/v1/notifications/:id
Response: 204 No Content

/**
 * Get user notification preferences
 * Permissions: Authenticated users only (own preferences)
 */
GET /api/v1/notifications/preferences
Response: 200 OK
{
  userId: string,
  emailEnabled: boolean,
  inAppEnabled: boolean,
  categories: {
    reportGeneration: ChannelPreferences,
    quarterlyUpdates: ChannelPreferences,
    subscriptionAlerts: ChannelPreferences,
    systemAnnouncements: ChannelPreferences
  },
  digestFrequency: DigestFrequency,
  quietHours: {
    enabled: boolean,
    start: string,
    end: string,
    timezone: string
  }
}

/**
 * Update user notification preferences
 * Permissions: Authenticated users only (own preferences)
 */
PUT /api/v1/notifications/preferences
Request Body:
{
  emailEnabled?: boolean,
  inAppEnabled?: boolean,
  categories?: {
    reportGeneration?: ChannelPreferences,
    quarterlyUpdates?: ChannelPreferences,
    subscriptionAlerts?: ChannelPreferences,
    systemAnnouncements?: ChannelPreferences
  },
  digestFrequency?: DigestFrequency,
  quietHours?: {
    enabled: boolean,
    start: string,
    end: string,
    timezone: string
  }
}
Response: 200 OK
{
  success: true,
  preferences: NotificationPreferences
}
```

### WebSocket Events

```typescript
// Client → Server (authentication)
event: 'authenticate'
payload: { token: string }

// Server → Client (notification delivery)
event: 'notification.received'
payload: {
  id: string,
  type: NotificationType,
  category: NotificationCategory,
  priority: PriorityLevel,
  title: string,
  message: string,
  actionUrl: string | null,
  actionLabel: string | null,
  createdAt: string,
  metadata: object
}

// Server → Client (notification read by another session)
event: 'notification.read'
payload: {
  notificationId: string,
  readAt: string
}

// Server → Client (batch notification delivery)
event: 'notifications.batch'
payload: {
  notifications: Notification[],
  unreadCount: number
}

// Client → Server (mark as read via WebSocket)
event: 'notification.markRead'
payload: { notificationId: string }

// Server → Client (connection acknowledged)
event: 'connected'
payload: {
  userId: string,
  unreadCount: number
}
```

## Database Schemas

### Notification Collection (MongoDB)

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
  REPORT_GENERATED = 'report_generated',
  QUARTERLY_UPDATE = 'quarterly_update',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  SUBSCRIPTION_EXPIRED = 'subscription_expired',
  EMPLOYEE_ADDED = 'employee_added',
  SYSTEM_ALERT = 'system_alert',
  TRAINING_RECOMMENDATION = 'training_recommendation',
}

export enum NotificationCategory {
  REPORTS = 'reports',
  SUBSCRIPTIONS = 'subscriptions',
  EMPLOYEES = 'employees',
  SYSTEM = 'system',
}

export enum PriorityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true, index: true })
  type: NotificationType;

  @Prop({ type: String, enum: NotificationCategory, required: true, index: true })
  category: NotificationCategory;

  @Prop({ type: String, enum: PriorityLevel, default: PriorityLevel.MEDIUM })
  priority: PriorityLevel;

  @Prop({ required: true, maxlength: 200 })
  title: string;

  @Prop({ required: true, maxlength: 1000 })
  message: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: [String], default: ['in-app'] })
  channels: string[];

  @Prop({ type: String, enum: DeliveryStatus, default: DeliveryStatus.PENDING, index: true })
  status: DeliveryStatus;

  @Prop({ type: Date, default: null, index: true })
  readAt: Date | null;

  @Prop({ type: Date, default: null })
  deliveredAt: Date | null;

  @Prop({ type: Date, default: null, index: true })
  expiresAt: Date;

  @Prop({ maxlength: 500 })
  actionUrl: string;

  @Prop({ maxlength: 50 })
  actionLabel: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for performance
NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ organizationId: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
```

### EmailLog Collection (MongoDB)

```typescript
export enum EmailStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  FAILED = 'failed',
}

@Schema({ timestamps: true, collection: 'email_logs' })
export class EmailLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Notification', index: true })
  notificationId: Types.ObjectId;

  @Prop({ required: true, index: true })
  recipient: string;

  @Prop({ required: true, maxlength: 200 })
  subject: string;

  @Prop({ required: true })
  template: string;

  @Prop({ type: String, enum: EmailStatus, default: EmailStatus.QUEUED, index: true })
  status: EmailStatus;

  @Prop({ type: Date, index: true })
  sentAt: Date;

  @Prop({ type: Date })
  deliveredAt: Date;

  @Prop({ type: Date })
  openedAt: Date;

  @Prop({ type: Date })
  clickedAt: Date;

  @Prop()
  errorMessage: string;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop()
  messageId: string; // SMTP message ID for tracking
}

export const EmailLogSchema = SchemaFactory.createForClass(EmailLog);

EmailLogSchema.index({ recipient: 1, sentAt: -1 });
EmailLogSchema.index({ status: 1, createdAt: -1 });
```

### NotificationPreferences Collection (MongoDB)

```typescript
export enum DigestFrequency {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export interface ChannelPreferences {
  email: boolean;
  inApp: boolean;
}

@Schema({ timestamps: true, collection: 'notification_preferences' })
export class NotificationPreferences extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: true })
  emailEnabled: boolean;

  @Prop({ default: true })
  inAppEnabled: boolean;

  @Prop({
    type: Object,
    default: { email: true, inApp: true }
  })
  reportGeneration: ChannelPreferences;

  @Prop({
    type: Object,
    default: { email: true, inApp: true }
  })
  quarterlyUpdates: ChannelPreferences;

  @Prop({
    type: Object,
    default: { email: true, inApp: true }
  })
  subscriptionAlerts: ChannelPreferences;

  @Prop({
    type: Object,
    default: { email: false, inApp: true }
  })
  systemAnnouncements: ChannelPreferences;

  @Prop({ type: String, enum: DigestFrequency, default: DigestFrequency.NONE })
  digestFrequency: DigestFrequency;

  @Prop({ default: '22:00' })
  quietHoursStart: string;

  @Prop({ default: '08:00' })
  quietHoursEnd: string;

  @Prop({ default: 'UTC' })
  timezone: string;
}

export const NotificationPreferencesSchema = SchemaFactory.createForClass(NotificationPreferences);
```

### EmailTemplate Collection (MongoDB)

```typescript
@Schema({ timestamps: true, collection: 'email_templates' })
export class EmailTemplate extends Document {
  @Prop({ required: true, unique: true, index: true })
  templateKey: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, maxlength: 200 })
  subject: string;

  @Prop({ required: true })
  htmlBody: string;

  @Prop()
  textBody: string;

  @Prop({ type: [String], default: [] })
  requiredVariables: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  category: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const EmailTemplateSchema = SchemaFactory.createForClass(EmailTemplate);
```

## Caching Strategy

### Redis Cache Implementation

**Cache Keys Structure:**
```
notification:preferences:{userId} - User notification preferences (TTL: 1 hour)
notification:templates:{templateKey} - Email templates (TTL: 24 hours)
notification:unread:{userId} - Unread count cache (TTL: 5 minutes)
notification:dedup:{eventHash} - Event deduplication (TTL: 5 minutes)
notification:ratelimit:{userId}:{action} - Rate limiting (TTL: 1 minute)
```

**Caching Rules:**

1. **User Preferences (Hot Cache)**
   - Cache all preferences on first access
   - Invalidate on preference update
   - TTL: 1 hour (refreshed on access)
   - Benefits: Reduces DB queries for every notification check

2. **Email Templates (Static Cache)**
   - Cache all active templates on application startup
   - Invalidate on template update (admin action)
   - TTL: 24 hours
   - Benefits: Eliminates DB queries for template rendering

3. **Unread Count (Volatile Cache)**
   - Cache unread notification count per user
   - Invalidate on read/delete actions
   - TTL: 5 minutes (eventual consistency acceptable)
   - Benefits: Improves UI responsiveness for notification badges

4. **Event Deduplication (Short-lived Cache)**
   - Hash event payloads and cache for 5 minutes
   - Prevents duplicate notifications from race conditions
   - TTL: 5 minutes
   - Benefits: Ensures idempotent notification delivery

5. **Rate Limiting (Protection Cache)**
   - Track notification creation rate per user/action
   - Prevent notification spam and abuse
   - TTL: 1 minute sliding window
   - Limits: 20 notifications per user per minute

**Cache Invalidation Strategies:**

```typescript
// Preference update invalidation
async updatePreferences(userId: string, preferences: any): Promise<void> {
  await this.preferencesRepository.update(userId, preferences);
  await this.cacheService.del(`notification:preferences:${userId}`);
}

// Template update invalidation
async updateTemplate(templateKey: string, template: any): Promise<void> {
  await this.templateRepository.update(templateKey, template);
  await this.cacheService.del(`notification:templates:${templateKey}`);
}

// Unread count invalidation on read
async markAsRead(notificationId: string, userId: string): Promise<void> {
  await this.notificationRepository.markAsRead(notificationId);
  await this.cacheService.del(`notification:unread:${userId}`);
  await this.websocketService.emitReadNotification(userId, notificationId);
}
```

**Queue Configuration (BullMQ):**

```typescript
// Email delivery queue
const emailQueue = new Queue('email-delivery', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5s delay
    },
    removeOnComplete: 100, // Keep last 100 successful jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
});

// In-app notification queue
const notificationQueue = new Queue('notification-delivery', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

// Notification digest queue (scheduled)
const digestQueue = new Queue('notification-digest', {
  connection: redisConnection,
  defaultJobOptions: {
    repeat: {
      pattern: '0 9 * * *', // Daily at 9 AM
    },
  },
});
```

**Performance Optimizations:**

- Use Redis pipelines for batch cache operations
- Implement cache warming for frequently accessed preferences
- Use compressed cache values for large template content
- Monitor cache hit rates and adjust TTLs accordingly
- Implement circuit breaker pattern for cache failures (fallback to DB)
- Use Redis pub/sub for cache invalidation across multiple instances

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Draft