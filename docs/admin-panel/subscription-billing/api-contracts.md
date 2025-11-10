# API Contracts - Subscription & Billing Management

## Overview

This document defines all API endpoints (internal and external) for the Subscription & Billing Management module within the PlanetsHR monolithic NestJS application.

## External APIs

### Subscription Management

#### Create Subscription
```http
POST /api/v1/subscriptions
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "organizationId": "string (UUID)",
  "planId": "string (UUID)",
  "billingCycle": "monthly | quarterly | annual",
  "paymentMethodId": "string",
  "autoRenew": "boolean",
  "couponCode": "string (optional)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "string (UUID)",
    "organizationId": "string (UUID)",
    "planId": "string (UUID)",
    "status": "active",
    "currentPeriodStart": "ISO8601 timestamp",
    "currentPeriodEnd": "ISO8601 timestamp",
    "billingCycle": "monthly",
    "limits": {
      "maxEmployees": 100,
      "maxReportsPerMonth": 500,
      "quarterlyAutoUpdates": true
    },
    "createdAt": "ISO8601 timestamp"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid plan or payment method
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User not authorized (non-Owner role)
- `409 Conflict` - Active subscription already exists
- `422 Unprocessable Entity` - Validation errors

#### Get Subscription Details
```http
GET /api/v1/subscriptions/:subscriptionId
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "string (UUID)",
    "organizationId": "string (UUID)",
    "plan": {
      "planId": "string (UUID)",
      "name": "Professional",
      "tier": "tier_2",
      "description": "Advanced HR analytics for growing teams"
    },
    "status": "active | past_due | canceled | expired",
    "currentPeriodStart": "ISO8601 timestamp",
    "currentPeriodEnd": "ISO8601 timestamp",
    "billingCycle": "monthly | quarterly | annual",
    "autoRenew": true,
    "limits": {
      "maxEmployees": 100,
      "maxReportsPerMonth": 500,
      "quarterlyAutoUpdates": true,
      "aiChatMessages": 1000
    },
    "usage": {
      "currentEmployees": 45,
      "reportsGeneratedThisMonth": 120,
      "aiChatMessagesUsed": 234
    },
    "nextBillingDate": "ISO8601 timestamp",
    "cancelAtPeriodEnd": false,
    "createdAt": "ISO8601 timestamp",
    "updatedAt": "ISO8601 timestamp"
  }
}
```

#### Get Organization's Active Subscription
```http
GET /api/v1/subscriptions/organization/:organizationId
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
Same structure as Get Subscription Details

**Error Response:**
- `404 Not Found` - No active subscription found

#### Update Subscription
```http
PATCH /api/v1/subscriptions/:subscriptionId
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "planId": "string (UUID) (optional)",
  "billingCycle": "monthly | quarterly | annual (optional)",
  "autoRenew": "boolean (optional)",
  "paymentMethodId": "string (optional)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "string (UUID)",
    "changeEffectiveDate": "ISO8601 timestamp",
    "proratedAmount": 45.50,
    "message": "Subscription updated successfully. Changes will take effect at the end of current billing period."
  }
}
```

#### Cancel Subscription
```http
DELETE /api/v1/subscriptions/:subscriptionId
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "cancelImmediately": false,
  "reason": "string (optional)",
  "feedback": "string (optional)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "string (UUID)",
    "status": "canceled",
    "canceledAt": "ISO8601 timestamp",
    "accessUntil": "ISO8601 timestamp",
    "message": "Subscription canceled. Access continues until 2025-12-31."
  }
}
```

#### Reactivate Subscription
```http
POST /api/v1/subscriptions/:subscriptionId/reactivate
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "string (UUID)",
    "status": "active",
    "reactivatedAt": "ISO8601 timestamp",
    "nextBillingDate": "ISO8601 timestamp"
  }
}
```

---

### Subscription Plans

#### List Available Plans
```http
GET /api/v1/subscription-plans
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `includeTrial` (boolean, default: true) - Include trial plan
- `currency` (string, default: "USD") - Pricing currency

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "planId": "string (UUID)",
      "name": "Starter",
      "tier": "tier_1",
      "description": "Perfect for small teams getting started",
      "pricing": {
        "monthly": 49.99,
        "quarterly": 134.97,
        "annual": 479.88,
        "currency": "USD"
      },
      "limits": {
        "maxEmployees": 50,
        "maxReportsPerMonth": 200,
        "quarterlyAutoUpdates": true,
        "aiChatMessages": 500,
        "departments": 5,
        "branches": 1
      },
      "features": [
        "8 comprehensive report types",
        "Quarterly auto-regeneration",
        "AI chat consultation",
        "Email support"
      ],
      "isMostPopular": false,
      "isActive": true
    },
    {
      "planId": "string (UUID)",
      "name": "Professional",
      "tier": "tier_2",
      "description": "Advanced analytics for growing organizations",
      "pricing": {
        "monthly": 149.99,
        "quarterly": 404.97,
        "annual": 1439.88,
        "currency": "USD"
      },
      "limits": {
        "maxEmployees": 200,
        "maxReportsPerMonth": 1000,
        "quarterlyAutoUpdates": true,
        "aiChatMessages": 2000,
        "departments": 20,
        "branches": 5
      },
      "features": [
        "All Starter features",
        "Multi-branch support",
        "Advanced analytics",
        "Priority support",
        "Custom report templates"
      ],
      "isMostPopular": true,
      "isActive": true
    },
    {
      "planId": "string (UUID)",
      "name": "Enterprise",
      "tier": "tier_3",
      "description": "Unlimited power for large enterprises",
      "pricing": {
        "monthly": 499.99,
        "quarterly": 1349.97,
        "annual": 4799.88,
        "currency": "USD"
      },
      "limits": {
        "maxEmployees": -1,
        "maxReportsPerMonth": -1,
        "quarterlyAutoUpdates": true,
        "aiChatMessages": -1,
        "departments": -1,
        "branches": -1
      },
      "features": [
        "All Professional features",
        "Unlimited everything",
        "Dedicated account manager",
        "24/7 priority support",
        "Custom integrations",
        "SLA guarantee"
      ],
      "isMostPopular": false,
      "isActive": true
    }
  ]
}
```

**Note:** `-1` indicates unlimited usage

#### Get Plan Details
```http
GET /api/v1/subscription-plans/:planId
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
Same structure as individual plan object from List Available Plans

---

### Payment Management

#### Add Payment Method
```http
POST /api/v1/payments/methods
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "organizationId": "string (UUID)",
  "type": "card | bank_account",
  "token": "string (Stripe token)",
  "setAsDefault": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "paymentMethodId": "string",
    "type": "card",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "expiryMonth": 12,
      "expiryYear": 2026
    },
    "isDefault": true,
    "createdAt": "ISO8601 timestamp"
  }
}
```

#### List Payment Methods
```http
GET /api/v1/payments/methods/organization/:organizationId
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "paymentMethodId": "string",
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242",
        "expiryMonth": 12,
        "expiryYear": 2026
      },
      "isDefault": true,
      "createdAt": "ISO8601 timestamp"
    }
  ]
}
```

#### Delete Payment Method
```http
DELETE /api/v1/payments/methods/:paymentMethodId
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment method deleted successfully"
}
```

**Error Response:**
- `400 Bad Request` - Cannot delete default payment method with active subscription

#### Process Payment
```http
POST /api/v1/payments/process
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "subscriptionId": "string (UUID)",
  "paymentMethodId": "string",
  "amount": 149.99,
  "currency": "USD",
  "invoiceId": "string (UUID) (optional)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "paymentId": "string (UUID)",
    "status": "succeeded | pending | failed",
    "amount": 149.99,
    "currency": "USD",
    "transactionId": "string (external gateway)",
    "receiptUrl": "string (URL)",
    "processedAt": "ISO8601 timestamp"
  }
}
```

#### Get Payment History
```http
GET /api/v1/payments/history/organization/:organizationId
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `startDate` (ISO8601) - Filter from date
- `endDate` (ISO8601) - Filter to date
- `status` (string) - Filter by payment status
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "paymentId": "string (UUID)",
        "subscriptionId": "string (UUID)",
        "invoiceId": "string (UUID)",
        "amount": 149.99,
        "currency": "USD",
        "status": "succeeded",
        "paymentMethod": {
          "type": "card",
          "last4": "4242"
        },
        "transactionId": "string",
        "receiptUrl": "string (URL)",
        "processedAt": "ISO8601 timestamp"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### Billing & Invoices

#### Get Invoice
```http
GET /api/v1/billing/invoices/:invoiceId
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "invoiceId": "string (UUID)",
    "invoiceNumber": "INV-2025-001234",
    "organizationId": "string (UUID)",
    "subscriptionId": "string (UUID)",
    "status": "draft | open | paid | void | uncollectible",
    "amount": {
      "subtotal": 149.99,
      "tax": 14.99,
      "discount": 0,
      "total": 164.98,
      "currency": "USD"
    },
    "lineItems": [
      {
        "description": "Professional Plan - Monthly",
        "quantity": 1,
        "unitPrice": 149.99,
        "amount": 149.99
      }
    ],
    "billingPeriod": {
      "start": "ISO8601 timestamp",
      "end": "ISO8601 timestamp"
    },
    "dueDate": "ISO8601 timestamp",
    "paidAt": "ISO8601 timestamp",
    "pdfUrl": "string (URL)",
    "createdAt": "ISO8601 timestamp"
  }
}
```

#### List Invoices
```http
GET /api/v1/billing/invoices/organization/:organizationId
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `status` (string) - Filter by status
- `startDate` (ISO8601) - Filter from date
- `endDate` (ISO8601) - Filter to date
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "invoiceId": "string (UUID)",
        "invoiceNumber": "INV-2025-001234",
        "status": "paid",
        "amount": 164.98,
        "currency": "USD",
        "dueDate": "ISO8601 timestamp",
        "paidAt": "ISO8601 timestamp",
        "pdfUrl": "string (URL)",
        "createdAt": "ISO8601 timestamp"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "totalPages": 1
    }
  }
}
```

#### Download Invoice PDF
```http
GET /api/v1/billing/invoices/:invoiceId/pdf
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="invoice-INV-2025-001234.pdf"

[PDF Binary Data]
```

#### Retry Failed Payment
```http
POST /api/v1/billing/invoices/:invoiceId/retry
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "paymentMethodId": "string (optional - uses default if not provided)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "invoiceId": "string (UUID)",
    "paymentId": "string (UUID)",
    "status": "succeeded | pending | failed",
    "processedAt": "ISO8601 timestamp"
  }
}
```

---

### Usage Tracking

#### Get Current Usage
```http
GET /api/v1/usage/organization/:organizationId
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `period` (string) - "current" | "previous" | "YYYY-MM" (default: "current")

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "organizationId": "string (UUID)",
    "subscriptionId": "string (UUID)",
    "period": {
      "start": "ISO8601 timestamp",
      "end": "ISO8601 timestamp"
    },
    "limits": {
      "maxEmployees": 200,
      "maxReportsPerMonth": 1000,
      "aiChatMessages": 2000
    },
    "usage": {
      "employees": {
        "current": 145,
        "limit": 200,
        "percentage": 72.5
      },
      "reports": {
        "current": 678,
        "limit": 1000,
        "percentage": 67.8
      },
      "aiChatMessages": {
        "current": 1234,
        "limit": 2000,
        "percentage": 61.7
      }
    },
    "warnings": [
      {
        "type": "approaching_limit",
        "resource": "reports",
        "message": "You've used 67.8% of your monthly report limit",
        "threshold": 80
      }
    ],
    "updatedAt": "ISO8601 timestamp"
  }
}
```

#### Get Usage History
```http
GET /api/v1/usage/organization/:organizationId/history
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `startDate` (ISO8601) - Filter from date
- `endDate` (ISO8601) - Filter to date
- `granularity` (string) - "daily" | "monthly" (default: "monthly")

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "periods": [
      {
        "period": "2025-11",
        "start": "2025-11-01T00:00:00Z",
        "end": "2025-11-30T23:59:59Z",
        "usage": {
          "employeesAvg": 142,
          "employeesPeak": 145,
          "reportsGenerated": 678,
          "aiChatMessages": 1234
        }
      },
      {
        "period": "2025-10",
        "start": "2025-10-01T00:00:00Z",
        "end": "2025-10-31T23:59:59Z",
        "usage": {
          "employeesAvg": 138,
          "employeesPeak": 142,
          "reportsGenerated": 892,
          "aiChatMessages": 1567
        }
      }
    ]
  }
}
```

#### Check Feature Access
```http
POST /api/v1/usage/check-access
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "organizationId": "string (UUID)",
  "feature": "quarterly_auto_updates | report_generation | ai_chat | multi_branch",
  "resourceType": "employee | report | chat_message (optional)",
  "requestedQuantity": 1
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "reason": "Feature included in current plan",
    "currentUsage": 145,
    "limit": 200,
    "remainingQuota": 55
  }
}
```

**Response (403 Forbidden) - No Access:**
```json
{
  "success": false,
  "error": {
    "code": "FEATURE_NOT_AVAILABLE",
    "message": "This feature is not available in your current plan",
    "details": {
      "currentPlan": "Starter",
      "requiredPlan": "Professional",
      "upgradeUrl": "/api/v1/subscriptions/upgrade"
    }
  }
}
```

**Response (429 Too Many Requests) - Limit Exceeded:**
```json
{
  "success": false,
  "error": {
    "code": "USAGE_LIMIT_EXCEEDED",
    "message": "You have reached your monthly limit for report generation",
    "details": {
      "currentUsage": 1000,
      "limit": 1000,
      "resetDate": "2025-12-01T00:00:00Z",
      "upgradeUrl": "/api/v1/subscriptions/upgrade"
    }
  }
}
```

---

### Quarterly Auto-Update Access

#### Check Auto-Update Eligibility
```http
GET /api/v1/subscriptions/:subscriptionId/auto-update-eligibility
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isEligible": true,
    "subscriptionStatus": "active",
    "planIncludesAutoUpdates": true,
    "paymentStatus": "current",
    "nextUpdateDate": "2025-12-15T00:00:00Z",
    "affectedEmployees": 145,
    "estimatedReportsToRegenerate": 1160
  }
}
```

**Response (200 OK) - Not Eligible:**
```json
{
  "success": true,
  "data": {
    "isEligible": false,
    "subscriptionStatus": "past_due",
    "planIncludesAutoUpdates": true,
    "paymentStatus": "overdue",
    "reasons": [
      "Subscription payment is overdue",
      "Please update payment method to restore auto-updates"
    ],
    "actionRequired": "update_payment_method"
  }
}
```

#### Trigger Manual Update (Admin Only)
```http
POST /api/v1/subscriptions/:subscriptionId/trigger-update
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "employeeIds": ["uuid1", "uuid2"],
  "reason": "Manual quarterly update trigger"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "jobId": "string (UUID)",
    "status": "queued",
    "totalEmployees": 145,
    "estimatedDuration": "45 minutes",
    "message": "Quarterly update job queued successfully"
  }
}
```

---

## Internal APIs

### Internal Module Communication

#### Subscription Service → Usage Tracking Service

##### Record Usage Event
```typescript
interface RecordUsageEventDto {
  organizationId: string;
  subscriptionId: string;
  eventType: 'employee_added' | 'report_generated' | 'ai_chat_message' | 'department_created';
  quantity: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Internal method call
usageTrackingService.recordEvent(recordUsageEventDto: RecordUsageEventDto): Promise<void>
```

##### Check Resource Quota
```typescript
interface CheckQuotaDto {
  organizationId: string;
  resourceType: 'employees' | 'reports' | 'ai_messages';
  requestedQuantity: number;
}

interface QuotaCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  remainingQuota: number;
  resetDate?: Date;
}

// Internal method call
usageTrackingService.checkQuota(checkQuotaDto: CheckQuotaDto): Promise<QuotaCheckResult>
```

---

#### Payment Service → Billing Service

##### Create Invoice
```typescript
interface CreateInvoiceDto {
  organizationId: string;
  subscriptionId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  dueDate: Date;
  taxRate?: number;
  discountAmount?: number;
}

interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  status: 'draft' | 'open' | 'paid' | 'void';
  amount: {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
  };
  createdAt: Date;
}

// Internal method call
billingService.createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<Invoice>
```

##### Update Invoice Status
```typescript
interface UpdateInvoiceStatusDto {
  invoiceId: string;
  status: 'paid' | 'void' | 'uncollectible';
  paymentId?: string;
  paidAt?: Date;
}

// Internal method call
billingService.updateInvoiceStatus(updateInvoiceStatusDto: UpdateInvoiceStatusDto): Promise<Invoice>
```

---

#### Subscription Service → Payment Service

##### Process Subscription Payment
```typescript
interface ProcessSubscriptionPaymentDto {
  subscriptionId: string;
  organizationId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  invoiceId: string;
  description: string;
}

interface PaymentResult {
  paymentId: string;
  status: 'succeeded' | 'pending' | 'failed';
  transactionId?: string;
  failureReason?: string;
  receiptUrl?: string;
  processedAt: Date;
}

// Internal method call
paymentService.processPayment(processPaymentDto: ProcessSubscriptionPaymentDto): Promise<PaymentResult>
```

##### Get Default Payment Method
```typescript
interface GetDefaultPaymentMethodDto {
  organizationId: string;
}

interface PaymentMethod {
  paymentMethodId: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  isDefault: boolean;
}

// Internal method call
paymentService.getDefaultPaymentMethod(organizationId: string): Promise<PaymentMethod | null>
```

---

#### Subscription Service → Report Service

##### Check Auto-Update Access
```typescript
interface AutoUpdateAccessDto {
  organizationId: string;
}

interface AutoUpdateAccessResult {
  hasAccess: boolean;
  reason?: string;
  subscriptionStatus: string;
  nextUpdateDate?: Date;
}

// Internal method call
subscriptionService.checkAutoUpdateAccess(dto: AutoUpdateAccessDto): Promise<AutoUpdateAccessResult>
```

##### Get Organizations for Quarterly Update
```typescript
interface QuarterlyUpdateEligibility {
  organizationIds: string[];
  totalOrganizations: number;
  totalEmployees: number;
}

// Internal method call
subscriptionService.getOrganizationsForQuarterlyUpdate(): Promise<QuarterlyUpdateEligibility>
```

---

#### Billing Service → Email Service

##### Send Invoice Email
```typescript
interface SendInvoiceEmailDto {
  invoiceId: string;
  recipientEmail: string;
  recipientName: string;
  organizationName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date;
  pdfUrl: string;
}

// Internal method call
emailService.sendInvoice(sendInvoiceEmailDto: SendInvoiceEmailDto): Promise<void>
```

##### Send Payment Receipt
```typescript
interface SendPaymentReceiptDto {
  paymentId: string;
  recipientEmail: string;
  recipientName: string;
  organizationName: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  receiptUrl: string;
}

// Internal method call
emailService.sendPaymentReceipt(sendPaymentReceiptDto: SendPaymentReceiptDto): Promise<void>
```

---

### WebSocket Events

#### Subscription Status Changed
```typescript
// Event emitted when subscription status changes
{
  event: 'subscription.status.changed',
  data: {
    organizationId: 'string (UUID)',
    subscriptionId: 'string (UUID)',
    previousStatus: 'active | past_due | canceled',
    newStatus: 'active | past_due | canceled | expired',
    changedAt: 'ISO8601 timestamp',
    reason: 'payment_failed | canceled_by_user | subscription_expired',
    affectedFeatures: ['quarterly_auto_updates', 'ai_chat']
  }
}
```

#### Usage Limit Warning
```typescript
// Event emitted when approaching usage limits
{
  event: 'usage.limit.warning',
  data: {
    organizationId: 'string (UUID)',
    resourceType: 'employees | reports | ai_messages',
    currentUsage: 180,
    limit: 200,
    percentage: 90,
    threshold: 80,
    message: 'You have used 90% of your employee limit',
    timestamp: 'ISO8601 timestamp'
  }
}
```

#### Payment Failed
```typescript
// Event emitted when payment fails
{
  event: 'payment.failed',
  data: {
    organizationId: 'string (UUID)',
    subscriptionId: 'string (UUID)',
    invoiceId: 'string (UUID)',
    paymentId: 'string (UUID)',
    amount: 149.99,
    currency: 'USD',
    failureReason: 'insufficient_funds | card_declined | expired_card',
    retryDate: 'ISO8601 timestamp',
    timestamp: 'ISO8601 timestamp'
  }
}
```

#### Invoice Generated
```typescript
// Event emitted when new invoice is created
{
  event: 'invoice.generated',
  data: {
    organizationId: 'string (UUID)',
    invoiceId: 'string (UUID)',
    invoiceNumber: 'INV-2025-001234',
    amount: 164.98,
    currency: 'USD',
    dueDate: 'ISO8601 timestamp',
    pdfUrl: 'string (URL)',
    timestamp: 'ISO8601 timestamp'
  }
}
```

---

## External Payment Gateway Integration

### Stripe API Integration

#### Create Payment Intent
```typescript
// Internal wrapper for Stripe API
interface CreatePaymentIntentDto {
  amount: number;
  currency: string;
  paymentMethodId: string;
  customerId: string;
  metadata: {
    organizationId: string;
    subscriptionId: string;
    invoiceId: string;
  };
}

// Stripe response wrapper
interface StripePaymentIntent {
  id: string;
  status: 'succeeded' | 'pending' | 'failed';
  clientSecret: string;
  receiptUrl?: string;
}

// Internal service method
stripeService.createPaymentIntent(dto: CreatePaymentIntentDto): Promise<StripePaymentIntent>
```

#### Create Customer
```typescript
interface CreateStripeCustomerDto {
  organizationId: string;
  email: string;
  name: string;
  metadata: Record<string, string>;
}

interface StripeCustomer {
  id: string;
  email: string;
  created: number;
}

// Internal service method
stripeService.createCustomer(dto: CreateStripeCustomerDto): Promise<StripeCustomer>
```

#### Attach Payment Method
```typescript
interface AttachPaymentMethodDto {
  paymentMethodId: string;
  customerId: string;
}

// Internal service method
stripeService.attachPaymentMethod(dto: AttachPaymentMethodDto): Promise<void>
```

#### Handle Webhook Events
```typescript
interface StripeWebhookEvent {
  type: 'payment_intent.succeeded' | 'payment_intent.failed' | 'customer.subscription.updated';
  data: {
    object: any;
  };
}

// Webhook endpoint (internal processing)
POST /webhooks/stripe
Content-Type: application/json
Stripe-Signature: {signature}

// Processes events and triggers internal service methods
```

---

## API Authentication & Authorization

### JWT Token Requirements
All external API endpoints require Bearer token authentication with valid JWT containing:
- `userId` - User's unique identifier
- `organizationId` - User's organization identifier
- `role` - User role (Owner, Leader, Manager)
- `exp` - Token expiration timestamp

### Role-Based Access Control

| Endpoint Pattern | Owner | Leader | Manager |
|-----------------|-------|--------|---------|
| `POST /subscriptions` | ✅ | ❌ | ❌ |
| `PATCH /subscriptions/:id` | ✅ | ❌ | ❌ |
| `DELETE /subscriptions/:id` | ✅ | ❌ | ❌ |
| `GET /subscriptions/*` | ✅ | ✅ (view only) | ✅ (view only) |
| `POST /payments/methods` | ✅ | ❌ | ❌ |
| `GET /billing/invoices/*` | ✅ | ✅ (view only) | ❌ |
| `GET /usage/*` | ✅ | ✅ | ✅ |

### Rate Limiting
- **Standard endpoints**: 100 requests per minute per organization
- **Usage check endpoint**: 300 requests per minute per organization
- **Webhook endpoints**: 1000 requests per minute (IP-based)

---

## Error Response Format

All API errors follow consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context",
      "validationErrors": []
    },
    "timestamp": "ISO8601 timestamp",
    "path": "/api/v1/subscriptions",
    "requestId": "string (UUID)"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `USAGE_LIMIT_EXCEEDED` - Resource quota exceeded
- `SUBSCRIPTION_INACTIVE` - Subscription not active
- `PAYMENT_FAILED` - Payment processing failed
- `FEATURE_NOT_AVAILABLE` - Feature not in current plan

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-10  
**Status:** Production Ready