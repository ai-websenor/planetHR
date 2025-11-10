# Error Handling - Authentication & Authorization

## Error Scenarios Matrix

| Scenario | Error Code | HTTP Status | User Message | Resolution |
|----------|------------|-------------|--------------|------------|
| Invalid credentials | AUTH_001 | 401 | Invalid email or password | Verify credentials and retry |
| Account locked | AUTH_002 | 403 | Account locked due to multiple failed attempts | Contact administrator or wait for auto-unlock |
| Token expired | AUTH_003 | 401 | Session expired, please login again | Refresh token or re-authenticate |
| Token malformed | AUTH_004 | 401 | Invalid authentication token | Clear session and login again |
| Token blacklisted | AUTH_005 | 401 | Authentication token has been revoked | Login with valid credentials |
| Missing token | AUTH_006 | 401 | Authentication required | Provide valid JWT token in Authorization header |
| Insufficient permissions | AUTHZ_001 | 403 | You don't have permission to perform this action | Contact administrator for access |
| Role not found | AUTHZ_002 | 404 | User role not found | Contact system administrator |
| Scope violation | AUTHZ_003 | 403 | Access denied: resource outside your scope | Request access from resource owner |
| Branch isolation violation | AUTHZ_004 | 403 | Cannot access resources from other branches | Access only resources within your branch |
| Department access denied | AUTHZ_005 | 403 | Cannot access this department | Request department access from leader |
| Hierarchical violation | AUTHZ_006 | 403 | Cannot perform action on superior role | Action restricted by role hierarchy |
| User not found | USER_001 | 404 | User account not found | Verify user exists or contact administrator |
| User already exists | USER_002 | 409 | User with this email already exists | Use different email or recover existing account |
| Invalid user data | USER_003 | 400 | Invalid user information provided | Check validation errors and correct input |
| Password too weak | USER_004 | 400 | Password doesn't meet security requirements | Use stronger password (min 8 chars, uppercase, lowercase, number, special char) |
| Email not verified | USER_005 | 403 | Email verification required | Check email and verify account |
| Organization not found | ORG_001 | 404 | Organization not found | Verify organization exists |
| Organization inactive | ORG_002 | 403 | Organization account is inactive | Contact billing or administrator |
| Subscription expired | SUB_001 | 402 | Subscription expired | Renew subscription to continue |
| Subscription inactive | SUB_002 | 403 | Active subscription required | Activate or upgrade subscription |
| Rate limit exceeded | RATE_001 | 429 | Too many requests, please try again later | Wait before retrying (Retry-After header provided) |
| Session not found | SESSION_001 | 401 | Session not found or expired | Login again to create new session |
| Concurrent session limit | SESSION_002 | 403 | Maximum concurrent sessions reached | Logout from other devices |
| Session hijacking detected | SESSION_003 | 403 | Suspicious session activity detected | Re-authenticate and verify account security |
| MFA required | MFA_001 | 403 | Multi-factor authentication required | Complete MFA verification |
| MFA code invalid | MFA_002 | 400 | Invalid verification code | Enter correct code or request new one |
| MFA code expired | MFA_003 | 400 | Verification code expired | Request new verification code |
| Refresh token invalid | TOKEN_001 | 401 | Invalid refresh token | Login again with credentials |
| Refresh token expired | TOKEN_002 | 401 | Refresh token expired | Login again with credentials |
| Password reset required | PWD_001 | 403 | Password reset required | Use forgot password to reset |
| Password reset token invalid | PWD_002 | 400 | Invalid or expired reset token | Request new password reset |
| Password reset token expired | PWD_003 | 400 | Password reset link expired | Request new password reset link |
| Same password reuse | PWD_004 | 400 | Cannot reuse recent passwords | Choose a different password |
| Audit log write failure | AUDIT_001 | 500 | Failed to record action | Action completed but not logged, contact administrator |
| Database connection error | DB_001 | 503 | Service temporarily unavailable | Retry after some time |
| Redis connection error | CACHE_001 | 503 | Session service unavailable | Retry after some time |
| Internal server error | SYS_001 | 500 | An unexpected error occurred | Contact support with error reference ID |

## Common Error Codes

### Authentication Errors (AUTH_xxx)

#### AUTH_001: Invalid Credentials
```json
{
  "statusCode": 401,
  "errorCode": "AUTH_001",
  "message": "Invalid email or password",
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/auth/login"
}
```
**Causes:**
- Incorrect email or password
- Account does not exist
- Password hash mismatch

**Resolution:**
- Verify email address is correct
- Check password for typos
- Use "Forgot Password" if needed

#### AUTH_002: Account Locked
```json
{
  "statusCode": 403,
  "errorCode": "AUTH_002",
  "message": "Account locked due to multiple failed attempts",
  "details": {
    "lockedUntil": "2025-11-11T11:30:00.000Z",
    "remainingMinutes": 30
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/auth/login"
}
```
**Causes:**
- 5+ consecutive failed login attempts
- Security policy triggered
- Manual account suspension

**Resolution:**
- Wait for auto-unlock (30 minutes default)
- Contact administrator for immediate unlock
- Use password reset if credentials forgotten

#### AUTH_003: Token Expired
```json
{
  "statusCode": 401,
  "errorCode": "AUTH_003",
  "message": "Session expired, please login again",
  "details": {
    "expiredAt": "2025-11-11T10:00:00.000Z"
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/users/profile"
}
```
**Causes:**
- JWT access token exceeded TTL (15 minutes default)
- User inactivity timeout
- Server time desynchronization

**Resolution:**
- Use refresh token to obtain new access token
- Re-authenticate if refresh token also expired
- Client should implement automatic token refresh

#### AUTH_004: Token Malformed
```json
{
  "statusCode": 401,
  "errorCode": "AUTH_004",
  "message": "Invalid authentication token",
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/users/profile"
}
```
**Causes:**
- Corrupted JWT structure
- Invalid signature
- Tampered token payload
- Missing token parts

**Resolution:**
- Clear local storage/cookies
- Re-authenticate
- Verify client is not modifying tokens

#### AUTH_005: Token Blacklisted
```json
{
  "statusCode": 401,
  "errorCode": "AUTH_005",
  "message": "Authentication token has been revoked",
  "details": {
    "reason": "User logged out",
    "revokedAt": "2025-11-11T10:00:00.000Z"
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/users/profile"
}
```
**Causes:**
- User logged out (token revoked)
- Password changed (all tokens invalidated)
- Security event triggered token revocation
- Administrator revoked access

**Resolution:**
- Login again with valid credentials
- Verify account status with administrator

#### AUTH_006: Missing Token
```json
{
  "statusCode": 401,
  "errorCode": "AUTH_006",
  "message": "Authentication required",
  "details": {
    "hint": "Provide JWT token in Authorization header"
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/users/profile"
}
```
**Causes:**
- Authorization header not provided
- Bearer prefix missing
- Empty token value

**Resolution:**
- Include `Authorization: Bearer <token>` header
- Ensure client sends token with all protected requests

### Authorization Errors (AUTHZ_xxx)

#### AUTHZ_001: Insufficient Permissions
```json
{
  "statusCode": 403,
  "errorCode": "AUTHZ_001",
  "message": "You don't have permission to perform this action",
  "details": {
    "requiredRole": "OWNER",
    "userRole": "MANAGER",
    "requiredPermission": "organization:manage"
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/organizations/123/settings"
}
```
**Causes:**
- User role lacks required permission
- Action restricted to higher role level
- Permission not assigned to user

**Resolution:**
- Request access from administrator/owner
- Verify role assignment is correct
- Use account with appropriate permissions

#### AUTHZ_003: Scope Violation
```json
{
  "statusCode": 403,
  "errorCode": "AUTHZ_003",
  "message": "Access denied: resource outside your scope",
  "details": {
    "userScope": "department:sales",
    "resourceScope": "department:engineering",
    "resourceType": "employee"
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/employees/456"
}
```
**Causes:**
- Attempting to access resource in different department
- Manager accessing employee outside their department
- Leader accessing branch they don't manage

**Resolution:**
- Request access to resource from its owner/manager
- Verify correct resource ID
- Contact owner for scope expansion if needed

#### AUTHZ_004: Branch Isolation Violation
```json
{
  "statusCode": 403,
  "errorCode": "AUTHZ_004",
  "message": "Cannot access resources from other branches",
  "details": {
    "userBranch": "branch-north",
    "resourceBranch": "branch-south",
    "isolationPolicy": "strict"
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/employees/789"
}
```
**Causes:**
- Cross-branch data access attempt
- Branch isolation policy enforcement
- Leader accessing different branch

**Resolution:**
- Access only resources within assigned branch
- Request cross-branch access from owner
- Verify resource location

#### AUTHZ_006: Hierarchical Violation
```json
{
  "statusCode": 403,
  "errorCode": "AUTHZ_006",
  "message": "Cannot perform action on superior role",
  "details": {
    "actorRole": "MANAGER",
    "targetRole": "LEADER",
    "action": "update",
    "hierarchy": ["OWNER", "LEADER", "MANAGER"]
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/users/321"
}
```
**Causes:**
- Manager attempting to modify leader account
- Lower role trying to manage higher role
- Hierarchy protection violation

**Resolution:**
- Request action from appropriate role level
- Contact superior for user management
- Verify target user role

### User Management Errors (USER_xxx)

#### USER_002: User Already Exists
```json
{
  "statusCode": 409,
  "errorCode": "USER_002",
  "message": "User with this email already exists",
  "details": {
    "email": "manager@company.com",
    "existingUserId": "user_123"
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/users"
}
```
**Causes:**
- Email address already registered
- Duplicate user creation attempt
- User exists in different branch

**Resolution:**
- Use different email address
- Use forgot password to recover account
- Contact administrator if account should not exist

#### USER_004: Password Too Weak
```json
{
  "statusCode": 400,
  "errorCode": "USER_004",
  "message": "Password doesn't meet security requirements",
  "details": {
    "requirements": {
      "minLength": 8,
      "requireUppercase": true,
      "requireLowercase": true,
      "requireNumber": true,
      "requireSpecialChar": true
    },
    "violations": ["minLength", "requireSpecialChar"]
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/auth/register"
}
```
**Causes:**
- Password does not meet complexity requirements
- Password too short
- Missing required character types

**Resolution:**
- Create password with at least 8 characters
- Include uppercase, lowercase, number, and special character
- Use password generator if needed

### Session Errors (SESSION_xxx)

#### SESSION_002: Concurrent Session Limit
```json
{
  "statusCode": 403,
  "errorCode": "SESSION_002",
  "message": "Maximum concurrent sessions reached",
  "details": {
    "maxSessions": 3,
    "activeSessions": 3,
    "oldestSession": "2025-11-10T08:00:00.000Z"
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/auth/login"
}
```
**Causes:**
- User logged in from too many devices
- Session limit policy exceeded
- Previous sessions not properly closed

**Resolution:**
- Logout from inactive devices
- Close browser tabs/apps not in use
- Contact administrator to increase limit

#### SESSION_003: Session Hijacking Detected
```json
{
  "statusCode": 403,
  "errorCode": "SESSION_003",
  "message": "Suspicious session activity detected",
  "details": {
    "reason": "IP address changed",
    "previousIP": "192.168.1.100",
    "currentIP": "203.0.113.50",
    "securityAction": "session_terminated"
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/users/profile"
}
```
**Causes:**
- IP address changed during session
- User-agent mismatch detected
- Suspicious activity pattern
- Possible session hijacking attempt

**Resolution:**
- Re-authenticate from trusted device
- Change password immediately
- Review recent account activity
- Enable MFA if not already enabled

### Multi-Factor Authentication Errors (MFA_xxx)

#### MFA_002: MFA Code Invalid
```json
{
  "statusCode": 400,
  "errorCode": "MFA_002",
  "message": "Invalid verification code",
  "details": {
    "attemptsRemaining": 2,
    "maxAttempts": 5
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/auth/mfa/verify"
}
```
**Causes:**
- Incorrect verification code entered
- Code typo
- Using old code instead of current one

**Resolution:**
- Verify code from authenticator app
- Ensure time synchronization on device
- Request new code if expired
- Use backup code if available

### Subscription Errors (SUB_xxx)

#### SUB_001: Subscription Expired
```json
{
  "statusCode": 402,
  "errorCode": "SUB_001",
  "message": "Subscription expired",
  "details": {
    "expiredAt": "2025-11-01T00:00:00.000Z",
    "gracePeriodEnd": "2025-11-08T00:00:00.000Z",
    "renewalUrl": "/billing/renew"
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/employees/reports"
}
```
**Causes:**
- Organization subscription expired
- Payment method failed
- Subscription cancelled

**Resolution:**
- Renew subscription via billing portal
- Update payment method
- Contact billing support

### System Errors (SYS_xxx, DB_xxx, CACHE_xxx)

#### DB_001: Database Connection Error
```json
{
  "statusCode": 503,
  "errorCode": "DB_001",
  "message": "Service temporarily unavailable",
  "details": {
    "retryAfter": 30,
    "referenceId": "err_db_20251111_103000"
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/users/profile"
}
```
**Causes:**
- MongoDB connection pool exhausted
- Database server unreachable
- Network connectivity issue
- Database maintenance

**Resolution:**
- Retry request after specified delay
- Check service status page
- Contact support with reference ID

#### CACHE_001: Redis Connection Error
```json
{
  "statusCode": 503,
  "errorCode": "CACHE_001",
  "message": "Session service unavailable",
  "details": {
    "fallback": "database",
    "performanceDegraded": true,
    "retryAfter": 15
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/auth/login"
}
```
**Causes:**
- Redis server unreachable
- Connection pool exhausted
- Redis instance restarting

**Resolution:**
- System may operate with degraded performance
- Retry after specified delay
- Sessions fall back to database storage

## Error Propagation

### Layer-by-Layer Error Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Request Layer                      │
│  - Validates HTTP headers                                    │
│  - Checks Content-Type                                       │
│  - Rate limiting checks                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼ [RATE_001 if rate limit exceeded]
┌─────────────────────────────────────────────────────────────┐
│                 Controller Layer (NestJS)                    │
│  - Route parameter validation                                │
│  - DTO validation with class-validator                      │
│  - Guards execution (JwtAuthGuard, RolesGuard)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼ [USER_003 for validation errors]
                      ▼ [AUTH_006 if token missing]
┌─────────────────────────────────────────────────────────────┐
│                    Guard Layer                               │
│  - JwtAuthGuard: Token validation                           │
│  - RolesGuard: Permission checking                          │
│  - ScopeGuard: Hierarchical access validation              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼ [AUTH_003, AUTH_004, AUTH_005]
                      ▼ [AUTHZ_001, AUTHZ_003, AUTHZ_006]
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  - Business logic validation                                 │
│  - Authorization scope checks                                │
│  - Data transformation                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼ [AUTHZ_004 for scope violations]
                      ▼ [USER_002 for conflicts]
┌─────────────────────────────────────────────────────────────┐
│                  Repository Layer                            │
│  - Database query execution                                  │
│  - Transaction management                                    │
│  - Connection pool management                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼ [DB_001 for connection errors]
                      ▼ [USER_001 for not found]
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                             │
│  - MongoDB operations                                        │
│  - Redis cache operations                                    │
│  - Connection management                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼ [CACHE_001 for Redis errors]
                      ▼ [SYS_001 for unexpected errors]
┌─────────────────────────────────────────────────────────────┐
│              Global Exception Filter                         │
│  - Catches all unhandled exceptions                         │
│  - Formats error response                                    │
│  - Logs error with context                                   │
│  - Triggers audit log (if applicable)                       │
│  - Returns standardized JSON response                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Client Response                            │
│  {                                                           │
│    "statusCode": 403,                                        │
│    "errorCode": "AUTHZ_003",                                │
│    "message": "Access denied",                              │
│    "details": {...},                                         │
│    "timestamp": "2025-11-11T10:30:00.000Z",                │
│    "path": "/api/resource"                                   │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### Error Transformation Rules

#### 1. Guard Layer → Service Layer
- **JwtAuthGuard** failures transform to AUTH_xxx codes
- **RolesGuard** failures transform to AUTHZ_001
- **ScopeGuard** failures transform to AUTHZ_003 or AUTHZ_004

#### 2. Service Layer → Repository Layer
- Business logic errors remain unchanged
- Add context information (user ID, resource ID, scope)
- Enrich error with audit trail data

#### 3. Repository Layer → Database Layer
- MongoDB errors transform to DB_001
- Redis errors transform to CACHE_001
- Mongoose validation errors transform to USER_003

#### 4. Global Exception Filter
Catches all errors and applies transformation:
```typescript
// Pseudocode
catch (error) {
  if (error instanceof UnauthorizedException) {
    return formatError(AUTH_006, 401, error);
  }
  if (error instanceof ForbiddenException) {
    return formatError(AUTHZ_001, 403, error);
  }
  if (error instanceof NotFoundException) {
    return formatError(USER_001, 404, error);
  }
  if (error instanceof MongoError) {
    return formatError(DB_001, 503, error);
  }
  // Default to SYS_001 for unknown errors
  return formatError(SYS_001, 500, error);
}
```

### Error Context Enrichment

Each layer adds contextual information:

**Controller Layer:**
- Request path
- HTTP method
- Request timestamp
- Client IP address

**Guard Layer:**
- User ID
- User role
- Required permissions
- Token expiration

**Service Layer:**
- Resource ID
- Resource type
- Business operation
- Scope information

**Repository Layer:**
- Query details
- Database collection
- Operation type
- Transaction ID

### Audit Logging Integration

Errors trigger audit logs at different severity levels:

| Error Type | Audit Level | Logged Information |
|------------|-------------|-------------------|
| AUTH_001, AUTH_002 | WARNING | Failed login attempt, email, IP, timestamp |
| AUTH_005 | INFO | Token revoked, user ID, reason |
| AUTHZ_001, AUTHZ_003 | WARNING | Permission denied, user ID, resource, action |
| AUTHZ_004, AUTHZ_006 | ERROR | Policy violation, user details, attempted action |
| SESSION_003 | CRITICAL | Security event, session details, IP addresses |
| USER_002 | INFO | Duplicate user attempt, email |
| DB_001, CACHE_001 | ERROR | System error, stack trace, connection details |
| SYS_001 | CRITICAL | Unexpected error, full context, stack trace |

### Error Recovery Strategies

#### Automatic Retry (Client-side)
- **Applicable to:** 503, 429 errors
- **Strategy:** Exponential backoff with jitter
- **Max retries:** 3 attempts
- **Backoff:** 1s, 2s, 4s

#### Token Refresh (Client-side)
- **Applicable to:** AUTH_003 (expired token)
- **Strategy:** Automatic refresh token usage
- **Fallback:** Re-authenticate if refresh fails

#### Session Recovery (Server-side)
- **Applicable to:** CACHE_001 (Redis unavailable)
- **Strategy:** Fallback to database session storage
- **Performance impact:** Degraded but functional

#### Graceful Degradation (Server-side)
- **Applicable to:** Non-critical service failures
- **Strategy:** Return cached data or default values
- **User notification:** Performance degraded message

### Error Response Format

All errors follow standardized JSON structure:
```json
{
  "statusCode": 403,
  "errorCode": "AUTHZ_003",
  "message": "Human-readable error message",
  "details": {
    "additionalContext": "value",
    "suggestedAction": "Contact administrator"
  },
  "timestamp": "2025-11-11T10:30:00.000Z",
  "path": "/api/resource/123",
  "requestId": "req_abc123xyz",
  "documentation": "https://docs.planetshr.com/errors/AUTHZ_003"
}
```

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Draft