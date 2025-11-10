# Database Schema - Authentication & Authorization

## Overview

This document defines the database schemas for the Authentication & Authorization module, covering user credentials, roles, permissions (MongoDB), and session management (Redis).

### MongoDB (user credentials, roles, permissions)

MongoDB stores persistent authentication data including user accounts, role definitions, permission mappings, and audit logs. The database uses Mongoose ODM with TypeScript for type safety and validation.

**Database Name:** `planetshr_auth`

**Collections:**
- `users` - User accounts and credentials
- `roles` - Role definitions and hierarchies
- `permissions` - Permission definitions
- `role_permissions` - Role-permission mappings
- `user_scopes` - User access scopes (branches/departments)
- `audit_logs` - Authentication and authorization audit trail

### Redis (session management, JWT tokens)

Redis provides fast, ephemeral storage for active sessions, JWT token blacklisting, and rate limiting. All keys include TTL (Time-To-Live) for automatic expiration.

**Redis Databases:**
- `DB 0` - Active sessions
- `DB 1` - Blacklisted JWT tokens
- `DB 2` - Rate limiting counters

---

## MongoDB Schemas

### 1. Users Collection

Stores user account information, credentials, and role assignments.

**Collection Name:** `users`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
  OWNER = 'OWNER',
  LEADER = 'LEADER',
  MANAGER = 'MANAGER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ type: String, enum: UserRole, required: true, index: true })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.PENDING_VERIFICATION })
  status: UserStatus;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Branch' }], default: [] })
  assignedBranches: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Department' }], default: [] })
  assignedDepartments: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date;

  @Prop({ type: String, default: null })
  lastLoginIp: string;

  @Prop({ type: Number, default: 0 })
  failedLoginAttempts: number;

  @Prop({ type: Date, default: null })
  lockedUntil: Date;

  @Prop({ type: String, default: null, select: false })
  emailVerificationToken: string;

  @Prop({ type: Date, default: null })
  emailVerifiedAt: Date;

  @Prop({ type: String, default: null, select: false })
  passwordResetToken: string;

  @Prop({ type: Date, default: null })
  passwordResetExpires: Date;

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1, organizationId: 1 }, { unique: true });
UserSchema.index({ role: 1, organizationId: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ assignedBranches: 1 });
UserSchema.index({ assignedDepartments: 1 });
UserSchema.index({ createdAt: -1 });
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Unique user identifier |
| `email` | String | Yes | User email address (unique per organization) |
| `passwordHash` | String | Yes | Bcrypt hashed password (select: false) |
| `firstName` | String | Yes | User's first name |
| `lastName` | String | Yes | User's last name |
| `role` | Enum | Yes | User role: OWNER, LEADER, MANAGER |
| `organizationId` | ObjectId | Yes | Reference to organization |
| `status` | Enum | Yes | Account status (default: PENDING_VERIFICATION) |
| `assignedBranches` | ObjectId[] | No | Branches accessible by user (Leader only) |
| `assignedDepartments` | ObjectId[] | No | Departments accessible by user (Leader/Manager) |
| `createdBy` | ObjectId | No | User who created this account |
| `lastLoginAt` | Date | No | Timestamp of last successful login |
| `lastLoginIp` | String | No | IP address of last login |
| `failedLoginAttempts` | Number | No | Failed login counter (for account locking) |
| `lockedUntil` | Date | No | Account lock expiration timestamp |
| `emailVerificationToken` | String | No | Token for email verification (select: false) |
| `emailVerifiedAt` | Date | No | Email verification timestamp |
| `passwordResetToken` | String | No | Token for password reset (select: false) |
| `passwordResetExpires` | Date | No | Password reset token expiration |
| `deletedAt` | Date | No | Soft delete timestamp |
| `createdAt` | Date | Auto | Record creation timestamp |
| `updatedAt` | Date | Auto | Record update timestamp |

---

### 2. Roles Collection

Defines role hierarchies and base permissions.

**Collection Name:** `roles`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'roles' })
export class Role extends Document {
  @Prop({ required: true, unique: true, uppercase: true })
  name: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0, max: 100 })
  hierarchyLevel: number;

  @Prop({ type: [String], default: [] })
  canManageRoles: string[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  isSystemRole: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.index({ name: 1 }, { unique: true });
RoleSchema.index({ hierarchyLevel: 1 });
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Unique role identifier |
| `name` | String | Yes | Role name (uppercase, unique): OWNER, LEADER, MANAGER |
| `displayName` | String | Yes | Human-readable role name |
| `description` | String | Yes | Role purpose and capabilities |
| `hierarchyLevel` | Number | Yes | Hierarchy position (0=highest, 100=lowest) |
| `canManageRoles` | String[] | No | Roles this role can create/manage |
| `isActive` | Boolean | Yes | Role enabled status (default: true) |
| `isSystemRole` | Boolean | Yes | System-defined role (cannot be deleted) |
| `createdAt` | Date | Auto | Record creation timestamp |
| `updatedAt` | Date | Auto | Record update timestamp |

**Seed Data:**

```json
[
  {
    "name": "OWNER",
    "displayName": "Organization Owner",
    "description": "Complete organizational access and control",
    "hierarchyLevel": 0,
    "canManageRoles": ["LEADER", "MANAGER"],
    "isActive": true,
    "isSystemRole": true
  },
  {
    "name": "LEADER",
    "displayName": "Department Leader",
    "description": "Multi-department and branch management",
    "hierarchyLevel": 50,
    "canManageRoles": ["MANAGER"],
    "isActive": true,
    "isSystemRole": true
  },
  {
    "name": "MANAGER",
    "displayName": "Department Manager",
    "description": "Single department employee management",
    "hierarchyLevel": 75,
    "canManageRoles": [],
    "isActive": true,
    "isSystemRole": true
  }
]
```

---

### 3. Permissions Collection

Defines granular permissions for system resources.

**Collection Name:** `permissions`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ResourceType {
  ORGANIZATION = 'ORGANIZATION',
  BRANCH = 'BRANCH',
  DEPARTMENT = 'DEPARTMENT',
  EMPLOYEE = 'EMPLOYEE',
  REPORT = 'REPORT',
  AI_CHAT = 'AI_CHAT',
  USER = 'USER',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export enum ActionType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE',
  EXECUTE = 'EXECUTE',
}

@Schema({ timestamps: true, collection: 'permissions' })
export class Permission extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: ResourceType, required: true })
  resource: ResourceType;

  @Prop({ type: String, enum: ActionType, required: true })
  action: ActionType;

  @Prop({ type: Boolean, default: false })
  scopeRequired: boolean;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

PermissionSchema.index({ resource: 1, action: 1 }, { unique: true });
PermissionSchema.index({ name: 1 }, { unique: true });
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Unique permission identifier |
| `name` | String | Yes | Permission identifier (e.g., "employee:create") |
| `description` | String | Yes | Human-readable permission description |
| `resource` | Enum | Yes | Resource type this permission applies to |
| `action` | Enum | Yes | Action allowed on the resource |
| `scopeRequired` | Boolean | Yes | Whether branch/department scope is required |
| `isActive` | Boolean | Yes | Permission enabled status (default: true) |
| `createdAt` | Date | Auto | Record creation timestamp |
| `updatedAt` | Date | Auto | Record update timestamp |

**Example Seed Data:**

```json
[
  {
    "name": "organization:manage",
    "description": "Full organization management access",
    "resource": "ORGANIZATION",
    "action": "MANAGE",
    "scopeRequired": false,
    "isActive": true
  },
  {
    "name": "employee:create",
    "description": "Create new employee records",
    "resource": "EMPLOYEE",
    "action": "CREATE",
    "scopeRequired": true,
    "isActive": true
  },
  {
    "name": "report:read",
    "description": "View employee reports",
    "resource": "REPORT",
    "action": "READ",
    "scopeRequired": true,
    "isActive": true
  },
  {
    "name": "ai_chat:execute",
    "description": "Access AI consultation chat",
    "resource": "AI_CHAT",
    "action": "EXECUTE",
    "scopeRequired": true,
    "isActive": true
  }
]
```

---

### 4. Role Permissions Collection

Maps permissions to roles.

**Collection Name:** `role_permissions`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'role_permissions' })
export class RolePermission extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Role', required: true, index: true })
  roleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Permission', required: true, index: true })
  permissionId: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const RolePermissionSchema = SchemaFactory.createForClass(RolePermission);

RolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Unique mapping identifier |
| `roleId` | ObjectId | Yes | Reference to Role |
| `permissionId` | ObjectId | Yes | Reference to Permission |
| `isActive` | Boolean | Yes | Permission enabled for role (default: true) |
| `createdAt` | Date | Auto | Record creation timestamp |
| `updatedAt` | Date | Auto | Record update timestamp |

---

### 5. User Scopes Collection

Defines user access boundaries for branches and departments.

**Collection Name:** `user_scopes`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ScopeType {
  ORGANIZATION = 'ORGANIZATION',
  BRANCH = 'BRANCH',
  DEPARTMENT = 'DEPARTMENT',
}

@Schema({ timestamps: true, collection: 'user_scopes' })
export class UserScope extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ScopeType, required: true })
  scopeType: ScopeType;

  @Prop({ type: Types.ObjectId, required: true })
  scopeId: Types.ObjectId;

  @Prop({ type: String, required: true })
  scopeName: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  grantedBy: Types.ObjectId;

  @Prop({ type: Date, default: null })
  expiresAt: Date;
}

export const UserScopeSchema = SchemaFactory.createForClass(UserScope);

UserScopeSchema.index({ userId: 1, scopeType: 1, scopeId: 1 }, { unique: true });
UserScopeSchema.index({ scopeId: 1 });
UserScopeSchema.index({ expiresAt: 1 });
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Unique scope identifier |
| `userId` | ObjectId | Yes | Reference to User |
| `scopeType` | Enum | Yes | Scope level: ORGANIZATION, BRANCH, DEPARTMENT |
| `scopeId` | ObjectId | Yes | Reference to scoped resource |
| `scopeName` | String | Yes | Cached name for display purposes |
| `isActive` | Boolean | Yes | Scope enabled status (default: true) |
| `grantedBy` | ObjectId | Yes | User who granted this scope |
| `expiresAt` | Date | No | Optional scope expiration date |
| `createdAt` | Date | Auto | Record creation timestamp |
| `updatedAt` | Date | Auto | Record update timestamp |

---

### 6. Audit Logs Collection

Comprehensive audit trail for authentication and authorization events.

**Collection Name:** `audit_logs`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AuditEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_COMPLETE = 'PASSWORD_RESET_COMPLETE',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  SCOPE_ASSIGNED = 'SCOPE_ASSIGNED',
  SCOPE_REMOVED = 'SCOPE_REMOVED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  ROLE_CHANGED = 'ROLE_CHANGED',
}

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: String, enum: AuditEventType, required: true, index: true })
  eventType: AuditEventType;

  @Prop({ required: true })
  eventDescription: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ type: Boolean, required: true })
  success: boolean;

  @Prop({ type: String, default: null })
  errorMessage: string;

  @Prop({ type: String, default: null })
  sessionId: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ eventType: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ sessionId: 1 });
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Unique audit log identifier |
| `userId` | ObjectId | No | User who triggered the event (null for anonymous) |
| `organizationId` | ObjectId | Yes | Organization context |
| `eventType` | Enum | Yes | Type of audit event |
| `eventDescription` | String | Yes | Human-readable event description |
| `metadata` | Object | No | Additional event context data |
| `ipAddress` | String | Yes | Source IP address |
| `userAgent` | String | Yes | Client user agent string |
| `success` | Boolean | Yes | Event success status |
| `errorMessage` | String | No | Error details if success=false |
| `sessionId` | String | No | Associated session identifier |
| `createdAt` | Date | Auto | Event timestamp |

---

## Redis Schemas

### 1. Active Sessions (DB 0)

Stores active user session data with automatic expiration.

**Key Pattern:** `session:{userId}:{sessionId}`

**Value Structure:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "sessionId": "uuid-v4-session-id",
  "organizationId": "507f1f77bcf86cd799439012",
  "email": "user@example.com",
  "role": "LEADER",
  "assignedBranches": ["507f1f77bcf86cd799439013"],
  "assignedDepartments": ["507f1f77bcf86cd799439014"],
  "createdAt": "2025-11-10T10:30:00.000Z",
  "lastActivityAt": "2025-11-10T12:45:00.000Z",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

**TTL:** 24 hours (86400 seconds)

**Operations:**
- `SET` on login/token refresh
- `GET` on authenticated requests
- `DEL` on logout
- `EXPIRE` on activity (sliding expiration)

**Indexes:**
```
KEY session:507f1f77bcf86cd799439011:* # All sessions for a user
KEY session:*:a1b2c3d4-... # Specific session lookup
```

---

### 2. JWT Token Blacklist (DB 1)

Stores revoked JWT tokens to prevent reuse after logout or password change.

**Key Pattern:** `blacklist:jwt:{jti}`

**Value Structure:**
```json
{
  "jti": "unique-jwt-token-id",
  "userId": "507f1f77bcf86cd799439011",
  "revokedAt": "2025-11-10T12:45:00.000Z",
  "reason": "USER_LOGOUT",
  "expiresAt": "2025-11-11T12:45:00.000Z"
}
```

**TTL:** Token expiration time (typically 1 hour for access tokens)

**Operations:**
- `SET` on logout, password change, role change
- `EXISTS` on token validation
- Auto-expire when token would naturally expire

**Revocation Reasons:**
- `USER_LOGOUT`
- `PASSWORD_CHANGED`
- `ROLE_CHANGED`
- `ACCOUNT_SUSPENDED`
- `ADMIN_REVOCATION`

---

### 3. Refresh Token Store (DB 0)

Stores refresh tokens for JWT rotation.

**Key Pattern:** `refresh:{userId}:{tokenId}`

**Value Structure:**
```json
{
  "tokenId": "uuid-v4-refresh-token-id",
  "userId": "507f1f77bcf86cd799439011",
  "sessionId": "uuid-v4-session-id",
  "issuedAt": "2025-11-10T10:30:00.000Z",
  "expiresAt": "2025-11-17T10:30:00.000Z",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.100"
  }
}
```

**TTL:** 7 days (604800 seconds)

**Operations:**
- `SET` on login and token refresh
- `GET` on refresh token request
- `DEL` on refresh token use (rotation)
- `DEL` on logout (all user refresh tokens)

---

### 4. Rate Limiting Counters (DB 2)

Tracks request counts for rate limiting and brute force protection.

#### Login Attempt Tracking

**Key Pattern:** `ratelimit:login:{email}`

**Value:** Counter (integer)

**TTL:** 15 minutes (900 seconds)

**Limits:**
- 5 failed attempts per 15 minutes per email
- Account lock after limit exceeded

#### API Rate Limiting

**Key Pattern:** `ratelimit:api:{userId}:{endpoint}`

**Value Structure:**
```json
{
  "count": 45,
  "resetAt": "2025-11-10T11:00:00.000Z"
}
```

**TTL:** 1 minute (60 seconds)

**Limits:**
- 100 requests per minute per user (general)
- 10 requests per minute for AI chat endpoints
- 50 requests per minute for report generation

---

### 5. Email Verification Tokens (DB 0)

Temporary storage for email verification tokens.

**Key Pattern:** `verify:email:{token}`

**Value Structure:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "createdAt": "2025-11-10T10:30:00.000Z"
}
```

**TTL:** 24 hours (86400 seconds)

**Operations:**
- `SET` on user registration
- `GET` on verification link click
- `DEL` on successful verification

---

### 6. Password Reset Tokens (DB 0)

Temporary storage for password reset tokens.

**Key Pattern:** `reset:password:{token}`

**Value Structure:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "createdAt": "2025-11-10T10:30:00.000Z",
  "ipAddress": "192.168.1.100"
}
```

**TTL:** 1 hour (3600 seconds)

**Operations:**
- `SET` on password reset request
- `GET` on reset link click
- `DEL` on successful password reset

---

## Migration Strategy

### Initial Setup (v1.0.0)

#### Phase 1: MongoDB Collections Creation
1. Create collections with defined schemas
2. Apply indexes for performance optimization
3. Seed system roles (OWNER, LEADER, MANAGER)
4. Seed base permissions for each resource type
5. Create role-permission mappings

**Migration Script:** `migrations/001_initial_auth_schema.ts`

```typescript
export async function up() {
  // Create collections
  await db.createCollection('users');
  await db.createCollection('roles');
  await db.createCollection('permissions');
  await db.createCollection('role_permissions');
  await db.createCollection('user_scopes');
  await db.createCollection('audit_logs');
  
  // Apply indexes
  await applyIndexes();
  
  // Seed data
  await seedRoles();
  await seedPermissions();
  await seedRolePermissions();
}
```

#### Phase 2: Redis Database Configuration
1. Configure Redis with 3 logical databases
2. Set up default TTL policies
3. Configure eviction policies (allkeys-lru for rate limiting)
4. Set up persistence (RDB + AOF for production)

**Redis Configuration:**
```conf
# redis.conf
databases 3
maxmemory-policy allkeys-lru
save 900 1
appendonly yes
```

---

### Schema Evolution Strategy

#### Version Control
- Use migration files with timestamps: `YYYYMMDDHHMMSS_migration_name.ts`
- Track migrations in `schema_migrations` collection
- Support rollback for each migration

#### Migration Process
1. **Development**: Test migration in local environment
2. **Staging**: Apply and verify in staging database
3. **Production**: Schedule maintenance window for deployment
4. **Validation**: Run post-migration validation scripts

#### Example Migration Template
```typescript
import { MigrationInterface } from './migration.interface';

export class AddScopeExpirationField implements MigrationInterface {
  async up(): Promise<void> {
    await db.collection('user_scopes').updateMany(
      {},
      { $set: { expiresAt: null } }
    );
    
    await db.collection('user_scopes').createIndex({ expiresAt: 1 });
  }

  async down(): Promise<void> {
    await db.collection('user_scopes').dropIndex({ expiresAt: 1 });
    
    await db.collection('user_scopes').updateMany(
      {},
      { $unset: { expiresAt: "" } }
    );
  }
}
```

---

### Data Backup Strategy

#### MongoDB Backups
- **Frequency**: Daily full backups, hourly incremental
- **Retention**: 30 days for daily, 7 days for incremental
- **Method**: `mongodump` with compression
- **Storage**: Cloud storage (S3/GCS) with encryption

#### Redis Backups
- **RDB Snapshots**: Every 6 hours
- **AOF Rewrite**: Every 24 hours
- **Retention**: 7 days
- **Method**: `BGSAVE` command with AOF persistence

---

### Performance Optimization

#### MongoDB Indexes
All critical indexes are defined in schemas above. Additional monitoring for:
- Query performance using `explain()`
- Index usage statistics via `$indexStats`
- Slow query logging (>100ms threshold)

#### Redis Memory Management
- Monitor memory usage with `INFO memory`
- Implement key expiration policies
- Use Redis clustering for high-volume scenarios
- Regular `BGREWRITEAOF` for AOF compaction

---

### Scaling Considerations

#### MongoDB Scaling
- **Vertical**: Increase RAM for working set
- **Horizontal**: Sharding by `organizationId` for multi-tenancy
- **Replication**: 3-node replica set (Primary + 2 Secondaries)
- **Read Preference**: Secondary reads for audit logs and reporting

#### Redis Scaling
- **Redis Cluster**: 6-node cluster (3 masters, 3 replicas)
- **Partitioning**: Hash slots by `userId` or `sessionId`
- **Read Replicas**: For session validation and rate limit checks

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Production Ready