# Error Handling - Subscription & Billing Management

## Error Scenarios Matrix

| Scenario | Error Code | HTTP Status | User Message | Resolution |
|----------|------------|-------------|--------------|------------|
| Invalid payment method | PAY_001 | 400 | The provided payment method is invalid or expired | Update payment method with valid card details |
| Payment processing failed | PAY_002 | 402 | Payment could not be processed. Please check your payment method | Verify card details and retry payment |
| Insufficient funds | PAY_003 | 402 | Payment declined due to insufficient funds | Use alternative payment method or add funds |
| Payment gateway timeout | PAY_004 | 504 | Payment processing timed out. Please try again | Retry payment after a few minutes |
| Duplicate payment attempt | PAY_005 | 409 | Payment is already being processed for this subscription | Wait for current payment to complete |
| Subscription not found | SUB_001 | 404 | Subscription not found for this organization | Verify subscription ID or create new subscription |
| Subscription already active | SUB_002 | 409 | An active subscription already exists | Manage existing subscription or upgrade plan |
| Subscription expired | SUB_003 | 403 | Your subscription has expired. Please renew to continue | Renew subscription through payment portal |
| Subscription cancelled | SUB_004 | 403 | This subscription has been cancelled | Reactivate subscription or create new one |
| Invalid plan selection | SUB_005 | 400 | Selected plan is not available or invalid | Choose from available subscription plans |
| Plan downgrade not allowed | SUB_006 | 409 | Cannot downgrade plan with current usage | Reduce usage or contact support for options |
| Employee limit exceeded | LIMIT_001 | 403 | Employee limit exceeded for current plan | Upgrade plan or remove inactive employees |
| Report generation limit reached | LIMIT_002 | 403 | Monthly report generation limit reached | Upgrade plan or wait for limit reset |
| Usage quota exceeded | LIMIT_003 | 403 | Usage quota exceeded for feature tier | Upgrade to higher tier or wait for reset |
| Auto-update not available | LIMIT_004 | 403 | Quarterly auto-updates require active subscription | Activate subscription to enable auto-updates |
| Invoice not found | INV_001 | 404 | Invoice not found for this organization | Verify invoice ID or date range |
| Invoice already paid | INV_002 | 409 | This invoice has already been paid | Download receipt from billing history |
| Invoice generation failed | INV_003 | 500 | Unable to generate invoice. Please try again | Contact support if issue persists |
| Billing address missing | BILL_001 | 400 | Billing address is required for invoicing | Add billing address in organization settings |
| Tax calculation failed | BILL_002 | 500 | Unable to calculate taxes for location | Verify billing address and retry |
| Proration calculation error | BILL_003 | 500 | Error calculating prorated charges | Contact support for manual calculation |
| Refund not allowed | REFUND_001 | 403 | Refund period has expired for this payment | Refunds available within 14 days of payment |
| Refund processing failed | REFUND_002 | 500 | Unable to process refund. Please contact support | Support team will manually process refund |
| Trial already used | TRIAL_001 | 409 | Trial period already used for this organization | Subscribe to paid plan to continue |
| Trial expired | TRIAL_002 | 403 | Trial period has expired | Subscribe to continue using the platform |
| Feature not available in plan | FEAT_001 | 403 | This feature is not available in your current plan | Upgrade to access this feature |
| Organization not verified | ORG_001 | 403 | Organization verification required for subscription | Complete verification process |
| Concurrent subscription update | CONC_001 | 409 | Subscription is being updated by another process | Wait a moment and retry |
| Usage tracking unavailable | TRACK_001 | 503 | Usage tracking service temporarily unavailable | Service will resume shortly |
| Webhook processing failed | WEBHOOK_001 | 500 | Payment webhook processing failed | Payment status will sync automatically |
| Invalid coupon code | COUPON_001 | 400 | Coupon code is invalid or expired | Verify code or contact support |
| Stripe API error | STRIPE_001 | 502 | Payment gateway error occurred | Retry or contact support if issue persists |
| Subscription data sync error | SYNC_001 | 500 | Failed to sync subscription data | System will retry automatically |

## Common Error Codes

### Payment Errors (PAY_xxx)

**PAY_001 - Invalid Payment Method**
```json
{
  "error": {
    "code": "PAY_001",
    "message": "The provided payment method is invalid or expired",
    "details": {
      "paymentMethodId": "pm_1234567890",
      "reason": "card_expired",
      "validUntil": "2024-10-31"
    },
    "actions": [
      {
        "type": "update_payment_method",
        "url": "/api/v1/organizations/{orgId}/payment-methods"
      }
    ]
  }
}
```

**PAY_002 - Payment Processing Failed**
```json
{
  "error": {
    "code": "PAY_002",
    "message": "Payment could not be processed. Please check your payment method",
    "details": {
      "attemptId": "attempt_1234567890",
      "gatewayResponse": "insufficient_funds",
      "retryable": true
    },
    "actions": [
      {
        "type": "retry_payment",
        "url": "/api/v1/payments/{paymentId}/retry"
      },
      {
        "type": "update_payment_method",
        "url": "/api/v1/organizations/{orgId}/payment-methods"
      }
    ]
  }
}
```

**PAY_004 - Payment Gateway Timeout**
```json
{
  "error": {
    "code": "PAY_004",
    "message": "Payment processing timed out. Please try again",
    "details": {
      "attemptId": "attempt_1234567890",
      "timeoutAfter": "30s",
      "retryAfter": 60
    },
    "actions": [
      {
        "type": "retry_payment",
        "url": "/api/v1/payments/{paymentId}/retry",
        "retryAfter": 60
      }
    ]
  }
}
```

### Subscription Errors (SUB_xxx)

**SUB_003 - Subscription Expired**
```json
{
  "error": {
    "code": "SUB_003",
    "message": "Your subscription has expired. Please renew to continue",
    "details": {
      "subscriptionId": "sub_1234567890",
      "expiredAt": "2025-10-15T00:00:00Z",
      "gracePeriodEnds": "2025-10-22T00:00:00Z",
      "affectedFeatures": [
        "quarterly_auto_updates",
        "ai_chat_access",
        "report_generation"
      ]
    },
    "actions": [
      {
        "type": "renew_subscription",
        "url": "/api/v1/subscriptions/{subscriptionId}/renew"
      }
    ]
  }
}
```

**SUB_006 - Plan Downgrade Not Allowed**
```json
{
  "error": {
    "code": "SUB_006",
    "message": "Cannot downgrade plan with current usage",
    "details": {
      "currentPlan": "enterprise",
      "requestedPlan": "professional",
      "conflicts": [
        {
          "limit": "employee_count",
          "currentUsage": 150,
          "newLimit": 100,
          "excess": 50
        },
        {
          "limit": "monthly_reports",
          "currentUsage": 500,
          "newLimit": 300,
          "excess": 200
        }
      ]
    },
    "actions": [
      {
        "type": "reduce_usage",
        "suggestions": [
          "Remove 50 inactive employees",
          "Archive old reports to reduce monthly generation"
        ]
      },
      {
        "type": "contact_support",
        "url": "/support/plan-change"
      }
    ]
  }
}
```

### Limit Errors (LIMIT_xxx)

**LIMIT_001 - Employee Limit Exceeded**
```json
{
  "error": {
    "code": "LIMIT_001",
    "message": "Employee limit exceeded for current plan",
    "details": {
      "currentPlan": "professional",
      "employeeLimit": 100,
      "currentCount": 100,
      "attemptedAction": "add_employee"
    },
    "actions": [
      {
        "type": "upgrade_plan",
        "url": "/api/v1/subscriptions/{subscriptionId}/upgrade",
        "suggestedPlan": "enterprise"
      },
      {
        "type": "remove_employees",
        "url": "/api/v1/employees?status=inactive"
      }
    ]
  }
}
```

**LIMIT_002 - Report Generation Limit Reached**
```json
{
  "error": {
    "code": "LIMIT_002",
    "message": "Monthly report generation limit reached",
    "details": {
      "currentPlan": "starter",
      "monthlyLimit": 50,
      "currentUsage": 50,
      "resetsAt": "2025-12-01T00:00:00Z"
    },
    "actions": [
      {
        "type": "upgrade_plan",
        "url": "/api/v1/subscriptions/{subscriptionId}/upgrade"
      },
      {
        "type": "wait_for_reset",
        "resetDate": "2025-12-01T00:00:00Z"
      }
    ]
  }
}
```

**LIMIT_004 - Auto-Update Not Available**
```json
{
  "error": {
    "code": "LIMIT_004",
    "message": "Quarterly auto-updates require active subscription",
    "details": {
      "subscriptionStatus": "expired",
      "expiredAt": "2025-10-15T00:00:00Z",
      "nextScheduledUpdate": "2025-12-01T00:00:00Z",
      "affectedEmployees": 75
    },
    "actions": [
      {
        "type": "renew_subscription",
        "url": "/api/v1/subscriptions/{subscriptionId}/renew"
      },
      {
        "type": "manual_update",
        "url": "/api/v1/reports/regenerate",
        "note": "Manual updates available with valid payment"
      }
    ]
  }
}
```

### Invoice Errors (INV_xxx)

**INV_003 - Invoice Generation Failed**
```json
{
  "error": {
    "code": "INV_003",
    "message": "Unable to generate invoice. Please try again",
    "details": {
      "invoiceId": "inv_1234567890",
      "reason": "template_rendering_failed",
      "retryable": true
    },
    "actions": [
      {
        "type": "retry_generation",
        "url": "/api/v1/invoices/{invoiceId}/regenerate"
      },
      {
        "type": "contact_support",
        "url": "/support/billing"
      }
    ]
  }
}
```

### Billing Errors (BILL_xxx)

**BILL_001 - Billing Address Missing**
```json
{
  "error": {
    "code": "BILL_001",
    "message": "Billing address is required for invoicing",
    "details": {
      "organizationId": "org_1234567890",
      "requiredFields": [
        "addressLine1",
        "city",
        "postalCode",
        "country"
      ]
    },
    "actions": [
      {
        "type": "add_billing_address",
        "url": "/api/v1/organizations/{orgId}/billing-address"
      }
    ]
  }
}
```

### Feature Access Errors (FEAT_xxx)

**FEAT_001 - Feature Not Available in Plan**
```json
{
  "error": {
    "code": "FEAT_001",
    "message": "This feature is not available in your current plan",
    "details": {
      "feature": "advanced_analytics",
      "currentPlan": "starter",
      "requiredPlan": "professional",
      "availableIn": ["professional", "enterprise"]
    },
    "actions": [
      {
        "type": "upgrade_plan",
        "url": "/api/v1/subscriptions/{subscriptionId}/upgrade",
        "suggestedPlan": "professional"
      },
      {
        "type": "view_plans",
        "url": "/pricing"
      }
    ]
  }
}
```

### Integration Errors (STRIPE_xxx, WEBHOOK_xxx)

**STRIPE_001 - Stripe API Error**
```json
{
  "error": {
    "code": "STRIPE_001",
    "message": "Payment gateway error occurred",
    "details": {
      "stripeError": "rate_limit",
      "retryable": true,
      "retryAfter": 30
    },
    "actions": [
      {
        "type": "retry_request",
        "retryAfter": 30
      },
      {
        "type": "contact_support",
        "url": "/support/payments"
      }
    ]
  }
}
```

## Error Propagation

### Layer Architecture

```
Controller Layer (HTTP)
    ↓ [Throws HttpException]
Service Layer (Business Logic)
    ↓ [Throws BusinessException]
Repository Layer (Data Access)
    ↓ [Throws DataException]
External APIs (Stripe, etc.)
    ↓ [Throws IntegrationException]
```

### Error Propagation Flow

#### 1. External API Errors → Integration Exceptions

**Stripe Payment Failure:**
```typescript
// External API Response
Stripe API Error → StripeException
    ↓
PaymentService.processPayment()
    ↓ [Catch & Transform]
throw new PaymentProcessingException(PAY_002)
    ↓
SubscriptionController.createSubscription()
    ↓ [Global Exception Filter]
HTTP 402 Payment Required
```

#### 2. Business Logic Errors → Business Exceptions

**Employee Limit Check:**
```typescript
// Business Logic Validation
EmployeeService.addEmployee()
    ↓ [Check current count vs limit]
if (currentCount >= limit)
    ↓
throw new EmployeeLimitExceededException(LIMIT_001)
    ↓
EmployeeController.createEmployee()
    ↓ [Global Exception Filter]
HTTP 403 Forbidden
```

#### 3. Data Access Errors → Data Exceptions

**Subscription Not Found:**
```typescript
// Database Query
SubscriptionRepository.findById(id)
    ↓ [Query returns null]
throw new SubscriptionNotFoundException(SUB_001)
    ↓
SubscriptionService.getSubscription()
    ↓ [Propagate unchanged]
SubscriptionController.getSubscription()
    ↓ [Global Exception Filter]
HTTP 404 Not Found
```

### Error Transformation Rules

#### Payment Errors
- **Stripe API errors** → Transformed to PAY_xxx codes
- **Network timeouts** → PAY_004 with retry logic
- **Invalid payment methods** → PAY_001 with update actions
- **Gateway failures** → STRIPE_001 with retry instructions

#### Subscription State Errors
- **Not found in DB** → SUB_001 (404)
- **Already exists** → SUB_002 (409 Conflict)
- **Expired state** → SUB_003 (403 Forbidden)
- **Invalid transitions** → SUB_005 (400 Bad Request)

#### Limit Enforcement Errors
- **Usage quota exceeded** → LIMIT_xxx (403 Forbidden)
- **Plan feature restrictions** → FEAT_001 (403 Forbidden)
- **Rate limiting** → HTTP 429 with Retry-After header

### Global Exception Filter

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    // Map internal exceptions to standardized error responses
    const errorResponse = this.mapExceptionToResponse(exception);
    
    // Log error for monitoring
    this.logError(exception, errorResponse);
    
    // Send standardized response
    response.status(errorResponse.status).json({
      error: {
        code: errorResponse.code,
        message: errorResponse.message,
        details: errorResponse.details,
        actions: errorResponse.actions,
        timestamp: new Date().toISOString(),
        requestId: ctx.getRequest().id
      }
    });
  }
}
```

### Error Handling Best Practices

1. **Always include recovery actions**: Every error response includes actionable next steps
2. **Provide context**: Include relevant IDs, limits, and current state
3. **Enable retry logic**: Mark retryable errors with retry timing
4. **Log for observability**: All errors logged with request correlation IDs
5. **Graceful degradation**: Non-critical errors allow partial functionality
6. **User-friendly messages**: Technical details in `details`, user messages at top level

### Retry Strategy

#### Automatic Retries (System Level)
- **Payment timeouts**: 3 retries with exponential backoff (5s, 10s, 20s)
- **Webhook processing**: 5 retries over 24 hours
- **Usage sync failures**: Retry every 5 minutes for 1 hour

#### User-Initiated Retries (Client Level)
- **Payment failures**: Immediate retry available
- **Invoice generation**: Retry after 30 seconds
- **Subscription updates**: Retry after resolving conflicts

### Monitoring & Alerting

**Critical Errors (Immediate Alert):**
- Payment gateway downtime (STRIPE_001 spike)
- Invoice generation failure rate >5%
- Subscription sync failures >10/hour

**Warning Errors (Delayed Alert):**
- Limit exceeded errors trending up
- Trial expiration without conversion
- Refund request volume increase

**Informational Errors (Log Only):**
- Invalid coupon code attempts
- Duplicate payment attempts
- Feature access denials (FEAT_001)

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Complete