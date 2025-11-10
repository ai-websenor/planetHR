# User Flows - Authentication & Authorization

## Overview

This document describes all user journey scenarios for the Authentication & Authorization module.

## Flow 1: JWT Based Authentication

### User Journey

A user (Owner, Leader, or Manager) accesses the PlanetsHR platform by logging in with their credentials. The system validates their identity, generates a JWT token, and maintains an authenticated session for secure access to platform features.

### Step-by-Step Flow

1. **Login Initiation**
   - User navigates to login page (`/auth/login`)
   - User enters email and password
   - User submits login form

2. **Credential Validation**
   - System receives login request
   - Auth service queries MongoDB for user record
   - Password hash comparison using bcrypt
   - Account status verification (active, not suspended)

3. **Token Generation**
   - System generates JWT payload with:
     - User ID
     - User role (Owner/Leader/Manager)
     - Organization ID
     - Branch/department scope
     - Token expiration (24 hours)
   - JWT signed with secret key
   - Refresh token generated (7 days validity)

4. **Session Management**
   - JWT stored in Redis with user ID as key
   - Refresh token stored in Redis with TTL
   - Session metadata logged (IP address, device info, login timestamp)

5. **Response to Client**
   - Access token returned in response body
   - Refresh token set in HTTP-only cookie
   - User profile data included in response
   - Redirect to role-specific dashboard

6. **Token Refresh Flow**
   - Client detects token expiration
   - Client sends refresh token to `/auth/refresh`
   - System validates refresh token from Redis
   - New access token generated and returned
   - Old token invalidated in Redis

7. **Logout Flow**
   - User initiates logout
   - System removes JWT from Redis
   - Refresh token invalidated
   - Audit log entry created
   - User redirected to login page

### Internal Module Flow

```
Client Request → Auth Controller → Auth Service → User Repository (MongoDB)
                                                → Token Service (Redis)
                                                → Audit Service (logging)
```

**Module Interactions:**
- **Auth Service** validates credentials and orchestrates authentication
- **User Repository** queries MongoDB for user data
- **Token Service** manages JWT lifecycle in Redis
- **Audit Service** logs authentication events
- **RBAC Service** retrieves role and permissions for token payload

---

## Flow 2: Role Based Access Control (Owner/Leader/Manager)

### User Journey

After authentication, users access platform features based on their assigned role. The system enforces role-based permissions to ensure users can only access data and perform actions appropriate to their role level (Owner, Leader, or Manager).

### Step-by-Step Flow

1. **Request Authentication**
   - User makes API request with JWT token in Authorization header
   - Auth guard intercepts request
   - Token extracted and validated

2. **Token Validation**
   - JWT signature verification
   - Token expiration check
   - Token existence validation in Redis
   - User account status verification

3. **Role Extraction**
   - Role claim extracted from JWT payload
   - Organization and scope information retrieved
   - User permissions loaded from cache or database

4. **Permission Check**
   - RBAC guard evaluates required role for endpoint
   - Current user role compared against required roles
   - Hierarchical role check (Owner > Leader > Manager)

5. **Access Decision**
   - **Owner Access**: Full system access granted
     - All branches and departments
     - All employees and candidates
     - System configuration and user management
   - **Leader Access**: Multi-department access
     - Assigned branches only
     - Multiple departments within scope
     - Employee management within scope
   - **Manager Access**: Single department access
     - Assigned department only
     - Employee management within department
     - Limited configuration options

6. **Request Processing**
   - If authorized: request proceeds to controller
   - If unauthorized: 403 Forbidden response returned
   - Audit log entry created for access attempt

7. **Data Scope Filtering**
   - Query filters applied based on role scope
   - Results limited to user's accessible data
   - Cross-branch/department data blocked automatically

### Internal Module Flow

```
Client Request → JWT Auth Guard → RBAC Guard → Scope Filter Guard
                      ↓               ↓              ↓
                Token Service   Permission Cache  Scope Service
                      ↓               ↓              ↓
                   Redis          MongoDB        Controller
                                                      ↓
                                              Audit Service
```

**Module Interactions:**
- **JWT Auth Guard** validates token authenticity
- **RBAC Guard** enforces role-based permissions
- **Scope Filter Guard** applies data isolation rules
- **Permission Cache** stores role permissions for performance
- **Audit Service** logs all access attempts and decisions

---

## Flow 3: Hierarchical Permission System

### User Journey

Users operate within a hierarchical permission structure where higher roles inherit lower role capabilities. The system enforces this hierarchy to maintain organizational structure and prevent privilege escalation.

### Step-by-Step Flow

1. **Permission Hierarchy Definition**
   - **Owner Permissions** (Level 3 - Highest):
     - Manage organization settings
     - Create/delete Leaders and Managers
     - Access all branches and departments
     - Configure billing and subscriptions
     - View all reports and analytics
     - Full audit log access
   - **Leader Permissions** (Level 2):
     - Manage assigned branches
     - Create/delete Managers within scope
     - Add/remove employees in assigned departments
     - Generate reports for scope
     - Access AI chat for their employees
   - **Manager Permissions** (Level 1):
     - Manage single department
     - Add/remove employees in department
     - Generate reports for department
     - Access AI chat for department employees

2. **Permission Inheritance**
   - Owner inherits all Leader permissions
   - Owner inherits all Manager permissions
   - Leader inherits all Manager permissions
   - Lower roles cannot access higher role features

3. **Action Request Flow**
   - User attempts protected action (e.g., create Manager)
   - System extracts user role from JWT
   - Required permission level checked in decorator
   - Hierarchical comparison performed

4. **User Management Restrictions**
   - Owner can manage Leaders and Managers
   - Leader can only manage Managers
   - Manager cannot manage any users
   - Users cannot modify their own role
   - Cross-organization user management blocked

5. **Data Access Hierarchy**
   - Owner: Organization-wide data access
   - Leader: Multi-branch/department access within scope
   - Manager: Single department access only
   - Automatic filtering applied to all queries

6. **Feature Access Control**
   - Company setup: Owner only
   - Branch management: Owner only
   - Department management: Owner and Leader
   - Employee management: All roles (scope-limited)
   - Report generation: All roles (scope-limited)
   - Subscription management: Owner only

7. **Permission Escalation Prevention**
   - Role change requests require higher authority
   - Scope expansion requires owner approval
   - Audit trail for all permission changes
   - Automatic permission revocation on role change

### Internal Module Flow

```
Action Request → Permission Decorator → RBAC Service → Permission Repository
                                             ↓
                                    Hierarchy Validator
                                             ↓
                                    Access Decision → Audit Log
```

**Module Interactions:**
- **Permission Decorator** marks endpoints with required permissions
- **RBAC Service** evaluates permission hierarchy
- **Hierarchy Validator** ensures role-based access rules
- **Permission Repository** stores permission matrix in MongoDB
- **Audit Service** tracks permission checks and violations

---

## Flow 4: Branch Level Data Isolation

### User Journey

Organizations with multiple branches require data isolation to prevent cross-branch access. The system ensures users can only access data from branches within their assigned scope, maintaining data privacy and organizational structure.

### Step-by-Step Flow

1. **Branch Assignment on User Creation**
   - Owner creates Leader or Manager account
   - Branch assignment selected during creation
   - Branch IDs stored in user profile
   - Scope metadata added to user record

2. **Branch Scope in JWT**
   - User logs in successfully
   - JWT payload includes:
     - `organizationId`: Parent organization
     - `branchIds`: Array of accessible branch IDs
     - `role`: User role level
   - Token issued with branch scope embedded

3. **Request Processing with Branch Filter**
   - User requests employee list
   - Auth guard extracts JWT
   - Branch scope retrieved from token
   - Query automatically filtered by branch IDs

4. **Multi-branch Access (Leaders)**
   - Leader assigned to multiple branches
   - JWT contains array of branch IDs
   - Queries use `$in` operator for branch filtering
   - Results aggregate across assigned branches only

5. **Single Branch Access (Managers)**
   - Manager assigned to single branch
   - JWT contains single branch ID
   - Queries filtered by exact branch match
   - Cross-branch requests automatically rejected

6. **Owner Unrestricted Access**
   - Owner JWT includes organization ID
   - No branch filter applied
   - All organizational branches accessible
   - Branch filter bypass for organization scope

7. **Branch Isolation Enforcement**
   - Database queries inject branch filter automatically
   - Query interceptor adds `branchId` clause
   - Manual branch ID override blocked
   - Audit log for cross-branch access attempts

8. **Branch Creation and Management**
   - Owner creates new branch
   - Branch metadata stored in MongoDB
   - Unique branch ID generated
   - Branch associated with organization

9. **Employee Assignment to Branch**
   - Employee record includes `branchId` field
   - Branch must exist and belong to organization
   - Employee visible only to users with branch access
   - Reports scoped to branch automatically

10. **Branch Deletion and Data Migration**
    - Owner initiates branch deletion
    - System checks for assigned employees
    - Optional data migration to another branch
    - User access to deleted branch removed

### Internal Module Flow

```
API Request → Auth Guard → JWT Extraction → Branch Scope Service
                                                    ↓
                                           Query Interceptor
                                                    ↓
                                    MongoDB Query + branchId Filter
                                                    ↓
                                            Filtered Results
                                                    ↓
                                            Response + Audit Log
```

**Module Interactions:**
- **Auth Guard** validates token and extracts branch scope
- **Branch Scope Service** manages branch access rules
- **Query Interceptor** automatically adds branch filters to database queries
- **Organization Service** manages branch hierarchy
- **Audit Service** logs branch access patterns and violations

---

## Flow 5: Department Scoped Access Control

### User Journey

Within branches, users are assigned specific departments that define their data access scope. Managers access single departments, Leaders access multiple departments, and Owners have organization-wide access. The system enforces department-level isolation for data privacy and operational boundaries.

### Step-by-Step Flow

1. **Department Assignment on User Creation**
   - Owner or Leader creates Manager account
   - Single department selected and assigned
   - Department ID stored in user profile
   - Manager scope limited to assigned department

2. **Multi-Department Assignment (Leaders)**
   - Owner creates Leader account
   - Multiple departments selected across branches
   - Department IDs array stored in user profile
   - Leader scope covers all assigned departments

3. **Department Scope in JWT**
   - User logs in successfully
   - JWT payload includes:
     - `departmentIds`: Array of accessible department IDs
     - `branchIds`: Parent branches of departments
     - `role`: User role level
   - Token issued with department scope

4. **Employee Data Access**
   - User requests employee list
   - System extracts department scope from JWT
   - Query filtered by `departmentId IN (user.departmentIds)`
   - Only employees in accessible departments returned

5. **Report Generation Access**
   - User requests employee report
   - System validates employee's department
   - Department ID compared against user's scope
   - Report access granted if department matches

6. **Department Hierarchy Navigation**
   - Manager views single department dashboard
   - Leader views multi-department aggregated dashboard
   - Owner views organization-wide dashboard
   - Navigation menus filtered by accessible departments

7. **Employee Assignment to Department**
   - Manager/Leader adds new employee
   - Department selection limited to user's accessible departments
   - Employee `departmentId` set during creation
   - Employee visible to users with department access

8. **Department Transfer**
   - Leader initiates employee department transfer
   - Both source and target departments must be in user's scope
   - Employee `departmentId` updated
   - Historical department assignment logged

9. **Cross-Department Report Generation**
   - Leader generates compatibility report for employees in different departments
   - System validates both employees' departments in user's scope
   - Report generated if both departments accessible
   - Cross-department interaction logged

10. **Department Deletion and Reassignment**
    - Owner or Leader deletes department
    - System identifies all assigned employees
    - Employees reassigned to different department
    - Managers assigned to deleted department notified
    - User access updated automatically

### Internal Module Flow

```
API Request → Auth Guard → JWT Extraction → Department Scope Service
                                                    ↓
                                           Scope Validation
                                                    ↓
                                    Department Filter Application
                                                    ↓
                                    MongoDB Query + departmentId Filter
                                                    ↓
                                            Filtered Results
                                                    ↓
                                            Response + Audit Log
```

**Module Interactions:**
- **Auth Guard** validates token and extracts department scope
- **Department Scope Service** manages department access rules and validation
- **Scope Validation Service** ensures requested data is within user's department scope
- **Query Interceptor** automatically adds department filters to database queries
- **Organization Service** manages department hierarchy and structure
- **Employee Service** enforces department-based employee access
- **Audit Service** logs department access patterns and scope violations

---

## Flow 6: Audit Logging For User Actions

### User Journey

All user actions in the system are tracked and logged for security, compliance, and troubleshooting purposes. The audit system captures authentication events, data access, modifications, and permission changes, providing a complete activity trail.

### Step-by-Step Flow

1. **Audit Log Trigger Points**
   - **Authentication Events**:
     - Login attempts (success/failure)
     - Logout events
     - Token refresh requests
     - Password changes
     - Account lockouts
   - **Data Access Events**:
     - Employee record views
     - Report generation
     - Bulk data exports
     - AI chat interactions
   - **Data Modification Events**:
     - Employee creation/update/deletion
     - User management actions
     - Department/branch changes
     - Organization settings modifications
   - **Permission Events**:
     - Role changes
     - Scope modifications
     - Permission grants/revokes
     - Access denial (403 errors)

2. **Log Entry Creation**
   - Action interceptor captures request
   - Log entry created with:
     - **Timestamp**: ISO 8601 format
     - **User ID**: Acting user identifier
     - **User Role**: Role at time of action
     - **Action Type**: Category and specific action
     - **Resource Type**: Target entity (employee, user, report, etc.)
     - **Resource ID**: Specific entity identifier
     - **IP Address**: Client IP address
     - **User Agent**: Browser/device information
     - **Request Payload**: Sanitized request data
     - **Response Status**: HTTP status code
     - **Changes**: Before/after state for modifications
     - **Scope Context**: Branch/department context

3. **Asynchronous Log Storage**
   - Log entry queued in Redis for processing
   - Audit service worker processes queue
   - Log stored in MongoDB audit collection
   - High-priority logs (security events) processed immediately
   - Log retention policy applied (configurable duration)

4. **Failed Authentication Logging**
   - Failed login attempt captured
   - User email, IP address, timestamp recorded
   - Multiple failed attempts trigger security alert
   - Account lockout after threshold (5 attempts)
   - Lockout event logged with duration

5. **Data Access Logging**
   - User views employee report
   - Log entry includes:
     - Employee ID accessed
     - Report type viewed
     - Department/branch context
     - Access timestamp
   - Sensitive data access flagged for review

6. **Modification Tracking**
   - User updates employee record
   - System captures:
     - Original field values
     - Updated field values
     - Change reason (if provided)
     - Approval status (if required)
   - Change diff stored in log entry

7. **Permission Change Logging**
   - Owner modifies user role
   - Log entry captures:
     - Target user ID
     - Previous role and scope
     - New role and scope
     - Reason for change
     - Approval workflow (if applicable)

8. **Audit Log Query Interface**
   - **Owner Access**: Full audit log access
   - **Leader Access**: Logs for their scope only
   - **Manager Access**: Logs for their department
   - Search filters:
     - Date range
     - User ID
     - Action type
     - Resource type
     - IP address
   - Export capability for compliance reporting

9. **Security Alert Generation**
   - Audit service analyzes log patterns
   - Anomaly detection rules:
     - Multiple failed logins
     - Access outside normal hours
     - Bulk data access
     - Permission escalation attempts
     - Cross-scope access attempts
   - Alerts sent to administrators
   - Automatic actions (account suspension, etc.)

10. **Compliance Reporting**
    - Scheduled audit report generation
    - Compliance metrics calculated:
      - Access patterns
      - Permission changes
      - Data modifications
      - Security incidents
    - Reports exported for regulatory compliance
    - Long-term archival to cold storage

### Internal Module Flow

```
User Action → Action Interceptor → Audit Service → Redis Queue
                     ↓                                  ↓
              Audit Decorator                   Audit Worker
                     ↓                                  ↓
           Request/Response Capture            MongoDB Audit Collection
                     ↓                                  ↓
              Continue Request                   Anomaly Detection
                                                         ↓
                                                 Alert Service (if needed)
```

**Module Interactions:**
- **Action Interceptor** captures all HTTP requests/responses
- **Audit Decorator** marks sensitive endpoints for detailed logging
- **Audit Service** creates and manages log entries
- **Redis Queue** buffers logs for asynchronous processing
- **Audit Worker** processes queue and stores logs in MongoDB
- **Anomaly Detection Service** analyzes patterns for security threats
- **Alert Service** notifies administrators of security events
- **Compliance Service** generates regulatory reports from audit logs

**Audit Log MongoDB Schema:**
```typescript
{
  _id: ObjectId,
  timestamp: Date,
  userId: ObjectId,
  userEmail: String,
  userRole: String,
  organizationId: ObjectId,
  branchId: ObjectId,
  departmentId: ObjectId,
  actionType: String,        // 'auth', 'data_access', 'data_modify', 'permission'
  actionName: String,        // 'login', 'view_report', 'update_employee'
  resourceType: String,      // 'employee', 'user', 'report', 'organization'
  resourceId: ObjectId,
  ipAddress: String,
  userAgent: String,
  requestMethod: String,     // GET, POST, PUT, DELETE
  requestPath: String,
  requestPayload: Object,    // Sanitized request body
  responseStatus: Number,    // HTTP status code
  changesBefore: Object,     // Previous state
  changesAfter: Object,      // New state
  changesDiff: Object,       // Computed differences
  securityLevel: String,     // 'low', 'medium', 'high', 'critical'
  complianceCategory: String, // 'gdpr', 'ccpa', 'hipaa', 'sox'
  retentionPolicy: String,   // Retention period identifier
  archived: Boolean,
  archivedAt: Date
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Complete