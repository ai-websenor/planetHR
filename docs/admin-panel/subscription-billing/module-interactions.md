# Module Interactions - Subscription & Billing Management

## Overview

This document describes how the Subscription & Billing Management module interacts with other internal modules in the monolithic PlanetsHR application.

## Internal Module Dependencies

### Core Dependencies

| Module | Purpose | Interaction Type |
|--------|---------|------------------|
| **auth** | User authentication & authorization | Direct Service Call |
| **organizations** | Company and branch data | Direct Service Call |
| **users** | User role and hierarchy management | Direct Service Call |
| **employees** | Employee count tracking | Event-based + Direct Call |
| **reports** | Report generation limits and access | Event-based + Direct Call |
| **cron** | Quarterly update scheduling | Event-based |
| **email** | Invoice and payment notifications | Event-based |

### Optional Dependencies

| Module | Purpose | Interaction Type |
|--------|---------|------------------|
| **audit** | Payment and subscription audit trail | Event-based |
| **analytics** | Usage metrics and billing analytics | Direct Service Call |
| **notifications** | Real-time subscription alerts | WebSocket Events |

## Communication Patterns

### 1. Subscription Creation Flow

```
User Registration → Auth Module
                  ↓
            Organizations Module (Create Org)
                  ↓
            Subscription Service (Create Trial/Paid Plan)
                  ↓
            Payment Service (Setup Payment Method)
                  ↓
            Email Module (Send Welcome Email)
```

**Pattern Type**: Synchronous Chain
**Error Handling**: Rollback transaction on any failure

### 2. Employee Addition with Limit Check

```
Users Module (Add Employee Request)
       ↓
Usage Tracking Service (Check Current Count)
       ↓
Subscription Service (Validate Against Plan Limit)
       ↓
Employees Module (Create Employee) → Success
       ↓
Usage Tracking Service (Increment Counter)
       ↓
WebSocket Event: usage.updated
```

**Pattern Type**: Synchronous with validation + Async event
**Error Handling**: Reject request if limit exceeded

### 3. Report Generation with Subscription Validation

```
Reports Module (Generate Report Request)
       ↓
Subscription Service (Check Active Subscription)
       ↓
Usage Tracking Service (Check Report Limit)
       ↓
Reports Module (Generate Report) → Success
       ↓
Usage Tracking Service (Increment Report Counter)
       ↓
Billing Service (Update Usage for Metered Billing)
```

**Pattern Type**: Synchronous validation + Async usage tracking
**Error Handling**: Block generation if subscription inactive or limit reached

### 4. Quarterly Auto-Update Access Control

```
Cron Module (Quarterly Update Trigger)
       ↓
Subscription Service (Get Active Subscriptions)
       ↓
FOR EACH Active Subscription:
    ↓
    Reports Module (Regenerate All Reports)
    ↓
    Email Module (Send Update Notification)
    ↓
    Usage Tracking Service (Log Auto-Update Event)
```

**Pattern Type**: Scheduled batch processing
**Error Handling**: Continue on individual failures, log errors

### 5. Payment Processing Flow

```
Stripe Webhook → Payment Service
       ↓
Payment Service (Validate & Process)
       ↓
Subscription Service (Update Subscription Status)
       ↓
Billing Service (Generate Invoice)
       ↓
Email Module (Send Invoice Email)
       ↓
WebSocket Event: subscription.status.changed
       ↓
Audit Module (Log Payment Event)
```

**Pattern Type**: Async webhook + Event-driven cascade
**Error Handling**: Retry webhook processing, manual reconciliation fallback

### 6. Subscription Renewal Flow

```
Cron Module (Daily Renewal Check)
       ↓
Subscription Service (Find Expiring Subscriptions)
       ↓
FOR EACH Expiring Subscription:
    ↓
    Payment Service (Charge Payment Method)
    ↓
    IF Payment Success:
        Subscription Service (Extend Subscription)
        Billing Service (Generate Invoice)
        Email Module (Send Renewal Confirmation)
    ELSE:
        Subscription Service (Suspend Subscription)
        Email Module (Send Payment Failed Notice)
        WebSocket Event: subscription.suspended
```

**Pattern Type**: Scheduled batch with conditional logic
**Error Handling**: Retry failed payments, grace period before suspension

### 7. Subscription Downgrade/Upgrade Flow

```
Users Module (Plan Change Request)
       ↓
Subscription Service (Validate Plan Change)
       ↓
IF Downgrade:
    Usage Tracking Service (Check Current Usage vs New Limits)
    ↓
    IF Usage Exceeds New Limits:
        REJECT with validation error
    ELSE:
        Continue
       ↓
Payment Service (Calculate Proration)
       ↓
Payment Service (Process Payment/Refund)
       ↓
Subscription Service (Update Plan)
       ↓
Billing Service (Generate Adjustment Invoice)
       ↓
Email Module (Send Plan Change Confirmation)
       ↓
WebSocket Event: subscription.plan.changed
```

**Pattern Type**: Synchronous validation + Transaction
**Error Handling**: Rollback on payment failure

### 8. Usage Limit Warning System

```
Usage Tracking Service (Monitor Thresholds)
       ↓
IF Usage > 80% of Limit:
    ↓
    Email Module (Send Warning Email)
    ↓
    WebSocket Event: usage.warning
    ↓
IF Usage = 100% of Limit:
    ↓
    Block Service (Prevent Further Actions)
    ↓
    Email Module (Send Limit Reached Email)
    ↓
    WebSocket Event: usage.limit.reached
```

**Pattern Type**: Real-time monitoring + Event-driven alerts
**Error Handling**: Ensure block takes effect even if notifications fail

## Shared Resources

### Database Resources

#### PostgreSQL Schemas

```sql
-- Shared with Organizations Module
organizations (id, name, owner_id)

-- Shared with Users Module
users (id, organization_id, role, email)

-- Owned by Subscription Module, Read by Others
subscriptions (
  id,
  organization_id,
  plan_id,
  status,
  current_period_start,
  current_period_end,
  auto_renew
)

-- Owned by Billing Module
invoices (
  id,
  organization_id,
  subscription_id,
  amount,
  status,
  due_date
)

-- Owned by Payment Module
payments (
  id,
  invoice_id,
  organization_id,
  amount,
  status,
  payment_method,
  stripe_payment_intent_id
)
```

**Access Pattern**: 
- Subscription data: Read by Reports, Cron, Employees, Users modules
- Payment data: Write-only by Payment module, Read by Billing and Audit
- Invoice data: Read by Email, Users modules

#### MongoDB Collections

```javascript
// Owned by Usage Tracking Service
usage_metrics: {
  organization_id: ObjectId,
  subscription_id: String,
  period_start: Date,
  period_end: Date,
  employee_count: Number,
  report_generation_count: Number,
  ai_chat_count: Number,
  api_calls: Number,
  timestamp: Date
}

// Time-series data for analytics
usage_history: {
  organization_id: ObjectId,
  metric_type: String, // "employee_added", "report_generated", etc.
  value: Number,
  timestamp: Date,
  metadata: Object
}
```

**Access Pattern**:
- Write by Usage Tracking Service
- Read by Subscription Service (limit validation)
- Read by Analytics Module (usage reports)

### Redis Cache

```redis
# Subscription cache (TTL: 5 minutes)
subscription:{org_id} → {subscription_object}

# Usage counter cache (TTL: 1 hour)
usage:employee:{org_id} → {current_count}
usage:reports:{org_id}:{period} → {report_count}

# Feature access cache (TTL: 15 minutes)
features:{org_id} → {enabled_features_array}

# Rate limiting (TTL: varies)
ratelimit:api:{org_id}:{endpoint} → {request_count}
```

**Access Pattern**:
- Read/Write by Subscription Service
- Read by all modules requiring subscription validation
- Write by Usage Tracking Service
- Invalidated on subscription status changes

### Event Bus (BullMQ Queues)

```typescript
// Queue: subscription-events
{
  event: "subscription.created" | "subscription.updated" | "subscription.suspended" | "subscription.cancelled",
  data: {
    organization_id: string,
    subscription_id: string,
    plan_id: string,
    status: string,
    timestamp: Date
  }
}

// Queue: payment-events
{
  event: "payment.succeeded" | "payment.failed" | "payment.refunded",
  data: {
    organization_id: string,
    payment_id: string,
    invoice_id: string,
    amount: number,
    timestamp: Date
  }
}

// Queue: usage-events
{
  event: "usage.limit.warning" | "usage.limit.reached" | "usage.reset",
  data: {
    organization_id: string,
    metric_type: string,
    current_usage: number,
    limit: number,
    timestamp: Date
  }
}

// Queue: billing-events
{
  event: "invoice.generated" | "invoice.paid" | "invoice.overdue",
  data: {
    organization_id: string,
    invoice_id: string,
    amount: number,
    due_date: Date,
    timestamp: Date
  }
}
```

**Producers**:
- Subscription Service → subscription-events
- Payment Service → payment-events
- Usage Tracking Service → usage-events
- Billing Service → billing-events

**Consumers**:
- Email Module (all queues)
- Audit Module (all queues)
- Analytics Module (usage-events, subscription-events)
- WebSocket Service (all queues for real-time updates)

### WebSocket Channels

```typescript
// Real-time subscription to organization-specific channel
channel: `org:${organization_id}:subscription`

// Events emitted:
- subscription.status.changed
- subscription.plan.changed
- usage.warning
- usage.limit.reached
- payment.succeeded
- payment.failed
- invoice.generated
```

**Subscribers**: Admin panel frontend, Leader/Manager dashboards

## Service Method Contracts

### Subscription Service Exports

```typescript
// Used by: Auth, Organizations, Users modules
interface ISubscriptionService {
  createSubscription(orgId: string, planId: string): Promise<Subscription>;
  getActiveSubscription(orgId: string): Promise<Subscription | null>;
  validateAccess(orgId: string, feature: string): Promise<boolean>;
  updatePlan(subscriptionId: string, newPlanId: string): Promise<Subscription>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  suspendSubscription(subscriptionId: string): Promise<void>;
  reactivateSubscription(subscriptionId: string): Promise<Subscription>;
}
```

### Usage Tracking Service Exports

```typescript
// Used by: Employees, Reports, Chat modules
interface IUsageTrackingService {
  checkLimit(orgId: string, metricType: UsageMetric): Promise<LimitCheckResult>;
  incrementUsage(orgId: string, metricType: UsageMetric): Promise<void>;
  getCurrentUsage(orgId: string): Promise<UsageMetrics>;
  resetPeriodUsage(orgId: string): Promise<void>;
  getUsageHistory(orgId: string, startDate: Date, endDate: Date): Promise<UsageHistory[]>;
}
```

### Payment Service Exports

```typescript
// Used by: Subscription, Billing modules
interface IPaymentService {
  setupPaymentMethod(orgId: string, paymentMethodId: string): Promise<void>;
  chargePayment(orgId: string, amount: number, invoiceId: string): Promise<Payment>;
  processRefund(paymentId: string, amount?: number): Promise<Refund>;
  handleWebhook(event: StripeEvent): Promise<void>;
  getPaymentHistory(orgId: string): Promise<Payment[]>;
}
```

### Billing Service Exports

```typescript
// Used by: Subscription, Payment modules
interface IBillingService {
  generateInvoice(orgId: string, subscriptionId: string): Promise<Invoice>;
  finalizeInvoice(invoiceId: string): Promise<Invoice>;
  voidInvoice(invoiceId: string): Promise<void>;
  getInvoices(orgId: string): Promise<Invoice[]>;
  calculateProration(subscriptionId: string, newPlanId: string): Promise<ProrationResult>;
}
```

## Transaction Boundaries

### Critical Transactions

1. **Plan Change Transaction**
   ```typescript
   // Must be atomic across:
   - Subscription update
   - Payment processing
   - Invoice generation
   - Usage limit updates
   ```

2. **Payment Processing Transaction**
   ```typescript
   // Must be atomic across:
   - Payment record creation
   - Invoice status update
   - Subscription status update
   ```

3. **Subscription Cancellation Transaction**
   ```typescript
   // Must be atomic across:
   - Subscription status update
   - Auto-renewal disable
   - Access revocation
   - Final invoice generation
   ```

### Rollback Strategies

- **Database Transactions**: Use PostgreSQL transactions for related writes
- **Compensating Transactions**: For cross-service operations (e.g., refund if subscription update fails)
- **Idempotency Keys**: All payment operations use idempotency keys
- **Saga Pattern**: For complex multi-step workflows (e.g., plan upgrades)

## Performance Considerations

### Caching Strategy

- **Subscription Data**: Cache for 5 minutes to reduce DB load
- **Usage Counters**: Cache for 1 hour with async write-through
- **Feature Flags**: Cache for 15 minutes per organization

### Rate Limiting

- **API Endpoints**: 100 requests/minute per organization
- **Webhook Processing**: Queue-based with exponential backoff
- **Usage Checks**: In-memory counter with periodic sync

### Monitoring Metrics

- Subscription validation latency (<50ms p95)
- Usage check latency (<20ms p95)
- Payment processing success rate (>99%)
- Webhook processing delay (<5 seconds p95)
- Cache hit rate (>95% for subscription data)

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Status:** Complete