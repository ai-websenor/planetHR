# Database Schema - Dashboard & Analytics

## Overview

This document defines the database schemas for the Dashboard & Analytics module. The module uses a hybrid database approach:
- **PostgreSQL** for structured analytics data, metrics, and aggregated statistics
- **MongoDB** for flexible, high-volume user activity logs and event tracking

---

## PostgreSQL Schemas

### 1. Dashboard Configuration

#### Table: `dashboard_configs`
Stores role-specific dashboard configurations and widget layouts.

```sql
CREATE TABLE dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'LEADER', 'MANAGER')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  layout_config JSONB NOT NULL DEFAULT '{}',
  widget_preferences JSONB NOT NULL DEFAULT '[]',
  theme_settings JSONB DEFAULT '{"mode": "light", "primaryColor": "#1976d2"}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dashboard_configs_user_id ON dashboard_configs(user_id);
CREATE INDEX idx_dashboard_configs_org_id ON dashboard_configs(organization_id);
CREATE INDEX idx_dashboard_configs_role ON dashboard_configs(role);
```

**Fields:**
- `layout_config`: Grid layout configuration with widget positions
- `widget_preferences`: Array of enabled/disabled widgets with custom settings
- `theme_settings`: User-specific theme preferences
- `is_default`: Whether this is the default configuration for the role

---

### 2. Platform Adoption Metrics

#### Table: `platform_adoption_metrics`
Aggregated metrics for organizational onboarding and adoption tracking.

```sql
CREATE TABLE platform_adoption_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  total_organizations INTEGER DEFAULT 0,
  new_organizations_today INTEGER DEFAULT 0,
  total_employees INTEGER DEFAULT 0,
  new_employees_today INTEGER DEFAULT 0,
  total_candidates INTEGER DEFAULT 0,
  new_candidates_today INTEGER DEFAULT 0,
  total_departments INTEGER DEFAULT 0,
  total_branches INTEGER DEFAULT 0,
  active_users_count INTEGER DEFAULT 0,
  reports_generated_total INTEGER DEFAULT 0,
  reports_generated_today INTEGER DEFAULT 0,
  ai_chat_sessions_total INTEGER DEFAULT 0,
  ai_chat_sessions_today INTEGER DEFAULT 0,
  subscription_status VARCHAR(20) CHECK (subscription_status IN ('ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED')),
  subscription_tier VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, metric_date)
);

CREATE INDEX idx_platform_adoption_org_id ON platform_adoption_metrics(organization_id);
CREATE INDEX idx_platform_adoption_date ON platform_adoption_metrics(metric_date DESC);
CREATE INDEX idx_platform_adoption_subscription ON platform_adoption_metrics(subscription_status);
```

---

### 3. User Engagement Analytics

#### Table: `user_engagement_metrics`
User-level engagement tracking and activity patterns.

```sql
CREATE TABLE user_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  login_count INTEGER DEFAULT 0,
  session_duration_minutes INTEGER DEFAULT 0,
  reports_viewed INTEGER DEFAULT 0,
  reports_downloaded INTEGER DEFAULT 0,
  ai_chat_messages_sent INTEGER DEFAULT 0,
  ai_chat_sessions INTEGER DEFAULT 0,
  employees_added INTEGER DEFAULT 0,
  employees_updated INTEGER DEFAULT 0,
  dashboard_visits INTEGER DEFAULT 0,
  feature_interactions JSONB DEFAULT '{}',
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, metric_date)
);

CREATE INDEX idx_user_engagement_user_id ON user_engagement_metrics(user_id);
CREATE INDEX idx_user_engagement_org_id ON user_engagement_metrics(organization_id);
CREATE INDEX idx_user_engagement_date ON user_engagement_metrics(metric_date DESC);
CREATE INDEX idx_user_engagement_last_activity ON user_engagement_metrics(last_activity_at DESC);
```

**feature_interactions JSONB structure:**
```json
{
  "employee_management": 45,
  "report_generation": 23,
  "ai_consultation": 12,
  "department_setup": 5,
  "user_management": 8
}
```

---

### 4. Report Generation Statistics

#### Table: `report_generation_stats`
Detailed statistics on report generation volume, types, and performance.

```sql
CREATE TABLE report_generation_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  generated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  generation_date DATE NOT NULL,
  generation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processing_time_seconds NUMERIC(10, 2),
  status VARCHAR(20) CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING', 'PROCESSING')),
  error_message TEXT,
  is_auto_generated BOOLEAN DEFAULT false,
  is_quarterly_update BOOLEAN DEFAULT false,
  report_size_kb NUMERIC(10, 2),
  ai_tokens_used INTEGER,
  viewed_count INTEGER DEFAULT 0,
  downloaded_count INTEGER DEFAULT 0,
  first_viewed_at TIMESTAMP WITH TIME ZONE,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_stats_org_id ON report_generation_stats(organization_id);
CREATE INDEX idx_report_stats_type ON report_generation_stats(report_type);
CREATE INDEX idx_report_stats_date ON report_generation_stats(generation_date DESC);
CREATE INDEX idx_report_stats_employee ON report_generation_stats(employee_id);
CREATE INDEX idx_report_stats_status ON report_generation_stats(status);
CREATE INDEX idx_report_stats_auto_generated ON report_generation_stats(is_auto_generated, is_quarterly_update);
```

**Report Types:**
- `PERSONALITY_ROLE`
- `BEHAVIOR_COMPANY`
- `COMPATIBILITY_JOB`
- `COMPATIBILITY_DEPARTMENT`
- `COMPATIBILITY_COMPANY`
- `COMPATIBILITY_INDUSTRY`
- `QA_QUESTIONNAIRE`
- `TRAINING_DEVELOPMENT`

---

### 5. Feature Utilization Tracking

#### Table: `feature_utilization_metrics`
Aggregated metrics for feature adoption and usage patterns across roles.

```sql
CREATE TABLE feature_utilization_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  feature_category VARCHAR(50) NOT NULL,
  user_role VARCHAR(20) CHECK (user_role IN ('OWNER', 'LEADER', 'MANAGER')),
  metric_date DATE NOT NULL,
  total_uses INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  average_duration_seconds NUMERIC(10, 2),
  success_rate NUMERIC(5, 2),
  error_count INTEGER DEFAULT 0,
  usage_distribution JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, feature_name, user_role, metric_date)
);

CREATE INDEX idx_feature_util_org_id ON feature_utilization_metrics(organization_id);
CREATE INDEX idx_feature_util_feature ON feature_utilization_metrics(feature_name);
CREATE INDEX idx_feature_util_category ON feature_utilization_metrics(feature_category);
CREATE INDEX idx_feature_util_role ON feature_utilization_metrics(user_role);
CREATE INDEX idx_feature_util_date ON feature_utilization_metrics(metric_date DESC);
```

**Feature Categories:**
- `EMPLOYEE_MANAGEMENT`
- `REPORT_GENERATION`
- `AI_CONSULTATION`
- `DEPARTMENT_SETUP`
- `USER_MANAGEMENT`
- `ANALYTICS_VIEWING`
- `NOTIFICATION_INTERACTION`

**usage_distribution JSONB structure:**
```json
{
  "hourly": {"0": 5, "1": 2, "8": 45, "9": 67, "10": 89},
  "by_department": {"sales": 34, "engineering": 56, "hr": 23}
}
```

---

### 6. Business Impact Metrics

#### Table: `business_impact_metrics`
High-level business KPIs and impact measurements.

```sql
CREATE TABLE business_impact_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  customer_retention_rate NUMERIC(5, 2),
  subscription_renewal_rate NUMERIC(5, 2),
  average_user_satisfaction_score NUMERIC(3, 2),
  report_accuracy_rating NUMERIC(3, 2),
  training_recommendation_implementation_rate NUMERIC(5, 2),
  employee_turnover_rate NUMERIC(5, 2),
  hiring_success_rate NUMERIC(5, 2),
  time_to_hire_days NUMERIC(10, 2),
  cost_per_hire NUMERIC(12, 2),
  ai_consultation_satisfaction_rate NUMERIC(5, 2),
  quarterly_report_completion_rate NUMERIC(5, 2),
  mrr NUMERIC(12, 2),
  arr NUMERIC(12, 2),
  churn_risk_score NUMERIC(3, 2),
  nps_score NUMERIC(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, metric_date)
);

CREATE INDEX idx_business_impact_org_id ON business_impact_metrics(organization_id);
CREATE INDEX idx_business_impact_date ON business_impact_metrics(metric_date DESC);
CREATE INDEX idx_business_impact_retention ON business_impact_metrics(customer_retention_rate);
CREATE INDEX idx_business_impact_satisfaction ON business_impact_metrics(average_user_satisfaction_score);
```

---

### 7. Notification Tracking

#### Table: `notification_delivery_logs`
Track notification delivery status and user interactions.

```sql
CREATE TABLE notification_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivery_channel VARCHAR(20) CHECK (delivery_channel IN ('IN_APP', 'EMAIL', 'WEBSOCKET', 'SMS')),
  delivery_status VARCHAR(20) CHECK (delivery_status IN ('SENT', 'DELIVERED', 'READ', 'FAILED', 'DISMISSED')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_logs_notification_id ON notification_delivery_logs(notification_id);
CREATE INDEX idx_notification_logs_user_id ON notification_delivery_logs(user_id);
CREATE INDEX idx_notification_logs_status ON notification_delivery_logs(delivery_status);
CREATE INDEX idx_notification_logs_sent_at ON notification_delivery_logs(sent_at DESC);
```

---

### 8. AI Chat Analytics

#### Table: `ai_chat_analytics`
Detailed analytics for AI consultation usage patterns.

```sql
CREATE TABLE ai_chat_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  session_date DATE NOT NULL,
  message_count INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  session_duration_seconds INTEGER,
  query_types JSONB DEFAULT '[]',
  employee_ids_discussed UUID[] DEFAULT '{}',
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  was_helpful BOOLEAN,
  feedback_text TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_chat_analytics_org_id ON ai_chat_analytics(organization_id);
CREATE INDEX idx_ai_chat_analytics_user_id ON ai_chat_analytics(user_id);
CREATE INDEX idx_ai_chat_analytics_session_id ON ai_chat_analytics(session_id);
CREATE INDEX idx_ai_chat_analytics_date ON ai_chat_analytics(session_date DESC);
CREATE INDEX idx_ai_chat_analytics_rating ON ai_chat_analytics(satisfaction_rating);
```

**query_types JSONB structure:**
```json
[
  "promotion_readiness",
  "team_formation",
  "conflict_resolution",
  "performance_optimization",
  "training_guidance"
]
```

---

## MongoDB Collections

### 1. User Activity Logs

#### Collection: `user_activity_logs`

High-volume, detailed user activity event tracking.

```javascript
{
  _id: ObjectId,
  userId: UUID,
  organizationId: UUID,
  sessionId: UUID,
  eventType: String, // 'PAGE_VIEW', 'BUTTON_CLICK', 'REPORT_VIEW', 'SEARCH', 'FILTER_APPLIED', etc.
  eventCategory: String, // 'NAVIGATION', 'INTERACTION', 'DATA_ACCESS', 'FEATURE_USE'
  eventAction: String, // Specific action description
  eventTarget: String, // Target element or resource
  eventMetadata: {
    page: String,
    component: String,
    feature: String,
    duration: Number,
    success: Boolean,
    errorMessage: String,
    customData: Object
  },
  userRole: String, // 'OWNER', 'LEADER', 'MANAGER'
  deviceInfo: {
    type: String, // 'desktop', 'mobile', 'tablet'
    os: String,
    browser: String,
    screenResolution: String,
    userAgent: String
  },
  geolocation: {
    country: String,
    city: String,
    ipAddress: String,
    timezone: String
  },
  timestamp: ISODate,
  createdAt: ISODate
}
```

**Indexes:**
```javascript
db.user_activity_logs.createIndex({ userId: 1, timestamp: -1 });
db.user_activity_logs.createIndex({ organizationId: 1, timestamp: -1 });
db.user_activity_logs.createIndex({ eventType: 1, timestamp: -1 });
db.user_activity_logs.createIndex({ sessionId: 1 });
db.user_activity_logs.createIndex({ timestamp: -1 });
db.user_activity_logs.createIndex({ "eventMetadata.feature": 1 });
db.user_activity_logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL
```

**Example Event Types:**
- `PAGE_VIEW` - User navigated to a page
- `BUTTON_CLICK` - User clicked a button
- `REPORT_VIEW` - User opened a report
- `REPORT_DOWNLOAD` - User downloaded a report
- `SEARCH_PERFORMED` - User performed a search
- `FILTER_APPLIED` - User applied filters
- `AI_CHAT_MESSAGE` - User sent AI chat message
- `EMPLOYEE_ADDED` - User added new employee
- `DASHBOARD_LOAD` - Dashboard loaded
- `NOTIFICATION_CLICKED` - User clicked notification

---

### 2. Real-time Metrics Buffer

#### Collection: `metrics_buffer`

Temporary storage for real-time metrics before aggregation into PostgreSQL.

```javascript
{
  _id: ObjectId,
  organizationId: UUID,
  metricType: String, // 'USER_ENGAGEMENT', 'REPORT_GENERATION', 'FEATURE_UTILIZATION'
  metricData: {
    userId: UUID,
    value: Number,
    dimensions: Object,
    tags: Array
  },
  aggregationStatus: String, // 'PENDING', 'PROCESSING', 'AGGREGATED', 'FAILED'
  aggregatedAt: ISODate,
  timestamp: ISODate,
  createdAt: ISODate
}
```

**Indexes:**
```javascript
db.metrics_buffer.createIndex({ organizationId: 1, timestamp: -1 });
db.metrics_buffer.createIndex({ metricType: 1, aggregationStatus: 1 });
db.metrics_buffer.createIndex({ aggregationStatus: 1, createdAt: 1 });
db.metrics_buffer.createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days TTL
```

---

### 3. Dashboard Interactions Log

#### Collection: `dashboard_interactions`

Detailed tracking of dashboard-specific interactions and widget usage.

```javascript
{
  _id: ObjectId,
  userId: UUID,
  organizationId: UUID,
  sessionId: UUID,
  dashboardType: String, // 'OWNER_DASHBOARD', 'LEADER_DASHBOARD', 'MANAGER_DASHBOARD'
  interactionType: String, // 'WIDGET_LOAD', 'WIDGET_REFRESH', 'WIDGET_RESIZE', 'WIDGET_REORDER'
  widgetId: String,
  widgetType: String, // 'METRICS_CARD', 'CHART', 'TABLE', 'AI_CHAT', 'NOTIFICATIONS'
  interactionData: {
    action: String,
    previousState: Object,
    newState: Object,
    duration: Number,
    dataLoaded: Boolean,
    errorOccurred: Boolean
  },
  performanceMetrics: {
    loadTime: Number,
    renderTime: Number,
    dataFetchTime: Number,
    totalTime: Number
  },
  timestamp: ISODate,
  createdAt: ISODate
}
```

**Indexes:**
```javascript
db.dashboard_interactions.createIndex({ userId: 1, timestamp: -1 });
db.dashboard_interactions.createIndex({ organizationId: 1, dashboardType: 1 });
db.dashboard_interactions.createIndex({ widgetType: 1, timestamp: -1 });
db.dashboard_interactions.createIndex({ sessionId: 1 });
db.dashboard_interactions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL
```

---

### 4. Report Access Logs

#### Collection: `report_access_logs`

Detailed audit trail for report viewing and downloading.

```javascript
{
  _id: ObjectId,
  reportId: UUID,
  reportType: String,
  employeeId: UUID,
  employeeName: String,
  accessedBy: {
    userId: UUID,
    userName: String,
    userRole: String
  },
  organizationId: UUID,
  departmentId: UUID,
  accessType: String, // 'VIEW', 'DOWNLOAD', 'SHARE', 'PRINT'
  accessMethod: String, // 'DIRECT_LINK', 'DASHBOARD', 'SEARCH', 'NOTIFICATION'
  accessDuration: Number, // seconds spent viewing
  pageViews: Number,
  deviceInfo: {
    type: String,
    os: String,
    browser: String
  },
  geolocation: {
    country: String,
    city: String,
    ipAddress: String
  },
  timestamp: ISODate,
  createdAt: ISODate
}
```

**Indexes:**
```javascript
db.report_access_logs.createIndex({ reportId: 1, timestamp: -1 });
db.report_access_logs.createIndex({ "accessedBy.userId": 1, timestamp: -1 });
db.report_access_logs.createIndex({ organizationId: 1, timestamp: -1 });
db.report_access_logs.createIndex({ employeeId: 1, timestamp: -1 });
db.report_access_logs.createIndex({ reportType: 1, accessType: 1 });
db.report_access_logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 15552000 }); // 180 days TTL
```

---

### 5. AI Chat Session Logs

#### Collection: `ai_chat_session_logs`

Detailed logs of AI consultation sessions and messages.

```javascript
{
  _id: ObjectId,
  sessionId: UUID,
  organizationId: UUID,
  userId: UUID,
  userRole: String,
  sessionStarted: ISODate,
  sessionEnded: ISODate,
  messages: [
    {
      messageId: UUID,
      role: String, // 'USER', 'ASSISTANT', 'SYSTEM'
      content: String,
      tokenCount: Number,
      timestamp: ISODate,
      metadata: {
        employeeIdsReferenced: Array,
        queryType: String,
        confidence: Number,
        sources: Array
      }
    }
  ],
  sessionMetrics: {
    totalMessages: Number,
    userMessages: Number,
    aiResponses: Number,
    totalTokens: Number,
    averageResponseTime: Number,
    employeesDiscussed: Array
  },
  sessionContext: {
    initialQuery: String,
    queryType: String,
    departmentId: UUID,
    relatedReports: Array
  },
  satisfactionFeedback: {
    rating: Number,
    wasHelpful: Boolean,
    feedbackText: String,
    submittedAt: ISODate
  },
  createdAt: ISODate,
  updatedAt: ISODate
}
```

**Indexes:**
```javascript
db.ai_chat_session_logs.createIndex({ sessionId: 1 });
db.ai_chat_session_logs.createIndex({ userId: 1, sessionStarted: -1 });
db.ai_chat_session_logs.createIndex({ organizationId: 1, sessionStarted: -1 });
db.ai_chat_session_logs.createIndex({ "sessionContext.queryType": 1 });
db.ai_chat_session_logs.createIndex({ "satisfactionFeedback.rating": 1 });
db.ai_chat_session_logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 365 days TTL
```

---

### 6. Notification Interaction Logs

#### Collection: `notification_interaction_logs`

Track user interactions with notifications in real-time.

```javascript
{
  _id: ObjectId,
  notificationId: UUID,
  userId: UUID,
  organizationId: UUID,
  notificationType: String, // 'REPORT_READY', 'QUARTERLY_UPDATE', 'SYSTEM_ALERT', 'USER_MENTION'
  interactionType: String, // 'DELIVERED', 'VIEWED', 'CLICKED', 'DISMISSED', 'SNOOZED'
  deliveryChannel: String, // 'IN_APP', 'EMAIL', 'WEBSOCKET', 'SMS'
  interactionData: {
    timeToView: Number, // seconds from delivery to view
    timeToClick: Number,
    clickTarget: String,
    deviceType: String
  },
  notificationContent: {
    title: String,
    message: String,
    priority: String, // 'HIGH', 'MEDIUM', 'LOW'
    category: String
  },
  timestamp: ISODate,
  createdAt: ISODate
}
```

**Indexes:**
```javascript
db.notification_interaction_logs.createIndex({ notificationId: 1 });
db.notification_interaction_logs.createIndex({ userId: 1, timestamp: -1 });
db.notification_interaction_logs.createIndex({ organizationId: 1, timestamp: -1 });
db.notification_interaction_logs.createIndex({ notificationType: 1, interactionType: 1 });
db.notification_interaction_logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL
```

---

## Data Aggregation Pipelines

### Daily Aggregation Process

**Frequency:** Runs daily at 02:00 UTC

**Process:**
1. Aggregate MongoDB activity logs into PostgreSQL metrics tables
2. Calculate daily engagement metrics per user
3. Update report generation statistics
4. Compute feature utilization metrics
5. Calculate business impact KPIs
6. Clear aggregated records from metrics_buffer

**Example Aggregation Query:**
```sql
-- Aggregate user engagement from activity logs
INSERT INTO user_engagement_metrics (
  user_id, organization_id, metric_date, 
  login_count, session_duration_minutes, reports_viewed
)
SELECT 
  user_id,
  organization_id,
  DATE(timestamp) as metric_date,
  COUNT(DISTINCT session_id) as login_count,
  SUM(session_duration) / 60 as session_duration_minutes,
  COUNT(CASE WHEN event_type = 'REPORT_VIEW' THEN 1 END) as reports_viewed
FROM mongodb_activity_logs_staging
WHERE timestamp >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY user_id, organization_id, DATE(timestamp)
ON CONFLICT (user_id, metric_date) 
DO UPDATE SET
  login_count = EXCLUDED.login_count,
  session_duration_minutes = EXCLUDED.session_duration_minutes,
  reports_viewed = EXCLUDED.reports_viewed;
```

---

### Real-time Metrics Updates

**Frequency:** Continuous (streaming)

**Process:**
1. WebSocket events trigger immediate metric buffer writes
2. Every 5 minutes, process pending buffer entries
3. Update real-time dashboard counters
4. Publish metrics updates via WebSocket to connected clients

---

## Migration Strategy

### Phase 1: Initial Schema Setup (Week 1)
1. Create PostgreSQL schemas and tables
2. Set up MongoDB collections with indexes
3. Implement TTL indexes for log retention
4. Create database migration scripts using TypeORM/Mongoose

### Phase 2: Data Population (Week 2)
1. Seed initial dashboard configurations for each role
2. Create default feature utilization tracking entries
3. Set up initial business impact metrics baseline
4. Populate test data for development

### Phase 3: Aggregation Pipeline (Week 3)
1. Implement daily aggregation cron jobs
2. Create real-time metrics processing workers
3. Set up MongoDB → PostgreSQL ETL pipelines
4. Test data consistency and accuracy

### Phase 4: Optimization (Week 4)
1. Analyze query performance and add additional indexes
2. Implement materialized views for common queries
3. Set up database partitioning for large tables
4. Configure connection pooling and caching

### Migration Scripts

**TypeORM Migration Template:**
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDashboardAnalyticsTables1699000000000 
  implements MigrationInterface {
  
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create dashboard_configs table
    await queryRunner.query(`
      CREATE TABLE dashboard_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        -- ... rest of schema
      );
    `);
    
    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_dashboard_configs_user_id 
      ON dashboard_configs(user_id);
    `);
  }
  
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE dashboard_configs CASCADE;`);
  }
}
```

**MongoDB Setup Script:**
```javascript
// setup-mongodb-collections.js
db.createCollection('user_activity_logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'organizationId', 'eventType', 'timestamp'],
      properties: {
        userId: { bsonType: 'string' },
        organizationId: { bsonType: 'string' },
        eventType: { 
          enum: ['PAGE_VIEW', 'BUTTON_CLICK', 'REPORT_VIEW', 'SEARCH', 'FILTER_APPLIED']
        },
        timestamp: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes
db.user_activity_logs.createIndex({ userId: 1, timestamp: -1 });
db.user_activity_logs.createIndex({ organizationId: 1, timestamp: -1 });
db.user_activity_logs.createIndex({ eventType: 1, timestamp: -1 });
db.user_activity_logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
```

### Rollback Strategy

1. **Backup existing data** before each migration
2. **Version control** all migration scripts
3. **Test rollback** procedures in staging environment
4. **Document** rollback commands for each migration
5. **Monitor** data integrity post-migration

---

## Performance Considerations

### PostgreSQL Optimization
- **Partitioning**: Partition large tables by date (monthly partitions)
- **Materialized Views**: Create for commonly accessed aggregated data
- **Index Strategy**: B-tree indexes for lookups, GIN indexes for JSONB columns
- **Vacuum**: Regular VACUUM ANALYZE to maintain query performance

### MongoDB Optimization
- **Sharding**: Shard collections by organizationId for horizontal scaling
- **Replica Sets**: 3-node replica set for high availability
- **Write Concern**: Balance between performance and durability
- **Read Preference**: Use secondary reads for analytics queries

### Data Retention Policies
- **User Activity Logs**: 90 days retention (TTL index)
- **Metrics Buffer**: 7 days retention
- **Dashboard Interactions**: 30 days retention
- **Report Access Logs**: 180 days retention
- **AI Chat Logs**: 365 days retention
- **PostgreSQL Metrics**: 2 years retention with monthly archival

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-10  
**Status:** Production Ready