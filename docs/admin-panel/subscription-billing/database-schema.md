# Database Schema - Subscription & Billing Management

## Overview

This document defines the complete database schema for the Subscription & Billing Management module. The system uses a dual-database approach: PostgreSQL for transactional data (subscriptions, payments, invoices) and MongoDB for high-volume usage metrics and tracking.

### PostgreSQL (subscriptions, payments, invoices)

PostgreSQL stores all critical transactional and relational data for subscriptions, payments, billing, and plan configurations.

#### Tables

##### 1. subscription_plans

Defines available subscription tiers and their features.

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  tier_level INTEGER NOT NULL, -- 1: Basic, 2: Professional, 3: Enterprise
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Feature limits
  max_employees INTEGER, -- NULL for unlimited
  max_reports_per_month INTEGER, -- NULL for unlimited
  max_ai_chat_messages INTEGER, -- NULL for unlimited
  max_branches INTEGER,
  max_departments INTEGER,
  max_leaders INTEGER,
  max_managers INTEGER,
  
  -- Feature flags
  quarterly_auto_updates BOOLEAN DEFAULT false,
  advanced_analytics BOOLEAN DEFAULT false,
  api_access BOOLEAN DEFAULT false,
  custom_branding BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  bulk_import BOOLEAN DEFAULT false,
  export_capabilities BOOLEAN DEFAULT false,
  webhook_notifications BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true, -- Hidden plans for custom enterprise
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_subscription_plans_tier ON subscription_plans(tier_level);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
```

##### 2. subscriptions

Organization subscription records.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Subscription details
  status VARCHAR(50) NOT NULL, -- active, past_due, canceled, trialing, incomplete
  billing_cycle VARCHAR(20) NOT NULL, -- monthly, yearly
  
  -- Dates
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  canceled_at TIMESTAMP,
  ended_at TIMESTAMP,
  
  -- Pricing
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment integration
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  payment_method_id UUID REFERENCES payment_methods(id),
  
  -- Auto-renewal
  auto_renew BOOLEAN DEFAULT true,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_org_active_subscription UNIQUE(organization_id) WHERE status = 'active'
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

##### 3. payment_methods

Stored payment method information.

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Payment method details
  type VARCHAR(50) NOT NULL, -- card, bank_account, paypal
  provider VARCHAR(50) NOT NULL, -- stripe, paypal, etc.
  provider_payment_method_id VARCHAR(255) NOT NULL,
  
  -- Card details (if applicable)
  card_brand VARCHAR(50), -- visa, mastercard, amex, etc.
  card_last4 VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  card_country VARCHAR(2),
  
  -- Bank account details (if applicable)
  bank_name VARCHAR(255),
  bank_account_last4 VARCHAR(4),
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active', -- active, expired, failed
  
  -- Metadata
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_default_payment_method UNIQUE(organization_id, is_default) WHERE is_default = true
);

CREATE INDEX idx_payment_methods_org ON payment_methods(organization_id);
CREATE INDEX idx_payment_methods_provider ON payment_methods(provider_payment_method_id);
```

##### 4. payments

Payment transaction records.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL, -- succeeded, pending, failed, refunded, canceled
  payment_type VARCHAR(50) NOT NULL, -- subscription, one_time, refund
  
  -- Provider details
  provider VARCHAR(50) NOT NULL, -- stripe, paypal, etc.
  provider_payment_id VARCHAR(255) UNIQUE,
  provider_charge_id VARCHAR(255),
  
  -- Transaction details
  description TEXT,
  failure_code VARCHAR(100),
  failure_message TEXT,
  
  -- Refund information
  refunded_amount DECIMAL(10, 2) DEFAULT 0.00,
  refund_reason TEXT,
  refunded_at TIMESTAMP,
  
  -- Dates
  attempted_at TIMESTAMP,
  succeeded_at TIMESTAMP,
  failed_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB,
  receipt_url TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider ON payments(provider_payment_id);
CREATE INDEX idx_payments_created ON payments(created_at DESC);
```

##### 5. invoices

Billing invoices for subscriptions and services.

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Invoice details
  status VARCHAR(50) NOT NULL, -- draft, open, paid, void, uncollectible
  amount_subtotal DECIMAL(10, 2) NOT NULL,
  amount_tax DECIMAL(10, 2) DEFAULT 0.00,
  amount_discount DECIMAL(10, 2) DEFAULT 0.00,
  amount_total DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0.00,
  amount_due DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Billing details
  billing_reason VARCHAR(100), -- subscription_cycle, subscription_create, manual
  description TEXT,
  
  -- Dates
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP,
  voided_at TIMESTAMP,
  
  -- Period covered
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Provider integration
  stripe_invoice_id VARCHAR(255) UNIQUE,
  hosted_invoice_url TEXT,
  invoice_pdf_url TEXT,
  
  -- Customer details (snapshot)
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_address JSONB,
  customer_tax_id VARCHAR(100),
  
  -- Metadata
  metadata JSONB,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);
```

##### 6. invoice_line_items

Individual line items within invoices.

```sql
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Line item details
  item_type VARCHAR(50) NOT NULL, -- subscription, usage, one_time, discount
  description TEXT NOT NULL,
  
  -- Quantity and pricing
  quantity INTEGER DEFAULT 1,
  unit_amount DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Period covered
  period_start DATE,
  period_end DATE,
  
  -- Tax
  tax_rate DECIMAL(5, 4) DEFAULT 0.0000,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Metadata
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);
```

##### 7. usage_quotas

Current usage limits and quotas for organizations.

```sql
CREATE TABLE usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Current period
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  
  -- Employee limits
  max_employees INTEGER,
  current_employees INTEGER DEFAULT 0,
  
  -- Report limits
  max_reports_per_month INTEGER,
  current_reports INTEGER DEFAULT 0,
  
  -- AI chat limits
  max_ai_chat_messages INTEGER,
  current_ai_messages INTEGER DEFAULT 0,
  
  -- Organizational structure limits
  max_branches INTEGER,
  current_branches INTEGER DEFAULT 0,
  max_departments INTEGER,
  current_departments INTEGER DEFAULT 0,
  max_leaders INTEGER,
  current_leaders INTEGER DEFAULT 0,
  max_managers INTEGER,
  current_managers INTEGER DEFAULT 0,
  
  -- Overage tracking
  employees_overage INTEGER DEFAULT 0,
  reports_overage INTEGER DEFAULT 0,
  ai_messages_overage INTEGER DEFAULT 0,
  
  -- Feature access flags
  quarterly_auto_updates_enabled BOOLEAN DEFAULT false,
  advanced_analytics_enabled BOOLEAN DEFAULT false,
  api_access_enabled BOOLEAN DEFAULT false,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_quotas_org ON usage_quotas(organization_id);
CREATE INDEX idx_usage_quotas_period ON usage_quotas(period_end);
```

##### 8. subscription_changes

Audit log for subscription modifications.

```sql
CREATE TABLE subscription_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Change details
  change_type VARCHAR(50) NOT NULL, -- created, upgraded, downgraded, renewed, canceled, reactivated
  previous_plan_id UUID REFERENCES subscription_plans(id),
  new_plan_id UUID REFERENCES subscription_plans(id),
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  
  -- Pricing changes
  previous_amount DECIMAL(10, 2),
  new_amount DECIMAL(10, 2),
  proration_amount DECIMAL(10, 2),
  
  -- Dates
  effective_date TIMESTAMP NOT NULL,
  
  -- User context
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  
  -- Metadata
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscription_changes_subscription ON subscription_changes(subscription_id);
CREATE INDEX idx_subscription_changes_org ON subscription_changes(organization_id);
CREATE INDEX idx_subscription_changes_type ON subscription_changes(change_type);
CREATE INDEX idx_subscription_changes_date ON subscription_changes(created_at DESC);
```

##### 9. billing_alerts

Automated alerts for billing events.

```sql
CREATE TABLE billing_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type VARCHAR(100) NOT NULL, -- payment_failed, trial_ending, subscription_expiring, usage_limit_reached, quota_exceeded
  severity VARCHAR(20) NOT NULL, -- info, warning, critical
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, acknowledged, resolved
  
  -- Related entities
  related_invoice_id UUID REFERENCES invoices(id),
  related_payment_id UUID REFERENCES payments(id),
  
  -- Resolution
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  
  -- Metadata
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_billing_alerts_org ON billing_alerts(organization_id);
CREATE INDEX idx_billing_alerts_status ON billing_alerts(status);
CREATE INDEX idx_billing_alerts_type ON billing_alerts(alert_type);
CREATE INDEX idx_billing_alerts_created ON billing_alerts(created_at DESC);
```

##### 10. discount_coupons

Promotional codes and discounts.

```sql
CREATE TABLE discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Discount details
  discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount
  discount_value DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD', -- For fixed_amount type
  
  -- Validity
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP,
  max_redemptions INTEGER, -- NULL for unlimited
  redemptions_count INTEGER DEFAULT 0,
  
  -- Applicability
  applicable_plans JSONB, -- Array of plan IDs, NULL for all plans
  first_time_customers_only BOOLEAN DEFAULT false,
  minimum_purchase_amount DECIMAL(10, 2),
  
  -- Duration (for recurring discounts)
  duration VARCHAR(20) DEFAULT 'once', -- once, repeating, forever
  duration_in_months INTEGER, -- For repeating type
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_discount_coupons_code ON discount_coupons(code);
CREATE INDEX idx_discount_coupons_active ON discount_coupons(is_active);
CREATE INDEX idx_discount_coupons_validity ON discount_coupons(valid_from, valid_until);
```

##### 11. coupon_redemptions

Track coupon usage.

```sql
CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES discount_coupons(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Redemption details
  discount_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  redeemed_by UUID REFERENCES users(id),
  
  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX idx_coupon_redemptions_org ON coupon_redemptions(organization_id);
CREATE INDEX idx_coupon_redemptions_subscription ON coupon_redemptions(subscription_id);
```

### MongoDB (usage metrics)

MongoDB stores high-frequency usage tracking data, event logs, and analytics metrics.

#### Collections

##### 1. usage_events

Real-time usage event tracking.

```javascript
{
  _id: ObjectId,
  organizationId: UUID,
  subscriptionId: UUID,
  userId: UUID,
  
  // Event details
  eventType: String, // employee_added, report_generated, ai_chat_message, department_created, etc.
  eventCategory: String, // employee_management, report_generation, ai_interaction, structure_management
  
  // Resource information
  resourceType: String, // employee, report, message, branch, department, leader, manager
  resourceId: UUID,
  
  // Metadata
  metadata: {
    reportType: String,
    messageLength: Number,
    processingTime: Number,
    // ... other event-specific data
  },
  
  // Quota impact
  quotaImpact: {
    employees: Number,
    reports: Number,
    aiMessages: Number,
    branches: Number,
    departments: Number
  },
  
  // Timestamps
  timestamp: ISODate,
  createdAt: ISODate
}

// Indexes
db.usage_events.createIndex({ organizationId: 1, timestamp: -1 });
db.usage_events.createIndex({ subscriptionId: 1, timestamp: -1 });
db.usage_events.createIndex({ eventType: 1, timestamp: -1 });
db.usage_events.createIndex({ eventCategory: 1, organizationId: 1 });
db.usage_events.createIndex({ timestamp: -1 });
db.usage_events.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL
```

##### 2. daily_usage_aggregates

Aggregated daily usage statistics.

```javascript
{
  _id: ObjectId,
  organizationId: UUID,
  subscriptionId: UUID,
  date: ISODate, // Start of day
  
  // Usage counts
  counters: {
    employeesAdded: Number,
    employeesDeleted: Number,
    employeesActive: Number,
    
    reportsGenerated: Number,
    reportsByType: {
      personality: Number,
      behavior: Number,
      jobRoleCompatibility: Number,
      departmentCompatibility: Number,
      companyCompatibility: Number,
      industryCompatibility: Number,
      training: Number,
      questionnaire: Number
    },
    
    aiChatMessages: Number,
    aiChatSessions: Number,
    
    branchesCreated: Number,
    departmentsCreated: Number,
    leadersAdded: Number,
    managersAdded: Number
  },
  
  // User activity
  activeUsers: {
    owners: Number,
    leaders: Number,
    managers: Number,
    total: Number
  },
  
  // Performance metrics
  performance: {
    avgReportGenerationTime: Number,
    avgAiResponseTime: Number,
    totalProcessingTime: Number
  },
  
  // Quota status at end of day
  quotaSnapshot: {
    employeesUsed: Number,
    employeesLimit: Number,
    reportsUsed: Number,
    reportsLimit: Number,
    aiMessagesUsed: Number,
    aiMessagesLimit: Number
  },
  
  updatedAt: ISODate,
  createdAt: ISODate
}

// Indexes
db.daily_usage_aggregates.createIndex({ organizationId: 1, date: -1 });
db.daily_usage_aggregates.createIndex({ subscriptionId: 1, date: -1 });
db.daily_usage_aggregates.createIndex({ date: -1 });
```

##### 3. monthly_usage_summaries

Monthly usage summaries for billing and analytics.

```javascript
{
  _id: ObjectId,
  organizationId: UUID,
  subscriptionId: UUID,
  year: Number,
  month: Number, // 1-12
  periodStart: ISODate,
  periodEnd: ISODate,
  
  // Total usage
  totals: {
    employeesAdded: Number,
    employeesTotal: Number,
    reportsGenerated: Number,
    aiChatMessages: Number,
    activeUserDays: Number
  },
  
  // Usage by category
  reportBreakdown: {
    personality: Number,
    behavior: Number,
    jobRoleCompatibility: Number,
    departmentCompatibility: Number,
    companyCompatibility: Number,
    industryCompatibility: Number,
    training: Number,
    questionnaire: Number
  },
  
  // Organizational structure
  structure: {
    branches: Number,
    departments: Number,
    leaders: Number,
    managers: Number
  },
  
  // Overages
  overages: {
    employees: Number,
    reports: Number,
    aiMessages: Number
  },
  
  // Billing impact
  billing: {
    baseAmount: Number,
    overageCharges: Number,
    totalAmount: Number,
    currency: String
  },
  
  // Related invoice
  invoiceId: UUID,
  
  updatedAt: ISODate,
  createdAt: ISODate
}

// Indexes
db.monthly_usage_summaries.createIndex({ organizationId: 1, year: -1, month: -1 });
db.monthly_usage_summaries.createIndex({ subscriptionId: 1, year: -1, month: -1 });
db.monthly_usage_summaries.createIndex({ invoiceId: 1 });
```

##### 4. feature_usage_tracking

Track usage of specific platform features.

```javascript
{
  _id: ObjectId,
  organizationId: UUID,
  userId: UUID,
  userRole: String, // owner, leader, manager
  
  // Feature details
  featureName: String, // quarterly_updates, advanced_analytics, api_access, etc.
  featureCategory: String, // reporting, analytics, integration, etc.
  action: String, // accessed, configured, used, etc.
  
  // Usage context
  context: {
    departmentId: UUID,
    branchId: UUID,
    employeeId: UUID,
    // ... other contextual data
  },
  
  // Performance
  duration: Number, // milliseconds
  success: Boolean,
  errorCode: String,
  
  // Metadata
  metadata: Object,
  
  timestamp: ISODate,
  createdAt: ISODate
}

// Indexes
db.feature_usage_tracking.createIndex({ organizationId: 1, timestamp: -1 });
db.feature_usage_tracking.createIndex({ featureName: 1, timestamp: -1 });
db.feature_usage_tracking.createIndex({ userId: 1, timestamp: -1 });
db.feature_usage_tracking.createIndex({ timestamp: -1 });
db.feature_usage_tracking.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL
```

##### 5. quota_violations

Track quota limit violations and enforcement.

```javascript
{
  _id: ObjectId,
  organizationId: UUID,
  subscriptionId: UUID,
  
  // Violation details
  violationType: String, // employee_limit, report_limit, ai_message_limit, etc.
  quotaType: String, // employees, reports, ai_messages, etc.
  
  // Limits
  currentLimit: Number,
  currentUsage: Number,
  attemptedUsage: Number,
  overage: Number,
  
  // Action taken
  action: String, // blocked, allowed_with_warning, allowed_with_charge
  blocked: Boolean,
  warningIssued: Boolean,
  
  // User context
  userId: UUID,
  userRole: String,
  
  // Related resources
  resourceType: String,
  resourceId: UUID,
  
  // Metadata
  metadata: Object,
  
  timestamp: ISODate,
  createdAt: ISODate
}

// Indexes
db.quota_violations.createIndex({ organizationId: 1, timestamp: -1 });
db.quota_violations.createIndex({ subscriptionId: 1, timestamp: -1 });
db.quota_violations.createIndex({ violationType: 1, timestamp: -1 });
db.quota_violations.createIndex({ timestamp: -1 });
```

##### 6. auto_update_access_logs

Track quarterly auto-update access and execution.

```javascript
{
  _id: ObjectId,
  organizationId: UUID,
  subscriptionId: UUID,
  
  // Update details
  updateType: String, // quarterly_regeneration
  quarter: Number, // 1-4
  year: Number,
  
  // Access check
  accessGranted: Boolean,
  subscriptionStatus: String, // active, past_due, canceled, etc.
  featureEnabled: Boolean,
  
  // Execution details
  employeesUpdated: Number,
  reportsGenerated: Number,
  startedAt: ISODate,
  completedAt: ISODate,
  duration: Number, // milliseconds
  
  // Status
  status: String, // scheduled, in_progress, completed, failed, skipped
  success: Boolean,
  errors: Array,
  
  // Metadata
  metadata: {
    triggerType: String, // automatic, manual
    triggeredBy: UUID,
    batchSize: Number,
    // ... other execution metadata
  },
  
  createdAt: ISODate
}

// Indexes
db.auto_update_access_logs.createIndex({ organizationId: 1, createdAt: -1 });
db.auto_update_access_logs.createIndex({ subscriptionId: 1, createdAt: -1 });
db.auto_update_access_logs.createIndex({ year: 1, quarter: 1, organizationId: 1 });
db.auto_update_access_logs.createIndex({ status: 1, createdAt: -1 });
```

## Migration Strategy

### Phase 1: Initial Schema Deployment

**Timeline:** Week 1

1. **PostgreSQL Schema Setup**
   - Create all tables in development environment
   - Run schema validation and constraint checks
   - Populate subscription_plans table with initial tiers
   - Create database roles and permissions

2. **MongoDB Collection Setup**
   - Create collections with schema validation rules
   - Implement all indexes for optimal query performance
   - Configure TTL indexes for automatic data cleanup
   - Set up sharding strategy for high-volume collections

3. **Testing**
   - Unit tests for schema constraints
   - Validate foreign key relationships
   - Test index performance with sample data
   - Verify TTL index functionality

### Phase 2: Data Seeding

**Timeline:** Week 2

1. **Seed Default Data**
   - Insert default subscription plans (Basic, Professional, Enterprise)
   - Create sample discount coupons for testing
   - Generate test organizations with various subscription states

2. **Validation**
   - Verify data integrity across relationships
   - Test cascade delete behavior
   - Validate unique constraints

### Phase 3: Production Migration

**Timeline:** Week 3-4

1. **Pre-Migration**
   - Backup existing data (if migrating from legacy system)
   - Create rollback scripts
   - Set up monitoring and alerting

2. **Migration Execution**
   - Deploy schema to staging environment
   - Run data migration scripts
   - Validate migrated data
   - Deploy to production during low-traffic window

3. **Post-Migration**
   - Monitor database performance
   - Verify application connectivity
   - Check data consistency
   - Optimize slow queries if needed

### Phase 4: Optimization

**Timeline:** Ongoing

1. **Performance Monitoring**
   - Track query performance metrics
   - Monitor index usage statistics
   - Identify slow queries for optimization

2. **Schema Evolution**
   - Version control all schema changes
   - Use migration tools (e.g., TypeORM migrations, Flyway)
   - Test migrations in staging before production

3. **Scaling Strategy**
   - Implement read replicas for PostgreSQL
   - Configure MongoDB replica sets
   - Set up connection pooling
   - Plan for horizontal scaling

### Migration Scripts

#### PostgreSQL Migration Template

```sql
-- Migration: V001__create_subscription_tables.sql
BEGIN;

-- Create tables (as defined above)
-- ...

-- Add audit trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Repeat for other tables...

COMMIT;
```

#### MongoDB Migration Template

```javascript
// Migration: 001_create_collections.js
db.createCollection('usage_events', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['organizationId', 'eventType', 'timestamp'],
      properties: {
        organizationId: { bsonType: 'string' },
        eventType: { bsonType: 'string' },
        timestamp: { bsonType: 'date' },
        // ... other schema definitions
      }
    }
  }
});

// Create indexes
db.usage_events.createIndex({ organizationId: 1, timestamp: -1 });
db.usage_events.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
```

### Rollback Strategy

1. **PostgreSQL Rollback**
   - Maintain rollback SQL scripts for each migration
   - Use transaction-wrapped migrations where possible
   - Keep database backups before major changes

2. **MongoDB Rollback**
   - Version collection schemas
   - Maintain data transformation scripts
   - Use MongoDB snapshots for point-in-time recovery

3. **Application Compatibility**
   - Ensure backward compatibility during schema changes
   - Use feature flags for gradual rollout
   - Maintain old and new schema support during transition period

### Data Archival Strategy

1. **PostgreSQL Archival**
   - Archive old invoices and payments (>2 years) to cold storage
   - Maintain subscription_changes for audit compliance
   - Implement soft delete with retention policies

2. **MongoDB Archival**
   - TTL indexes automatically remove old usage_events (90 days)
   - Archive monthly_usage_summaries to data warehouse
   - Compress historical data for long-term storage

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-10  
**Status:** Production Ready