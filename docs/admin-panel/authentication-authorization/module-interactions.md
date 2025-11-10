# Module Interactions - Authentication & Authorization

## Overview

This document describes how the Authentication & Authorization module interacts with other internal modules within the PlanetsHR monolithic application. This module serves as the foundational security layer for the entire platform, providing authentication, authorization, and audit capabilities to all other modules.

## Internal Module Dependencies

### Upstream Dependencies (Modules this module depends on)

#### Users Module
- **Purpose**: User entity management and profile data
- **Interaction Type**: Direct service injection
- **Usage**:
  - Retrieve user credentials during authentication
  - Validate user existence and status
  - Fetch user role and organization assignments
  - Update last login timestamps
- **Methods Called**:
  - `findUserByEmail(email: string): Promise<User>`
  - `findUserById(id: string): Promise<User>`
  - `updateLastLogin(userId: string): Promise<void>`
  - `validateUserStatus(userId: string): Promise<boolean>`

#### Organizations Module
- **Purpose**: Organization and branch hierarchy validation
- **Interaction Type**: Direct service injection
- **Usage**:
  - Validate organization membership during authentication
  - Retrieve organizational hierarchy for permission scoping
  - Check branch-level access rights
  - Verify organization subscription status
- **Methods Called**:
  - `getOrganizationById(orgId: string): Promise<Organization>`
  - `getUserOrganizations(userId: string): Promise<Organization[]>`
  - `getBranchHierarchy(branchId: string): Promise<Branch[]>`
  - `validateOrganizationAccess(userId: string, orgId: string): Promise<boolean>`

#### Email Module
- **Purpose**: Notification delivery for security events
- **Interaction Type**: Event-driven (async)
- **Usage**:
  - Send password reset emails
  - Notify on suspicious login attempts
  - Alert on role changes
  - Send audit notifications to administrators
- **Events Published**:
  - `auth.password.reset.requested`
  - `auth.login.suspicious`
  - `auth.role.changed`
  - `auth.audit.critical`

### Downstream Dependencies (Modules that depend on this module)

#### Employees Module
- **Dependency Type**: Authentication & Authorization Guards
- **Usage**:
  - Validates user authentication before employee operations
  - Enforces scope-based access to employee records
  - Verifies department-level permissions
- **Exposed Services**:
  - `JwtAuthGuard`: Validates JWT tokens
  - `RolesGuard`: Enforces role-based permissions
  - `ScopeGuard`: Validates hierarchical access rights

#### Reports Module
- **Dependency Type**: Authentication & Authorization Guards + Audit Logging
- **Usage**:
  - Authenticates report generation requests
  - Validates access to specific reports based on role and scope
  - Logs report access for compliance
- **Exposed Services**:
  - `JwtAuthGuard`: Validates JWT tokens
  - `RolesGuard`: Enforces role-based permissions
  - `AuditService.logReportAccess()`: Tracks report viewing

#### Payments Module
- **Dependency Type**: Authentication & Authorization + Owner Validation
- **Usage**:
  - Restricts payment operations to Owner role only
  - Validates organization ownership before subscription changes
  - Audits all payment-related actions
- **Exposed Services**:
  - `JwtAuthGuard`: Validates JWT tokens
  - `OwnerGuard`: Restricts access to Owner role
  - `AuditService.logPaymentAction()`: Tracks financial operations

#### Chat Module
- **Dependency Type**: WebSocket Authentication + Scope Validation
- **Usage**:
  - Authenticates WebSocket connections
  - Validates employee access based on hierarchical scope
  - Ensures real-time access control
- **Exposed Services**:
  - `WsJwtGuard`: WebSocket JWT authentication
  - `WsScopeGuard`: Real-time scope validation

#### Cron Module
- **Dependency Type**: System Authentication
- **Usage**:
  - Provides system-level authentication for scheduled tasks
  - Validates service account permissions
  - Audits automated operations
- **Exposed Services**:
  - `SystemAuthService.getSystemToken()`: Service account authentication
  - `AuditService.logSystemAction()`: Automated task logging

## Communication Patterns

### Synchronous Communication

#### Direct Service Injection
```typescript
// Example: AuthService depending on UsersService
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findUserByEmail(email);
    // Authentication logic
  }
}
```

**Use Cases**:
- User credential validation
- Organization membership verification
- Role and permission retrieval
- Real-time authorization checks

**Performance Considerations**:
- Caching user permissions in Redis for 5 minutes
- Lazy-loading organization hierarchy only when needed
- Connection pooling for database queries

#### Guard-Based Authorization
```typescript
// Example: Controller using AuthGuards
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
export class EmployeesController {
  @Get()
  @Roles(UserRole.OWNER, UserRole.LEADER, UserRole.MANAGER)
  async getEmployees(@CurrentUser() user: User) {
    // Scope-limited employee retrieval
  }
}
```

**Use Cases**:
- Protecting all API endpoints
- Enforcing role-based access control
- Validating hierarchical permissions
- Request-level authorization

### Asynchronous Communication

#### Event-Driven Architecture
```typescript
// Example: Publishing authentication events
@Injectable()
export class AuthService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async login(credentials: LoginDto): Promise<AuthResponse> {
    // Authentication logic
    
    this.eventEmitter.emit('auth.login.success', {
      userId: user.id,
      timestamp: new Date(),
      ipAddress: request.ip,
    });
  }
}
```

**Published Events**:
- `auth.login.success`: Successful authentication
- `auth.login.failed`: Failed login attempt
- `auth.logout`: User logout
- `auth.password.reset.requested`: Password reset initiated
- `auth.password.reset.completed`: Password successfully changed
- `auth.role.changed`: User role modified
- `auth.token.refreshed`: JWT token refreshed
- `auth.audit.critical`: Critical security event

**Event Subscribers**:
- **Email Module**: Sends notifications for security events
- **Audit Service**: Logs all authentication events
- **Analytics Module**: Tracks user activity patterns
- **Security Module**: Monitors suspicious activities

#### Queue-Based Processing
```typescript
// Example: Audit log processing via BullMQ
@Injectable()
export class AuditService {
  constructor(
    @InjectQueue('audit') private auditQueue: Queue,
  ) {}

  async logAction(action: AuditAction): Promise<void> {
    await this.auditQueue.add('log-action', action, {
      priority: action.severity === 'critical' ? 1 : 10,
      removeOnComplete: true,
    });
  }
}
```

**Queue Usage**:
- **audit**: Asynchronous audit log writing
- **email**: Security notification delivery
- **analytics**: User behavior tracking

**Benefits**:
- Non-blocking authentication flow
- Resilient audit logging
- Scalable event processing

### WebSocket Communication

#### Real-Time Authentication
```typescript
// Example: WebSocket guard for Chat module
@WebSocketGateway()
export class ChatGateway {
  @UseGuards(WsJwtGuard, WsScopeGuard)
  @SubscribeMessage('message')
  handleMessage(@ConnectedUser() user: User, @MessageBody() data: any) {
    // Real-time message handling with authentication
  }
}
```

**Use Cases**:
- Real-time chat authentication
- Live notification delivery
- WebSocket connection authorization
- Dynamic permission validation

## Shared Resources

### Redis Cache

#### Session Management
- **Key Pattern**: `session:{userId}`
- **TTL**: 24 hours (configurable)
- **Data Stored**: 
  - User ID
  - Active JWT token ID
  - Role and permissions cache
  - Organization context
  - Last activity timestamp

#### JWT Token Blacklist
- **Key Pattern**: `blacklist:{tokenId}`
- **TTL**: Token expiration time
- **Purpose**: Revoked token tracking for logout and security

#### Permission Cache
- **Key Pattern**: `permissions:{userId}:{orgId}`
- **TTL**: 5 minutes
- **Data Stored**:
  - Role assignments
  - Branch access list
  - Department access list
  - Computed permission set

#### Rate Limiting
- **Key Pattern**: `ratelimit:{userId}:{action}`
- **TTL**: 1 minute to 1 hour (action-dependent)
- **Purpose**: Brute force protection and API throttling

**Redis Configuration**:
```typescript
{
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  keyPrefix: 'auth:',
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
}
```

### MongoDB Collections

#### users
- **Shared With**: Users Module (primary owner), Organizations Module
- **Access Pattern**: Read-heavy during authentication
- **Indexes**: 
  - `email` (unique)
  - `organizationId, role`
  - `lastLoginAt`
- **This Module's Usage**:
  - Read user credentials for authentication
  - Update lastLoginAt timestamp
  - Read role and organization assignments

#### roles
- **Shared With**: RBAC Service (primary owner)
- **Access Pattern**: Read-only, heavily cached
- **Indexes**: 
  - `name` (unique)
  - `organizationId`
- **This Module's Usage**:
  - Read role definitions for authorization
  - Validate role hierarchy
  - Cache role permissions

#### audit_logs
- **Owned By**: Audit Service (this module)
- **Access Pattern**: Write-heavy, read for compliance reports
- **Indexes**: 
  - `userId, timestamp`
  - `action, timestamp`
  - `organizationId, timestamp`
  - `severity` (for critical event queries)
- **This Module's Usage**:
  - Write all authentication and authorization events
  - Write user action logs
  - Write security events

#### refresh_tokens
- **Owned By**: Auth Service (this module)
- **Access Pattern**: Read/write during token refresh
- **Indexes**: 
  - `token` (unique)
  - `userId, expiresAt`
- **This Module's Usage**:
  - Store refresh tokens
  - Validate refresh token usage
  - Revoke tokens on logout

### Environment Variables

#### Shared Configuration
```bash
# JWT Configuration
JWT_SECRET=shared-secret-key                    # Shared: All modules validating JWTs
JWT_EXPIRATION=15m                              # Owned: Auth module
JWT_REFRESH_EXPIRATION=7d                       # Owned: Auth module

# Redis Configuration
REDIS_HOST=localhost                            # Shared: All modules using Redis
REDIS_PORT=6379                                 # Shared: All modules using Redis
REDIS_PASSWORD=                                 # Shared: All modules using Redis

# Security Settings
BCRYPT_ROUNDS=12                                # Owned: Auth module
MAX_LOGIN_ATTEMPTS=5                            # Owned: Auth module
LOCKOUT_DURATION=900                            # Owned: Auth module (15 min in seconds)

# Session Configuration
SESSION_TIMEOUT=86400                           # Shared: Used by WebSocket and API modules
```

### Shared Decorators & Guards

#### Decorators
```typescript
// Exported for use by all modules
@CurrentUser()           // Extracts authenticated user from request
@CurrentOrganization()   // Extracts organization context
@Roles(...roles)         // Defines required roles for route
@RequireScope(scope)     // Defines required scope for route
@Public()               // Marks route as publicly accessible
@AuditLog(action)       // Enables automatic audit logging
```

#### Guards
```typescript
// Exported for use by all modules
JwtAuthGuard            // Validates JWT token
RolesGuard              // Enforces role-based access
ScopeGuard              // Validates hierarchical scope
OwnerGuard              // Restricts to Owner role only
WsJwtGuard              // WebSocket JWT authentication
WsScopeGuard            // WebSocket scope validation
```

### Shared Types & Interfaces

#### Authentication Types
```typescript
// Exported to all modules
interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
  branchIds: string[];
  departmentIds: string[];
}

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  orgId: string;
  iat: number;
  exp: number;
}
```

## Data Flow Diagrams

### Login Flow
```
User Request → AuthController
    ↓
AuthService.login()
    ↓
UsersService.findUserByEmail() ← MongoDB (users collection)
    ↓
Password validation (bcrypt)
    ↓
OrganizationsService.validateOrganizationAccess()
    ↓
JWT generation
    ↓
Session creation → Redis (session:{userId})
    ↓
EventEmitter.emit('auth.login.success')
    ↓
AuditService.logAction() → BullMQ (audit queue) → MongoDB (audit_logs)
    ↓
EmailService (async notification)
    ↓
AuthResponse → User
```

### Authorization Flow
```
Protected Route Request
    ↓
JwtAuthGuard.canActivate()
    ↓
Validate JWT signature
    ↓
Check Redis blacklist (blacklist:{tokenId})
    ↓
Retrieve user from cache or DB
    ↓
RolesGuard.canActivate()
    ↓
Check Redis permission cache (permissions:{userId}:{orgId})
    ↓
If cache miss → Compute permissions from DB
    ↓
Cache permissions (TTL: 5 min)
    ↓
ScopeGuard.canActivate()
    ↓
Validate hierarchical access (branch/department)
    ↓
Allow/Deny request
    ↓
If allowed → AuditService.logAction()
```

### Logout Flow
```
Logout Request → AuthController
    ↓
AuthService.logout()
    ↓
Add JWT to blacklist → Redis (blacklist:{tokenId})
    ↓
Delete session → Redis (session:{userId})
    ↓
Invalidate refresh token → MongoDB (refresh_tokens)
    ↓
Clear permission cache → Redis (permissions:{userId}:*)
    ↓
EventEmitter.emit('auth.logout')
    ↓
AuditService.logAction()
    ↓
Success response
```

## Integration Points

### Module Initialization Order
1. **Config Module** - Environment configuration loading
2. **Database Module** - MongoDB connection establishment
3. **Redis Module** - Redis connection establishment
4. **Users Module** - User entity and service initialization
5. **Organizations Module** - Organization entity and service initialization
6. **Auth Module** - Authentication service initialization
7. **RBAC Module** - Permission service initialization
8. **Audit Module** - Audit logging service initialization
9. **All Other Modules** - Can now use authentication guards

### Circular Dependency Prevention
```typescript
// Use forwardRef() to prevent circular dependencies
@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}
}
```

### Module Export Strategy
```typescript
@Module({
  imports: [
    JwtModule.register({...}),
    PassportModule,
    RedisModule,
  ],
  providers: [
    AuthService,
    RbacService,
    AuditService,
    JwtStrategy,
    LocalStrategy,
  ],
  controllers: [AuthController],
  exports: [
    // Export services for other modules
    AuthService,
    RbacService,
    AuditService,
    // Export guards for route protection
    JwtAuthGuard,
    RolesGuard,
    ScopeGuard,
    OwnerGuard,
    WsJwtGuard,
    WsScopeGuard,
  ],
})
export class AuthModule {}
```

## Performance Considerations

### Caching Strategy
- **Permission Cache**: 5-minute TTL to balance security and performance
- **Role Definition Cache**: 1-hour TTL (rarely changes)
- **Organization Hierarchy Cache**: 30-minute TTL
- **Session Cache**: 24-hour TTL with sliding expiration

### Connection Pooling
- **MongoDB**: 10-50 connections based on load
- **Redis**: 10 connections with automatic reconnection

### Async Operations
- **Audit Logging**: Always asynchronous via BullMQ
- **Email Notifications**: Event-driven async processing
- **Analytics**: Fire-and-forget event emission

### Rate Limiting
- **Login Endpoint**: 5 attempts per 15 minutes per IP
- **Password Reset**: 3 attempts per hour per email
- **Token Refresh**: 10 requests per minute per user

## Error Propagation

### Module Error Handling
```typescript
// Auth module throws domain-specific exceptions
throw new UnauthorizedException('Invalid credentials');
throw new ForbiddenException('Insufficient permissions');
throw new BadRequestException('Invalid token format');
```

### Downstream Error Impact
- **Authentication Failures**: Block all protected routes
- **Authorization Failures**: Return 403 Forbidden to client
- **Audit Failures**: Log error but don't block primary operation
- **Cache Failures**: Fallback to database queries

### Error Recovery
- **Redis Unavailable**: Fallback to stateless JWT validation only
- **Database Unavailable**: Return 503 Service Unavailable
- **Queue Unavailable**: Log errors locally and retry

**Document Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** Complete