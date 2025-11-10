# Error Handling - Notification System

## Error Scenarios Matrix

| Scenario | Error Code | HTTP Status | User Message | Resolution |
|----------|------------|-------------|--------------|------------|
| Email service unavailable | NOTIFY_EMAIL_001 | 503 | Email service is temporarily unavailable. Notification will be retried. | Automatic retry with exponential backoff (3 attempts). Falls back to in-app notification only. |
| Invalid email address | NOTIFY_EMAIL_002 | 400 | Invalid email address provided. | Validate email format on input. Update user profile with valid email. |
| Email delivery failed | NOTIFY_EMAIL_003 | 500 | Failed to send email notification. | Retry up to 3 times. Log failure and alert admin if persistent. Mark notification as failed. |
| SMTP authentication failure | NOTIFY_EMAIL_004 | 503 | Email service configuration error. | Verify SMTP credentials. Check environment variables. Contact system administrator. |
| Email rate limit exceeded | NOTIFY_EMAIL_005 | 429 | Too many emails sent. Please try again later. | Queue notification for delayed sending. Implement rate limiting per user/organization. |
| Notification template not found | NOTIFY_TMPL_001 | 404 | Notification template is missing. | Create or restore missing template. Use fallback generic template if available. |
| Template rendering failed | NOTIFY_TMPL_002 | 500 | Failed to generate notification content. | Validate template syntax. Check template variables. Use fallback template. |
| Invalid template variables | NOTIFY_TMPL_003 | 400 | Required notification data is missing. | Validate all required variables before rendering. Provide default values where possible. |
| Notification preferences not found | NOTIFY_PREF_001 | 404 | User notification preferences not configured. | Create default preferences for user. Allow preference configuration in settings. |
| Invalid notification type | NOTIFY_TYPE_001 | 400 | Unknown notification type requested. | Validate notification type against allowed enum. Check API request payload. |
| User not found | NOTIFY_USER_001 | 404 | Recipient user does not exist. | Verify user ID exists in database. Check if user was deleted. |
| Insufficient permissions | NOTIFY_AUTH_001 | 403 | You do not have permission to send this notification. | Verify role-based access. Ensure sender has appropriate permissions for notification type. |
| WebSocket connection failed | NOTIFY_WS_001 | 503 | Real-time notifications unavailable. | Automatic reconnection attempts. Fall back to polling for in-app notifications. |
| WebSocket message delivery failed | NOTIFY_WS_002 | 500 | Failed to deliver real-time notification. | Store notification in database for later retrieval. Client will fetch on next sync. |
| Redis queue unavailable | NOTIFY_QUEUE_001 | 503 | Notification queue is unavailable. | Attempt direct delivery. Retry queue connection. Alert operations team. |
| Redis connection timeout | NOTIFY_QUEUE_002 | 504 | Notification queue connection timeout. | Retry connection with exponential backoff. Use in-memory fallback queue temporarily. |
| Queue message processing failed | NOTIFY_QUEUE_003 | 500 | Failed to process queued notification. | Move to dead letter queue. Log failure details. Retry with backoff. |
| Notification batch too large | NOTIFY_BATCH_001 | 413 | Too many recipients in notification batch. | Split batch into smaller chunks (max 100 recipients per batch). Process in parallel. |
| Duplicate notification detected | NOTIFY_DUP_001 | 409 | Notification already sent. | Check notification log before sending. Use idempotency keys for critical notifications. |
| Database write failure | NOTIFY_DB_001 | 500 | Failed to save notification record. | Retry database operation. Log to external system. Alert if persistent. |
| Database read failure | NOTIFY_DB_002 | 500 | Failed to retrieve notification data. | Retry read operation. Check database connection. Return cached data if available. |
| Report generation event missing data | NOTIFY_EVENT_001 | 400 | Report notification missing required data. | Validate event payload. Ensure report ID and user ID are present. |
| Quarterly update event invalid | NOTIFY_EVENT_002 | 400 | Invalid quarterly update event data. | Validate employee IDs and organization scope. Check subscription status. |
| Subscription event validation failed | NOTIFY_EVENT_003 | 400 | Invalid subscription event data. | Verify subscription ID and status. Validate event timestamp. |
| Role-based filtering failed | NOTIFY_FILTER_001 | 500 | Failed to apply role-based notification filters. | Log filter failure. Send to all eligible roles as fallback. Review filter logic. |
| Notification preference override failed | NOTIFY_PREF_002 | 500 | Failed to apply user notification preferences. | Use default preferences. Log override failure for investigation. |
| Unsubscribed user | NOTIFY_UNSUB_001 | 200 | User has unsubscribed from this notification type. | Skip notification delivery. Log event. Return success (not an error condition). |
| External notification service timeout | NOTIFY_EXT_001 | 504 | External notification service timed out. | Retry with shorter timeout. Fall back to alternative service. Queue for later. |
| Notification content too large | NOTIFY_SIZE_001 | 413 | Notification content exceeds maximum size. | Truncate content with "Read more" link. Store full content separately. |
| Invalid notification schedule | NOTIFY_SCHED_001 | 400 | Invalid notification schedule configuration. | Validate cron expression or timestamp. Use immediate delivery as fallback. |
| Scheduled notification execution failed | NOTIFY_SCHED_002 | 500 | Failed to execute scheduled notification. | Retry on next schedule cycle. Log failure. Alert if multiple failures. |
| Multi-channel delivery partial failure | NOTIFY_MULTI_001 | 207 | Some notification channels failed. | Log successful and failed channels. Retry failed channels. Notify user of partial delivery. |
| Notification audit log failure | NOTIFY_AUDIT_001 | 500 | Failed to record notification audit log. | Continue with notification delivery. Log to backup system. Alert operations. |

## Common Error Codes

### Email Service Errors (NOTIFY_EMAIL_XXX)
**Range**: NOTIFY_EMAIL_001 to NOTIFY_EMAIL_099

- **001**: Email service unavailable - Temporary outage or network issue
- **002**: Invalid email address - Format validation failure
- **003**: Email delivery failed - SMTP delivery rejection
- **004**: SMTP authentication failure - Configuration or credentials issue
- **005**: Email rate limit exceeded - Too many emails in short period

**Common Causes**:
- SMTP server downtime or maintenance
- Network connectivity issues
- Invalid email configuration (host, port, credentials)
- Recipient email server rejection (spam filters, blacklisting)
- Rate limiting by email provider

**Handling Strategy**:
- Implement exponential backoff retry (initial: 30s, max: 10 minutes)
- Maximum 3 retry attempts for transient failures
- Fall back to in-app notification if email fails
- Queue failed emails for batch retry during off-peak hours
- Alert operations team after 3 consecutive failures

### Template Errors (NOTIFY_TMPL_XXX)
**Range**: NOTIFY_TMPL_001 to NOTIFY_TMPL_099

- **001**: Template not found - Missing template in database or file system
- **002**: Template rendering failed - Syntax error or rendering engine failure
- **003**: Invalid template variables - Missing required data for template

**Common Causes**:
- Template deleted or not deployed
- Handlebars/EJS syntax errors in template
- Missing or null values for required template variables
- Type mismatch in template data
- Circular reference in template logic

**Handling Strategy**:
- Maintain fallback generic templates for each notification type
- Validate template syntax on upload/deployment
- Provide default values for optional variables
- Log template errors with full context for debugging
- Cache compiled templates to reduce parsing errors

### Notification Preferences Errors (NOTIFY_PREF_XXX)
**Range**: NOTIFY_PREF_001 to NOTIFY_PREF_099

- **001**: Preferences not found - User has no preference configuration
- **002**: Preference override failed - Unable to apply user settings

**Common Causes**:
- New user without initialized preferences
- Database query failure
- Corrupted preference data
- Invalid preference schema after system update

**Handling Strategy**:
- Auto-create default preferences on first user access
- Use system defaults when user preferences unavailable
- Validate preference data against schema before applying
- Log preference failures for user support follow-up

### Authentication & Authorization Errors (NOTIFY_AUTH_XXX)
**Range**: NOTIFY_AUTH_001 to NOTIFY_AUTH_099

- **001**: Insufficient permissions - User lacks required role for notification action

**Common Causes**:
- User role doesn't match required permission level
- Attempting to send organization-wide notifications without Owner role
- Cross-department notification without Leader role
- Token expiration or invalid JWT

**Handling Strategy**:
- Validate permissions before processing notification request
- Return 403 with clear permission requirements
- Log unauthorized attempts for security monitoring
- Suggest required role in error message

### WebSocket Connection Errors (NOTIFY_WS_XXX)
**Range**: NOTIFY_WS_001 to NOTIFY_WS_099

- **001**: WebSocket connection failed - Unable to establish real-time connection
- **002**: WebSocket message delivery failed - Message not delivered to client

**Common Causes**:
- Client network disconnection
- WebSocket server overload
- Browser/client doesn't support WebSockets
- Firewall or proxy blocking WebSocket protocol
- Client-side reconnection logic failure

**Handling Strategy**:
- Implement automatic reconnection with exponential backoff
- Store undelivered notifications in database for client retrieval
- Fall back to HTTP polling for critical notifications
- Set reasonable WebSocket timeout (30 seconds)
- Log connection failures for infrastructure monitoring

### Queue & Redis Errors (NOTIFY_QUEUE_XXX)
**Range**: NOTIFY_QUEUE_001 to NOTIFY_QUEUE_099

- **001**: Redis queue unavailable - Cannot connect to Redis
- **002**: Redis connection timeout - Connection attempt exceeded timeout
- **003**: Queue message processing failed - Error processing job from queue

**Common Causes**:
- Redis server down or restarting
- Network latency or connectivity loss
- Redis memory full (maxmemory limit reached)
- Message payload exceeds Redis string size limit
- Worker process crash during job processing

**Handling Strategy**:
- Implement Redis connection pooling with health checks
- Use dead letter queue (DLQ) for failed jobs
- Retry failed jobs with exponential backoff (max 5 attempts)
- Monitor Redis memory usage and set appropriate maxmemory policy
- Alert operations on queue depth exceeding threshold (>1000 jobs)
- Implement circuit breaker for Redis failures (fail open after 3 attempts)

### Database Errors (NOTIFY_DB_XXX)
**Range**: NOTIFY_DB_001 to NOTIFY_DB_099

- **001**: Database write failure - Unable to save notification record
- **002**: Database read failure - Unable to retrieve notification data

**Common Causes**:
- MongoDB connection pool exhausted
- Database index issues causing slow queries
- Disk space full on database server
- Replica set failover in progress
- Schema validation errors

**Handling Strategy**:
- Implement connection retry with exponential backoff
- Use MongoDB connection pooling (min: 10, max: 100 connections)
- Cache frequently accessed notification templates
- Implement read preference for replica sets (secondary for reads)
- Log slow queries (>1 second) for optimization
- Monitor database health metrics (CPU, memory, disk I/O)

### Event Processing Errors (NOTIFY_EVENT_XXX)
**Range**: NOTIFY_EVENT_001 to NOTIFY_EVENT_099

- **001**: Report generation event missing data - Invalid event payload
- **002**: Quarterly update event invalid - Malformed event data
- **003**: Subscription event validation failed - Event doesn't meet schema

**Common Causes**:
- Event publisher sending incomplete data
- Schema version mismatch between services
- Event serialization/deserialization errors
- Missing required fields in event payload
- Event timestamp out of acceptable range

**Handling Strategy**:
- Validate all event payloads against JSON schema
- Log invalid events to dead letter queue for investigation
- Send alert to event publisher service on validation failures
- Implement event versioning for backward compatibility
- Define clear event contracts in documentation

### General System Errors (NOTIFY_XXX)
**Range**: NOTIFY_001 to NOTIFY_099 (reserved for future use)

- **DUP_001**: Duplicate notification - Same notification already sent
- **BATCH_001**: Batch too large - Exceeds maximum recipient count
- **SIZE_001**: Content too large - Notification content exceeds limit
- **SCHED_001**: Invalid schedule - Cron expression or timestamp invalid
- **MULTI_001**: Multi-channel partial failure - Some channels succeeded, others failed

## Error Propagation

### Layer Architecture

```
┌─────────────────────────────────────┐
│     Controller Layer (HTTP/WS)      │  ← Handles HTTP exceptions, formats responses
├─────────────────────────────────────┤
│        Service Layer (Business)     │  ← Throws domain-specific exceptions
├─────────────────────────────────────┤
│      Repository Layer (Data)        │  ← Throws database exceptions
├─────────────────────────────────────┤
│    External Services (Email/Queue)  │  ← Throws integration exceptions
└─────────────────────────────────────┘
```

### Error Flow

#### 1. External Service Errors → Repository Layer
**Scenario**: Email service fails to send notification

```typescript
// External service throws error
EmailService.send() → throws SmtpException

// Caught in NotificationService
catch (SmtpException) {
  → throw new EmailDeliveryFailedException(NOTIFY_EMAIL_003)
}
```

**Propagation**:
- External error caught and wrapped in domain-specific exception
- Original error details logged for debugging
- Retry logic applied at service layer
- Fall back to alternative channel (in-app notification)

#### 2. Database Errors → Service Layer
**Scenario**: MongoDB connection failure during notification save

```typescript
// Repository layer
NotificationRepository.create() → throws MongoError

// Service layer catches and transforms
catch (MongoError) {
  → log error details
  → throw new NotificationPersistenceException(NOTIFY_DB_001)
  → trigger retry mechanism
}
```

**Propagation**:
- Database error caught in repository layer
- Transformed to business exception in service layer
- Retry attempted (max 3 times with exponential backoff)
- If retries fail, error propagated to controller
- Controller returns 500 with user-friendly message

#### 3. Validation Errors → Controller Layer
**Scenario**: Invalid notification payload from client

```typescript
// Controller layer (DTO validation)
@Post('/send')
async sendNotification(@Body() dto: SendNotificationDto) {
  // class-validator throws ValidationError
}

// NestJS exception filter catches
ValidationException → BadRequestException {
  statusCode: 400,
  message: "Invalid email address provided",
  errorCode: "NOTIFY_EMAIL_002"
}
```

**Propagation**:
- Validation error caught by NestJS pipes
- Transformed to BadRequestException
- Formatted response returned immediately
- No service layer invocation occurs

#### 4. Business Logic Errors → Service Layer
**Scenario**: User has unsubscribed from notification type

```typescript
// Service layer validates business rules
if (user.preferences.unsubscribed.includes(notificationType)) {
  throw new NotificationBlockedException(NOTIFY_UNSUB_001);
}

// Exception filter catches
NotificationBlockedException → HttpException {
  statusCode: 200, // Not an error, expected behavior
  message: "User has unsubscribed from this notification type",
  errorCode: "NOTIFY_UNSUB_001"
}
```

**Propagation**:
- Business rule violation detected in service layer
- Custom exception thrown with appropriate status code
- Logged as info level (not an error)
- Response indicates successful handling of unsubscribed state

### Error Handling Patterns

#### Pattern 1: Retry with Exponential Backoff
**Used for**: Transient errors (network, temporary service unavailability)

```typescript
async function sendWithRetry(notification: Notification, maxAttempts = 3) {
  let attempt = 0;
  let delay = 1000; // Initial delay: 1 second

  while (attempt < maxAttempts) {
    try {
      return await emailService.send(notification);
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) {
        logger.error(`Failed after ${maxAttempts} attempts`, error);
        throw new EmailDeliveryFailedException(NOTIFY_EMAIL_003);
      }
      await sleep(delay);
      delay *= 2; // Exponential backoff: 1s, 2s, 4s
    }
  }
}
```

#### Pattern 2: Circuit Breaker
**Used for**: Protecting against cascading failures from external services

```typescript
class EmailServiceCircuitBreaker {
  private failureCount = 0;
  private readonly threshold = 5;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private nextAttemptTime: Date;

  async send(notification: Notification) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime.getTime()) {
        throw new ServiceUnavailableException(NOTIFY_EMAIL_001);
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await emailService.send(notification);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = new Date(Date.now() + 60000); // 1 minute
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}
```

#### Pattern 3: Dead Letter Queue
**Used for**: Failed messages that need manual investigation

```typescript
async function processNotificationJob(job: Job) {
  try {
    await notificationService.send(job.data);
    await job.done();
  } catch (error) {
    if (job.attemptsMade >= 3) {
      // Move to dead letter queue
      await deadLetterQueue.add({
        originalJob: job.data,
        error: error.message,
        attempts: job.attemptsMade,
        timestamp: new Date()
      });
      await job.done(); // Remove from main queue
    } else {
      // Retry
      throw error;
    }
  }
}
```

#### Pattern 4: Graceful Degradation
**Used for**: Non-critical features that can fail without blocking core functionality

```typescript
async function sendMultiChannelNotification(notification: Notification) {
  const results = {
    email: null,
    inApp: null,
    websocket: null
  };

  // Try email (non-blocking)
  try {
    results.email = await emailService.send(notification);
  } catch (error) {
    logger.warn('Email delivery failed, continuing with other channels', error);
  }

  // Try in-app (critical - must succeed)
  try {
    results.inApp = await inAppService.create(notification);
  } catch (error) {
    logger.error('In-app notification failed', error);
    throw new NotificationDeliveryException(NOTIFY_MULTI_001);
  }

  // Try WebSocket (non-blocking, best effort)
  try {
    results.websocket = await websocketService.emit(notification);
  } catch (error) {
    logger.debug('WebSocket delivery failed (expected if user offline)', error);
  }

  return results;
}
```

### Error Logging Strategy

#### Log Levels by Error Severity

**ERROR Level**: System failures requiring immediate attention
- Database connection failures (NOTIFY_DB_XXX)
- Redis queue unavailable (NOTIFY_QUEUE_001)
- Critical configuration errors (SMTP auth failure)
- Repeated failures exceeding threshold

**WARN Level**: Recoverable issues that may indicate problems
- Email delivery failures (will retry)
- Template rendering issues (using fallback)
- Individual channel failures in multi-channel delivery
- Rate limiting triggered

**INFO Level**: Expected business events
- User unsubscribed from notifications
- Notification successfully sent
- Scheduled notification executed
- Preference updated

**DEBUG Level**: Detailed diagnostic information
- WebSocket connection attempts
- Queue job processing started/completed
- Template rendering details
- Retry attempts

#### Structured Logging Format

```json
{
  "timestamp": "2025-11-10T12:34:56.789Z",
  "level": "error",
  "errorCode": "NOTIFY_EMAIL_003",
  "message": "Failed to send email notification",
  "context": {
    "userId": "user_123",
    "organizationId": "org_456",
    "notificationType": "REPORT_GENERATED",
    "attemptNumber": 3,
    "recipientEmail": "user@example.com"
  },
  "error": {
    "name": "SmtpException",
    "message": "Connection timeout",
    "stack": "..."
  },
  "metadata": {
    "requestId": "req_789",
    "sessionId": "sess_012"
  }
}
```

### Error Monitoring & Alerting

#### Alert Triggers

**Critical (Immediate PagerDuty)**:
- Email service down for >5 minutes
- Redis queue unavailable for >2 minutes
- Database connection pool exhausted
- Circuit breaker open for >10 minutes
- Dead letter queue exceeding 100 messages

**Warning (Slack notification)**:
- Email delivery failure rate >10% over 15 minutes
- WebSocket connection failure rate >25%
- Queue processing lag >5 minutes
- Template rendering errors >5 per minute

**Info (Dashboard metric)**:
- Individual notification failures
- User preference changes
- Channel delivery statistics
- Performance metrics (p95, p99 latency)

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-10  
**Status:** Complete