# User Flows - Dashboard & Analytics

## Overview

This document describes all user journey scenarios for the Dashboard & Analytics module.

## Flow 1: Role Specific Dashboard Views

### User Journey

Each user role (Owner, Leader, Manager) accesses a customized dashboard that displays relevant metrics, reports, and actions based on their hierarchical permissions and organizational scope. The dashboard serves as the primary landing page after authentication and provides quick access to key features and insights.

### Step-by-Step Flow

1. **User Authentication**
   - User logs in with email and password
   - System validates credentials via auth module
   - JWT token generated and stored in session

2. **Role Identification**
   - System retrieves user profile from users module
   - User role (Owner/Leader/Manager) determined
   - Organizational scope (branches/departments) loaded

3. **Dashboard Data Aggregation**
   - Dashboard service requests relevant metrics from analytics service
   - Filters applied based on user's organizational scope
   - Recent reports fetched from reports module
   - Pending notifications retrieved from notification service

4. **Dashboard Rendering**
   - Owner View: Company-wide metrics, all branches/departments, subscription status, user management panel
   - Leader View: Assigned branches/departments, team overview, reports within scope, employee management
   - Manager View: Single department metrics, direct reports, employee performance, training recommendations

5. **Real-time Updates**
   - WebSocket connection established for live notifications
   - Metrics auto-refresh every 30 seconds
   - New report generation triggers dashboard update
   - Quarterly regeneration alerts displayed

### Internal Module Flow

```
1. auth-module → Validate JWT token
2. users-module → Retrieve user profile and role
3. organizations-module → Load organizational hierarchy and scope
4. dashboard-service → Orchestrate data aggregation
5. analytics-service → Calculate role-specific metrics
6. reports-module → Fetch recent and pending reports
7. notifications-module → Load unread notifications
8. dashboard-service → Compile and render role-specific view
9. websocket-gateway → Establish real-time update channel
```

---

## Flow 2: Report Access Navigation

### User Journey

Users navigate to view, download, and analyze the 8 different report types generated for employees and candidates within their organizational scope. The system ensures users can only access reports for employees within their hierarchical permissions.

### Step-by-Step Flow

1. **Report List Access**
   - User clicks "Reports" navigation menu item
   - System displays employee/candidate list within user's scope
   - Filter options: department, report type, generation date, employee name

2. **Scope-based Filtering**
   - Owner: All employees across all branches/departments
   - Leader: Employees within assigned branches/departments only
   - Manager: Employees within assigned single department only

3. **Employee Selection**
   - User searches or selects specific employee
   - System displays employee profile summary
   - Lists all 8 available report types with generation dates

4. **Report Type Selection**
   - User selects desired report type:
     - Role-Specific Personality Analysis
     - Company-Specific Behavioral Analysis
     - Job Role Compatibility
     - Department Compatibility
     - Company Compatibility
     - Industry Compatibility
     - Employee Q&A System
     - Training & Development Recommendations

5. **Report Viewing**
   - Report rendered in interactive web view
   - Highlights: compatibility scores, personality insights, recommendations
   - Options: Download PDF, Share with authorized users, Archive

6. **Report History**
   - View quarterly regenerated versions
   - Compare changes over time
   - Trend analysis visualization
   - Harmonic code evolution tracking

### Internal Module Flow

```
1. auth-guard → Verify user authentication
2. roles-guard → Check user permissions
3. employees-module → Fetch employees within user's scope
4. reports-module → Retrieve report list for selected employee
5. reports-service → Load specific report content
6. analytics-service → Calculate comparison metrics (if viewing history)
7. reports-module → Render report view with download options
8. audit-logger → Log report access event
```

---

## Flow 3: Integrated AI Chat Interface

### User Journey

Users interact with the AI consultation system to ask specific questions about employees, team compatibility, promotion readiness, and training needs. The AI provides real-time insights based on the comprehensive analysis data, respecting user's organizational scope.

### Step-by-Step Flow

1. **Chat Interface Access**
   - User clicks "AI Consultation" button on dashboard or employee profile
   - Chat panel slides in from right side of screen
   - System loads recent chat history (if any)

2. **Context Initialization**
   - If accessed from employee profile: Employee context pre-loaded
   - If accessed from dashboard: General consultation mode
   - User's role and scope sent to AI service for filtering

3. **Query Input**
   - User types question in natural language
   - Examples:
     - "Is John ready for promotion to senior role?"
     - "How compatible are Sarah and Mike for team collaboration?"
     - "What training does the marketing team need?"
     - "Which candidate is best fit for data analyst position?"

4. **AI Processing**
   - Query sent to AI chat service
   - LLM accesses relevant reports and analysis data
   - Scope validation: AI only uses data within user's permissions
   - Response generated with citations to specific reports

5. **Response Rendering**
   - AI response displayed with formatted text
   - Referenced reports linked for quick access
   - Compatibility scores and metrics highlighted
   - Follow-up question suggestions provided

6. **Conversation Management**
   - Chat history maintained for session
   - User can switch employee context mid-conversation
   - Export chat transcript option available
   - Clear conversation and start new topic

7. **WebSocket Real-time Updates**
   - Typing indicators shown during AI processing
   - Streaming response for long answers
   - Multi-turn conversation support
   - Real-time notification if referenced data updates

### Internal Module Flow

```
1. chat-gateway → WebSocket connection established
2. auth-guard → Validate user session
3. chat-service → Initialize conversation context
4. employees-module → Load employee data within scope
5. reports-module → Fetch relevant reports for AI context
6. ai-service (Mastra.ai) → Process query with LLM
7. compatibility-service → Calculate real-time compatibility scores
8. chat-service → Format and stream response
9. analytics-service → Log chat interaction metrics
10. chat-gateway → Deliver response via WebSocket
```

---

## Flow 4: Update Notification System

### User Journey

Users receive real-time notifications about report generation completion, quarterly regeneration events, subscription alerts, and system updates. Notifications are role-specific and prioritized based on relevance.

### Step-by-Step Flow

1. **Notification Generation Events**
   - New employee report generation completed
   - Quarterly report regeneration finished
   - Subscription expiration warning (Owner only)
   - New employee added by team member
   - AI chat mention or follow-up
   - System maintenance or feature update

2. **Notification Creation**
   - Event triggers notification service
   - Notification content generated based on event type
   - Target users determined by role and scope
   - Priority level assigned (high/medium/low)

3. **Real-time Delivery**
   - WebSocket push notification to active users
   - In-app notification badge updated
   - Dashboard notification panel refreshed
   - Email notification sent for high-priority events (configurable)

4. **Notification Display**
   - Notification icon shows unread count
   - User clicks notification icon to view list
   - Grouped by type: Reports, System, Subscription, Team
   - Timestamped with relative time (e.g., "5 minutes ago")

5. **Notification Interaction**
   - Click notification to navigate to related page
   - Mark as read individually or bulk
   - Dismiss or archive notification
   - Configure notification preferences

6. **Notification History**
   - View past 30 days of notifications
   - Filter by type, date, priority
   - Search notification content
   - Export notification log

### Internal Module Flow

```
1. Event source (reports/employees/cron) → Trigger event
2. notifications-module → Receive event and create notification
3. users-module → Determine target users based on scope
4. notifications-service → Generate notification content
5. websocket-gateway → Push to active user sessions
6. email-service → Send email for high-priority (if enabled)
7. notifications-module → Update unread count in database
8. dashboard-service → Refresh notification badge
9. analytics-service → Track notification delivery and interaction
```

---

## Flow 5: Platform Adoption Metrics

### User Journey

Owners and Leaders view comprehensive metrics about platform adoption across their organization, including onboarding progress, user activation rates, feature adoption, and organizational growth over time.

### Step-by-Step Flow

1. **Analytics Dashboard Access**
   - User navigates to "Analytics" section (Owner/Leader only)
   - System loads adoption metrics tab
   - Date range selector: Last 7/30/90 days, or custom range

2. **Organization Onboarding Metrics**
   - Total organizations onboarded (Owner view only)
   - Organizational profile completion percentage
   - Branch and department setup progress
   - Company astrological data completion status

3. **User Activation Metrics**
   - Total users by role: Owner/Leader/Manager breakdown
   - Active users (logged in last 30 days)
   - User activation rate (invited vs. active)
   - Average time to first login after invitation
   - User growth trend over time (line chart)

4. **Employee Profile Metrics**
   - Total employee profiles created
   - Profiles with complete data vs. incomplete
   - Candidate profiles vs. employee profiles
   - Employee addition rate trend (weekly/monthly)
   - Average employees per department

5. **Report Generation Volume**
   - Total reports generated since onboarding
   - Reports by type distribution (pie chart)
   - Initial report generation vs. quarterly regeneration
   - Average report generation time
   - Failed report generations and reasons

6. **Feature Adoption Tracking**
   - Users who have accessed AI chat
   - Users who have viewed reports
   - Users who have downloaded reports
   - Users who have configured notifications
   - Feature adoption funnel visualization

7. **Subscription Status**
   - Active subscription indicator
   - Subscription tier details
   - Usage against plan limits
   - Renewal date and billing cycle
   - Upgrade prompts for feature limits

### Internal Module Flow

```
1. auth-guard → Verify Owner/Leader role
2. analytics-service → Query adoption metrics from database
3. organizations-module → Load organizational hierarchy data
4. users-module → Aggregate user statistics
5. employees-module → Calculate employee profile metrics
6. reports-module → Fetch report generation statistics
7. payments-module → Retrieve subscription details
8. analytics-service → Calculate trend analysis and percentages
9. dashboard-service → Render charts and visualizations
10. metrics-tracking-service → Log analytics view event
```

---

## Flow 6: User Engagement Analytics

### User Journey

Owners and Leaders analyze how users interact with the platform, including login frequency, feature utilization patterns, report viewing behaviors, and AI consultation engagement to identify power users and areas needing training.

### Step-by-Step Flow

1. **Engagement Dashboard Access**
   - User navigates to "Analytics" > "User Engagement" tab
   - Scope filter: All users / Specific role / Specific department
   - Time period selector: Daily/Weekly/Monthly view

2. **Login Activity Metrics**
   - Login frequency by role type (bar chart)
   - Active users vs. inactive users (last 30 days)
   - Peak usage times (heatmap by hour/day)
   - Average session duration per role
   - Login trend over time (line chart)

3. **Report Interaction Analytics**
   - Total report views by user and role
   - Most viewed report types
   - Report download frequency
   - Average time spent viewing reports
   - Report sharing activity
   - Comparison view usage (quarterly trends)

4. **AI Chat Engagement**
   - Total AI consultation sessions
   - Average questions per session
   - Most common query types
   - AI response satisfaction (if rated)
   - Power users with highest AI interaction
   - Topics/employees most queried

5. **Feature Utilization Patterns**
   - Dashboard access frequency
   - Employee management activity (add/edit/view)
   - Notification interaction rate
   - Settings configuration usage
   - Mobile vs. desktop usage breakdown

6. **User Segmentation**
   - Power users (high engagement across features)
   - Report-focused users (primarily view reports)
   - Management-focused users (primarily manage employees)
   - Low engagement users (at-risk, need training)
   - Recently inactive users (churn warning)

7. **Comparative Analysis**
   - Engagement comparison by department
   - Manager vs. Leader engagement patterns
   - Engagement trend: improving/declining
   - Benchmark against industry standards (if available)

### Internal Module Flow

```
1. auth-guard → Verify Owner/Leader permissions
2. analytics-service → Query user engagement data
3. users-module → Load user list and activity logs
4. reports-module → Fetch report viewing statistics
5. chat-module → Aggregate AI consultation metrics
6. metrics-tracking-service → Retrieve feature usage events
7. analytics-service → Calculate engagement scores and patterns
8. analytics-service → Segment users by behavior
9. dashboard-service → Render engagement visualizations
10. export-service → Generate CSV/PDF reports (optional)
```

---

## Flow 7: Report Generation Statistics

### User Journey

Owners, Leaders, and Managers monitor report generation performance, success rates, processing times, and identify any failed or pending reports that need attention.

### Step-by-Step Flow

1. **Report Statistics Access**
   - User navigates to "Analytics" > "Report Statistics"
   - Scope applied automatically based on user role
   - Date range filter: Last 7/30/90 days or custom

2. **Generation Volume Metrics**
   - Total reports generated in period
   - Reports by type: 8 report types breakdown (stacked bar chart)
   - Initial generation vs. quarterly regeneration split
   - Average reports per employee
   - Daily/weekly generation trend

3. **Generation Performance**
   - Average processing time per report type
   - Fastest and slowest report generation times
   - Queue wait time metrics
   - Concurrent generation capacity
   - Performance trend over time

4. **Success and Failure Rates**
   - Successful generation percentage
   - Failed reports count and reasons
   - Retry attempts and outcomes
   - Pending reports in queue
   - Alerts for stuck or failed reports

5. **Report Type Analysis**
   - Most/least generated report types
   - Average generation time by report type
   - Failure rate by report type
   - User preference patterns (most viewed types)

6. **Employee Coverage**
   - Employees with complete reports (all 8 types)
   - Employees with partial reports
   - Employees pending initial generation
   - Candidates vs. employees report status

7. **Quarterly Regeneration Tracking**
   - Last regeneration cycle completion date
   - Next scheduled regeneration date
   - Regeneration success rate
   - Employees updated in last cycle
   - Subscription status impact on regeneration

8. **AI Processing Metrics**
   - LLM API calls for report generation
   - Average token usage per report
   - AI processing cost estimation (Owner only)
   - API rate limit status
   - External service uptime

### Internal Module Flow

```
1. auth-guard → Verify user authentication
2. roles-guard → Apply scope-based filtering
3. reports-module → Query report generation logs
4. analytics-service → Calculate statistics and aggregations
5. bullmq-module → Fetch queue metrics (pending, failed jobs)
6. employees-module → Calculate employee coverage metrics
7. cron-module → Retrieve quarterly regeneration schedule
8. ai-service → Fetch LLM usage metrics
9. analytics-service → Generate performance insights
10. dashboard-service → Render statistics dashboard
```

---

## Flow 8: Feature Utilization Tracking

### User Journey

Platform administrators (Owners) track which features are most/least used across the platform to identify underutilized capabilities, guide product improvements, and optimize user training efforts.

### Step-by-Step Flow

1. **Feature Analytics Access**
   - User navigates to "Analytics" > "Feature Utilization"
   - Owner-level access (can be extended to Leaders for their scope)
   - Aggregated view across all users or filtered by role/department

2. **Core Feature Usage**
   - Dashboard access frequency
   - Employee Management: Add/Edit/Delete operations
   - Report Generation: Manual trigger usage
   - Report Viewing: Per report type breakdown
   - Report Download: Format preferences (PDF)
   - AI Chat: Session count and query volume

3. **Advanced Feature Adoption**
   - Report comparison tool usage (quarterly trends)
   - Bulk employee import usage
   - Department template utilization
   - Custom notification preferences configuration
   - Report sharing feature usage
   - Training recommendation implementation tracking

4. **Feature Adoption Funnel**
   - User awareness (feature visited at least once)
   - Initial usage (feature used 1-3 times)
   - Regular usage (feature used 4+ times)
   - Power usage (feature used weekly+)
   - Abandonment rate per feature

5. **Feature Interaction Patterns**
   - Most common feature sequence (user journey mapping)
   - Features used together frequently
   - Entry point features (first feature used in session)
   - Exit point features (last feature before logout)
   - Feature to feature navigation flow diagram

6. **Underutilized Features**
   - Features with <20% adoption rate
   - Features never used by certain roles
   - Features accessed but abandoned quickly
   - Opportunities for in-app guidance or training

7. **Role-Specific Utilization**
   - Owner feature usage patterns
   - Leader feature usage patterns
   - Manager feature usage patterns
   - Comparative analysis across roles

8. **Time-Based Trends**
   - Feature adoption over time since launch
   - Seasonal or weekly usage patterns
   - Correlation with training initiatives
   - Impact of new feature announcements

### Internal Module Flow

```
1. auth-guard → Verify Owner role
2. metrics-tracking-service → Query feature event logs
3. analytics-service → Aggregate usage by feature and role
4. users-module → Load user segmentation data
5. analytics-service → Calculate adoption rates and funnels
6. analytics-service → Identify usage patterns and sequences
7. analytics-service → Generate underutilization insights
8. dashboard-service → Render feature utilization dashboard
9. export-service → Generate feature utilization report
10. recommendations-engine → Suggest training focus areas
```

---

## Flow 9: Business Impact Metrics

### User Journey

Owners and senior leadership view high-level business metrics demonstrating platform ROI, including customer retention, user satisfaction, report actionability, and training implementation rates.

### Step-by-Step Flow

1. **Business Metrics Dashboard Access**
   - User navigates to "Analytics" > "Business Impact"
   - Owner-only access with executive summary view
   - Customizable dashboard with KPI cards

2. **Customer Retention Metrics**
   - Total active organizations on platform
   - Organization churn rate (monthly/annually)
   - Subscription renewal rate
   - Average customer lifetime value (LTV)
   - Retention cohort analysis (by signup month)
   - Organizations at risk of churn (low engagement)

3. **Subscription Health**
   - Active subscriptions by tier/plan
   - Monthly Recurring Revenue (MRR)
   - Annual Recurring Revenue (ARR)
   - Upgrade/downgrade trends
   - Subscription-related support tickets
   - Payment success rate

4. **User Satisfaction Metrics**
   - Net Promoter Score (NPS) - if collected
   - User satisfaction survey results
   - Feature feedback scores
   - Support ticket resolution time
   - In-app feedback sentiment analysis
   - AI chat satisfaction ratings

5. **Report Actionability Metrics**
   - Reports marked as "actionable" by users
   - Training recommendations implemented (tracked)
   - Follow-up actions taken after report viewing
   - Manager notes and action items logged
   - Time from report generation to action
   - Report influence on hiring decisions (candidate reports)

6. **Training Implementation Tracking**
   - Training recommendations generated
   - Training programs initiated based on reports
   - Employee skill improvement tracking
   - Correlation: training completion vs. performance
   - ROI of training recommendations
   - Most effective training types

7. **Organizational Impact**
   - Average employee retention at client organizations
   - Hiring success rate (candidates who succeed long-term)
   - Department compatibility improvement over time
   - Reduction in employee-manager conflicts
   - Team formation success metrics

8. **Platform Performance vs. Goals**
   - Active users target vs. actual
   - Report generation volume target vs. actual
   - AI consultation usage target vs. actual
   - Revenue target vs. actual
   - Growth rate trends

9. **ROI Calculation**
   - Platform development and maintenance costs
   - Revenue generated (subscriptions)
   - Customer acquisition cost (CAC)
   - LTV to CAC ratio
   - Overall profitability metrics

### Internal Module Flow

```
1. auth-guard → Verify Owner role
2. analytics-service → Query business metrics from data warehouse
3. payments-module → Retrieve subscription and revenue data
4. organizations-module → Calculate retention and churn metrics
5. reports-module → Fetch actionability and implementation data
6. users-module → Aggregate satisfaction survey results
7. employees-module → Calculate organizational impact metrics
8. analytics-service → Compute ROI and financial metrics
9. analytics-service → Generate executive insights and trends
10. dashboard-service → Render business impact dashboard
11. export-service → Generate executive PDF report
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Production Ready