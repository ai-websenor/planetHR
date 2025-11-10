# API Contracts - Notification System

## Overview

This document defines all API endpoints (internal and external) for the Notification System module. The notification system operates primarily through internal module methods and event-driven architecture within the NestJS monolith.

## External APIs

### 1. Get User Notifications

**Endpoint:** `GET /api/v1/notifications`

**Description:** Retrieve paginated notifications for the authenticated user

**Authentication:** Required (JWT)

**Authorization:** All authenticated users (Owner, Leader, Manager)

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 20 | Number of notifications per page (max: 100) |
| status | string | No | all | Filter by status: `all`, `read`, `unread` |
| type | string | No | all | Filter by type: `all`, `report`, `quarterly`, `subscription`, `system` |
| startDate | string | No | - | ISO 8601 date for filtering from date |
| endDate | string | No | - | ISO 8601 date for filtering to date |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "507f1f77bcf86cd799439011",
        "userId": "507f1f77bcf86cd799439012",
        "type": "report_generated",
        "channel": "email",
        "title": "Employee Report Generated",
        "message": "Report for John Doe has been successfully generated",
        "metadata": {
          "employeeId": "507f1f77bcf86cd799439013",
          "employeeName": "John Doe",
          "reportTypes": ["personality", "compatibility"],
          "reportUrl": "/reports/507f1f77bcf86cd799439014"
        },
        "isRead": false,
        "priority": "medium",
        "createdAt": "2025-11-10T10:30:00Z",
        "readAt": null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 95,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token
- `400 Bad Request` - Invalid query parameters

---

### 2. Mark Notification as Read

**Endpoint:** `PATCH /api/v1/notifications/:notificationId/read`

**Description:** Mark a specific notification as read

**Authentication:** Required (JWT)

**Authorization:** Notification owner only

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| notificationId | string | Yes | MongoDB ObjectId of the notification |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "isRead": true,
    "readAt": "2025-11-10T11:45:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User does not own this notification
- `404 Not Found` - Notification not found

---

### 3. Mark All Notifications as Read

**Endpoint:** `PATCH /api/v1/notifications/read-all`

**Description:** Mark all unread notifications for the authenticated user as read

**Authentication:** Required (JWT)

**Authorization:** All authenticated users

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "markedCount": 15,
    "message": "15 notifications marked as read"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token

---

### 4. Delete Notification

**Endpoint:** `DELETE /api/v1/notifications/:notificationId`

**Description:** Soft delete a notification (marks as deleted, not permanent removal)

**Authentication:** Required (JWT)

**Authorization:** Notification owner only

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| notificationId | string | Yes | MongoDB ObjectId of the notification |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Notification deleted successfully"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User does not own this notification
- `404 Not Found` - Notification not found

---

### 5. Get Notification Preferences

**Endpoint:** `GET /api/v1/notifications/preferences`

**Description:** Retrieve notification preferences for the authenticated user

**Authentication:** Required (JWT)

**Authorization:** All authenticated users

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439012",
    "emailNotifications": {
      "reportGeneration": true,
      "quarterlyUpdates": true,
      "subscriptionAlerts": true,
      "systemAlerts": false
    },
    "inAppNotifications": {
      "reportGeneration": true,
      "quarterlyUpdates": true,
      "subscriptionAlerts": true,
      "systemAlerts": true
    },
    "frequency": {
      "digestMode": false,
      "digestFrequency": "daily"
    },
    "quietHours": {
      "enabled": false,
      "startTime": "22:00",
      "endTime": "08:00",
      "timezone": "America/New_York"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token

---

### 6. Update Notification Preferences

**Endpoint:** `PATCH /api/v1/notifications/preferences`

**Description:** Update notification preferences for the authenticated user

**Authentication:** Required (JWT)

**Authorization:** All authenticated users

**Request Body:**
```json
{
  "emailNotifications": {
    "reportGeneration": true,
    "quarterlyUpdates": true,
    "subscriptionAlerts": false,
    "systemAlerts": false
  },
  "inAppNotifications": {
    "reportGeneration": true,
    "quarterlyUpdates": true,
    "subscriptionAlerts": true,
    "systemAlerts": true
  },
  "frequency": {
    "digestMode": true,
    "digestFrequency": "weekly"
  },
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00",
    "timezone": "America/New_York"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Notification preferences updated successfully",
    "preferences": {
      "userId": "507f1f77bcf86cd799439012",
      "emailNotifications": {
        "reportGeneration": true,
        "quarterlyUpdates": true,
        "subscriptionAlerts": false,
        "systemAlerts": false
      },
      "inAppNotifications": {
        "reportGeneration": true,
        "quarterlyUpdates": true,
        "subscriptionAlerts": true,
        "systemAlerts": true
      },
      "frequency": {
        "digestMode": true,
        "digestFrequency": "weekly"
      },
      "quietHours": {
        "enabled": true,
        "startTime": "22:00",
        "endTime": "08:00",
        "timezone": "America/New_York"
      }
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token
- `400 Bad Request` - Invalid preference values

---

### 7. Get Unread Notification Count

**Endpoint:** `GET /api/v1/notifications/unread-count`

**Description:** Get the count of unread notifications for the authenticated user

**Authentication:** Required (JWT)

**Authorization:** All authenticated users

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "unreadCount": 12,
    "byType": {
      "report_generated": 5,
      "quarterly_update": 3,
      "subscription_alert": 2,
      "system_alert": 2
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token

---

### 8. Resend Notification Email

**Endpoint:** `POST /api/v1/notifications/:notificationId/resend`

**Description:** Resend a notification email (for failed or missed notifications)

**Authentication:** Required (JWT)

**Authorization:** Notification owner only

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| notificationId | string | Yes | MongoDB ObjectId of the notification |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Notification email resent successfully",
    "sentAt": "2025-11-10T12:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User does not own this notification
- `404 Not Found` - Notification not found
- `400 Bad Request` - Notification type does not support email resend

---

## Internal APIs

### NotificationService Methods

Internal service methods used by other modules within the monolith.

#### 1. createNotification()

**Method:** `async createNotification(dto: CreateNotificationDto): Promise<Notification>`

**Description:** Create a new notification and dispatch it through appropriate channels

**Parameters:**
```typescript
interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  channels: NotificationChannel[];
  title: string;
  message: string;
  metadata?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: Date;
  expiresAt?: Date;
}

enum NotificationType {
  REPORT_GENERATED = 'report_generated',
  QUARTERLY_UPDATE = 'quarterly_update',
  QUARTERLY_UPDATE_FAILED = 'quarterly_update_failed',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  SUBSCRIPTION_EXPIRED = 'subscription_expired',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',
  PAYMENT_FAILED = 'payment_failed',
  EMPLOYEE_ADDED = 'employee_added',
  REPORT_GENERATION_FAILED = 'report_generation_failed',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  ACCOUNT_SECURITY = 'account_security'
}

enum NotificationChannel {
  EMAIL = 'email',
  IN_APP = 'in_app'
}
```

**Returns:** `Notification` object

**Throws:**
- `BadRequestException` - Invalid notification data
- `NotFoundException` - User not found

**Usage Example:**
```typescript
const notification = await this.notificationService.createNotification({
  userId: '507f1f77bcf86cd799439012',
  type: NotificationType.REPORT_GENERATED,
  channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
  title: 'Employee Report Generated',
  message: 'Report for John Doe has been successfully generated',
  metadata: {
    employeeId: '507f1f77bcf86cd799439013',
    employeeName: 'John Doe',
    reportTypes: ['personality', 'compatibility']
  },
  priority: 'medium'
});
```

---

#### 2. createBulkNotifications()

**Method:** `async createBulkNotifications(dtos: CreateNotificationDto[]): Promise<Notification[]>`

**Description:** Create multiple notifications in bulk (optimized for batch operations)

**Parameters:** Array of `CreateNotificationDto` objects

**Returns:** Array of `Notification` objects

**Throws:**
- `BadRequestException` - Invalid notification data in batch

**Usage Example:**
```typescript
const notifications = await this.notificationService.createBulkNotifications([
  {
    userId: '507f1f77bcf86cd799439012',
    type: NotificationType.QUARTERLY_UPDATE,
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    title: 'Quarterly Reports Updated',
    message: 'All employee reports have been regenerated'
  },
  // ... more notifications
]);
```

---

#### 3. notifyReportGeneration()

**Method:** `async notifyReportGeneration(params: ReportGenerationNotificationParams): Promise<void>`

**Description:** Specialized method for report generation notifications

**Parameters:**
```typescript
interface ReportGenerationNotificationParams {
  userId: string;
  employeeId: string;
  employeeName: string;
  reportTypes: string[];
  reportUrl: string;
  generatedAt: Date;
}
```

**Returns:** `void`

**Usage Example:**
```typescript
await this.notificationService.notifyReportGeneration({
  userId: '507f1f77bcf86cd799439012',
  employeeId: '507f1f77bcf86cd799439013',
  employeeName: 'John Doe',
  reportTypes: ['personality', 'job_compatibility', 'department_compatibility'],
  reportUrl: '/reports/507f1f77bcf86cd799439014',
  generatedAt: new Date()
});
```

---

#### 4. notifyQuarterlyUpdate()

**Method:** `async notifyQuarterlyUpdate(params: QuarterlyUpdateNotificationParams): Promise<void>`

**Description:** Notify users about quarterly report regeneration

**Parameters:**
```typescript
interface QuarterlyUpdateNotificationParams {
  userId: string;
  organizationId: string;
  quarter: string; // e.g., "Q1 2025"
  employeesUpdated: number;
  reportTypes: string[];
  completedAt: Date;
}
```

**Returns:** `void`

**Usage Example:**
```typescript
await this.notificationService.notifyQuarterlyUpdate({
  userId: '507f1f77bcf86cd799439012',
  organizationId: '507f1f77bcf86cd799439015',
  quarter: 'Q4 2025',
  employeesUpdated: 125,
  reportTypes: ['all'],
  completedAt: new Date()
});
```

---

#### 5. notifySubscriptionEvent()

**Method:** `async notifySubscriptionEvent(params: SubscriptionEventNotificationParams): Promise<void>`

**Description:** Send subscription-related notifications

**Parameters:**
```typescript
interface SubscriptionEventNotificationParams {
  userId: string;
  eventType: 'expiring' | 'expired' | 'renewed' | 'payment_failed';
  subscriptionPlan: string;
  expiryDate?: Date;
  renewalDate?: Date;
  daysRemaining?: number;
  actionUrl: string;
}
```

**Returns:** `void`

**Usage Example:**
```typescript
await this.notificationService.notifySubscriptionEvent({
  userId: '507f1f77bcf86cd799439012',
  eventType: 'expiring',
  subscriptionPlan: 'Premium',
  expiryDate: new Date('2025-12-01'),
  daysRemaining: 7,
  actionUrl: '/billing/renew'
});
```

---

#### 6. getUserNotifications()

**Method:** `async getUserNotifications(userId: string, filters: NotificationFilters): Promise<PaginatedNotifications>`

**Description:** Retrieve notifications for a user with filtering and pagination

**Parameters:**
```typescript
interface NotificationFilters {
  page?: number;
  limit?: number;
  status?: 'all' | 'read' | 'unread';
  type?: NotificationType | 'all';
  startDate?: Date;
  endDate?: Date;
}

interface PaginatedNotifications {
  notifications: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

**Returns:** `PaginatedNotifications` object

---

#### 7. markAsRead()

**Method:** `async markAsRead(notificationId: string, userId: string): Promise<Notification>`

**Description:** Mark a notification as read with user verification

**Parameters:**
- `notificationId`: MongoDB ObjectId string
- `userId`: MongoDB ObjectId string for verification

**Returns:** Updated `Notification` object

**Throws:**
- `NotFoundException` - Notification not found
- `ForbiddenException` - User does not own notification

---

#### 8. markAllAsRead()

**Method:** `async markAllAsRead(userId: string): Promise<{ markedCount: number }>`

**Description:** Mark all unread notifications as read for a user

**Parameters:**
- `userId`: MongoDB ObjectId string

**Returns:** Object with count of marked notifications

---

#### 9. deleteNotification()

**Method:** `async deleteNotification(notificationId: string, userId: string): Promise<void>`

**Description:** Soft delete a notification (sets deletedAt timestamp)

**Parameters:**
- `notificationId`: MongoDB ObjectId string
- `userId`: MongoDB ObjectId string for verification

**Returns:** `void`

**Throws:**
- `NotFoundException` - Notification not found
- `ForbiddenException` - User does not own notification

---

#### 10. getUnreadCount()

**Method:** `async getUnreadCount(userId: string): Promise<UnreadCountResponse>`

**Description:** Get count of unread notifications by type

**Parameters:**
- `userId`: MongoDB ObjectId string

**Returns:**
```typescript
interface UnreadCountResponse {
  unreadCount: number;
  byType: Record<NotificationType, number>;
}
```

---

### EmailService Methods

Internal email service methods called by NotificationService.

#### 1. sendNotificationEmail()

**Method:** `async sendNotificationEmail(params: EmailNotificationParams): Promise<EmailResult>`

**Description:** Send notification email using templates

**Parameters:**
```typescript
interface EmailNotificationParams {
  to: string;
  subject: string;
  template: EmailTemplate;
  context: Record<string, any>;
  priority?: 'normal' | 'high';
  attachments?: EmailAttachment[];
}

enum EmailTemplate {
  REPORT_GENERATED = 'report-generated',
  QUARTERLY_UPDATE = 'quarterly-update',
  SUBSCRIPTION_EXPIRING = 'subscription-expiring',
  SUBSCRIPTION_EXPIRED = 'subscription-expired',
  PAYMENT_FAILED = 'payment-failed',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password-reset'
}

interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  sentAt: Date;
}
```

**Returns:** `EmailResult` object

**Throws:**
- `InternalServerErrorException` - Email sending failed

---

#### 2. sendBulkEmails()

**Method:** `async sendBulkEmails(params: EmailNotificationParams[]): Promise<EmailResult[]>`

**Description:** Send multiple emails in batch with rate limiting

**Parameters:** Array of `EmailNotificationParams`

**Returns:** Array of `EmailResult` objects

---

### EventDispatcherService Methods

Internal event dispatcher for real-time notifications.

#### 1. emitNotification()

**Method:** `async emitNotification(userId: string, notification: Notification): Promise<void>`

**Description:** Emit WebSocket event for real-time notification delivery

**Parameters:**
- `userId`: Target user ID
- `notification`: Notification object to emit

**Returns:** `void`

**WebSocket Event:**
```typescript
{
  event: 'notification.received',
  data: {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata: Record<string, any>;
    priority: string;
    createdAt: Date;
  }
}
```

---

#### 2. emitNotificationCountUpdate()

**Method:** `async emitNotificationCountUpdate(userId: string, count: number): Promise<void>`

**Description:** Emit updated unread count to user's active WebSocket connections

**Parameters:**
- `userId`: Target user ID
- `count`: Updated unread count

**Returns:** `void`

**WebSocket Event:**
```typescript
{
  event: 'notification.count_updated',
  data: {
    unreadCount: number;
  }
}
```

---

## Notification Event Types

### System Events Triggering Notifications

| Event | Source Module | Notification Type | Recipients |
|-------|---------------|-------------------|------------|
| `employee.added` | employees-module | `EMPLOYEE_ADDED` | Manager, Leader, Owner |
| `report.generated` | reports-module | `REPORT_GENERATED` | Requesting user |
| `report.generation_failed` | reports-module | `REPORT_GENERATION_FAILED` | Requesting user, Owner |
| `quarterly.update_started` | cron-module | `QUARTERLY_UPDATE` | All organization users |
| `quarterly.update_completed` | cron-module | `QUARTERLY_UPDATE` | Owner, Leaders |
| `quarterly.update_failed` | cron-module | `QUARTERLY_UPDATE_FAILED` | Owner |
| `subscription.expiring` | payments-module | `SUBSCRIPTION_EXPIRING` | Owner |
| `subscription.expired` | payments-module | `SUBSCRIPTION_EXPIRED` | Owner |
| `subscription.renewed` | payments-module | `SUBSCRIPTION_RENEWED` | Owner |
| `payment.failed` | payments-module | `PAYMENT_FAILED` | Owner |
| `system.maintenance` | admin-module | `SYSTEM_MAINTENANCE` | All users |

---

## WebSocket Integration

### Connection

**WebSocket URL:** `ws://api.planetshr.com/ws`

**Authentication:** JWT token in connection query string
```
ws://api.planetshr.com/ws?token=<jwt_token>
```

### Client Events

#### Subscribe to Notifications
```typescript
{
  event: 'notification.subscribe',
  data: {
    userId: '507f1f77bcf86cd799439012'
  }
}
```

#### Acknowledge Notification Receipt
```typescript
{
  event: 'notification.acknowledged',
  data: {
    notificationId: '507f1f77bcf86cd799439011'
  }
}
```

### Server Events

#### New Notification
```typescript
{
  event: 'notification.received',
  data: {
    id: '507f1f77bcf86cd799439011',
    type: 'report_generated',
    title: 'Employee Report Generated',
    message: 'Report for John Doe has been successfully generated',
    metadata: {
      employeeId: '507f1f77bcf86cd799439013',
      employeeName: 'John Doe'
    },
    priority: 'medium',
    createdAt: '2025-11-10T10:30:00Z'
  }
}
```

#### Unread Count Update
```typescript
{
  event: 'notification.count_updated',
  data: {
    unreadCount: 13
  }
}
```

---

## Rate Limiting

### Email Notifications
- **Per User:** 100 emails per hour
- **Per Organization:** 1000 emails per hour
- **Bulk Operations:** 50 emails per batch

### API Endpoints
- **Standard Endpoints:** 100 requests per minute per user
- **Bulk Operations:** 10 requests per minute per user

---

## Error Response Format

All API errors follow consistent format:

```json
{
  "success": false,
  "error": {
    "code": "NOTIFICATION_NOT_FOUND",
    "message": "The requested notification does not exist",
    "statusCode": 404,
    "timestamp": "2025-11-10T12:00:00Z",
    "path": "/api/v1/notifications/507f1f77bcf86cd799439011"
  }
}
```

### Common Error Codes
- `NOTIFICATION_NOT_FOUND` - Notification does not exist
- `NOTIFICATION_ACCESS_DENIED` - User lacks permission
- `INVALID_NOTIFICATION_PREFERENCES` - Invalid preference values
- `EMAIL_SEND_FAILED` - Email delivery failure
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INVALID_NOTIFICATION_TYPE` - Unsupported notification type

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Complete