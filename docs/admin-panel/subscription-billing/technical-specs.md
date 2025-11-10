# Technical Specifications - Subscription & Billing Management

## Architecture Overview

This module is part of a monolithic application architecture with well-defined internal modules and layers.

The Subscription & Billing Management module operates within the PlanetsHR monolithic NestJS application. It handles all subscription lifecycle operations, payment processing, billing, and usage tracking. The module integrates with external payment gateways (Stripe) while maintaining internal business logic for subscription management, feature tier enforcement, and usage limits.

The architecture follows NestJS best practices with dependency injection, module boundaries, and clear separation of concerns. All components operate within the same process but maintain logical separation through modules, ensuring maintainability while benefiting from monolithic simplicity.

## Application Modules

### payment-service

**Responsibility:**
Handles payment processing, payment method management, payment gateway integration (Stripe), transaction recording, refund processing, and payment verification. Manages the complete payment lifecycle from initiation to confirmation.

**Layer:** Business Logic Layer with Data Access

**Dependencies:**
- `subscription-service` - For subscription payment associations
- `billing-service` - For invoice payment linking
- `email` module - For payment confirmation emails
- `users` module - For customer identification
- `organizations` module - For organization context
- External: Stripe API

**Exposed APIs:**
- `createPaymentIntent(organizationId, amount, metadata)` - Initialize payment
- `confirmPayment(paymentIntentId)` - Confirm payment completion
- `processRefund(paymentId, amount, reason)` - Process refund requests
- `getPaymentHistory(organizationId, filters)` - Retrieve payment history
- `addPaymentMethod(organizationId, paymentMethodData)` - Add payment method
- `removePaymentMethod(organizationId, paymentMethodId)` - Remove payment method
- `setDefaultPaymentMethod(organizationId, paymentMethodId)` - Set default method
- `validatePaymentMethod(paymentMethodId)` - Validate payment method

### subscription-service

**Responsibility:**
Manages subscription plans, subscription lifecycle (creation, upgrades, downgrades, cancellations), feature tier access control, subscription status management, renewal scheduling, and auto-update access control based on active subscriptions.

**Layer:** Business Logic Layer with Data Access

**Dependencies:**
- `payment-service` - For payment processing
- `billing-service` - For invoice generation
- `usage-tracking-service` - For usage limit enforcement
- `users` module - For user role-based subscription access
- `organizations` module - For organization-level subscriptions
- `reports` module - For quarterly update access control
- `cron` module - For subscription renewal scheduling
- `email` module - For subscription notifications

**Exposed APIs:**
- `createSubscription(organizationId, planId, paymentMethodId)` - Create new subscription
- `upgradeSubscription(subscriptionId, newPlanId)` - Upgrade to higher tier
- `downgradeSubscription(subscriptionId, newPlanId)` - Downgrade to lower tier
- `cancelSubscription(subscriptionId, reason, immediate)` - Cancel subscription
- `reactivateSubscription(subscriptionId)` - Reactivate cancelled subscription
- `getSubscriptionStatus(organizationId)` - Get current subscription status
- `validateFeatureAccess(organizationId, feature)` - Check feature availability
- `checkAutoUpdateAccess(organizationId)` - Verify quarterly update eligibility
- `getAvailablePlans()` - List all subscription plans
- `comparePlans(planIds)` - Compare plan features
- `processRenewal(subscriptionId)` - Handle subscription renewal
- `sendRenewalReminders()` - Send renewal notifications

### billing-service

**Responsibility:**
Generates invoices, manages invoice lifecycle, calculates prorated charges, handles invoice payments, generates billing reports, manages billing cycles, and provides invoice download functionality.

**Layer:** Business Logic Layer with Data Access

**Dependencies:**
- `subscription-service` - For subscription details
- `payment-service` - For payment linkage
- `usage-tracking-service` - For usage-based billing
- `organizations` module - For billing information
- `email` module - For invoice delivery
- External: PDF generation library

**Exposed APIs:**
- `generateInvoice(subscriptionId, billingPeriod)` - Create invoice
- `getInvoice(invoiceId)` - Retrieve invoice details
- `listInvoices(organizationId, filters)` - List organization invoices
- `downloadInvoice(invoiceId, format)` - Download invoice (PDF/JSON)
- `markInvoicePaid(invoiceId, paymentId)` - Mark invoice as paid
- `calculateProration(subscriptionId, changeType, newPlanId)` - Calculate prorated amount
- `sendInvoiceEmail(invoiceId)` - Email invoice to customer
- `generateBillingReport(organizationId, period)` - Generate billing report
- `getUpcomingInvoice(subscriptionId)` - Preview next invoice
- `applyCredit(invoiceId, creditAmount, reason)` - Apply credit to invoice

### usage-tracking-service

**Responsibility:**
Tracks employee count, monitors report generation usage, enforces usage limits, provides usage analytics, alerts on limit approaches, manages usage quotas, and resets monthly usage counters.

**Layer:** Business Logic Layer with Data Access

**Dependencies:**
- `subscription-service` - For plan limits
- `employees` module - For employee count tracking
- `reports` module - For report generation tracking
- `organizations` module - For organization context
- `email` module - For usage alerts
- MongoDB - For high-volume usage metrics

**Exposed APIs:**
- `trackEmployeeCount(organizationId)` - Track current employee count
- `trackReportGeneration(organizationId, reportType, employeeId)` - Track report usage
- `checkEmployeeLimit(organizationId, requestedCount)` - Validate employee limit
- `checkReportLimit(organizationId)` - Validate report limit
- `getUsageStatistics(organizationId, period)` - Get usage stats
- `getUsageAlerts(organizationId)` - Get usage warnings
- `resetMonthlyUsage(organizationId)` - Reset monthly counters
- `getRemainingQuota(organizationId, quotaType)` - Get remaining usage
- `sendUsageAlert(organizationId, alertType, threshold)` - Send usage notification
- `exportUsageReport(organizationId, format, dateRange)` - Export usage data


## Layered Architecture

### Presentation Layer

**Controllers:**
- `SubscriptionsController` - Subscription management endpoints
- `PaymentsController` - Payment processing endpoints
- `BillingController` - Invoice and billing endpoints
- `UsageController` - Usage tracking and analytics endpoints

**Responsibilities:**
- Request validation using class-validator DTOs
- Authentication via JwtAuthGuard
- Authorization via RolesGuard (Owner-only access)
- API documentation with Swagger decorators
- Response formatting and error handling
- Rate limiting on payment endpoints

**DTOs:**
- `CreateSubscriptionDto` - Plan selection and payment method
- `UpdateSubscriptionDto` - Plan changes and modifications
- `CreatePaymentMethodDto` - Payment method details
- `ProcessRefundDto` - Refund request details
- `UsageFilterDto` - Usage query parameters
- `BillingPeriodDto` - Invoice period selection

**Swagger Documentation:**
- All endpoints documented with @ApiOperation
- Request/response schemas defined
- Authentication requirements specified
- Error responses documented

### Business Logic Layer

**Services:**

**SubscriptionService:**
- Plan management and comparison
- Subscription lifecycle orchestration
- Feature tier validation
- Renewal and cancellation logic
- Auto-update access control
- Plan upgrade/downgrade calculations

**PaymentService:**
- Stripe payment intent management
- Payment method CRUD operations
- Refund processing
- Payment verification
- Transaction history management
- Payment webhook handling

**BillingService:**
- Invoice generation with line items
- Proration calculations
- Invoice status management
- PDF invoice generation
- Billing cycle management
- Credit and discount application

**UsageTrackingService:**
- Real-time usage monitoring
- Limit enforcement logic
- Usage analytics and reporting
- Alert threshold management
- Monthly usage reset automation
- Usage trend analysis

**Business Rules:**
- Employee count cannot exceed subscription limit
- Report generation blocked when limit reached
- Quarterly updates require active subscription
- Proration applied on mid-cycle changes
- Grace period: 7 days post-expiration
- Failed payment retry: 3 attempts over 10 days

**Event Emitters:**
- `subscription.created` - New subscription activated
- `subscription.upgraded` - Plan upgraded
- `subscription.downgraded` - Plan downgraded
- `subscription.cancelled` - Subscription cancelled
- `subscription.renewed` - Subscription renewed
- `payment.succeeded` - Payment successful
- `payment.failed` - Payment failed
- `usage.limit.approaching` - Usage near limit (90%)
- `usage.limit.reached` - Usage limit reached

### Data Access Layer

**Repositories (TypeORM):**
- `SubscriptionRepository` - PostgreSQL subscription data
- `PaymentRepository` - PostgreSQL payment records
- `InvoiceRepository` - PostgreSQL invoice data
- `PaymentMethodRepository` - PostgreSQL payment methods

**Repositories (Mongoose):**
- `UsageMetricsRepository` - MongoDB usage events
- `UsageAggregationRepository` - MongoDB usage summaries

**Schemas:**

**PostgreSQL Tables:**
- `subscriptions` - Subscription records
- `subscription_plans` - Available plans
- `payments` - Payment transactions
- `payment_methods` - Stored payment methods
- `invoices` - Generated invoices
- `invoice_line_items` - Invoice details

**MongoDB Collections:**
- `usage_events` - Individual usage tracking events
- `usage_summaries` - Aggregated daily/monthly usage
- `usage_alerts` - Usage alert history

**Data Access Patterns:**
- Transaction management for payment operations
- Optimistic locking for subscription updates
- Time-series queries for usage data
- Aggregation pipelines for usage analytics
- Indexed queries on organizationId and status
- Soft deletes for payment methods

## API Endpoints

### Subscription Management

**POST /api/v1/subscriptions**
- Create new subscription
- Body: `{ planId, paymentMethodId }`
- Auth: Owner role required
- Returns: Subscription object

**GET /api/v1/subscriptions**
- Get organization subscription
- Auth: Owner role required
- Returns: Current subscription details

**PATCH /api/v1/subscriptions/:id/upgrade**
- Upgrade subscription plan
- Body: `{ newPlanId }`
- Auth: Owner role required
- Returns: Updated subscription with proration

**PATCH /api/v1/subscriptions/:id/downgrade**
- Downgrade subscription plan
- Body: `{ newPlanId, effectiveDate }`
- Auth: Owner role required
- Returns: Updated subscription

**DELETE /api/v1/subscriptions/:id**
- Cancel subscription
- Query: `?immediate=true/false`
- Auth: Owner role required
- Returns: Cancellation confirmation

**POST /api/v1/subscriptions/:id/reactivate**
- Reactivate cancelled subscription
- Auth: Owner role required
- Returns: Reactivated subscription

**GET /api/v1/subscriptions/plans**
- List available plans
- Auth: Public or authenticated
- Returns: Array of plan details

**GET /api/v1/subscriptions/plans/compare**
- Compare subscription plans
- Query: `?planIds=plan1,plan2`
- Auth: Public or authenticated
- Returns: Feature comparison matrix

### Payment Management

**POST /api/v1/payments/intent**
- Create payment intent
- Body: `{ amount, currency, metadata }`
- Auth: Owner role required
- Returns: Stripe client secret

**POST /api/v1/payments/:id/confirm**
- Confirm payment
- Auth: Owner role required
- Returns: Payment confirmation

**GET /api/v1/payments**
- List payment history
- Query: `?status=&startDate=&endDate=`
- Auth: Owner role required
- Returns: Paginated payments

**POST /api/v1/payments/:id/refund**
- Process refund
- Body: `{ amount, reason }`
- Auth: Owner role required
- Returns: Refund confirmation

**POST /api/v1/payments/methods**
- Add payment method
- Body: `{ type, details, setDefault }`
- Auth: Owner role required
- Returns: Payment method object

**DELETE /api/v1/payments/methods/:id**
- Remove payment method
- Auth: Owner role required
- Returns: Deletion confirmation

**PATCH /api/v1/payments/methods/:id/default**
- Set default payment method
- Auth: Owner role required
- Returns: Updated method

**POST /api/v1/payments/webhook**
- Stripe webhook endpoint
- Headers: `stripe-signature`
- Auth: Stripe signature verification
- Returns: Webhook acknowledgment

### Billing Management

**GET /api/v1/billing/invoices**
- List organization invoices
- Query: `?status=&year=&page=&limit=`
- Auth: Owner role required
- Returns: Paginated invoices

**GET /api/v1/billing/invoices/:id**
- Get invoice details
- Auth: Owner role required
- Returns: Invoice with line items

**GET /api/v1/billing/invoices/:id/download**
- Download invoice PDF
- Auth: Owner role required
- Returns: PDF file stream

**GET /api/v1/billing/invoices/upcoming**
- Preview upcoming invoice
- Auth: Owner role required
- Returns: Projected invoice

**POST /api/v1/billing/invoices/:id/send**
- Email invoice to customer
- Auth: Owner role required
- Returns: Send confirmation

**GET /api/v1/billing/reports**
- Generate billing report
- Query: `?startDate=&endDate=&format=`
- Auth: Owner role required
- Returns: Billing report data/PDF

**POST /api/v1/billing/invoices/:id/credit**
- Apply credit to invoice
- Body: `{ amount, reason }`
- Auth: Owner role required
- Returns: Updated invoice

### Usage Tracking

**GET /api/v1/usage/current**
- Get current usage statistics
- Auth: Owner/Leader/Manager roles
- Returns: Current period usage

**GET /api/v1/usage/history**
- Get usage history
- Query: `?period=&metricType=`
- Auth: Owner role required
- Returns: Historical usage data

**GET /api/v1/usage/limits**
- Get remaining quotas
- Auth: Owner/Leader/Manager roles
- Returns: Remaining employee/report counts

**GET /api/v1/usage/alerts**
- Get usage alerts
- Auth: Owner role required
- Returns: Active usage warnings

**GET /api/v1/usage/export**
- Export usage data
- Query: `?format=csv/json&startDate=&endDate=`
- Auth: Owner role required
- Returns: Usage export file

## Database Schemas

### PostgreSQL Schemas

**subscriptions**
```typescript
{
  id: UUID PRIMARY KEY,
  organizationId: UUID FOREIGN KEY -> organizations.id,
  planId: UUID FOREIGN KEY -> subscription_plans.id,
  status: ENUM('active', 'past_due', 'cancelled', 'trialing'),
  currentPeriodStart: TIMESTAMP,
  currentPeriodEnd: TIMESTAMP,
  cancelAtPeriodEnd: BOOLEAN,
  cancelledAt: TIMESTAMP NULL,
  trialStart: TIMESTAMP NULL,
  trialEnd: TIMESTAMP NULL,
  stripeSubscriptionId: VARCHAR(255) UNIQUE,
  metadata: JSONB,
  createdAt: TIMESTAMP DEFAULT NOW(),
  updatedAt: TIMESTAMP DEFAULT NOW()
}

INDEXES:
- organizationId (unique)
- status
- currentPeriodEnd
```

**subscription_plans**
```typescript
{
  id: UUID PRIMARY KEY,
  name: VARCHAR(100) NOT NULL,
  displayName: VARCHAR(100),
  description: TEXT,
  price: DECIMAL(10,2),
  currency: VARCHAR(3) DEFAULT 'USD',
  billingInterval: ENUM('monthly', 'annual'),
  employeeLimit: INTEGER,
  reportLimit: INTEGER NULL, // NULL = unlimited
  features: JSONB, // Feature flags and limits
  stripePriceId: VARCHAR(255),
  isActive: BOOLEAN DEFAULT TRUE,
  sortOrder: INTEGER,
  createdAt: TIMESTAMP DEFAULT NOW(),
  updatedAt: TIMESTAMP DEFAULT NOW()
}

INDEXES:
- isActive
- sortOrder
```

**payments**
```typescript
{
  id: UUID PRIMARY KEY,
  organizationId: UUID FOREIGN KEY -> organizations.id,
  subscriptionId: UUID FOREIGN KEY -> subscriptions.id NULL,
  invoiceId: UUID FOREIGN KEY -> invoices.id NULL,
  amount: DECIMAL(10,2),
  currency: VARCHAR(3),
  status: ENUM('pending', 'succeeded', 'failed', 'refunded'),
  paymentMethodId: UUID FOREIGN KEY -> payment_methods.id,
  stripePaymentIntentId: VARCHAR(255) UNIQUE,
  failureReason: TEXT NULL,
  refundAmount: DECIMAL(10,2) NULL,
  refundedAt: TIMESTAMP NULL,
  metadata: JSONB,
  createdAt: TIMESTAMP DEFAULT NOW(),
  updatedAt: TIMESTAMP DEFAULT NOW()
}

INDEXES:
- organizationId
- subscriptionId
- status
- createdAt
```

**payment_methods**
```typescript
{
  id: UUID PRIMARY KEY,
  organizationId: UUID FOREIGN KEY -> organizations.id,
  type: ENUM('card', 'bank_account'),
  isDefault: BOOLEAN DEFAULT FALSE,
  stripePaymentMethodId: VARCHAR(255) UNIQUE,
  last4: VARCHAR(4),
  brand: VARCHAR(50), // Visa, Mastercard, etc.
  expiryMonth: INTEGER NULL,
  expiryYear: INTEGER NULL,
  metadata: JSONB,
  createdAt: TIMESTAMP DEFAULT NOW(),
  deletedAt: TIMESTAMP NULL
}

INDEXES:
- organizationId, isDefault
- organizationId, deletedAt
```

**invoices**
```typescript
{
  id: UUID PRIMARY KEY,
  organizationId: UUID FOREIGN KEY -> organizations.id,
  subscriptionId: UUID FOREIGN KEY -> subscriptions.id,
  invoiceNumber: VARCHAR(50) UNIQUE,
  status: ENUM('draft', 'open', 'paid', 'void', 'uncollectible'),
  subtotal: DECIMAL(10,2),
  tax: DECIMAL(10,2),
  total: DECIMAL(10,2),
  amountPaid: DECIMAL(10,2),
  amountDue: DECIMAL(10,2),
  currency: VARCHAR(3),
  periodStart: TIMESTAMP,
  periodEnd: TIMESTAMP,
  dueDate: TIMESTAMP,
  paidAt: TIMESTAMP NULL,
  stripeInvoiceId: VARCHAR(255) UNIQUE,
  pdfUrl: TEXT NULL,
  metadata: JSONB,
  createdAt: TIMESTAMP DEFAULT NOW(),
  updatedAt: TIMESTAMP DEFAULT NOW()
}

INDEXES:
- organizationId
- subscriptionId
- status
- invoiceNumber
- dueDate
```

**invoice_line_items**
```typescript
{
  id: UUID PRIMARY KEY,
  invoiceId: UUID FOREIGN KEY -> invoices.id,
  description: TEXT,
  quantity: INTEGER,
  unitAmount: DECIMAL(10,2),
  amount: DECIMAL(10,2),
  currency: VARCHAR(3),
  period: JSONB, // { start, end }
  proration: BOOLEAN DEFAULT FALSE,
  metadata: JSONB
}

INDEXES:
- invoiceId
```

### MongoDB Schemas

**usage_events**
```typescript
{
  _id: ObjectId,
  organizationId: String (indexed),
  eventType: String, // 'employee_added', 'employee_removed', 'report_generated'
  employeeId: String (indexed),
  reportType: String,
  userId: String,
  timestamp: Date (indexed),
  metadata: {
    reportId: String,
    generatedBy: String,
    automated: Boolean
  }
}

INDEXES:
- { organizationId: 1, timestamp: -1 }
- { organizationId: 1, eventType: 1, timestamp: -1 }
- { timestamp: 1 } (TTL index: 90 days)
```

**usage_summaries**
```typescript
{
  _id: ObjectId,
  organizationId: String (indexed),
  period: String, // 'YYYY-MM-DD' for daily, 'YYYY-MM' for monthly
  periodType: String, // 'daily', 'monthly'
  metrics: {
    employeeCount: Number,
    reportsGenerated: Number,
    reportsByType: {
      personality: Number,
      compatibility: Number,
      training: Number,
      qa: Number
    },
    activeUsers: Number
  },
  limits: {
    employeeLimit: Number,
    reportLimit: Number
  },
  createdAt: Date,
  updatedAt: Date
}

INDEXES:
- { organizationId: 1, period: -1 }
- { organizationId: 1, periodType: 1 }
```

**usage_alerts**
```typescript
{
  _id: ObjectId,
  organizationId: String (indexed),
  alertType: String, // 'employee_limit_approaching', 'report_limit_reached'
  severity: String, // 'warning', 'critical'
  threshold: Number,
  currentValue: Number,
  message: String,
  acknowledged: Boolean,
  acknowledgedAt: Date,
  acknowledgedBy: String,
  createdAt: Date
}

INDEXES:
- { organizationId: 1, acknowledged: 1, createdAt: -1 }
```

## Caching Strategy

**Redis Caching Layers:**

**Subscription Data Cache:**
- Key: `subscription:org:{organizationId}`
- TTL: 1 hour
- Invalidation: On subscription updates
- Purpose: Fast subscription status checks

**Feature Access Cache:**
- Key: `features:org:{organizationId}`
- TTL: 30 minutes
- Invalidation: On plan changes
- Purpose: Quick feature availability checks

**Usage Quota Cache:**
- Key: `usage:quota:{organizationId}:{period}`
- TTL: 5 minutes
- Invalidation: On usage events
- Purpose: Real-time quota enforcement

**Payment Method Cache:**
- Key: `payment:methods:{organizationId}`
- TTL: 15 minutes
- Invalidation: On payment method changes
- Purpose: Fast payment method retrieval

**Plan Catalog Cache:**
- Key: `plans:catalog`
- TTL: 24 hours
- Invalidation: On plan configuration changes
- Purpose: Public plan listing performance

**Invoice List Cache:**
- Key: `invoices:list:{organizationId}`
- TTL: 10 minutes
- Invalidation: On new invoice generation
- Purpose: Billing history performance

**Cache Warming:**
- Subscription data preloaded on organization login
- Plan catalog preloaded at application startup
- Usage quotas refreshed every 5 minutes via scheduled job

**Cache Invalidation Patterns:**
- Event-driven invalidation on data modifications
- TTL-based expiration for non-critical data
- Bulk invalidation on subscription status changes
- Manual invalidation API for administrative purposes

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Draft