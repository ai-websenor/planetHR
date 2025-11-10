# Module Interactions - Dashboard & Analytics

## Overview

This document describes how this module interacts with other internal modules in the monolith.

## Internal Module Dependencies

### Direct Dependencies

| Module | Purpose | Interaction Type | Critical Path |
|--------|---------|------------------|---------------|
| **Auth Module** | User authentication & role verification | Service injection | Yes |
| **Users Module** | User profile data, role hierarchy | Service injection | Yes |
| **Organizations Module** | Organization/branch/department data | Service injection | Yes |
| **Employees Module** | Employee data, candidate information | Service injection | Yes |
| **Reports Module** | Report generation status, report access | Service injection | Yes |
| **AI Chat Module** | Chat history, conversation context | Service injection | No |
| **Notifications Module** | Alert delivery, notification preferences | Event-driven | No |
| **Subscriptions Module** | Subscription status, feature access | Service injection | Yes |
| **Activity Logs Module** | User activity tracking, audit trails | Event-driven | No |

### Indirect Dependencies

| Module | Purpose | Via Module | Reason |
|--------|---------|------------|--------|
| **Email Module** | Report delivery notifications | Notifications Module | Async notification delivery |
| **Queue Module** | Background metric processing | Analytics Service | Heavy computation tasks |
| **Cache Module** | Dashboard data caching | Redis Service | Performance optimization |

## Communication Patterns

### 1. Synchronous Service Injection

**Pattern**: Direct method calls between services using NestJS dependency injection

**Use Cases**:
- Fetching user role and permissions for dashboard customization
- Retrieving organization hierarchy for data filtering
- Accessing report metadata for navigation
- Validating subscription status for feature availability

**Example Flow**:
```typescript
// Dashboard Service injecting Organizations Service
@Injectable()
export class DashboardService {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
    private readonly reportsService: ReportsService,
  ) {}

  async getDashboardData(userId: string) {
    const user = await this.usersService.findById(userId);
    const scope = await this.organizationsService.getUserScope(userId);
    const reports = await this.reportsService.getRecentReports(scope);
    
    return this.buildDashboard(user, scope, reports);
  }
}
```

**Error Handling**:
- Wrap external service calls in try-catch blocks
- Implement circuit breaker pattern for failing services
- Provide degraded functionality when non-critical services fail

### 2. Event-Driven Communication

**Pattern**: Asynchronous events using EventEmitter2 or message bus

**Use Cases**:
- Tracking user activity for analytics
- Logging dashboard actions for audit
- Sending notifications on metric thresholds
- Updating real-time statistics

**Events Published**:

| Event Name | Payload | Purpose | Subscribers |
|------------|---------|---------|-------------|
| `dashboard.viewed` | `{ userId, role, timestamp }` | Track dashboard access | Analytics Service |
| `report.accessed` | `{ userId, reportId, reportType }` | Track report usage | Analytics Service, Activity Logs |
| `ai.chat.initiated` | `{ userId, employeeId, timestamp }` | Track AI chat usage | Analytics Service, AI Chat Module |
| `metrics.threshold.reached` | `{ metricType, value, organizationId }` | Alert on metric milestones | Notifications Module |
| `dashboard.error` | `{ userId, error, context }` | Log dashboard errors | Activity Logs Module |

**Events Subscribed**:

| Event Name | Source Module | Action Taken |
|------------|---------------|--------------|
| `report.generated` | Reports Module | Update dashboard statistics |
| `employee.added` | Employees Module | Increment employee count metrics |
| `user.login` | Auth Module | Track user engagement |
| `subscription.updated` | Subscriptions Module | Refresh feature access |
| `notification.sent` | Notifications Module | Log notification delivery |

**Example Implementation**:
```typescript
@Injectable()
export class AnalyticsService {
  constructor(private eventEmitter: EventEmitter2) {
    // Subscribe to events
    this.eventEmitter.on('dashboard.viewed', this.trackDashboardView.bind(this));
    this.eventEmitter.on('report.accessed', this.trackReportAccess.bind(this));
  }

  private async trackDashboardView(payload: DashboardViewEvent) {
    await this.metricsRepository.incrementDashboardViews(payload);
  }
}

// Publishing events
this.eventEmitter.emit('dashboard.viewed', {
  userId: user.id,
  role: user.role,
  timestamp: new Date(),
});
```

### 3. WebSocket Real-Time Updates

**Pattern**: Bidirectional communication for live dashboard updates

**Use Cases**:
- Real-time notification display
- Live metric updates
- Report generation progress
- AI chat integration

**WebSocket Events**:

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `dashboard.notification` | Server → Client | `{ type, message, priority, timestamp }` | Push notifications |
| `metrics.updated` | Server → Client | `{ metricType, value, delta }` | Live metric updates |
| `report.status.changed` | Server → Client | `{ reportId, status, progress }` | Report generation progress |
| `dashboard.refresh` | Server → Client | `{ scope: 'full' \| 'partial' }` | Trigger dashboard reload |

**Implementation**:
```typescript
@WebSocketGateway()
export class DashboardGateway {
  @WebSocketServer()
  server: Server;

  notifyUser(userId: string, notification: Notification) {
    this.server.to(`user:${userId}`).emit('dashboard.notification', notification);
  }

  broadcastMetricUpdate(organizationId: string, metric: MetricUpdate) {
    this.server.to(`org:${organizationId}`).emit('metrics.updated', metric);
  }
}
```

### 4. Queue-Based Background Processing

**Pattern**: Asynchronous task processing using BullMQ

**Use Cases**:
- Heavy analytics computation
- Historical data aggregation
- Report generation tracking
- Metric rollup calculations

**Queues Used**:

| Queue Name | Purpose | Priority | Retry Strategy |
|------------|---------|----------|----------------|
| `analytics-processing` | Process user activity logs | Medium | 3 attempts, exponential backoff |
| `metrics-aggregation` | Daily/weekly/monthly rollups | Low | 5 attempts, fixed delay |
| `dashboard-cache-refresh` | Precompute dashboard data | Low | 2 attempts |
| `report-tracking` | Track report generation metrics | Medium | 3 attempts |

**Example**:
```typescript
@Injectable()
export class MetricsTrackingService {
  constructor(
    @InjectQueue('analytics-processing') private analyticsQueue: Queue,
  ) {}

  async trackUserAction(action: UserAction) {
    await this.analyticsQueue.add('process-action', action, {
      priority: action.critical ? 1 : 5,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }
}
```

## Shared Resources

### 1. Databases

#### PostgreSQL - Analytics Database

**Shared Tables**:

| Table | Owner Module | Access Type | Purpose |
|-------|--------------|-------------|---------|
| `user_activity_logs` | Activity Logs Module | Read/Write | User action tracking |
| `dashboard_views` | Dashboard Module | Read/Write | Dashboard access analytics |
| `report_access_logs` | Reports Module | Read | Report usage statistics |
| `feature_usage` | Dashboard Module | Read/Write | Feature utilization tracking |
| `subscription_events` | Subscriptions Module | Read | Feature access validation |

**Connection Pool**:
- Shared connection pool with max 50 connections
- Dashboard module uses max 10 connections
- Read replicas for analytics queries

#### MongoDB - User Activity Collection

**Shared Collections**:

| Collection | Owner Module | Access Pattern | Indexes |
|------------|--------------|----------------|---------|
| `user_sessions` | Auth Module | Read | `userId`, `timestamp` |
| `dashboard_interactions` | Dashboard Module | Read/Write | `userId`, `organizationId`, `timestamp` |
| `ai_chat_history` | AI Chat Module | Read | `userId`, `employeeId`, `timestamp` |
| `notification_logs` | Notifications Module | Read | `userId`, `status`, `timestamp` |

**Access Strategy**:
- Time-series data with TTL indexes (90 days retention)
- Aggregation pipelines for metric calculation
- Bulk write operations for high-volume logging

### 2. Redis Cache

**Shared Keys**:

| Key Pattern | Owner Module | TTL | Purpose |
|-------------|--------------|-----|---------|
| `dashboard:user:{userId}` | Dashboard Module | 5 min | Cached dashboard data |
| `metrics:org:{orgId}:daily` | Analytics Service | 1 hour | Daily metrics cache |
| `user:scope:{userId}` | Organizations Module | 15 min | User access scope |
| `reports:recent:{userId}` | Reports Module | 10 min | Recent reports list |
| `subscription:status:{orgId}` | Subscriptions Module | 30 min | Subscription validation |

**Cache Invalidation Strategy**:
- Event-based invalidation on data changes
- Automatic expiry with TTL
- Manual invalidation for critical updates

**Example**:
```typescript
@Injectable()
export class DashboardCacheService {
  constructor(
    private readonly redisService: RedisService,
    private eventEmitter: EventEmitter2,
  ) {
    // Invalidate cache on relevant events
    this.eventEmitter.on('employee.updated', this.invalidateOrgCache.bind(this));
    this.eventEmitter.on('report.generated', this.invalidateUserCache.bind(this));
  }

  async invalidateUserCache(userId: string) {
    await this.redisService.del(`dashboard:user:${userId}`);
  }
}
```

### 3. Session Store

**Shared Resource**: Redis session storage

**Usage**:
- Active user sessions for WebSocket connections
- Room management for real-time updates
- User presence tracking

**Keys**:
- `session:{sessionId}` - Session data
- `user:sockets:{userId}` - Active WebSocket connections
- `org:users:{orgId}` - Online users per organization

### 4. File Storage (S3/Local)

**Shared Buckets**:

| Bucket/Path | Owner Module | Access Type | Purpose |
|-------------|--------------|-------------|---------|
| `/reports/generated/` | Reports Module | Read | Report file access |
| `/exports/analytics/` | Analytics Service | Read/Write | Analytics data exports |
| `/dashboard/widgets/` | Dashboard Module | Read | Custom widget configs |

## Data Flow Diagrams

### Dashboard Load Flow

```
User Request → Auth Module (validate) → Users Module (get role) →
Organizations Module (get scope) → Dashboard Service (build dashboard) →
  ↓
  ├─→ Reports Module (recent reports)
  ├─→ Employees Module (employee count)
  ├─→ Analytics Service (metrics summary)
  └─→ Subscriptions Module (feature access)
  ↓
Dashboard Response (cached for 5 min)
```

### Real-Time Metric Update Flow

```
Report Generated Event →
  ↓
  ├─→ Analytics Service (update metrics)
  ├─→ Dashboard Gateway (WebSocket broadcast)
  └─→ Cache Service (invalidate dashboard cache)
  ↓
Connected Clients (receive metric update)
```

### Analytics Processing Flow

```
User Action (dashboard/report access) →
Event Emitter (publish action event) →
  ↓
  ├─→ Analytics Queue (process in background)
  ├─→ Activity Logs Module (audit trail)
  └─→ Metrics Tracking Service (increment counters)
  ↓
Periodic Aggregation (hourly/daily rollups) →
Metrics Database (historical data) →
Dashboard Analytics (business intelligence)
```

## Performance Considerations

### Caching Strategy

1. **Multi-level Cache**:
   - L1: In-memory cache (NestJS CacheManager) - 1 min TTL
   - L2: Redis cache - 5-30 min TTL
   - L3: Database query results - as needed

2. **Cache Warming**:
   - Pre-compute dashboard data for active users
   - Background jobs refresh popular metrics
   - Predictive caching based on usage patterns

3. **Cache Coherence**:
   - Event-driven invalidation
   - Version-based cache keys
   - Distributed cache coordination

### Query Optimization

1. **Database Indexes**:
   - Composite indexes on `(userId, timestamp)` for activity logs
   - Covering indexes for common dashboard queries
   - Partial indexes for active subscriptions

2. **Aggregation Pipelines**:
   - MongoDB aggregation for complex analytics
   - PostgreSQL materialized views for metrics
   - Incremental updates for time-series data

3. **Batch Operations**:
   - Bulk writes for activity logging
   - Batch metric updates every 5 minutes
   - Consolidated database queries

### Scalability Patterns

1. **Horizontal Scaling**:
   - Stateless dashboard service instances
   - Load-balanced WebSocket connections
   - Distributed Redis cluster

2. **Vertical Optimization**:
   - Connection pooling
   - Query result streaming
   - Memory-efficient data structures

3. **Circuit Breakers**:
   - Fail fast on service unavailability
   - Graceful degradation for analytics
   - Fallback to cached data

## Security Considerations

### Access Control

1. **Role-Based Filtering**:
   - Dashboard data filtered by user scope
   - Metrics aggregated per user permissions
   - Organization-level data isolation

2. **Data Masking**:
   - Sensitive employee data masked in analytics
   - Anonymized user activity logs
   - Aggregated metrics only for lower roles

### Audit Logging

1. **Dashboard Actions**:
   - All dashboard views logged
   - Report access tracked with user details
   - AI chat queries audited

2. **Metric Manipulation**:
   - Administrative metric adjustments logged
   - Data export activities tracked
   - Anomaly detection for suspicious patterns

## Error Handling & Resilience

### Service Failure Scenarios

| Scenario | Impact | Mitigation | User Experience |
|----------|--------|------------|-----------------|
| Reports Module unavailable | No recent reports | Show cached reports, hide "Generate" button | "Reports temporarily unavailable" |
| Analytics Service down | No live metrics | Show cached metrics, disable refresh | Stale data warning |
| Organizations Module failure | Can't determine scope | Deny access, fallback to cached scope | "Please try again later" |
| WebSocket disconnection | No live updates | Auto-reconnect, poll for updates | Reconnection indicator |
| Cache failure | Slow dashboard load | Direct database queries, degraded performance | Slower load times |

### Retry Strategies

1. **Synchronous Calls**:
   - Immediate retry with exponential backoff
   - Max 3 attempts
   - Circuit breaker after 5 consecutive failures

2. **Event Processing**:
   - Queue-based retry with delay
   - Dead letter queue for permanent failures
   - Manual intervention for critical events

3. **WebSocket Reconnection**:
   - Client-side auto-reconnect
   - Exponential backoff (1s, 2s, 4s, 8s)
   - Max 10 reconnection attempts

## Testing Integration Points

### Unit Testing

- Mock all injected services
- Test event emissions and subscriptions
- Verify cache invalidation logic

### Integration Testing

- Test cross-module service calls
- Verify event propagation
- Test shared database access

### E2E Testing

- Test complete dashboard load flow
- Verify real-time updates end-to-end
- Test analytics pipeline from action to metrics

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Complete