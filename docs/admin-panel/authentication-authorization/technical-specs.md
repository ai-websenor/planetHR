# Technical Specifications - Authentication & Authorization

## Architecture Overview

This module is part of a monolithic application architecture with well-defined internal modules and layers.

The Authentication & Authorization module implements a secure, role-based access control system within the PlanetsHR monolithic architecture. Built on NestJS framework, it provides JWT-based authentication, hierarchical permission management, and comprehensive audit logging. The module integrates deeply with MongoDB for persistent storage and Redis for session management and token caching.

The architecture follows a layered approach with clear separation of concerns:
- **Presentation Layer**: Controllers handling HTTP requests and responses
- **Business Logic Layer**: Services implementing authentication logic, role validation, and permission checks
- **Data Access Layer**: Repositories managing database operations and data persistence

The module implements a hierarchical permission model where:
- **Owner** has complete organizational access
- **Leader** has multi-department access within assigned scope
- **Manager** has single-department access within assigned scope

Data isolation is enforced at branch and department levels, ensuring users can only access information within their authorized scope.

## Application Modules

### auth-service

**Responsibility:**
Handles user authentication, JWT token generation and validation, password management, and session lifecycle. Provides core authentication mechanisms including login, logout, token refresh, password reset, and two-factor authentication support.

**Layer:** Presentation Layer (Controllers) + Business Logic Layer (Services)

**Dependencies:**
- `rbac-service` (for role validation during authentication)
- `audit-service` (for logging authentication events)
- `users-module` (for user data retrieval)
- `organizations-module` (for organization context)
- MongoDB (user credentials storage)
- Redis (session and token cache)
- JWT Library (token operations)
- BCrypt (password hashing)

**Exposed APIs:**
- `POST /auth/login` - User authentication with credentials
- `POST /auth/logout` - Session termination
- `POST /auth/refresh` - JWT token refresh
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset execution
- `POST /auth/verify-token` - Token validation for other modules
- `GET /auth/me` - Current user profile retrieval

### rbac-service

**Responsibility:**
Manages Role-Based Access Control (RBAC) logic including role assignment, permission validation, hierarchical access control, and scope-based data filtering. Enforces branch-level and department-level data isolation across the application.

**Layer:** Business Logic Layer (Services) + Data Access Layer (Repositories)

**Dependencies:**
- `auth-service` (for user authentication context)
- `audit-service` (for permission check logging)
- `users-module` (for user role information)
- `organizations-module` (for organizational hierarchy)
- MongoDB (roles and permissions storage)
- Redis (permission cache)

**Exposed APIs:**
- `checkPermission(userId, resource, action)` - Internal API for permission validation
- `getUserScope(userId)` - Returns user's accessible branches/departments
- `validateRoleHierarchy(requesterId, targetUserId)` - Validates hierarchical relationships
- `canAccessEmployee(userId, employeeId)` - Employee-specific access check
- `canAccessDepartment(userId, departmentId)` - Department-specific access check
- `canAccessBranch(userId, branchId)` - Branch-specific access check
- `filterByScope(userId, query)` - Applies scope filters to database queries

### audit-service

**Responsibility:**
Provides comprehensive audit logging for all authentication and authorization events including login attempts, permission checks, role changes, and access violations. Maintains immutable audit trails for compliance and security monitoring.

**Layer:** Business Logic Layer (Services) + Data Access Layer (Repositories)

**Dependencies:**
- `auth-service` (for user context)
- MongoDB (audit logs storage)
- Redis (recent activity cache)
- Queue System (asynchronous log processing)

**Exposed APIs:**
- `logAuthEvent(event)` - Internal API for authentication event logging
- `logPermissionCheck(userId, resource, action, result)` - Permission check logging
- `logAccessViolation(userId, resource, reason)` - Security violation logging
- `logRoleChange(adminId, userId, oldRole, newRole)` - Role modification logging
- `GET /audit/logs` - Retrieve audit logs (Owner only)
- `GET /audit/user-activity/:userId` - User-specific activity logs
- `GET /audit/security-events` - Security-related event logs


## Layered Architecture

### Presentation Layer

**Components:**
- **AuthController**: Handles authentication endpoints (login, logout, refresh, password reset)
- **UserController**: Manages user profile and account operations
- **AdminController**: Provides administrative endpoints for user management

**Responsibilities:**
- HTTP request/response handling
- Input validation using DTOs (Data Transfer Objects) with class-validator
- Request transformation and serialization
- API documentation via Swagger decorators
- Rate limiting and throttling
- CORS configuration

**Guards & Decorators:**
- `@UseGuards(JwtAuthGuard)` - JWT token validation
- `@UseGuards(RolesGuard)` - Role-based access control
- `@Roles(UserRole.OWNER, UserRole.LEADER)` - Required roles specification
- `@Public()` - Public endpoint marker (bypasses authentication)
- `@CurrentUser()` - Extracts authenticated user from request

**DTOs:**
- `LoginDto` - Login credentials validation
- `RegisterDto` - User registration data
- `ResetPasswordDto` - Password reset request
- `UpdateProfileDto` - User profile updates
- `CreateUserDto` - Admin user creation
- `UpdateRoleDto` - Role assignment/modification

### Business Logic Layer

**Services:**

**AuthService:**
- JWT token generation (access + refresh tokens)
- Password hashing and verification using BCrypt
- Session management with Redis
- Token blacklisting for logout
- Password reset token generation and validation
- Rate limiting for authentication attempts
- Two-factor authentication logic (future enhancement)

**RBACService:**
- Role assignment and validation
- Permission checking against resource-action pairs
- Hierarchical permission resolution (Owner → Leader → Manager)
- Scope-based filtering logic
- Branch and department access validation
- Dynamic permission caching
- Role inheritance rules

**AuditService:**
- Event logging with contextual metadata
- Asynchronous log processing via BullMQ
- Log retention and archival policies
- Security event detection and alerting
- Compliance report generation
- Activity timeline construction

**PasswordService:**
- Password strength validation
- Password history management (prevent reuse)
- Secure password reset workflows
- Password expiration policies
- Breach detection integration (HaveIBeenPwned API)

**SessionService:**
- Active session tracking
- Multi-device session management
- Session revocation and timeout
- Concurrent session limits
- Session activity monitoring

**Business Rules:**
- Owner can manage all users in organization
- Leader can manage users in assigned departments
- Manager can only manage users in single department
- Users cannot modify their own roles
- Role changes require higher-level authorization
- Password must meet complexity requirements
- Failed login attempts trigger temporary lockout
- Token refresh requires valid refresh token
- Audit logs are immutable and append-only

### Data Access Layer

**Repositories:**

**UserRepository:**
- CRUD operations for user entities
- Scope-filtered queries based on role hierarchy
- Efficient lookup by email, username, organization
- Soft delete implementation
- User search with pagination

**RoleRepository:**
- Role definition and permission mapping
- Role hierarchy queries
- Permission set retrieval
- Custom role creation (future enhancement)

**SessionRepository:**
- Session storage and retrieval from Redis
- Session expiration management
- Active session queries by user
- Session cleanup and garbage collection

**AuditLogRepository:**
- Immutable audit log insertion
- Time-range and user-filtered queries
- Event type filtering
- Aggregation for reporting
- Efficient indexing strategy

**Database Operations:**
- Mongoose ODM for MongoDB operations
- Transaction support for critical operations
- Optimistic locking for concurrent updates
- Connection pooling and retry logic
- Query optimization with proper indexing

**Caching Layer:**
- Redis integration for high-performance caching
- Permission cache with TTL (Time To Live)
- Session state caching
- User profile caching
- Cache invalidation strategies

## API Endpoints

### Authentication Endpoints

**POST /api/v1/auth/login**
- **Purpose**: Authenticate user and generate JWT tokens
- **Access**: Public
- **Request Body**: `{ email: string, password: string }`
- **Response**: `{ accessToken: string, refreshToken: string, user: UserDto }`
- **Status Codes**: 200 (Success), 401 (Invalid credentials), 429 (Too many attempts)

**POST /api/v1/auth/logout**
- **Purpose**: Invalidate current session and tokens
- **Access**: Authenticated users
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ message: "Logged out successfully" }`
- **Status Codes**: 200 (Success), 401 (Unauthorized)

**POST /api/v1/auth/refresh**
- **Purpose**: Generate new access token using refresh token
- **Access**: Public (requires valid refresh token)
- **Request Body**: `{ refreshToken: string }`
- **Response**: `{ accessToken: string, refreshToken: string }`
- **Status Codes**: 200 (Success), 401 (Invalid token)

**POST /api/v1/auth/forgot-password**
- **Purpose**: Initiate password reset process
- **Access**: Public
- **Request Body**: `{ email: string }`
- **Response**: `{ message: "Reset email sent" }`
- **Status Codes**: 200 (Success), 404 (User not found)

**POST /api/v1/auth/reset-password**
- **Purpose**: Complete password reset with token
- **Access**: Public (requires reset token)
- **Request Body**: `{ token: string, newPassword: string }`
- **Response**: `{ message: "Password reset successful" }`
- **Status Codes**: 200 (Success), 400 (Invalid token), 422 (Weak password)

**GET /api/v1/auth/me**
- **Purpose**: Retrieve current authenticated user profile
- **Access**: Authenticated users
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `UserDto with role and scope information`
- **Status Codes**: 200 (Success), 401 (Unauthorized)

### User Management Endpoints

**POST /api/v1/users**
- **Purpose**: Create new user (Leader or Manager)
- **Access**: Owner, Leader (within scope)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `CreateUserDto`
- **Response**: `Created user entity`
- **Status Codes**: 201 (Created), 403 (Forbidden), 409 (Email exists)

**GET /api/v1/users**
- **Purpose**: List users within authorized scope
- **Access**: Owner, Leader, Manager (scope-filtered)
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `?page=1&limit=20&role=LEADER&departmentId=xxx`
- **Response**: `Paginated list of users`
- **Status Codes**: 200 (Success), 401 (Unauthorized)

**GET /api/v1/users/:id**
- **Purpose**: Retrieve specific user details
- **Access**: Owner, Leader, Manager (scope-validated)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `Detailed user entity`
- **Status Codes**: 200 (Success), 403 (Forbidden), 404 (Not found)

**PATCH /api/v1/users/:id**
- **Purpose**: Update user information
- **Access**: Owner, Leader (hierarchical validation)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `UpdateUserDto`
- **Response**: `Updated user entity`
- **Status Codes**: 200 (Success), 403 (Forbidden), 404 (Not found)

**DELETE /api/v1/users/:id**
- **Purpose**: Soft delete user account
- **Access**: Owner, Leader (hierarchical validation)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ message: "User deleted successfully" }`
- **Status Codes**: 200 (Success), 403 (Forbidden), 404 (Not found)

**PATCH /api/v1/users/:id/role**
- **Purpose**: Change user role
- **Access**: Owner only
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{ role: UserRole, departmentIds?: string[] }`
- **Response**: `Updated user with new role`
- **Status Codes**: 200 (Success), 403 (Forbidden)

### Audit Log Endpoints

**GET /api/v1/audit/logs**
- **Purpose**: Retrieve audit logs
- **Access**: Owner only
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `?startDate=ISO&endDate=ISO&userId=xxx&eventType=LOGIN`
- **Response**: `Paginated audit log entries`
- **Status Codes**: 200 (Success), 403 (Forbidden)

**GET /api/v1/audit/user-activity/:userId**
- **Purpose**: User-specific activity timeline
- **Access**: Owner, Leader (for their scope)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `User activity log entries`
- **Status Codes**: 200 (Success), 403 (Forbidden)

**GET /api/v1/audit/security-events**
- **Purpose**: Security-related events (failed logins, access violations)
- **Access**: Owner only
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `?severity=HIGH&limit=50`
- **Response**: `Security event log entries`
- **Status Codes**: 200 (Success), 403 (Forbidden)

## Database Schemas

### Users Collection

```typescript
{
  _id: ObjectId,
  email: string (unique, indexed),
  username: string (unique, indexed),
  passwordHash: string,
  role: enum ['OWNER', 'LEADER', 'MANAGER'],
  organizationId: ObjectId (indexed, ref: 'organizations'),
  branchIds: ObjectId[] (indexed, ref: 'branches'),
  departmentIds: ObjectId[] (indexed, ref: 'departments'),
  firstName: string,
  lastName: string,
  phoneNumber: string?,
  isActive: boolean (default: true),
  isEmailVerified: boolean (default: false),
  lastLoginAt: Date?,
  passwordChangedAt: Date?,
  passwordResetToken: string?,
  passwordResetExpires: Date?,
  failedLoginAttempts: number (default: 0),
  lockedUntil: Date?,
  createdBy: ObjectId (ref: 'users'),
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date? (soft delete)
}
```

**Indexes:**
- `{ email: 1 }` - Unique
- `{ username: 1 }` - Unique
- `{ organizationId: 1, role: 1 }`
- `{ organizationId: 1, departmentIds: 1 }`
- `{ passwordResetToken: 1 }`
- `{ isActive: 1, deletedAt: 1 }`

### Roles Collection

```typescript
{
  _id: ObjectId,
  name: enum ['OWNER', 'LEADER', 'MANAGER'],
  displayName: string,
  description: string,
  permissions: [
    {
      resource: string, // e.g., 'employees', 'reports', 'users'
      actions: string[] // e.g., ['create', 'read', 'update', 'delete']
    }
  ],
  hierarchy: number, // 1 (Owner), 2 (Leader), 3 (Manager)
  isSystemRole: boolean (default: true),
  organizationId: ObjectId?, // null for system roles
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ name: 1, organizationId: 1 }` - Unique
- `{ hierarchy: 1 }`

### Sessions Collection (Redis)

```typescript
{
  key: `session:${userId}:${sessionId}`,
  value: {
    userId: string,
    sessionId: string,
    accessToken: string,
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
    issuedAt: number (timestamp),
    expiresAt: number (timestamp),
    lastActivityAt: number (timestamp)
  },
  ttl: 7 days (for refresh token)
}
```

**Additional Redis Keys:**
- `token:blacklist:${token}` - Blacklisted tokens (TTL = token expiry)
- `user:permissions:${userId}` - Cached permissions (TTL = 1 hour)
- `user:scope:${userId}` - Cached user scope (TTL = 1 hour)
- `login:attempts:${email}` - Failed login tracking (TTL = 15 minutes)

### AuditLogs Collection

```typescript
{
  _id: ObjectId,
  eventType: enum [
    'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 
    'PASSWORD_RESET', 'PASSWORD_CHANGED',
    'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
    'ROLE_CHANGED', 'PERMISSION_DENIED',
    'TOKEN_REFRESH', 'SESSION_EXPIRED'
  ],
  userId: ObjectId? (ref: 'users'),
  performedBy: ObjectId? (ref: 'users'),
  organizationId: ObjectId (indexed, ref: 'organizations'),
  resource: string?, // e.g., 'users', 'employees'
  resourceId: string?,
  action: string?, // e.g., 'create', 'update', 'delete'
  result: enum ['SUCCESS', 'FAILURE', 'DENIED'],
  metadata: {
    ipAddress: string,
    userAgent: string,
    requestId: string,
    oldValues: object?,
    newValues: object?,
    reason: string?,
    errorMessage: string?
  },
  severity: enum ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  timestamp: Date (indexed),
  createdAt: Date
}
```

**Indexes:**
- `{ organizationId: 1, timestamp: -1 }`
- `{ userId: 1, timestamp: -1 }`
- `{ eventType: 1, timestamp: -1 }`
- `{ severity: 1, timestamp: -1 }`
- `{ result: 1, timestamp: -1 }`
- TTL Index: `{ timestamp: 1 }` - Auto-delete after 2 years

### PasswordHistory Collection

```typescript
{
  _id: ObjectId,
  userId: ObjectId (indexed, ref: 'users'),
  passwordHash: string,
  changedAt: Date,
  createdAt: Date
}
```

**Indexes:**
- `{ userId: 1, changedAt: -1 }`
- TTL Index: `{ createdAt: 1 }` - Keep last 12 months only

## Caching Strategy

### Cache Layers

**1. User Permission Cache (Redis)**
- **Key Pattern**: `user:permissions:${userId}`
- **TTL**: 1 hour
- **Invalidation**: On role change, permission update
- **Purpose**: Fast permission lookups without database queries
- **Data Structure**: JSON string of permission map

**2. User Scope Cache (Redis)**
- **Key Pattern**: `user:scope:${userId}`
- **TTL**: 1 hour
- **Invalidation**: On department/branch assignment change
- **Purpose**: Rapid scope validation for data access
- **Data Structure**: `{ branchIds: [], departmentIds: [], role: string }`

**3. Session Cache (Redis)**
- **Key Pattern**: `session:${userId}:${sessionId}`
- **TTL**: 7 days (refresh token lifetime)
- **Invalidation**: On logout, token expiry
- **Purpose**: Session state management without database
- **Data Structure**: Session object with tokens and metadata

**4. Token Blacklist (Redis)**
- **Key Pattern**: `token:blacklist:${tokenId}`
- **TTL**: Token expiry time
- **Purpose**: Revoked token tracking for logout
- **Data Structure**: Boolean flag with expiry

**5. Failed Login Attempts (Redis)**
- **Key Pattern**: `login:attempts:${email}`
- **TTL**: 15 minutes
- **Purpose**: Rate limiting and account lockout
- **Data Structure**: Counter value

**6. Role Definition Cache (Redis)**
- **Key Pattern**: `role:definition:${roleName}`
- **TTL**: 24 hours
- **Invalidation**: On role permission update (rare)
- **Purpose**: Quick role permission lookup
- **Data Structure**: Complete role object with permissions

### Cache Invalidation Strategies

**Write-Through:**
- User profile updates invalidate `user:permissions:${userId}` and `user:scope:${userId}`
- Role changes invalidate all affected user caches

**Time-Based Expiration:**
- Permission cache: 1 hour (balance between freshness and performance)
- Scope cache: 1 hour
- Session cache: 7 days (refresh token lifetime)
- Failed attempts: 15 minutes (security window)

**Event-Based Invalidation:**
- User role change → Invalidate user permissions and scope
- Department assignment change → Invalidate user scope
- System-wide role update → Invalidate all role definition caches

**Cache Warming:**
- On user login, preload permissions and scope into cache
- Background job to warm frequently accessed user caches

### Performance Optimization

**Cache Hit Ratio Targets:**
- Permission checks: >95% cache hit ratio
- Scope validation: >90% cache hit ratio
- Session validation: >98% cache hit ratio

**Fallback Strategy:**
- Cache miss → Query database → Store in cache
- Redis unavailable → Direct database queries (degraded mode)
- Database query timeout → Return cached stale data with warning

**Monitoring:**
- Track cache hit/miss ratios per cache type
- Monitor cache memory usage and eviction rates
- Alert on cache cluster failures
- Log slow database fallback queries

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Draft