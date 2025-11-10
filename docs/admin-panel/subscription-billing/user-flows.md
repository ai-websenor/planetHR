# User Flows - Subscription & Billing Management

## Overview

This document describes all user journey scenarios for the Subscription & Billing Management module.

## Flow 1: Subscription Plan Management

### User Journey

An Owner (Super Admin) manages subscription plans for their organization, selecting appropriate tiers based on organizational needs, upgrading/downgrading as requirements change, and viewing available features per plan.

### Step-by-Step Flow

1. **Owner logs into admin panel**
   - JWT authentication via JwtAuthGuard
   - Role validation confirms Owner role
   - Redirected to dashboard

2. **Navigate to Subscription Management**
   - Owner clicks "Subscription & Billing" menu
   - Current subscription status displayed
   - Available plans shown with feature comparison

3. **View Current Subscription**
   - Display current plan name (Starter/Professional/Enterprise)
   - Show active features and limitations
   - Display employee count limit and current usage
   - Show report generation limits
   - Display next billing date and amount

4. **Browse Available Plans**
   - Plan comparison table rendered
   - Feature differences highlighted
   - Pricing displayed per tier
   - Employee count limits shown
   - Report generation limits displayed
   - Quarterly update access indicated

5. **Select New Plan**
   - Owner clicks "Upgrade" or "Change Plan"
   - Plan selection modal opens
   - Confirmation required for plan change
   - Proration calculation displayed (if applicable)

6. **Confirm Plan Change**
   - Review new plan features
   - Accept terms and conditions
   - Submit plan change request
   - Payment processing initiated (if upgrade)

7. **Plan Activation**
   - Subscription status updated in database
   - Feature flags updated immediately
   - New limits applied to organization
   - Confirmation email sent
   - Success notification displayed

### Internal Module Flow

1. **subscription-service** receives plan change request
2. **subscription-service** validates Owner role and organization ownership
3. **subscription-service** calculates proration (if mid-cycle change)
4. **subscription-service** calls **payment-service** for payment processing
5. **payment-service** processes payment via Stripe API
6. **subscription-service** updates subscription record in PostgreSQL
7. **usage-tracking-service** resets limits and counters
8. **subscription-service** emits `subscription.status.changed` WebSocket event
9. **billing-service** generates invoice/credit note
10. **email-service** sends confirmation email via Nodemailer
11. **subscription-service** returns updated subscription details

---

## Flow 2: Feature Tier Configuration

### User Journey

System administrators configure feature availability across subscription tiers, defining which capabilities (AI chat, quarterly updates, bulk imports, export options) are available at each plan level.

### Step-by-Step Flow

1. **System Admin Access**
   - Admin logs into administrative configuration panel
   - Navigate to "Feature Tier Configuration"
   - Current tier configuration matrix displayed

2. **View Feature Matrix**
   - Table shows all features vs. all subscription tiers
   - Current enabled/disabled status per feature
   - Usage limits per tier displayed
   - Feature dependencies highlighted

3. **Select Feature to Configure**
   - Admin selects feature from list
   - Feature details modal opens
   - Current tier availability shown
   - Dependencies and restrictions displayed

4. **Configure Tier Availability**
   - Toggle feature availability per tier
   - Set numeric limits (employee count, report generation)
   - Define quota refresh periods
   - Set rate limiting parameters

5. **Set Feature Limits**
   - Employee count limits per tier
   - Monthly report generation limits
   - AI chat interaction quotas
   - Bulk operation limits
   - Export frequency restrictions

6. **Configure Quarterly Update Access**
   - Enable/disable auto-regeneration per tier
   - Set retention period for historical reports
   - Configure notification preferences

7. **Save Configuration**
   - Validate configuration consistency
   - Check for breaking changes
   - Submit configuration update
   - Configuration versioned and stored

8. **Apply Changes**
   - Feature flags updated in database
   - Active subscriptions validated against new rules
   - Affected organizations notified if downgraded
   - Cache invalidated for immediate effect

### Internal Module Flow

1. **subscription-service** receives feature configuration update
2. **subscription-service** validates admin permissions
3. **subscription-service** performs consistency checks
4. **subscription-service** stores configuration in PostgreSQL (feature_tiers table)
5. **subscription-service** validates all active subscriptions against new configuration
6. **subscription-service** identifies organizations affected by changes
7. **subscription-service** emits `feature.tier.updated` event
8. **usage-tracking-service** updates quota definitions
9. **notification-service** sends alerts to affected organizations
10. **subscription-service** invalidates feature flag cache
11. **audit-service** logs configuration change

---

## Flow 3: Employee Count And Report Limits

### User Journey

Owners and managers monitor employee count and report generation usage against subscription limits, receive warnings when approaching limits, and upgrade when needed.

### Step-by-Step Flow

1. **Access Usage Dashboard**
   - Owner/Leader/Manager logs in
   - Navigate to "Usage & Limits" section
   - Current usage statistics displayed

2. **View Employee Count Usage**
   - Total employees added displayed
   - Subscription limit shown
   - Usage percentage visualized (progress bar)
   - Remaining capacity indicated
   - Historical growth chart shown

3. **View Report Generation Usage**
   - Monthly report count displayed
   - Subscription limit shown
   - Usage percentage visualized
   - Reports breakdown by type shown
   - Reset date indicated (monthly)

4. **Monitor Quarterly Update Status**
   - Quarterly update eligibility displayed
   - Next scheduled update date shown
   - Subscription requirement indicated
   - Historical update log available

5. **Approach Limit Warning**
   - System detects usage approaching limit (80% threshold)
   - Warning notification displayed on dashboard
   - Email notification sent to Owner
   - Upgrade suggestion presented

6. **Reach Limit Restriction**
   - System prevents adding new employees at 100% limit
   - Error message displayed: "Employee limit reached"
   - Report generation blocked at limit
   - Upgrade prompt displayed prominently

7. **Request Limit Increase**
   - Owner clicks "Upgrade Plan"
   - Redirected to subscription management
   - Higher tier plans displayed
   - Feature comparison shown

8. **Temporary Overage Handling**
   - Small overage allowed (5% buffer) with warning
   - Grace period provided (7 days)
   - Overage charges calculated (if applicable)
   - Forced upgrade if not resolved

### Internal Module Flow

1. **usage-tracking-service** monitors employee additions in real-time
2. **usage-tracking-service** increments employee_count in MongoDB
3. **usage-tracking-service** checks against subscription limit from **subscription-service**
4. **usage-tracking-service** calculates usage percentage
5. **usage-tracking-service** triggers warning at 80% threshold
6. **notification-service** sends warning email via **email-service**
7. **usage-tracking-service** blocks operation at 100% limit
8. **usage-tracking-service** logs limit violation attempt
9. **subscription-service** generates upgrade recommendation
10. **usage-tracking-service** tracks report generation similarly
11. **usage-tracking-service** resets monthly counters via **cron-service**

---

## Flow 4: Payment Gateway Integration

### User Journey

Owners provide payment information, process subscription payments, update payment methods, and handle payment failures through integrated Stripe payment gateway.

### Step-by-Step Flow

1. **Initial Payment Setup**
   - Owner completes registration
   - Selects subscription plan
   - Redirected to payment information page
   - Stripe Elements embedded form displayed

2. **Enter Payment Information**
   - Owner enters credit card details
   - Card number, expiry, CVV collected
   - Billing address captured
   - Company tax information requested

3. **Validate Payment Method**
   - Stripe client-side validation
   - Card type detected and displayed
   - Real-time error feedback
   - 3D Secure verification initiated (if required)

4. **Process Payment**
   - Owner clicks "Subscribe & Pay"
   - Payment intent created via Stripe API
   - Payment processed securely
   - Loading indicator displayed

5. **Payment Success**
   - Confirmation page displayed
   - Receipt email sent immediately
   - Subscription activated
   - Payment method saved for future use
   - Redirect to dashboard

6. **Payment Failure Handling**
   - Error message displayed (card declined, insufficient funds)
   - Retry option provided
   - Alternative payment method suggested
   - Support contact information shown

7. **Update Payment Method**
   - Owner navigates to "Payment Methods"
   - Current card details displayed (masked)
   - Click "Update Payment Method"
   - New Stripe Elements form displayed
   - Submit new card information
   - Verify via small charge (optional)
   - Update confirmed

8. **Recurring Payment Processing**
   - Automated monthly/annual charge
   - Payment processed via saved method
   - Success confirmation email sent
   - Invoice generated and emailed

9. **Failed Recurring Payment**
   - Payment retry attempted (3 attempts over 7 days)
   - Failure notification email sent
   - Account marked "Payment Failed"
   - Grace period provided (7 days)
   - Features limited after grace period
   - Account suspended if not resolved

### Internal Module Flow

1. **payment-service** receives payment initiation request
2. **payment-service** creates Stripe payment intent
3. **payment-service** returns client secret to frontend
4. Frontend Stripe.js confirms payment
5. Stripe webhook notifies backend of payment status
6. **payment-service** webhook handler validates signature
7. **payment-service** updates payment record in PostgreSQL
8. **payment-service** emits `payment.completed` or `payment.failed` event
9. **subscription-service** listens to payment events
10. **subscription-service** activates/suspends subscription accordingly
11. **billing-service** generates invoice
12. **email-service** sends confirmation/failure email
13. **audit-service** logs payment transaction

---

## Flow 5: Billing And Invoice Generation

### User Journey

Owners view billing history, download invoices, access payment receipts, and manage billing information for accounting and compliance purposes.

### Step-by-Step Flow

1. **Access Billing Section**
   - Owner logs into admin panel
   - Navigate to "Billing & Invoices"
   - Billing dashboard displayed

2. **View Billing Overview**
   - Current billing cycle displayed
   - Next payment date shown
   - Payment amount indicated
   - Payment method summary (last 4 digits)
   - Billing contact information displayed

3. **View Invoice History**
   - Table of all invoices displayed
   - Columns: Invoice number, date, amount, status, actions
   - Filterable by date range
   - Searchable by invoice number
   - Sortable by any column

4. **Invoice Details**
   - Click invoice to view details
   - Invoice modal/page opens
   - Line items displayed (subscription fee, overages, credits)
   - Tax breakdown shown
   - Payment status indicated
   - Payment method used displayed

5. **Download Invoice**
   - Click "Download PDF" button
   - Invoice generated as PDF
   - Company logo and branding included
   - Invoice number and date prominent
   - Itemized charges listed
   - Tax information included
   - Payment instructions shown
   - PDF downloaded to device

6. **Email Invoice**
   - Click "Email Invoice" button
   - Email address confirmation modal
   - Default to billing email
   - Allow custom recipient
   - Invoice sent via email
   - Confirmation message displayed

7. **Update Billing Information**
   - Click "Edit Billing Info"
   - Form displayed with current information
   - Update company name, address, tax ID
   - Update billing contact email
   - Save changes
   - Information validated and updated

8. **View Payment Receipts**
   - Separate "Receipts" tab
   - All successful payments listed
   - Receipt number, date, amount shown
   - Download individual receipts
   - Tax compliant format

9. **Automated Invoice Generation**
   - Invoice automatically generated on successful payment
   - Unique invoice number assigned
   - Sent to billing email within 1 hour
   - Stored in system for future access
   - Archived after retention period

### Internal Module Flow

1. **billing-service** listens to `payment.completed` event
2. **billing-service** retrieves subscription details from **subscription-service**
3. **billing-service** retrieves organization info from **organization-service**
4. **billing-service** calculates line items (base fee, overages, taxes)
5. **billing-service** generates unique invoice number
6. **billing-service** creates invoice record in PostgreSQL
7. **billing-service** generates PDF using template engine
8. **billing-service** stores PDF in file storage (AWS S3 or local)
9. **billing-service** calls **email-service** to send invoice
10. **email-service** attaches PDF and sends via Nodemailer
11. **billing-service** updates invoice status to "sent"
12. **billing-service** logs invoice generation event

---

## Flow 6: Subscription Renewal Management

### User Journey

Owners manage subscription renewals, receive renewal notifications, update renewal preferences, handle automatic vs. manual renewals, and process cancellations.

### Step-by-Step Flow

1. **View Renewal Status**
   - Owner navigates to subscription details
   - Current subscription end date displayed
   - Renewal status shown (auto-renew enabled/disabled)
   - Next renewal date indicated
   - Renewal amount shown

2. **Renewal Notification (30 days)**
   - Email notification sent 30 days before renewal
   - Subject: "Your PlanetsHR subscription renews soon"
   - Renewal date and amount included
   - Option to change plan or cancel
   - Link to billing portal

3. **Renewal Notification (7 days)**
   - Second email reminder sent 7 days before
   - More urgent tone
   - Confirm payment method is valid
   - Update payment method link
   - Manage subscription link

4. **Enable Auto-Renewal**
   - Owner clicks "Enable Auto-Renewal"
   - Confirmation modal displayed
   - Payment method verification required
   - Terms and conditions acceptance
   - Auto-renewal activated
   - Confirmation email sent

5. **Disable Auto-Renewal**
   - Owner clicks "Disable Auto-Renewal"
   - Warning modal: "Your subscription will not renew"
   - Confirmation required
   - Access until end of current period indicated
   - Auto-renewal disabled
   - Confirmation email sent

6. **Automatic Renewal Processing**
   - System processes renewal 1 day before expiration
   - Payment charged via saved method
   - Payment success: subscription extended
   - Invoice generated and emailed
   - Access continues uninterrupted
   - Confirmation notification sent

7. **Renewal Payment Failure**
   - Payment fails during auto-renewal
   - Retry scheduled (3 attempts over 3 days)
   - Failure notification email sent immediately
   - Update payment method prompt
   - Grace period provided (7 days)
   - Features limited if not resolved

8. **Manual Renewal**
   - Auto-renewal disabled by Owner
   - Subscription expires at end of period
   - Expiration warning shown in dashboard
   - "Renew Subscription" button displayed
   - Owner clicks to renew manually
   - Payment process initiated
   - Subscription reactivated upon payment

9. **Cancel Subscription**
   - Owner clicks "Cancel Subscription"
   - Multi-step cancellation process
   - Reason for cancellation requested (optional)
   - Impact explained (loss of access, data retention)
   - Confirmation required: "I understand"
   - Effective date selected (immediate or end of period)
   - Cancellation processed
   - Confirmation email with data export link

10. **Post-Cancellation**
    - Access maintained until period end
    - Data retained for 90 days
    - Export data option available
    - Re-activation option presented
    - Quarterly updates stopped

### Internal Module Flow

1. **cron-service** checks upcoming renewals daily
2. **subscription-service** identifies subscriptions 30 days from expiry
3. **notification-service** sends renewal reminder emails
4. **subscription-service** marks subscriptions for auto-renewal 1 day before expiry
5. **payment-service** processes renewal payment via Stripe
6. **payment-service** handles payment success/failure
7. **subscription-service** extends subscription period on success
8. **subscription-service** updates subscription status in PostgreSQL
9. **billing-service** generates renewal invoice
10. **email-service** sends confirmation/failure notification
11. For cancellations, **subscription-service** sets cancellation_date
12. **subscription-service** maintains access until period_end
13. **data-retention-service** schedules data deletion after 90 days
14. **subscription-service** emits `subscription.renewed` or `subscription.cancelled` events

---

## Flow 7: Usage Tracking And Monitoring

### User Journey

System administrators and Owners monitor subscription usage metrics, track feature utilization, analyze usage patterns, and generate usage reports for capacity planning and billing verification.

### Step-by-Step Flow

1. **Access Usage Monitoring Dashboard**
   - Owner logs into admin panel
   - Navigate to "Usage & Analytics"
   - Comprehensive usage dashboard displayed
   - Date range selector available

2. **View Employee Metrics**
   - Total active employees displayed
   - Employees added this month shown
   - Employees removed this month shown
   - Historical growth chart rendered
   - Breakdown by department visualized
   - Trend analysis displayed

3. **View Report Generation Metrics**
   - Total reports generated (lifetime) displayed
   - Reports generated this month shown
   - Breakdown by report type (8 types) shown
   - Peak usage times highlighted
   - Monthly trend chart displayed
   - Average reports per employee calculated

4. **View AI Chat Usage**
   - Total AI chat sessions tracked
   - Messages sent this month shown
   - Average session length calculated
   - Most queried employees identified
   - Token usage tracked
   - Cost estimation displayed

5. **View Quarterly Update Metrics**
   - Last quarterly update date shown
   - Next scheduled update date displayed
   - Employees affected by last update shown
   - Reports regenerated count displayed
   - Update execution time tracked
   - Success/failure rate shown

6. **View Storage Usage**
   - Total data storage consumed shown
   - Storage by category (reports, profiles, documents)
   - Storage limit for plan displayed
   - Remaining capacity indicated
   - Growth projection calculated

7. **View API Usage**
   - Total API requests this month
   - Requests by endpoint category
   - Rate limit status displayed
   - Error rate tracked
   - Response time metrics shown

8. **Set Usage Alerts**
   - Owner clicks "Configure Alerts"
   - Alert rules configuration modal opens
   - Set thresholds (80%, 90%, 95%, 100%)
   - Select notification channels (email, in-app)
   - Save alert preferences

9. **Receive Usage Alerts**
   - System detects threshold breach
   - Alert notification sent immediately
   - Dashboard shows warning banner
   - Alert details displayed
   - Action recommendations provided

10. **Export Usage Report**
    - Owner clicks "Export Usage Report"
    - Date range selection modal
    - Report format selection (PDF, CSV, Excel)
    - Report generated with all metrics
    - Downloadable link provided
    - Report emailed to Owner

11. **Compare Period-over-Period**
    - Select comparison periods
    - Side-by-side metrics displayed
    - Percentage changes calculated
    - Trend indicators shown (up/down arrows)
    - Anomaly detection highlights unusual patterns

### Internal Module Flow

1. **usage-tracking-service** tracks all usage events in real-time
2. Events stored in MongoDB for fast writes and time-series queries
3. **usage-tracking-service** maintains counters in Redis for real-time access
4. Aggregation pipeline runs every hour to summarize usage metrics
5. **usage-tracking-service** checks usage against limits from **subscription-service**
6. When threshold reached, **usage-tracking-service** emits `usage.threshold.reached` event
7. **notification-service** listens to event and sends alerts
8. **usage-tracking-service** provides REST API for usage queries
9. Dashboard frontend calls API to retrieve and visualize data
10. **usage-tracking-service** generates usage reports via background job
11. **billing-service** consumes usage data for overage calculations
12. **analytics-service** aggregates usage for trend analysis and forecasting
13. **cron-service** resets monthly counters at billing cycle start

---

## Flow 8: Auto Update Access Control

### User Journey

The system controls access to quarterly automatic report regeneration based on active subscription status, managing scheduled updates, enforcing subscription requirements, and handling subscription lapses.

### Step-by-Step Flow

1. **Quarterly Update Scheduling**
   - Cron job triggers quarterly (every 3 months)
   - System identifies all employees requiring updates
   - Harmonic code recalculation scheduled
   - Report regeneration queued

2. **Subscription Validation**
   - For each organization, subscription status checked
   - Active subscription required for auto-updates
   - Subscription expiry date verified
   - Payment status confirmed current

3. **Active Subscription - Update Granted**
   - Subscription status: ACTIVE
   - Auto-update permission granted
   - Employee queued for harmonic code update
   - All 8 reports marked for regeneration
   - Update process initiated

4. **Inactive Subscription - Update Denied**
   - Subscription status: EXPIRED, CANCELLED, or SUSPENDED
   - Auto-update permission denied
   - Employee skipped from quarterly update queue
   - Owner notified of skipped updates
   - Upgrade prompt displayed in dashboard

5. **Grace Period Handling**
   - Subscription expired within last 7 days
   - Grace period active
   - Limited updates allowed (existing employees only)
   - Warning notification sent
   - Full update requires renewal

6. **Partial Update for Trial/Starter Plans**
   - Lower tier subscriptions identified
   - Limited update features applied
   - Core reports regenerated only
   - Advanced analytics skipped
   - Upgrade suggestion presented

7. **Owner Notification - Update Started**
   - Email sent: "Quarterly update in progress"
   - Estimated completion time provided
   - Number of employees being updated shown
   - Progress tracking link included

8. **Batch Processing**
   - Employees processed in batches (50 at a time)
   - Queue management via BullMQ
   - Job priority based on subscription tier
   - Higher tier customers processed first

9. **Update Execution**
   - Harmonic code recalculated via astrology service
   - Energy pattern changes detected
   - LLM AI analysis triggered with updated codes
   - 8 reports regenerated sequentially
   - Previous reports archived with timestamp

10. **Update Completion Notification**
    - Email sent: "Quarterly update completed"
    - Summary of updates provided
    - Number of reports regenerated shown
    - Significant changes highlighted
    - Dashboard link to view new reports

11. **Failed Update Handling**
    - Update fails for specific employee
    - Error logged with details
    - Retry scheduled (3 attempts)
    - Owner notified if all retries fail
    - Support contact information provided

12. **Subscription Lapsed During Update**
    - Subscription expires mid-update
    - Current batch completes processing
    - Remaining employees skipped
    - Partial completion notification sent
    - Renewal required message displayed

13. **Manual Update Override (Owner)**
    - Owner can request manual update anytime
    - Subscription status checked
    - Credit/token system for ad-hoc updates
    - Single employee or bulk update option
    - On-demand processing queue

14. **Update History Tracking**
    - All updates logged with timestamp
    - Success/failure status recorded
    - Changes summary stored
    - Audit trail maintained
    - Accessible via dashboard

### Internal Module Flow

1. **cron-service** triggers quarterly update job (scheduled task)
2. **cron-service** calls **subscription-service** to get all organizations
3. **subscription-service** queries PostgreSQL for subscriptions with status ACTIVE
4. **subscription-service** returns list of eligible organizations
5. **cron-service** calls **employees-service** to get employees for eligible orgs
6. **cron-service** adds jobs to BullMQ queue (report-regeneration queue)
7. **reports-service** worker processes queue jobs
8. For each job, **reports-service** calls **subscription-service** to revalidate subscription
9. If valid, **reports-service** calls external Astrology API for harmonic code update
10. **reports-service** triggers AI analysis via **ai-service** (Mastra.ai + OpenAI)
11. **reports-service** regenerates all 8 report types
12. **reports-service** stores new reports in MongoDB
13. **reports-service** archives previous reports with version timestamp
14. **reports-service** emits `report.regenerated` event via WebSocket
15. **notification-service** listens to event and sends completion email
16. **usage-tracking-service** increments quarterly_updates_completed counter
17. **audit-service** logs update completion with metadata
18. If subscription invalid, **reports-service** skips update and emits `update.denied` event
19. **notification-service** sends denial notification with upgrade link
20. Dashboard displays update status in real-time via WebSocket events

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Status:** Complete