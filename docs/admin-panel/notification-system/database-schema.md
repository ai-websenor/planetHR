# Database Schema - Notification System

## Overview

This document defines the database schemas for the Notification System, including MongoDB collections for notification templates, logs, and user preferences, as well as Redis data structures for the notification queue.

### MongoDB (notification templates, logs)

MongoDB is used for persistent storage of notification templates, delivery logs, user preferences, and notification history.

**Collections:**
- `notification_templates` - Reusable notification templates
- `notification_logs` - Delivery tracking and audit trail
- `notification_preferences` - User notification settings
- `notification_history` - In-app notification storage

### Redis (notification queue)

Redis is used for the notification queue system, temporary caching, and real-time notification delivery tracking.

**Data Structures:**
- BullMQ queues for notification processing
- Rate limiting counters
- Delivery status cache

---

## MongoDB Schemas

### 1. Notification Templates Collection

**Collection Name:** `notification_templates`

```typescript
{
  _id: ObjectId,
  templateCode: String,          // Unique identifier (e.g., "REPORT_GENERATED", "QUARTERLY_UPDATE")
  channel: String,               // "EMAIL" | "IN_APP" | "BOTH"
  eventType: String,             // Event that triggers this template
  
  // Email template data
  emailTemplate: {
    subject: String,             // Email subject with placeholder support
    htmlBody: String,            // HTML email body
    textBody: String,            // Plain text fallback
    fromName: String,            // Sender name
    fromEmail: String,           // Sender email address
    replyTo: String,             // Reply-to address
    attachmentSupport: Boolean   // Whether attachments are supported
  },
  
  // In-app template data
  inAppTemplate: {
    title: String,               // Notification title
    body: String,                // Notification message body
    actionUrl: String,           // Deep link or URL for action
    actionText: String,          // Call-to-action button text
    icon: String,                // Icon identifier or URL
    priority: String             // "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  },
  
  // Role-based targeting
  targetRoles: [String],         // Array of UserRole enum values
  
  // Template metadata
  variables: [{                  // Available placeholder variables
    name: String,
    description: String,
    required: Boolean,
    defaultValue: String
  }],
  
  isActive: Boolean,             // Template enabled/disabled status
  version: Number,               // Template version for A/B testing
  
  // Audit fields
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId,           // Reference to User
  updatedBy: ObjectId
}
```

**Indexes:**
```javascript
db.notification_templates.createIndex({ templateCode: 1 }, { unique: true });
db.notification_templates.createIndex({ eventType: 1 });
db.notification_templates.createIndex({ isActive: 1 });
db.notification_templates.createIndex({ targetRoles: 1 });
```

---

### 2. Notification Logs Collection

**Collection Name:** `notification_logs`

```typescript
{
  _id: ObjectId,
  
  // Notification identification
  notificationId: String,        // Unique notification identifier (UUID)
  templateCode: String,          // Reference to template used
  channel: String,               // "EMAIL" | "IN_APP"
  
  // Recipient information
  recipientId: ObjectId,         // Reference to User
  recipientEmail: String,
  recipientRole: String,         // User role at time of sending
  organizationId: ObjectId,      // Reference to Organization
  
  // Event context
  eventType: String,             // Event that triggered notification
  eventData: {                   // Event-specific data
    employeeId: ObjectId,
    reportId: ObjectId,
    reportType: String,
    quarterlyUpdateId: ObjectId,
    subscriptionId: ObjectId,
    // ... other event-specific fields
  },
  
  // Delivery tracking
  status: String,                // "QUEUED" | "SENDING" | "SENT" | "DELIVERED" | "FAILED" | "BOUNCED"
  deliveryAttempts: Number,
  lastAttemptAt: Date,
  
  // Email-specific tracking
  emailTracking: {
    messageId: String,           // Email service provider message ID
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    bouncedAt: Date,
    bounceReason: String,
    failureReason: String
  },
  
  // In-app specific tracking
  inAppTracking: {
    deliveredAt: Date,
    readAt: Date,
    clickedAt: Date,
    dismissedAt: Date
  },
  
  // Content snapshot
  contentSnapshot: {
    subject: String,
    body: String,
    variables: Object            // Resolved template variables
  },
  
  // Metadata
  priority: String,              // "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  retryCount: Number,
  maxRetries: Number,
  
  // Audit fields
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.notification_logs.createIndex({ notificationId: 1 }, { unique: true });
db.notification_logs.createIndex({ recipientId: 1, createdAt: -1 });
db.notification_logs.createIndex({ organizationId: 1, createdAt: -1 });
db.notification_logs.createIndex({ status: 1, createdAt: -1 });
db.notification_logs.createIndex({ eventType: 1, createdAt: -1 });
db.notification_logs.createIndex({ templateCode: 1 });
db.notification_logs.createIndex({ "emailTracking.sentAt": 1 });
db.notification_logs.createIndex({ createdAt: -1 }); // For cleanup/archival
```

---

### 3. Notification Preferences Collection

**Collection Name:** `notification_preferences`

```typescript
{
  _id: ObjectId,
  
  userId: ObjectId,              // Reference to User (unique)
  organizationId: ObjectId,      // Reference to Organization
  
  // Channel preferences
  channelPreferences: {
    email: {
      enabled: Boolean,
      emailAddress: String       // Override default user email
    },
    inApp: {
      enabled: Boolean
    }
  },
  
  // Event-specific preferences
  eventPreferences: {
    reportGeneration: {
      email: Boolean,
      inApp: Boolean,
      immediate: Boolean,        // Send immediately or batch
      digestFrequency: String    // "IMMEDIATE" | "DAILY" | "WEEKLY" | null
    },
    quarterlyUpdates: {
      email: Boolean,
      inApp: Boolean,
      advanceNotice: Boolean,    // Notify before update runs
      completionNotice: Boolean  // Notify after update completes
    },
    subscriptionEvents: {
      email: Boolean,
      inApp: Boolean,
      renewalReminders: Boolean,
      paymentFailures: Boolean,
      planChanges: Boolean
    },
    systemAlerts: {
      email: Boolean,
      inApp: Boolean,
      maintenanceNotices: Boolean,
      securityAlerts: Boolean
    },
    teamUpdates: {
      email: Boolean,
      inApp: Boolean,
      employeeAdded: Boolean,
      employeeRemoved: Boolean,
      reportShared: Boolean
    }
  },
  
  // Quiet hours
  quietHours: {
    enabled: Boolean,
    timezone: String,            // IANA timezone (e.g., "America/New_York")
    startTime: String,           // "HH:mm" format (e.g., "22:00")
    endTime: String,             // "HH:mm" format (e.g., "08:00")
    daysOfWeek: [Number]         // 0-6 (Sunday-Saturday)
  },
  
  // Digest preferences
  digestSettings: {
    enabled: Boolean,
    frequency: String,           // "DAILY" | "WEEKLY"
    deliveryTime: String,        // "HH:mm" format
    deliveryDay: Number          // For weekly: 0-6 (Sunday-Saturday)
  },
  
  // Metadata
  lastModifiedBy: String,        // "USER" | "ADMIN" | "SYSTEM"
  
  // Audit fields
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.notification_preferences.createIndex({ userId: 1 }, { unique: true });
db.notification_preferences.createIndex({ organizationId: 1 });
db.notification_preferences.createIndex({ "channelPreferences.email.enabled": 1 });
```

---

### 4. Notification History Collection (In-App)

**Collection Name:** `notification_history`

```typescript
{
  _id: ObjectId,
  
  // Recipient information
  userId: ObjectId,              // Reference to User
  organizationId: ObjectId,      // Reference to Organization
  
  // Notification content
  title: String,
  body: String,
  
  // Action details
  actionUrl: String,             // Deep link or URL
  actionText: String,            // CTA button text
  icon: String,                  // Icon identifier
  
  // Metadata
  priority: String,              // "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  category: String,              // "REPORT" | "UPDATE" | "SUBSCRIPTION" | "SYSTEM" | "TEAM"
  
  // Event reference
  eventType: String,
  eventId: ObjectId,             // Reference to related entity (Report, Employee, etc.)
  templateCode: String,
  
  // Status tracking
  status: String,                // "UNREAD" | "READ" | "CLICKED" | "DISMISSED"
  readAt: Date,
  clickedAt: Date,
  dismissedAt: Date,
  
  // Expiration
  expiresAt: Date,               // Auto-cleanup date (default: 90 days)
  
  // Audit fields
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.notification_history.createIndex({ userId: 1, createdAt: -1 });
db.notification_history.createIndex({ userId: 1, status: 1 });
db.notification_history.createIndex({ organizationId: 1, createdAt: -1 });
db.notification_history.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
db.notification_history.createIndex({ eventType: 1, eventId: 1 });
db.notification_history.createIndex({ category: 1, createdAt: -1 });
```

---

## Redis Data Structures

### 1. Notification Queue (BullMQ)

**Queue Name:** `notifications:queue`

```typescript
// Job Data Structure
{
  jobId: string,                 // Unique job identifier
  
  // Notification details
  type: string,                  // "EMAIL" | "IN_APP" | "BOTH"
  templateCode: string,
  
  // Recipient
  recipientId: string,
  recipientEmail: string,
  recipientRole: string,
  organizationId: string,
  
  // Template variables
  variables: {
    employeeName: string,
    reportType: string,
    reportUrl: string,
    // ... other template-specific variables
  },
  
  // Event context
  eventType: string,
  eventData: object,
  
  // Processing options
  priority: number,              // 1-10 (10 = highest)
  attempts: number,              // Max retry attempts
  backoff: {
    type: string,                // "exponential" | "fixed"
    delay: number                // Milliseconds
  },
  
  // Timestamps
  timestamp: number,
  scheduledFor: number           // Optional: scheduled delivery time
}
```

**Queue Configuration:**
```typescript
// Queue settings in Redis
notifications:queue:settings = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 1000,      // Keep last 1000 completed jobs
    removeOnFail: 5000           // Keep last 5000 failed jobs
  },
  limiter: {
    max: 100,                    // Max 100 jobs processed
    duration: 60000              // Per 60 seconds
  }
}
```

---

### 2. Rate Limiting

**Key Pattern:** `ratelimit:{userId}:{channel}:{eventType}`

```typescript
// Redis String with TTL
Key: "ratelimit:507f1f77bcf86cd799439011:email:reportGeneration"
Value: 5                         // Current count
TTL: 3600                        // 1 hour in seconds

// Rate limit configuration stored in Redis Hash
notifications:ratelimits = {
  "email:reportGeneration": "10:3600",      // 10 per hour
  "email:quarterlyUpdate": "5:86400",       // 5 per day
  "email:subscription": "3:3600",           // 3 per hour
  "inApp:reportGeneration": "50:3600",      // 50 per hour
  "inApp:systemAlert": "20:3600"            // 20 per hour
}
```

---

### 3. Delivery Status Cache

**Key Pattern:** `notification:status:{notificationId}`

```typescript
// Redis Hash
Key: "notification:status:550e8400-e29b-41d4-a716-446655440000"
Value: {
  status: "SENT",
  channel: "EMAIL",
  recipientId: "507f1f77bcf86cd799439011",
  sentAt: "2025-11-10T10:30:00Z",
  attempts: 1,
  lastError: null
}
TTL: 86400                       // 24 hours
```

---

### 4. User Notification Count Cache

**Key Pattern:** `notifications:unread:{userId}`

```typescript
// Redis String
Key: "notifications:unread:507f1f77bcf86cd799439011"
Value: 12                        // Unread count
TTL: 300                         // 5 minutes (refresh from MongoDB)
```

---

### 5. Digest Batch Queue

**Key Pattern:** `digest:batch:{frequency}:{date}`

```typescript
// Redis Set (collection of user IDs)
Key: "digest:batch:daily:2025-11-10"
Members: [
  "507f1f77bcf86cd799439011",
  "507f1f77bcf86cd799439012",
  "507f1f77bcf86cd799439013"
]
TTL: 172800                      // 2 days

// Individual user digest data
Key: "digest:user:507f1f77bcf86cd799439011:2025-11-10"
Value: JSON.stringify([
  {
    type: "REPORT_GENERATED",
    data: { reportId: "...", employeeName: "..." }
  },
  {
    type: "QUARTERLY_UPDATE",
    data: { updateId: "...", employeeCount: 5 }
  }
])
TTL: 172800                      // 2 days
```

---

### 6. WebSocket Connection Tracking

**Key Pattern:** `ws:connections:{userId}`

```typescript
// Redis Set (active WebSocket connection IDs)
Key: "ws:connections:507f1f77bcf86cd799439011"
Members: [
  "conn_abc123xyz",              // Browser session 1
  "conn_def456uvw"               // Browser session 2 (multi-tab)
]
TTL: 3600                        // 1 hour, refreshed on activity
```

---

## Migration Strategy

### Initial Setup (v1.0)

1. **MongoDB Collections**
   - Create collections with defined schemas
   - Apply indexes for performance optimization
   - Insert default notification templates
   - Set up TTL indexes for auto-cleanup

2. **Redis Configuration**
   - Initialize BullMQ queues with proper settings
   - Configure rate limiting rules
   - Set up connection pool for high throughput

3. **Data Seeding**
   ```javascript
   // Default notification templates
   db.notification_templates.insertMany([
     {
       templateCode: "REPORT_GENERATED",
       channel: "BOTH",
       eventType: "employee.report.generated",
       // ... template details
     },
     {
       templateCode: "QUARTERLY_UPDATE_COMPLETE",
       channel: "BOTH",
       eventType: "system.quarterly.update.complete",
       // ... template details
     },
     // ... other default templates
   ]);
   
   // Default rate limits in Redis
   redis.hmset("notifications:ratelimits", {
     "email:reportGeneration": "10:3600",
     "email:quarterlyUpdate": "5:86400",
     // ... other rate limits
   });
   ```

### Schema Versioning

- Use `schemaVersion` field in collections for tracking
- Implement migration scripts in `/migrations/` directory
- Use Mongoose schema versioning for breaking changes

### Backward Compatibility

- Maintain deprecated fields during transition periods
- Use field aliases for renamed properties
- Provide migration utilities for data transformation

### Data Retention Policies

1. **Notification Logs**
   - Retain for 1 year in active database
   - Archive to cold storage after 1 year
   - Permanent deletion after 3 years

2. **In-App Notifications**
   - Auto-expire after 90 days (TTL index)
   - User-dismissed notifications: 30 days
   - Read notifications: 60 days

3. **Redis Cache**
   - Delivery status: 24 hours
   - Rate limit counters: Reset per time window
   - WebSocket connections: 1 hour with activity refresh

### Performance Optimization

1. **Index Maintenance**
   - Monthly index usage analysis
   - Remove unused indexes
   - Add indexes based on query patterns

2. **Sharding Strategy** (Future)
   - Shard `notification_logs` by `organizationId` when > 50M documents
   - Shard `notification_history` by `userId` when > 100M documents

3. **Caching Strategy**
   - Cache frequently accessed templates in Redis
   - Cache user preferences for 5 minutes
   - Invalidate cache on preference updates

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Status:** Production Ready