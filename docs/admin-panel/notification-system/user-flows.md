# User Flows - Notification System

## Overview

This document describes all user journey scenarios for the Notification System module.

## Flow 1: Email Notifications

### User Journey

**Actors**: Owner, Leader, Manager
**Trigger**: Report generation completion, system event occurrence
**Goal**: Receive important platform updates via email

The user receives email notifications for critical events such as report generation completion, quarterly updates, subscription changes, and system alerts. The system ensures reliable email delivery with retry logic and delivery tracking.

### Step-by-Step Flow

1. **Event Triggered**
   - System event occurs (report ready, subscription expiring, etc.)
   - Event-dispatcher-service captures the event

2. **Notification Queued**
   - Event data transformed into notification payload
   - Notification added to Redis queue with priority level

3. **User Preferences Checked**
   - notification-service retrieves user preferences from MongoDB
   - Validates if user has email notifications enabled for this event type
   - Checks user's role-based permissions for the content

4. **Template Rendered**
   - email-service fetches appropriate email template from MongoDB
   - Populates template with event-specific data
   - Applies organization branding if configured

5. **Email Sent**
   - SMTP/SendGrid integration sends email
   - Delivery status tracked and logged in MongoDB

6. **Retry Logic**
   - Failed deliveries retry up to 3 times with exponential backoff
   - Permanent failures logged for admin review

7. **User Receives Email**
   - User opens email in their email client
   - Email contains actionable links to relevant platform sections

### Internal Module Flow

```
[Event Source] → [event-dispatcher-service]
                           ↓
                  [Redis Queue: email]
                           ↓
                [notification-service]
                  ↓                ↓
         [Check Preferences]  [Check Permissions]
                  ↓                ↓
                [email-service]
                           ↓
                  [Render Template]
                           ↓
                  [SMTP/SendGrid]
                           ↓
                  [Log Delivery Status]
                           ↓
                  [MongoDB: notification_logs]
```

**Module Interactions:**
- event-dispatcher-service publishes events to notification-service
- notification-service validates user preferences and permissions
- email-service handles template rendering and SMTP delivery
- All modules log to shared MongoDB collections

---

## Flow 2: In App Notifications

### User Journey

**Actors**: Owner, Leader, Manager
**Trigger**: Any platform event requiring user attention
**Goal**: View real-time notifications within the application dashboard

Users receive in-app notifications displayed in the dashboard header with a notification bell icon. Notifications are categorized, unread counts are displayed, and users can mark notifications as read or dismiss them.

### Step-by-Step Flow

1. **User Logged In**
   - User authenticates and lands on dashboard
   - WebSocket connection established for real-time updates

2. **Notification Generated**
   - System event triggers notification creation
   - event-dispatcher-service publishes event

3. **Notification Created**
   - notification-service creates notification record in MongoDB
   - Notification includes: title, message, type, priority, timestamp
   - User ID and role associations stored

4. **Real-time Delivery**
   - WebSocket event `notification.received` emitted to user's active sessions
   - Notification appears in dashboard bell icon
   - Unread count badge updated

5. **User Interaction**
   - User clicks notification bell to view list
   - Notifications displayed with filters: All, Unread, Reports, Alerts
   - User clicks individual notification to view details

6. **Navigation**
   - Clicking notification marks it as read
   - User redirected to relevant platform section (e.g., report details)

7. **Notification Management**
   - User can mark all as read
   - User can delete individual notifications
   - Notifications auto-archive after 30 days

### Internal Module Flow

```
[Event Source] → [event-dispatcher-service]
                           ↓
                  [notification-service]
                           ↓
              [Create Notification Record]
                           ↓
                  [MongoDB: notifications]
                           ↓
              [WebSocket: notification.received]
                           ↓
                  [Frontend Dashboard]
                           ↓
         [User Clicks → Mark as Read → Navigate]
```

**Module Interactions:**
- event-dispatcher-service publishes events via internal event bus
- notification-service stores notifications in MongoDB
- WebSocket gateway broadcasts real-time updates
- Frontend subscribes to WebSocket events for live updates

---

## Flow 3: Report Generation Alerts

### User Journey

**Actors**: Owner, Leader, Manager
**Trigger**: Employee/candidate report generation completed
**Goal**: Get notified immediately when reports are ready for review

When a new employee or candidate is added to the system, 8 comprehensive reports are generated. Users who initiated the addition or have permission to view the reports receive notifications via email and in-app channels.

### Step-by-Step Flow

1. **Report Generation Initiated**
   - Employee/candidate data submitted by user
   - Report generation pipeline starts processing
   - AI analysis, astrology calculations, harmonic codes computed

2. **Generation Progress Tracking**
   - Each of 8 reports processed sequentially or in parallel
   - Progress tracked in report-service module
   - Estimated completion time calculated

3. **Report Completion Event**
   - All 8 reports successfully generated
   - event-dispatcher-service receives `report.generated` event
   - Event payload includes: employee ID, report IDs, requester ID

4. **Role-based Notification Routing**
   - notification-service determines eligible recipients:
     - User who added the employee
     - Direct manager of the employee
     - Department leader (if applicable)
     - Organization owner
   - Validates each recipient's scope access

5. **Multi-channel Notification**
   - In-app notification created for each recipient
   - Email notification queued for each recipient
   - WebSocket event broadcasted to online recipients

6. **Notification Content**
   - Title: "Reports Ready: [Employee Name]"
   - Message: "All 8 reports have been generated and are ready for review"
   - Action button: "View Reports"
   - Report type breakdown listed

7. **User Access**
   - User clicks notification
   - Redirected to employee detail page
   - Reports tab displayed with all 8 reports available
   - Reports can be viewed, downloaded, or shared

### Internal Module Flow

```
[report-service] → [Report Generation Complete]
                           ↓
                  [event-dispatcher-service]
              {event: "report.generated"}
                           ↓
                  [notification-service]
                           ↓
              [Determine Recipients by Role]
                  ↓                    ↓
    [Create In-app Notification]  [Queue Email]
                  ↓                    ↓
    [MongoDB: notifications]    [Redis: email_queue]
                  ↓                    ↓
    [WebSocket Broadcast]       [email-service]
                  ↓                    ↓
         [Frontend Update]       [SMTP Delivery]
```

**Module Interactions:**
- report-service emits `report.generated` event upon completion
- event-dispatcher-service routes event to notification-service
- notification-service applies role-based access control
- Both in-app and email channels activated simultaneously
- Notification links deep-link to report detail pages

---

## Flow 4: Quarterly Update Notifications

### User Journey

**Actors**: Owner, Leader, Manager
**Trigger**: Automated quarterly report regeneration
**Goal**: Stay informed about refreshed employee reports based on updated harmonic codes

Every quarter, the system automatically regenerates all employee reports due to harmonic energy code changes. Users with active subscriptions receive notifications about these updates for employees within their scope.

### Step-by-Step Flow

1. **Quarterly Cron Job Triggered**
   - cron-service initiates quarterly update process
   - Identifies all organizations with active subscriptions
   - Retrieves all employees requiring report regeneration

2. **Batch Processing Initiated**
   - Employees grouped by organization and department
   - Report regeneration jobs added to Redis queue
   - Processing scheduled to avoid system overload

3. **Harmonic Code Updates**
   - Astrology service recalculates harmonic energy codes
   - New codes compared with previous quarter
   - Changes flagged for significant variations

4. **Report Regeneration**
   - All 8 reports regenerated for each employee
   - AI analysis rerun with updated harmonic data
   - New compatibility scores calculated

5. **Batch Completion Event**
   - event-dispatcher-service receives `quarterly.update.completed` event
   - Event includes: organization ID, employee count, significant changes summary

6. **Summary Notification Generation**
   - notification-service creates organization-level summary
   - Identifies employees with significant compatibility changes
   - Generates actionable insights for management

7. **Role-based Distribution**
   - **Owner**: Receives organization-wide summary with all departments
   - **Leader**: Receives summary for their assigned departments only
   - **Manager**: Receives summary for their single department only

8. **Multi-channel Delivery**
   - Email with detailed summary and attached report links
   - In-app notification with key highlights
   - Dashboard widget updated with "Quarterly Update Available" banner

9. **User Review**
   - User clicks notification or dashboard banner
   - Redirected to "Quarterly Updates" section
   - View comparison reports: old vs. new compatibility scores
   - Identify employees requiring attention or intervention

### Internal Module Flow

```
[cron-service] → [Quarterly Job Triggered]
                           ↓
              [Batch Report Regeneration]
                           ↓
         [report-service: Regenerate All Reports]
                           ↓
              [event-dispatcher-service]
        {event: "quarterly.update.completed"}
                           ↓
              [notification-service]
                           ↓
    [Generate Summary by Organization & Role]
                  ↓                    ↓
    [MongoDB: quarterly_summaries]  [Redis: notification_queue]
                  ↓                    ↓
    [In-app Notification]        [Email with Summary]
                  ↓                    ↓
    [Dashboard Widget Update]    [email-service]
```

**Module Interactions:**
- cron-service orchestrates quarterly updates on schedule
- report-service regenerates reports in batches
- event-dispatcher-service publishes completion events
- notification-service aggregates changes into role-specific summaries
- Both email and in-app channels deliver comprehensive updates
- Subscription status validated before notification delivery

---

## Flow 5: Subscription Renewal Reminders

### User Journey

**Actors**: Owner only
**Trigger**: Subscription expiration approaching
**Goal**: Ensure uninterrupted service by renewing subscription on time

Owners receive proactive reminders about upcoming subscription expirations at 30 days, 14 days, 7 days, and 1 day before expiration. Post-expiration, reminders continue until renewal or account suspension.

### Step-by-Step Flow

1. **Subscription Monitoring**
   - cron-service runs daily check on all organization subscriptions
   - Identifies subscriptions expiring within reminder windows
   - Checks subscription status: active, grace_period, expired

2. **Reminder Window Triggered**
   - Subscription falls within reminder threshold (30/14/7/1 days)
   - event-dispatcher-service emits `subscription.reminder` event
   - Event payload includes: organization ID, owner ID, days remaining, plan details

3. **Owner Identification**
   - notification-service retrieves organization owner from users-service
   - Validates owner contact information (email, phone)
   - Checks notification delivery history to avoid duplicates

4. **Reminder Content Generation**
   - notification-service selects appropriate template based on urgency:
     - 30 days: Friendly reminder with benefits recap
     - 14 days: Standard reminder with renewal link
     - 7 days: Urgent reminder with consequences of non-renewal
     - 1 day: Critical reminder with immediate action required
   - Includes: current plan details, renewal pricing, feature access summary

5. **Multi-channel Delivery**
   - **Email**: Detailed reminder with payment link and plan comparison
   - **In-app**: Persistent dashboard banner with countdown timer
   - **SMS** (optional): Critical reminders at 1 day before expiration

6. **Owner Interaction**
   - Owner clicks "Renew Now" button
   - Redirected to payment gateway (Stripe integration)
   - Completes payment process

7. **Post-renewal Confirmation**
   - Payment service confirms successful renewal
   - event-dispatcher-service emits `subscription.renewed` event
   - Confirmation notification sent via email and in-app
   - Dashboard banner removed

8. **Expired Subscription Handling**
   - If subscription expires without renewal:
     - Grace period activated (7 days)
     - Daily reminders intensify
     - Platform features progressively restricted
     - Quarterly auto-updates suspended

### Internal Module Flow

```
[cron-service] → [Daily Subscription Check]
                           ↓
              [Identify Expiring Subscriptions]
                           ↓
              [event-dispatcher-service]
        {event: "subscription.reminder"}
                           ↓
              [notification-service]
                           ↓
    [Fetch Owner & Subscription Details]
                           ↓
    [Select Template by Urgency Level]
                  ↓                    ↓
    [Email Reminder]            [In-app Banner]
         ↓                            ↓
    [email-service]           [Dashboard Widget]
         ↓                            ↓
    [Track Delivery]          [Persistent Display]
                           ↓
              [Owner Clicks Renew]
                           ↓
              [Payment Gateway]
                           ↓
        [subscription.renewed event]
                           ↓
        [Confirmation Notification]
```

**Module Interactions:**
- cron-service monitors subscription expiration dates
- event-dispatcher-service publishes reminder events at threshold intervals
- notification-service tailors content based on urgency and days remaining
- payment-service integrates with notification flow for renewal confirmation
- Dashboard displays persistent reminders until action taken
- Only Owner role receives subscription-related notifications

---

## Flow 6: System Event Notifications

### User Journey

**Actors**: Owner, Leader, Manager (role-dependent)
**Trigger**: System maintenance, security alerts, platform updates, errors
**Goal**: Stay informed about platform status and critical system events

Users receive notifications about system-level events that may impact their usage, require attention, or provide important platform updates. Notifications are prioritized by severity and relevance to user role.

### Step-by-Step Flow

1. **System Event Occurs**
   - Event types:
     - Scheduled maintenance windows
     - Security alerts (unauthorized access attempts)
     - Platform updates and new features
     - Critical errors affecting report generation
     - API integration failures
     - Data import/export completion
   - System monitoring tools detect event

2. **Event Classification**
   - event-dispatcher-service receives system event
   - Event classified by:
     - Severity: critical, high, medium, low
     - Impact scope: platform-wide, organization-specific, department-specific
     - Urgency: immediate, scheduled, informational

3. **Audience Determination**
   - notification-service determines target audience based on scope:
     - **Platform-wide**: All active users
     - **Organization-specific**: Owner + Leaders + Managers in affected org
     - **Department-specific**: Leaders + Managers in affected department
     - **Critical security**: Owners only

4. **Notification Priority Assignment**
   - Critical events: Immediate delivery, bypasses preference settings
   - High priority: Standard delivery with elevated visibility
   - Medium/Low priority: Respects user notification preferences

5. **Content Preparation**
   - Template selected based on event type
   - Content includes:
     - Clear description of event/issue
     - Impact on user's workflow
     - Action required (if any)
     - Timeline or resolution status
     - Support contact information

6. **Multi-channel Distribution**
   - **Critical events**: Email + In-app + SMS (if configured)
   - **High priority**: Email + In-app
   - **Medium/Low priority**: In-app only (unless user preferences specify email)

7. **Delivery Tracking**
   - All system event notifications logged in MongoDB
   - Read receipts tracked for critical notifications
   - Unread critical notifications resurface until acknowledged

8. **User Acknowledgment**
   - User views notification in dashboard
   - Critical notifications require explicit acknowledgment
   - User can view notification history in "System Alerts" section

9. **Follow-up Notifications**
   - For ongoing issues: Status updates sent at regular intervals
   - Resolution confirmation sent when issue resolved
   - Post-mortem summary for critical incidents

### Internal Module Flow

```
[System Monitor/Event Source]
                ↓
    [event-dispatcher-service]
  {event: "system.event.[type]"}
                ↓
    [notification-service]
                ↓
    [Classify: Severity + Scope]
                ↓
    [Determine Target Audience by Role]
                ↓
    [Assign Priority & Channel Strategy]
        ↓               ↓               ↓
    [Email]      [In-app]          [SMS]
        ↓               ↓               ↓
 [email-service] [WebSocket]  [SMS Provider]
        ↓               ↓               ↓
    [Delivery Tracking MongoDB]
                ↓
    [User Acknowledgment Tracking]
                ↓
    [Follow-up Automation if Needed]
```

**Module Interactions:**
- System monitoring tools publish events to event-dispatcher-service
- event-dispatcher-service categorizes events by severity and scope
- notification-service applies intelligent routing based on role and impact
- Critical events bypass user preferences for guaranteed delivery
- Acknowledgment tracking ensures critical messages are seen
- Follow-up automation handles ongoing incident communication

**Event Categories:**
- **Maintenance**: Scheduled downtime, system upgrades
- **Security**: Login anomalies, data access alerts, permission changes
- **Features**: New feature announcements, UI updates
- **Errors**: Report generation failures, API timeout issues
- **Integrations**: Third-party service disruptions (AI, astrology API)
- **Data Operations**: Bulk import/export completion, data migration status

---

## Flow 7: Role Based Notification Filtering

### User Journey

**Actors**: Owner, Leader, Manager
**Trigger**: Any notification event in the system
**Goal**: Receive only notifications relevant to user's role and scope of access

The system automatically filters and delivers notifications based on the user's role and organizational scope, ensuring users only see information they're authorized to access and that's relevant to their responsibilities.

### Step-by-Step Flow

1. **Notification Event Triggered**
   - Any system event occurs (report ready, quarterly update, alert, etc.)
   - event-dispatcher-service receives event with metadata:
     - Organization ID
     - Department ID(s) affected
     - Employee/Candidate ID(s) involved
     - Event type and severity

2. **Context Extraction**
   - notification-service extracts hierarchical context:
     - Which organization is affected
     - Which branches are involved
     - Which departments are impacted
     - Which specific employees are relevant

3. **Potential Recipients Identified**
   - Query users-service for all users in affected organization
   - Retrieve role and scope for each user:
     - Owner: Full organization access
     - Leader: Assigned branches/departments
     - Manager: Single department assignment

4. **Permission Matrix Applied**
   - For each potential recipient, validate:
     - **Organizational access**: User belongs to affected organization
     - **Department scope**: User has access to affected department(s)
     - **Employee visibility**: User has permission to view affected employee data
     - **Feature access**: User's plan includes relevant features

5. **Role-specific Filtering Logic**
   - **Owner Filtering**:
     - Receives all notifications for their organization
     - No department-level filtering applied
     - Full visibility across all branches and employees
   
   - **Leader Filtering**:
     - Receives notifications only for assigned departments
     - Cross-department events filtered to their scope
     - No visibility into departments they don't manage
   
   - **Manager Filtering**:
     - Receives notifications only for their single department
     - No visibility into other departments or branches
     - Limited to employees directly reporting to them

6. **Notification Customization**
   - Content tailored to user's role:
     - Owner sees org-wide summaries
     - Leader sees department-specific summaries
     - Manager sees individual employee details
   - Language and terminology adjusted for role level

7. **Preference Layer Applied**
   - User's notification preferences respected (unless critical):
     - Email on/off for specific event types
     - In-app notification categories enabled/disabled
     - Digest mode vs. real-time delivery
   - Critical notifications bypass preferences

8. **Delivery Queue Optimization**
   - Filtered notifications added to appropriate channels:
     - Redis queue for email delivery
     - MongoDB for in-app notifications
     - WebSocket for real-time updates
   - Duplicate detection prevents redundant notifications

9. **Audit Trail**
   - All filtering decisions logged:
     - Who received the notification
     - Who was filtered out and why
     - Timestamp and delivery status
   - Compliance and troubleshooting support

### Internal Module Flow

```
[Event Source] → [event-dispatcher-service]
                           ↓
            [notification-service]
                           ↓
    ┌──────────────────────────────────────┐
    │   Role-Based Filtering Engine        │
    │                                      │
    │   1. Extract Context                │
    │      - Organization ID              │
    │      - Department IDs               │
    │      - Employee IDs                 │
    │                                      │
    │   2. Query User Permissions         │
    │      [users-service]                │
    │      - Roles                        │
    │      - Scopes                       │
    │      - Assignments                  │
    │                                      │
    │   3. Apply Permission Matrix        │
    │      ┌────────┬──────────┬────────┐ │
    │      │ Owner  │ Leader   │Manager │ │
    │      ├────────┼──────────┼────────┤ │
    │      │ All    │ Assigned │ Single │ │
    │      │ Orgs   │ Depts    │ Dept   │ │
    │      └────────┴──────────┴────────┘ │
    │                                      │
    │   4. Filter Recipients              │
    │      - Match scope                  │
    │      - Validate access              │
    │      - Remove unauthorized          │
    │                                      │
    │   5. Customize Content              │
    │      - Role-specific language       │
    │      - Scope-appropriate detail     │
    │                                      │
    └──────────────────────────────────────┘
                           ↓
            [Filtered Recipient List]
                           ↓
        ┌──────────────────┴──────────────────┐
        ↓                                      ↓
    [In-app Queue]                      [Email Queue]
        ↓                                      ↓
    [MongoDB]                            [Redis]
        ↓                                      ↓
    [WebSocket Delivery]              [email-service]
```

**Module Interactions:**
- event-dispatcher-service publishes raw events with full context
- notification-service queries users-service for role and scope data
- Filtering engine applies hierarchical permission logic
- Content customization adjusts messaging for role level
- Audit logging captures all filtering decisions
- Delivery queues receive only authorized recipients

**Filtering Rules:**
- **Organizational Boundary**: Users never see notifications from other organizations
- **Department Scope**: Leaders/Managers limited to assigned departments
- **Employee Privacy**: Managers cannot see employees outside their department
- **Feature Gating**: Notifications tied to subscription features filtered by plan
- **Critical Override**: Critical security notifications may bypass scope limitations for Owners

**Edge Cases Handled:**
- Multi-department employees: Notifications sent to all relevant managers
- Department transfers: Notifications route to new manager after transfer date
- Role changes: Real-time permission updates when user role modified
- Subscription downgrade: Feature-specific notifications disabled for unavailable features

---

## Flow 8: Notification Preferences Management

### User Journey

**Actors**: Owner, Leader, Manager
**Trigger**: User wants to customize notification delivery
**Goal**: Control which notifications are received and through which channels

Users can customize their notification preferences to control the type, frequency, and delivery method of notifications they receive, ensuring they stay informed without being overwhelmed.

### Step-by-Step Flow

1. **Access Preferences**
   - User navigates to "Settings" → "Notifications" in dashboard
   - Current preferences loaded from MongoDB
   - Default preferences shown if first-time access

2. **Preference Categories Displayed**
   - **Report Notifications**
     - New report generated
     - Quarterly report updates
     - Report generation failures
   
   - **Employee Management**
     - New employee added
     - Employee data updated
     - Employee removed
   
   - **Team Alerts**
     - Compatibility score changes
     - Training recommendations available
     - Manager assignments changed
   
   - **System Notifications**
     - Platform updates
     - Maintenance schedules
     - Security alerts
   
   - **Subscription & Billing**
     - Renewal reminders
     - Payment confirmations
     - Plan changes

3. **Channel Selection**
   - For each notification category, user selects:
     - **Email**: On/Off toggle
     - **In-app**: On/Off toggle
     - **SMS** (if configured): On/Off toggle
   - Some critical notifications marked "Cannot be disabled"

4. **Frequency Options**
   - **Real-time**: Immediate delivery as events occur
   - **Daily Digest**: Single summary email at chosen time
   - **Weekly Summary**: Consolidated report every Monday
   - Frequency applies to non-critical notifications only

5. **Advanced Filtering**
   - **Report Notifications**: Select specific report types to monitor
   - **Employee Scope**: All employees vs. specific departments
   - **Threshold Alerts**: Only notify for significant changes (e.g., compatibility drop >15%)
   - **Quiet Hours**: Suppress non-critical notifications during specified hours

6. **Preview Settings**
   - User can preview what notifications they'll receive
   - Example scenarios shown based on current settings
   - Estimated notification volume displayed

7. **Save Preferences**
   - User clicks "Save Preferences"
   - Validation checks ensure critical notifications remain enabled
   - Preferences saved to MongoDB
   - Confirmation message displayed

8. **Preference Sync**
   - notification-service updates in-memory cache
   - Real-time preference application for subsequent notifications
   - No restart or re-login required

9. **Reset to Defaults**
   - Option to reset all preferences to system defaults
   - Confirmation dialog prevents accidental resets
   - Default preferences based on role (Owner/Leader/Manager)

10. **Preference Audit**
    - All preference changes logged with timestamp
    - User can view preference change history
    - Compliance tracking for regulatory requirements

### Internal Module Flow

```
[User] → [Frontend: Settings Page]
              ↓
    [GET /api/notifications/preferences]
              ↓
    [notification-service]
              ↓
    [MongoDB: user_preferences]
              ↓
    [Load Current Settings]
              ↓
    [Display in UI with Categories]
              ↓
    [User Modifies Preferences]
              ↓
    [PUT /api/notifications/preferences]
              ↓
    [notification-service]
              ↓
    ┌─────────────────────────────────┐
    │  Preference Validation          │
    │  - Critical checks enabled      │
    │  - Valid time formats          │
    │  - Channel availability        │
    └─────────────────────────────────┘
              ↓
    [Save to MongoDB: user_preferences]
              ↓
    [Update Redis Cache]
              ↓
    [Emit: preferences.updated event]
              ↓
    [Confirmation Response]
              ↓
    [Frontend: Display Success]
              ↓
    ┌─────────────────────────────────┐
    │  Ongoing Notification Flow      │
    │                                 │
    │  [Event Occurs]                │
    │        ↓                        │
    │  [notification-service]        │
    │        ↓                        │
    │  [Check Redis Cache]           │
    │        ↓                        │
    │  [Apply User Preferences]      │
    │        ↓                        │
    │  [Filter Channels]             │
    │        ↓                        │
    │  [Respect Quiet Hours]         │
    │        ↓                        │
    │  [Queue for Delivery]          │
    └─────────────────────────────────┘
```

**Module Interactions:**
- Frontend communicates with notification-service REST API
- notification-service reads/writes preferences to MongoDB
- Redis cache maintains active user preferences for fast lookup
- event-dispatcher-service checks preferences before routing notifications
- Preference changes take effect immediately via cache update

**Preference Data Model:**
```json
{
  "userId": "user_123",
  "organizationId": "org_456",
  "preferences": {
    "reports": {
      "newReportGenerated": { "email": true, "inApp": true, "sms": false },
      "quarterlyUpdates": { "email": true, "inApp": true, "sms": false },
      "reportFailures": { "email": true, "inApp": true, "sms": true }
    },
    "employees": {
      "employeeAdded": { "email": false, "inApp": true, "sms": false },
      "employeeUpdated": { "email": false, "inApp": true, "sms": false }
    },
    "system": {
      "platformUpdates": { "email": true, "inApp": true, "sms": false },
      "securityAlerts": { "email": true, "inApp": true, "sms": true }
    },
    "subscription": {
      "renewalReminders": { "email": true, "inApp": true, "sms": true }
    }
  },
  "frequency": "realtime",
  "digestTime": "09:00",
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00"
  },
  "advancedFilters": {
    "thresholdAlerts": true,
    "thresholdPercentage": 15,
    "specificDepartments": ["dept_1", "dept_2"]
  },
  "updatedAt": "2025-11-10T14:30:00Z"
}
```

**Special Handling:**
- **Critical Notifications**: Always delivered regardless of preferences (security alerts, subscription expiration)
- **Role-based Defaults**: New users inherit role-appropriate default preferences
- **Digest Mode**: Accumulates non-critical notifications for batch delivery
- **Quiet Hours**: Buffers notifications during specified hours, delivers after window closes
- **Mobile App Sync**: Preferences sync across web and mobile platforms

**User Experience Enhancements:**
- Smart defaults based on user behavior and role
- Suggestions for optimal settings based on notification volume
- Preview mode shows sample notifications before saving
- Quick toggles for "Mute all" or "Enable all" per category
- Import/export preferences for consistency across accounts

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Complete