# Technical Specifications - Dashboard & Analytics

## Architecture Overview

This module is part of a monolithic application architecture with well-defined internal modules and layers.

The Dashboard & Analytics module provides a comprehensive view of organizational data through role-specific dashboards, real-time metrics tracking, and advanced analytics capabilities. It serves as the primary interface for users to access reports, monitor system usage, and interact with AI-powered insights.

### Architectural Principles

- **Monolithic Module Structure**: Three core internal services within the NestJS application
- **Event-Driven Communication**: WebSocket integration for real-time updates and notifications
- **Multi-Database Strategy**: PostgreSQL for structured analytics, MongoDB for high-volume activity logs
- **Role-Based Data Filtering**: All data queries enforce user role and organizational scope
- **Caching-First Approach**: Redis caching for frequently accessed dashboard data and metrics
- **Queue-Based Processing**: BullMQ for heavy analytics computation and report aggregation

### Technology Stack

- **Framework**: NestJS v11.x with TypeScript
- **Databases**: PostgreSQL (analytics), MongoDB (activity logs)
- **Cache**: Redis for dashboard data and computed metrics
- **Queue**: BullMQ for async analytics processing
- **Real-time**: WebSocket (Socket.io) for notifications
- **Visualization**: Computed metrics served to frontend charting libraries

## Application Modules

### dashboard-service

**Responsibility:**
Manages role-specific dashboard views, widget configuration, and data aggregation for visualization. Orchestrates data from multiple sources (reports, employees, organizations) to provide customized dashboard experiences based on user roles (Owner, Leader, Manager).

**Layer:** Presentation + Business Logic

**Dependencies:**
- `reports-service` - Fetches report metadata and generation status
- `employees-service` - Retrieves employee counts and profile summaries
- `organizations-service` - Organization and department hierarchy data
- `auth-service` - User role and permission validation
- `analytics-service` - Pre-computed metrics and statistics
- `chat-service` - AI chat integration status and history
- `notifications-service` - Recent notifications and alerts

**Exposed APIs:**

```typescript
// Internal Module Interface
interface IDashboardService {
  // Dashboard data retrieval
  getDashboardData(userId: string, roleScope: RoleScope): Promise<DashboardData>;
  
  // Widget management
  getUserWidgets(userId: string): Promise<DashboardWidget[]>;
  updateWidgetConfiguration(userId: string, widgetId: string, config: WidgetConfig): Promise<void>;
  
  // Quick stats
  getQuickStats(userId: string, scope: OrganizationalScope): Promise<QuickStats>;
  
  // Recent activities
  getRecentActivities(userId: string, limit: number): Promise<Activity[]>;
  
  // Notification feed
  getNotificationFeed(userId: string, page: number): Promise<PaginatedNotifications>;
}
```

**Key Components:**
- `DashboardController` - REST API endpoints for dashboard data
- `DashboardOrchestrator` - Aggregates data from multiple services
- `WidgetFactory` - Creates role-specific widget configurations
- `DashboardCacheManager` - Redis caching for dashboard data
- `RealTimeUpdater` - WebSocket handler for live dashboard updates

### analytics-service

**Responsibility:**
Computes and stores platform adoption metrics, user engagement statistics, and business impact measurements. Processes activity logs to generate insights on feature utilization, report generation patterns, and system performance KPIs.

**Layer:** Business Logic + Data Access

**Dependencies:**
- `users-service` - User login and activity data
- `reports-service` - Report generation and viewing statistics
- `chat-service` - AI chat interaction metrics
- `employees-service` - Employee and candidate management statistics
- `organizations-service` - Organization and subscription data
- `metrics-tracking-service` - Raw event data consumption

**Exposed APIs:**

```typescript
// Internal Module Interface
interface IAnalyticsService {
  // Platform adoption metrics
  getPlatformAdoptionMetrics(orgId: string, timeRange: TimeRange): Promise<AdoptionMetrics>;
  
  // User engagement analytics
  getUserEngagementAnalytics(orgId: string, timeRange: TimeRange): Promise<EngagementAnalytics>;
  
  // Report generation statistics
  getReportGenerationStats(orgId: string, timeRange: TimeRange): Promise<ReportStats>;
  
  // Feature utilization tracking
  getFeatureUtilization(orgId: string, timeRange: TimeRange): Promise<FeatureUsageMetrics>;
  
  // Business impact metrics
  getBusinessImpactMetrics(orgId: string, timeRange: TimeRange): Promise<BusinessMetrics>;
  
  // Compute and cache metrics
  computeMetrics(orgId: string, metricType: MetricType): Promise<void>;
}
```

**Key Components:**
- `AnalyticsController` - REST API endpoints for analytics data
- `MetricsComputer` - Aggregates raw event data into meaningful metrics
- `AnalyticsRepository` - PostgreSQL queries for computed analytics
- `TrendAnalyzer` - Computes period-over-period changes and trends
- `AnalyticsQueueProcessor` - BullMQ consumer for heavy analytics computation

### metrics-tracking-service

**Responsibility:**
Captures and persists all user activities, system events, and interaction data in real-time. Provides high-throughput event ingestion for subsequent analytics processing. Serves as the source of truth for all platform usage data.

**Layer:** Data Access

**Dependencies:**
- None (foundational service consumed by others)

**Exposed APIs:**

```typescript
// Internal Module Interface
interface IMetricsTrackingService {
  // Event tracking
  trackEvent(event: PlatformEvent): Promise<void>;
  trackBatchEvents(events: PlatformEvent[]): Promise<void>;
  
  // Activity logging
  logUserActivity(activity: UserActivity): Promise<void>;
  
  // Feature usage tracking
  trackFeatureUsage(userId: string, feature: FeatureIdentifier): Promise<void>;
  
  // Report interaction tracking
  trackReportInteraction(userId: string, reportId: string, action: ReportAction): Promise<void>;
  
  // Session tracking
  trackSessionStart(userId: string, sessionData: SessionInfo): Promise<string>;
  trackSessionEnd(sessionId: string): Promise<void>;
  
  // Query raw events
  queryEvents(filters: EventFilters, pagination: Pagination): Promise<PaginatedEvents>;
}
```

**Key Components:**
- `MetricsTrackingController` - REST API endpoints for event ingestion
- `EventRepository` - MongoDB high-performance writes for activity logs
- `EventBatcher` - Buffers and batches events for efficient writes
- `EventValidator` - Validates event schema before persistence
- `MetricsWebSocketGateway` - Real-time event streaming via WebSocket


## Layered Architecture

### Presentation Layer

**Controllers:**
- `DashboardController` - Dashboard data endpoints (`/api/v1/dashboard/*`)
- `AnalyticsController` - Analytics and metrics endpoints (`/api/v1/analytics/*`)
- `MetricsController` - Event tracking endpoints (`/api/v1/metrics/*`)

**WebSocket Gateways:**
- `DashboardGateway` - Real-time dashboard updates (`ws://server/dashboard`)
- `MetricsGateway` - Live metrics streaming (`ws://server/metrics`)

**Responsibilities:**
- HTTP request/response handling with validation
- WebSocket connection management and event broadcasting
- Authentication and authorization via guards (`JwtAuthGuard`, `RolesGuard`)
- Request transformation and response serialization
- API documentation via Swagger decorators

**Key Patterns:**
- DTO validation using `class-validator`
- Role-based access control via `@Roles()` decorator
- Pagination and filtering using query parameters
- Standardized error responses using NestJS exception filters

### Business Logic Layer

**Services:**
- `DashboardOrchestrator` - Aggregates and formats dashboard data from multiple sources
- `WidgetFactory` - Creates role-specific widget configurations
- `MetricsComputer` - Computes analytics metrics from raw event data
- `TrendAnalyzer` - Analyzes trends and period-over-period changes
- `ReportAccessManager` - Manages report navigation and access permissions
- `NotificationAggregator` - Aggregates and prioritizes notifications

**Queue Processors:**
- `AnalyticsProcessor` - Processes heavy analytics computations asynchronously
- `MetricsAggregationProcessor` - Periodic metric aggregation jobs
- `DashboardCacheRefreshProcessor` - Scheduled cache warming

**Responsibilities:**
- Complex business logic and data transformation
- Role-based data filtering and organizational scope enforcement
- Metric calculation and aggregation algorithms
- Cache invalidation and refresh strategies
- Event-driven communication between modules
- Queue job management for async operations

**Key Patterns:**
- Dependency injection for service composition
- Factory pattern for widget creation
- Strategy pattern for different metric computation algorithms
- Observer pattern for real-time update broadcasting

### Data Access Layer

**Repositories:**
- `AnalyticsRepository` - PostgreSQL queries for computed analytics (TypeORM)
- `EventRepository` - MongoDB queries for activity logs (Mongoose)
- `DashboardConfigRepository` - User dashboard configurations (TypeORM)
- `MetricsSnapshotRepository` - Periodic metric snapshots (TypeORM)

**Cache Managers:**
- `DashboardCacheManager` - Redis caching for dashboard data
- `MetricsCacheManager` - Redis caching for computed metrics
- `WidgetCacheManager` - Redis caching for widget configurations

**Responsibilities:**
- Database query optimization and indexing
- Transaction management for data consistency
- Connection pooling and query performance
- Cache-aside pattern implementation
- Data model mapping and transformation
- Efficient bulk operations and aggregations

**Key Patterns:**
- Repository pattern for data abstraction
- Unit of Work pattern for transaction management
- Cache-aside pattern for read-heavy operations
- Write-through caching for critical metrics
- Query builder for dynamic filtering

## API Endpoints

### Dashboard Endpoints

```typescript
// GET /api/v1/dashboard
// Get role-specific dashboard data
@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.LEADER, UserRole.MANAGER)
@ApiOperation({ summary: 'Get dashboard data for authenticated user' })
getDashboard(@User() user: AuthUser): Promise<DashboardResponse>

// GET /api/v1/dashboard/widgets
// Get user widget configuration
@Get('widgets')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get user dashboard widgets' })
getWidgets(@User() user: AuthUser): Promise<WidgetConfigResponse>

// PUT /api/v1/dashboard/widgets/:widgetId
// Update widget configuration
@Put('widgets/:widgetId')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Update widget configuration' })
updateWidget(
  @Param('widgetId') widgetId: string,
  @Body() config: UpdateWidgetDto,
  @User() user: AuthUser
): Promise<void>

// GET /api/v1/dashboard/quick-stats
// Get quick statistics summary
@Get('quick-stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.LEADER, UserRole.MANAGER)
@ApiOperation({ summary: 'Get quick stats for user scope' })
getQuickStats(@User() user: AuthUser): Promise<QuickStatsResponse>

// GET /api/v1/dashboard/recent-activities
// Get recent user activities
@Get('recent-activities')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get recent activities' })
@ApiQuery({ name: 'limit', required: false, type: Number })
getRecentActivities(
  @User() user: AuthUser,
  @Query('limit') limit: number = 10
): Promise<ActivitiesResponse>

// GET /api/v1/dashboard/notifications
// Get notification feed
@Get('notifications')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get notification feed' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
getNotifications(
  @User() user: AuthUser,
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 20
): Promise<NotificationsResponse>
```

### Analytics Endpoints

```typescript
// GET /api/v1/analytics/adoption
// Platform adoption metrics
@Get('adoption')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.LEADER)
@ApiOperation({ summary: 'Get platform adoption metrics' })
@ApiQuery({ name: 'timeRange', enum: TimeRange })
getAdoptionMetrics(
  @User() user: AuthUser,
  @Query('timeRange') timeRange: TimeRange
): Promise<AdoptionMetricsResponse>

// GET /api/v1/analytics/engagement
// User engagement analytics
@Get('engagement')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.LEADER)
@ApiOperation({ summary: 'Get user engagement analytics' })
@ApiQuery({ name: 'timeRange', enum: TimeRange })
@ApiQuery({ name: 'userRole', required: false, enum: UserRole })
getEngagementAnalytics(
  @User() user: AuthUser,
  @Query('timeRange') timeRange: TimeRange,
  @Query('userRole') userRole?: UserRole
): Promise<EngagementAnalyticsResponse>

// GET /api/v1/analytics/reports
// Report generation statistics
@Get('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.LEADER, UserRole.MANAGER)
@ApiOperation({ summary: 'Get report generation statistics' })
@ApiQuery({ name: 'timeRange', enum: TimeRange })
@ApiQuery({ name: 'reportType', required: false })
getReportStats(
  @User() user: AuthUser,
  @Query('timeRange') timeRange: TimeRange,
  @Query('reportType') reportType?: string
): Promise<ReportStatsResponse>

// GET /api/v1/analytics/features
// Feature utilization tracking
@Get('features')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.LEADER)
@ApiOperation({ summary: 'Get feature utilization metrics' })
@ApiQuery({ name: 'timeRange', enum: TimeRange })
getFeatureUtilization(
  @User() user: AuthUser,
  @Query('timeRange') timeRange: TimeRange
): Promise<FeatureUtilizationResponse>

// GET /api/v1/analytics/business-impact
// Business impact metrics
@Get('business-impact')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
@ApiOperation({ summary: 'Get business impact metrics' })
@ApiQuery({ name: 'timeRange', enum: TimeRange })
getBusinessImpact(
  @User() user: AuthUser,
  @Query('timeRange') timeRange: TimeRange
): Promise<BusinessImpactResponse>

// GET /api/v1/analytics/export
// Export analytics data
@Get('export')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.LEADER)
@ApiOperation({ summary: 'Export analytics data to CSV/Excel' })
@ApiQuery({ name: 'format', enum: ['csv', 'excel'] })
@ApiQuery({ name: 'metricType', enum: MetricType })
@ApiQuery({ name: 'timeRange', enum: TimeRange })
exportAnalytics(
  @User() user: AuthUser,
  @Query('format') format: 'csv' | 'excel',
  @Query('metricType') metricType: MetricType,
  @Query('timeRange') timeRange: TimeRange,
  @Res() response: Response
): Promise<void>
```

### Metrics Tracking Endpoints

```typescript
// POST /api/v1/metrics/track
// Track single event
@Post('track')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Track platform event' })
trackEvent(@Body() event: TrackEventDto): Promise<void>

// POST /api/v1/metrics/track-batch
// Track multiple events
@Post('track-batch')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Track batch of platform events' })
trackBatchEvents(@Body() events: TrackEventBatchDto): Promise<void>

// POST /api/v1/metrics/activity
// Log user activity
@Post('activity')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Log user activity' })
logActivity(@Body() activity: LogActivityDto, @User() user: AuthUser): Promise<void>

// GET /api/v1/metrics/events
// Query event logs (admin only)
@Get('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
@ApiOperation({ summary: 'Query event logs' })
@ApiQuery({ name: 'eventType', required: false })
@ApiQuery({ name: 'userId', required: false })
@ApiQuery({ name: 'startDate', required: false })
@ApiQuery({ name: 'endDate', required: false })
@ApiQuery({ name: 'page', required: false, type: Number })
queryEvents(
  @Query() filters: EventFiltersDto,
  @User() user: AuthUser
): Promise<EventsResponse>
```

## Database Schemas

### PostgreSQL Schemas (TypeORM Entities)

```typescript
// Analytics Metrics Table
@Entity('analytics_metrics')
export class AnalyticsMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  organizationId: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  metricType: string; // 'platform_adoption', 'user_engagement', etc.

  @Column({ type: 'varchar', length: 50 })
  @Index()
  timeRange: string; // 'daily', 'weekly', 'monthly', 'quarterly'

  @Column({ type: 'date' })
  @Index()
  periodStart: Date;

  @Column({ type: 'date' })
  periodEnd: Date;

  @Column({ type: 'jsonb' })
  metricData: Record<string, any>; // Flexible metric storage

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  percentageChange: number; // Period-over-period change

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index(['organizationId', 'metricType', 'timeRange', 'periodStart'])
  compositeIndex: void;
}

// Dashboard Configuration Table
@Entity('dashboard_configurations')
export class DashboardConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'jsonb' })
  widgetConfigs: WidgetConfig[]; // Array of widget configurations

  @Column({ type: 'varchar', length: 50 })
  layout: string; // 'grid', 'list', 'compact'

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>; // User-specific preferences

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Metrics Snapshot Table (for trend analysis)
@Entity('metrics_snapshots')
export class MetricsSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  organizationId: string;

  @Column({ type: 'timestamp' })
  @Index()
  snapshotTime: Date;

  @Column({ type: 'integer' })
  totalUsers: number;

  @Column({ type: 'integer' })
  activeUsers: number;

  @Column({ type: 'integer' })
  totalEmployees: number;

  @Column({ type: 'integer' })
  reportsGenerated: number;

  @Column({ type: 'integer' })
  aiChatInteractions: number;

  @Column({ type: 'jsonb' })
  featureUsageCount: Record<string, number>;

  @CreateDateColumn()
  createdAt: Date;
}

// Report Access Logs Table
@Entity('report_access_logs')
export class ReportAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  reportId: string;

  @Column({ type: 'varchar', length: 50 })
  reportType: string;

  @Column({ type: 'varchar', length: 50 })
  action: string; // 'view', 'download', 'share'

  @Column({ type: 'timestamp' })
  @Index()
  accessedAt: Date;

  @Column({ type: 'integer', nullable: true })
  timeSpentSeconds: number;

  @CreateDateColumn()
  createdAt: Date;
}
```

### MongoDB Schemas (Mongoose Models)

```typescript
// User Activity Log Schema
import { Schema, Document } from 'mongoose';

export interface IUserActivity extends Document {
  userId: string;
  organizationId: string;
  sessionId: string;
  activityType: string;
  activityDetails: Record<string, any>;
  userRole: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export const UserActivitySchema = new Schema<IUserActivity>({
  userId: { type: String, required: true, index: true },
  organizationId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  activityType: { type: String, required: true, index: true },
  activityDetails: { type: Schema.Types.Mixed, required: true },
  userRole: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: { type: Schema.Types.Mixed }
}, {
  collection: 'user_activities',
  timestamps: true,
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'minutes'
  }
});

// Platform Event Schema
export interface IPlatformEvent extends Document {
  eventType: string;
  eventCategory: string;
  userId?: string;
  organizationId: string;
  eventData: Record<string, any>;
  timestamp: Date;
  source: string;
}

export const PlatformEventSchema = new Schema<IPlatformEvent>({
  eventType: { type: String, required: true, index: true },
  eventCategory: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  organizationId: { type: String, required: true, index: true },
  eventData: { type: Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  source: { type: String, required: true }
}, {
  collection: 'platform_events',
  timestamps: true,
  timeseries: {
    timeField: 'timestamp',
    metaField: 'eventData',
    granularity: 'seconds'
  }
});

// Feature Usage Tracking Schema
export interface IFeatureUsage extends Document {
  userId: string;
  organizationId: string;
  feature: string;
  subFeature?: string;
  usageCount: number;
  lastUsedAt: Date;
  firstUsedAt: Date;
  averageTimeSpent: number;
}

export const FeatureUsageSchema = new Schema<IFeatureUsage>({
  userId: { type: String, required: true, index: true },
  organizationId: { type: String, required: true, index: true },
  feature: { type: String, required: true, index: true },
  subFeature: { type: String, index: true },
  usageCount: { type: Number, default: 1 },
  lastUsedAt: { type: Date, default: Date.now },
  firstUsedAt: { type: Date, default: Date.now },
  averageTimeSpent: { type: Number, default: 0 }
}, {
  collection: 'feature_usage',
  timestamps: true
});

// Compound indexes for efficient querying
UserActivitySchema.index({ organizationId: 1, timestamp: -1 });
UserActivitySchema.index({ userId: 1, activityType: 1, timestamp: -1 });
PlatformEventSchema.index({ organizationId: 1, eventType: 1, timestamp: -1 });
FeatureUsageSchema.index({ organizationId: 1, feature: 1 });
```

## Caching Strategy

### Cache Layers

**L1 Cache - Application Memory (In-Memory)**
- Widget configurations (TTL: 1 hour)
- User permissions and roles (TTL: 30 minutes)
- Static dashboard templates (TTL: 24 hours)
- Implementation: Node.js Map or LRU cache

**L2 Cache - Redis (Distributed)**
- Complete dashboard data (TTL: 5 minutes)
- Computed analytics metrics (TTL: 1 hour)
- Quick stats and summaries (TTL: 10 minutes)
- Recent activities feed (TTL: 2 minutes)
- Notification feed (TTL: 1 minute)

### Caching Patterns

**Dashboard Data Caching**
```typescript
// Cache key structure: dashboard:{userId}:{roleScope}
// TTL: 5 minutes
// Invalidation: On employee data change, report generation, org structure update

async getDashboardData(userId: string): Promise<DashboardData> {
  const cacheKey = `dashboard:${userId}:${await this.getUserScope(userId)}`;
  
  // Try L1 cache first
  let data = this.memoryCache.get(cacheKey);
  if (data) return data;
  
  // Try L2 cache (Redis)
  data = await this.redisCache.get(cacheKey);
  if (data) {
    this.memoryCache.set(cacheKey, data);
    return data;
  }
  
  // Compute and store in both caches
  data = await this.computeDashboardData(userId);
  await this.redisCache.set(cacheKey, data, 300); // 5 minutes
  this.memoryCache.set(cacheKey, data);
  
  return data;
}
```

**Analytics Metrics Caching**
```typescript
// Cache key structure: analytics:{orgId}:{metricType}:{timeRange}:{periodStart}
// TTL: 1 hour for historical data, 10 minutes for current period
// Invalidation: On metric recomputation, manual cache clear

async getMetrics(orgId: string, metricType: string, timeRange: TimeRange): Promise<Metrics> {
  const periodStart = this.calculatePeriodStart(timeRange);
  const cacheKey = `analytics:${orgId}:${metricType}:${timeRange}:${periodStart}`;
  
  // Historical data cached longer
  const isHistorical = periodStart < this.getCurrentPeriodStart(timeRange);
  const ttl = isHistorical ? 3600 : 600;
  
  const cached = await this.redisCache.get(cacheKey);
  if (cached) return cached;
  
  const metrics = await this.computeMetrics(orgId, metricType, timeRange);
  await this.redisCache.set(cacheKey, metrics, ttl);
  
  return metrics;
}
```

**Quick Stats Caching**
```typescript
// Cache key structure: quickstats:{userId}:{scope}
// TTL: 10 minutes
// Invalidation: On relevant data changes (employees added, reports generated)

async getQuickStats(userId: string): Promise<QuickStats> {
  const scope = await this.getUserScope(userId);
  const cacheKey = `quickstats:${userId}:${scope}`;
  
  const cached = await this.redisCache.get(cacheKey);
  if (cached) return cached;
  
  const stats = await this.computeQuickStats(userId, scope);
  await this.redisCache.set(cacheKey, stats, 600); // 10 minutes
  
  return stats;
}
```

### Cache Invalidation Strategy

**Event-Based Invalidation**
```typescript
// Listen to events from other modules
@OnEvent('employee.created')
async handleEmployeeCreated(payload: EmployeeCreatedEvent) {
  const patterns = [
    `dashboard:*:org:${payload.organizationId}:*`,
    `quickstats:*:org:${payload.organizationId}`,
    `analytics:${payload.organizationId}:*`
  ];
  await this.invalidateCachePatterns(patterns);
}

@OnEvent('report.generated')
async handleReportGenerated(payload: ReportGeneratedEvent) {
  const patterns = [
    `dashboard:${payload.userId}:*`,
    `quickstats:${payload.userId}:*`,
    `analytics:${payload.organizationId}:reports:*`
  ];
  await this.invalidateCachePatterns(patterns);
}

@OnEvent('organization.updated')
async handleOrganizationUpdated(payload: OrgUpdatedEvent) {
  // Clear all caches for the organization
  const patterns = [`*:${payload.organizationId}:*`];
  await this.invalidateCachePatterns(patterns);
}
```

**Time-Based Invalidation**
- Dashboard data: 5 minutes
- Analytics metrics (current period): 10 minutes
- Analytics metrics (historical): 1 hour
- Quick stats: 10 minutes
- Widget configurations: 1 hour
- Notification feed: 1 minute

**Manual Invalidation API**
```typescript
// POST /api/v1/dashboard/cache/invalidate
@Post('cache/invalidate')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
async invalidateCache(@Body() payload: InvalidateCacheDto): Promise<void> {
  await this.cacheManager.invalidatePattern(payload.pattern);
}
```

### Cache Warming Strategy

**Scheduled Cache Warming**
```typescript
// Warm cache for active users every morning
@Cron('0 6 * * *') // 6 AM daily
async warmDashboardCache() {
  const activeUsers = await this.usersService.getActiveUsers();
  
  for (const user of activeUsers) {
    await this.dashboardService.getDashboardData(user.id);
  }
}

// Pre-compute analytics before business hours
@Cron('0 5 * * *') // 5 AM daily
async precomputeAnalytics() {
  const organizations = await this.orgsService.getActiveOrganizations();
  
  for (const org of organizations) {
    await this.analyticsService.computeMetrics(org.id, 'all');
  }
}
```

### Redis Key Naming Convention

```
Pattern: {module}:{entity}:{scope}:{identifier}[:{subkey}]

Examples:
- dashboard:user:org:123e4567:scope:leader
- analytics:org:123e4567:adoption:monthly:2025-11
- quickstats:user:987fcdeb:org:123e4567
- metrics:org:123e4567:features:weekly:2025-W45
- widget:user:987fcdeb:config
```

### Cache Performance Monitoring

```typescript
// Track cache hit/miss rates
@Injectable()
export class CacheMonitoringService {
  private hits = 0;
  private misses = 0;
  
  recordHit() { this.hits++; }
  recordMiss() { this.misses++; }
  
  getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }
  
  // Export metrics every minute
  @Cron('* * * * *')
  async exportMetrics() {
    await this.metricsService.trackMetric('cache.hit_rate', this.getHitRate());
    this.hits = 0;
    this.misses = 0;
  }
}
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-10  
**Status:** Complete