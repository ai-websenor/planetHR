# API Contracts - Authentication & Authorization

## Overview

This document defines all API endpoints (internal and external) for the Authentication & Authorization module. The system uses JWT-based authentication with role-based access control supporting Owner, Leader, and Manager hierarchies.

## Base URL

```
Production: https://api.planetshr.com/v1
Development: http://localhost:3000/v1
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## External APIs

### Authentication Endpoints

#### POST /auth/register
Register a new organization owner account.

**Request Body:**
```json
{
  "email": "owner@company.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "Acme Corporation",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123",
    "organizationId": "org_xyz789",
    "role": "OWNER",
    "email": "owner@company.com",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `409 Conflict` - Email already exists

---

#### POST /auth/login
Authenticate user and obtain JWT tokens.

**Request Body:**
```json
{
  "email": "user@company.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123",
    "organizationId": "org_xyz789",
    "role": "LEADER",
    "permissions": ["employee:read", "employee:write", "report:read"],
    "scope": {
      "branches": ["branch_001", "branch_002"],
      "departments": ["dept_hr", "dept_finance"]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account locked or disabled
- `404 Not Found` - User not found

---

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired refresh token

---

#### POST /auth/logout
Invalidate current session and tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid token

---

#### POST /auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@company.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset instructions sent to email"
}
```

**Error Responses:**
- `404 Not Found` - Email not found (returns 200 for security)

---

#### POST /auth/reset-password
Reset password using token from email.

**Request Body:**
```json
{
  "token": "reset_token_abc123",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password successfully reset"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid or expired token
- `422 Unprocessable Entity` - Password doesn't meet requirements

---

#### POST /auth/change-password
Change password for authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password successfully changed"
}
```

**Error Responses:**
- `401 Unauthorized` - Current password incorrect
- `422 Unprocessable Entity` - New password doesn't meet requirements

---

### User Management Endpoints

#### POST /users
Create a new user (Leader or Manager).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Required Role:** OWNER (for Leaders), OWNER/LEADER (for Managers)

**Request Body:**
```json
{
  "email": "leader@company.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "LEADER",
  "phone": "+1234567890",
  "scope": {
    "branches": ["branch_001"],
    "departments": ["dept_hr", "dept_finance"]
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_def456",
    "email": "leader@company.com",
    "role": "LEADER",
    "organizationId": "org_xyz789",
    "scope": {
      "branches": ["branch_001"],
      "departments": ["dept_hr", "dept_finance"]
    },
    "createdAt": "2025-11-10T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input data
- `403 Forbidden` - Insufficient permissions
- `409 Conflict` - Email already exists

---

#### GET /users/:userId
Retrieve user details.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Required Role:** OWNER, LEADER (scope-limited)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_def456",
    "email": "leader@company.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "LEADER",
    "phone": "+1234567890",
    "organizationId": "org_xyz789",
    "scope": {
      "branches": ["branch_001"],
      "departments": ["dept_hr", "dept_finance"]
    },
    "isActive": true,
    "lastLogin": "2025-11-10T09:15:00Z",
    "createdAt": "2025-11-01T10:30:00Z",
    "updatedAt": "2025-11-10T09:15:00Z"
  }
}
```

**Error Responses:**
- `403 Forbidden` - User outside requester's scope
- `404 Not Found` - User not found

---

#### PUT /users/:userId
Update user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Required Role:** OWNER, LEADER (scope-limited)

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith-Johnson",
  "phone": "+1234567891",
  "scope": {
    "branches": ["branch_001", "branch_002"],
    "departments": ["dept_hr", "dept_finance", "dept_it"]
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_def456",
    "email": "leader@company.com",
    "firstName": "Jane",
    "lastName": "Smith-Johnson",
    "phone": "+1234567891",
    "scope": {
      "branches": ["branch_001", "branch_002"],
      "departments": ["dept_hr", "dept_finance", "dept_it"]
    },
    "updatedAt": "2025-11-10T11:00:00Z"
  }
}
```

**Error Responses:**
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - User not found

---

#### DELETE /users/:userId
Deactivate user account (soft delete).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Required Role:** OWNER, LEADER (scope-limited)

**Response (200):**
```json
{
  "success": true,
  "message": "User successfully deactivated"
}
```

**Error Responses:**
- `403 Forbidden` - Insufficient permissions or self-deletion attempt
- `404 Not Found` - User not found

---

#### GET /users
List users with filtering and pagination.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Required Role:** OWNER, LEADER

**Query Parameters:**
- `role` (optional): Filter by role (OWNER, LEADER, MANAGER)
- `branchId` (optional): Filter by branch
- `departmentId` (optional): Filter by department
- `isActive` (optional): Filter by active status (true/false)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Example Request:**
```
GET /users?role=MANAGER&branchId=branch_001&page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": "usr_ghi789",
        "email": "manager1@company.com",
        "firstName": "Bob",
        "lastName": "Johnson",
        "role": "MANAGER",
        "scope": {
          "departments": ["dept_hr"]
        },
        "isActive": true,
        "lastLogin": "2025-11-10T08:00:00Z"
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

### Role & Permission Endpoints

#### GET /roles
Get available roles and their permissions.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "role": "OWNER",
        "description": "Organization owner with full access",
        "permissions": [
          "organization:*",
          "user:*",
          "employee:*",
          "report:*",
          "ai-chat:*"
        ],
        "hierarchy": 1
      },
      {
        "role": "LEADER",
        "description": "Department head with branch-level access",
        "permissions": [
          "user:read",
          "user:create:manager",
          "employee:*",
          "report:read",
          "ai-chat:use"
        ],
        "hierarchy": 2
      },
      {
        "role": "MANAGER",
        "description": "Department manager with limited access",
        "permissions": [
          "employee:read",
          "employee:create",
          "employee:update",
          "report:read",
          "ai-chat:use"
        ],
        "hierarchy": 3
      }
    ]
  }
}
```

---

#### GET /permissions/check
Check if current user has specific permissions.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `permission`: Permission to check (e.g., "employee:write")
- `resourceId` (optional): Specific resource ID for scope checking

**Example Request:**
```
GET /permissions/check?permission=employee:write&resourceId=emp_123
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "hasPermission": true,
    "permission": "employee:write",
    "resourceId": "emp_123",
    "scope": {
      "departments": ["dept_hr"]
    }
  }
}
```

---

### Audit Log Endpoints

#### GET /audit/logs
Retrieve audit logs for user actions.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Required Role:** OWNER, LEADER (scope-limited)

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `action` (optional): Filter by action type
- `resourceType` (optional): Filter by resource type
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Example Request:**
```
GET /audit/logs?userId=usr_def456&action=LOGIN&startDate=2025-11-01T00:00:00Z&page=1&limit=50
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "logId": "log_001",
        "userId": "usr_def456",
        "userEmail": "leader@company.com",
        "action": "LOGIN",
        "resourceType": "USER",
        "resourceId": "usr_def456",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2025-11-10T09:15:00Z",
        "metadata": {
          "loginMethod": "password"
        }
      },
      {
        "logId": "log_002",
        "userId": "usr_def456",
        "userEmail": "leader@company.com",
        "action": "EMPLOYEE_CREATE",
        "resourceType": "EMPLOYEE",
        "resourceId": "emp_123",
        "ipAddress": "192.168.1.100",
        "timestamp": "2025-11-10T10:30:00Z",
        "metadata": {
          "departmentId": "dept_hr"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 234,
      "totalPages": 5
    }
  }
}
```

---

## Internal APIs

### Internal Service: Auth Service

#### Internal: validateToken(token: string)
Validate JWT token and return decoded payload.

**Input:**
```typescript
{
  token: string
}
```

**Output:**
```typescript
{
  isValid: boolean,
  payload?: {
    userId: string,
    organizationId: string,
    role: 'OWNER' | 'LEADER' | 'MANAGER',
    scope: {
      branches?: string[],
      departments?: string[]
    },
    iat: number,
    exp: number
  },
  error?: string
}
```

---

#### Internal: generateTokens(userId: string)
Generate access and refresh tokens for user.

**Input:**
```typescript
{
  userId: string
}
```

**Output:**
```typescript
{
  accessToken: string,
  refreshToken: string,
  expiresIn: number
}
```

---

#### Internal: revokeToken(token: string)
Invalidate a specific token (logout).

**Input:**
```typescript
{
  token: string
}
```

**Output:**
```typescript
{
  success: boolean
}
```

---

### Internal Service: RBAC Service

#### Internal: checkPermission(userId: string, permission: string, resourceId?: string)
Check if user has specific permission for resource.

**Input:**
```typescript
{
  userId: string,
  permission: string, // e.g., "employee:write"
  resourceId?: string
}
```

**Output:**
```typescript
{
  hasPermission: boolean,
  reason?: string, // If permission denied
  scope?: {
    branches?: string[],
    departments?: string[]
  }
}
```

---

#### Internal: getUserPermissions(userId: string)
Get all permissions for a user.

**Input:**
```typescript
{
  userId: string
}
```

**Output:**
```typescript
{
  userId: string,
  role: 'OWNER' | 'LEADER' | 'MANAGER',
  permissions: string[],
  scope: {
    branches?: string[],
    departments?: string[]
  }
}
```

---

#### Internal: isResourceInScope(userId: string, resourceType: string, resourceId: string)
Check if a resource is within user's access scope.

**Input:**
```typescript
{
  userId: string,
  resourceType: 'EMPLOYEE' | 'REPORT' | 'DEPARTMENT' | 'BRANCH',
  resourceId: string
}
```

**Output:**
```typescript
{
  inScope: boolean,
  userScope: {
    branches?: string[],
    departments?: string[]
  },
  resourceScope: {
    branchId?: string,
    departmentId?: string
  }
}
```

---

#### Internal: getScopedQuery(userId: string, baseQuery: object)
Add scope filtering to database query.

**Input:**
```typescript
{
  userId: string,
  baseQuery: object // MongoDB query object
}
```

**Output:**
```typescript
{
  scopedQuery: object // MongoDB query with scope filters applied
}
```

---

### Internal Service: Audit Service

#### Internal: logAction(auditData: AuditLogEntry)
Record user action in audit log.

**Input:**
```typescript
{
  userId: string,
  action: string, // e.g., "LOGIN", "EMPLOYEE_CREATE"
  resourceType?: string,
  resourceId?: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: object
}
```

**Output:**
```typescript
{
  logId: string,
  timestamp: Date
}
```

---

#### Internal: getAuditTrail(filters: AuditFilters)
Retrieve filtered audit logs.

**Input:**
```typescript
{
  userId?: string,
  action?: string,
  resourceType?: string,
  startDate?: Date,
  endDate?: Date,
  limit?: number,
  offset?: number
}
```

**Output:**
```typescript
{
  logs: Array<{
    logId: string,
    userId: string,
    action: string,
    resourceType?: string,
    resourceId?: string,
    timestamp: Date,
    metadata?: object
  }>,
  total: number
}
```

---

## Error Response Format

All error responses follow this standard format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    },
    "timestamp": "2025-11-10T12:00:00Z",
    "path": "/api/v1/auth/login"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions for action |
| `NOT_FOUND` | 404 | Requested resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate email) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server-side error |
| `TOKEN_EXPIRED` | 401 | JWT token has expired |
| `INVALID_CREDENTIALS` | 401 | Invalid login credentials |
| `SCOPE_VIOLATION` | 403 | Resource outside user's scope |

---

## Rate Limiting

| Endpoint Type | Rate Limit | Window |
|---------------|------------|--------|
| Auth (login, register) | 5 requests | 15 minutes |
| Password reset | 3 requests | 1 hour |
| Standard API calls | 100 requests | 1 minute |
| Audit log queries | 20 requests | 1 minute |

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699617600
```

---

## Webhook Events

Authentication events can trigger webhooks for external integrations:

### Event: user.created
```json
{
  "event": "user.created",
  "timestamp": "2025-11-10T10:30:00Z",
  "data": {
    "userId": "usr_abc123",
    "email": "user@company.com",
    "role": "LEADER",
    "organizationId": "org_xyz789"
  }
}
```

### Event: user.login
```json
{
  "event": "user.login",
  "timestamp": "2025-11-10T09:15:00Z",
  "data": {
    "userId": "usr_abc123",
    "email": "user@company.com",
    "ipAddress": "192.168.1.100"
  }
}
```

### Event: permission.denied
```json
{
  "event": "permission.denied",
  "timestamp": "2025-11-10T11:45:00Z",
  "data": {
    "userId": "usr_abc123",
    "permission": "organization:delete",
    "resourceId": "org_xyz789",
    "reason": "INSUFFICIENT_ROLE"
  }
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Complete