# Module Interactions - Organization Management

## Overview

This document describes how this module interacts with other internal modules in the monolith.

## Internal Module Dependencies

### Direct Dependencies

| Module | Purpose | Interaction Type |
|--------|---------|------------------|
| **auth-module** | Authentication & Authorization | Service Injection |
| **users-module** | Owner, Leader, Manager management | Service Injection |
| **employees-module** | Employee assignment to departments | Event-driven + Direct Calls |
| **reports-module** | Organization data for report context | Service Injection |
| **payments-module** | Subscription validation | Service Injection |
| **email-module** | Organization setup notifications | Event-driven |
| **cron-module** | Quarterly harmonic code updates | Event-driven |

### Dependency Graph

```
organization-module
├── auth-module (JWT validation, role guards)
├── users-module (owner/leader/manager data)
├── employees-module (department assignments)
├── reports-module (org context for reports)
├── payments-module (subscription checks)
├── email-module (notifications)
└── cron-module (scheduled updates)
```

## Communication Patterns

### 1. Synchronous Service Injection

#### Organization Service → User Service
```typescript
// Getting user details for organization owner
@Injectable()
export class OrganizationService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async createOrganization(ownerId: string, data: CreateOrgDto) {
    const owner = await this.usersService.findById(ownerId);
    if (owner.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only owners can create organizations');
    }
    // Create organization logic...
  }
}
```

#### Organization Service → Payment Service
```typescript
// Validating subscription before harmonic updates
async canPerformHarmonicUpdate(orgId: string): Promise<boolean> {
  const subscription = await this.paymentsService.getActiveSubscription(orgId);
  return subscription && subscription.status === 'active';
}
```

### 2. Event-Driven Communication

#### Events Published by Organization Module

| Event Name | Payload | Consumers |
|------------|---------|-----------|
| `organization.created` | `{ organizationId, ownerId, companyName }` | email-module, users-module |
| `organization.updated` | `{ organizationId, changes }` | reports-module, employees-module |
| `organization.deleted` | `{ organizationId }` | All dependent modules |
| `branch.created` | `{ branchId, organizationId, branchName }` | users-module, employees-module |
| `branch.updated` | `{ branchId, changes }` | employees-module |
| `department.created` | `{ departmentId, branchId, departmentName }` | employees-module, reports-module |
| `department.updated` | `{ departmentId, changes }` | employees-module |
| `harmonic_code.updated` | `{ organizationId, newHarmonicCode, quarter }` | reports-module, cron-module |

#### Event Listeners in Organization Module

| Event Name | Source Module | Handler Action |
|------------|---------------|----------------|
| `subscription.activated` | payments-module | Enable quarterly harmonic updates |
| `subscription.cancelled` | payments-module | Disable quarterly harmonic updates |
| `employee.assigned` | employees-module | Update department employee count |
| `employee.removed` | employees-module | Update department employee count |
| `quarterly.update.triggered` | cron-module | Recalculate harmonic codes |

#### Event Bus Implementation
```typescript
@Injectable()
export class OrganizationEventsService {
  constructor(
    @InjectEventEmitter() private readonly eventEmitter: EventEmitter2,
  ) {}

  emitOrganizationCreated(org: Organization) {
    this.eventEmitter.emit('organization.created', {
      organizationId: org._id,
      ownerId: org.ownerId,
      companyName: org.companyName,
      timestamp: new Date(),
    });
  }

  emitHarmonicCodeUpdated(orgId: string, newCode: string) {
    this.eventEmitter.emit('harmonic_code.updated', {
      organizationId: orgId,
      newHarmonicCode: newCode,
      quarter: getCurrentQuarter(),
      timestamp: new Date(),
    });
  }
}
```

### 3. Database-Level Interactions

#### Shared Collection Access

```typescript
// Organization Module owns these collections
- organizations
- branches
- departments
- organization_astrology_data

// Other modules READ from these collections
- employees-module: reads branches, departments for assignment validation
- reports-module: reads organization, branches, departments for context
- users-module: reads organizations for scope validation
```

#### Cross-Module Queries
```typescript
// Example: Employee Module validating department assignment
async assignEmployeeToDepartment(employeeId: string, departmentId: string) {
  const department = await this.departmentModel.findById(departmentId);
  if (!department) {
    throw new NotFoundException('Department not found');
  }
  
  // Validate user has access to this department's branch
  const hasAccess = await this.usersService.hasAccessToBranch(
    currentUser.id,
    department.branchId,
  );
  
  if (!hasAccess) {
    throw new ForbiddenException('No access to this department');
  }
  
  // Proceed with assignment...
}
```

### 4. Queue-Based Async Processing

#### Organization Module Producer

```typescript
// Queue heavy astrological calculations
@Injectable()
export class AstrologyQueueProducer {
  constructor(
    @InjectQueue('astrology') private astrologyQueue: Queue,
  ) {}

  async queueHarmonicCalculation(orgId: string) {
    await this.astrologyQueue.add('calculate-harmonic-code', {
      organizationId: orgId,
      type: 'quarterly-update',
      priority: 2,
    });
  }
}
```

#### Queue Consumers

| Queue Name | Job Type | Consumer Module |
|------------|----------|-----------------|
| `astrology` | `calculate-harmonic-code` | organization-module |
| `notifications` | `org-setup-complete` | email-module |
| `reports` | `regenerate-org-reports` | reports-module |

## Shared Resources

### 1. MongoDB Collections

#### Primary Owner: Organization Module

```typescript
// Organization Module manages these collections
organizations: {
  _id: ObjectId,
  ownerId: ObjectId,
  companyName: string,
  astrologyData: {...},
  harmonicCode: string,
  // Read by: users, employees, reports, payments modules
}

branches: {
  _id: ObjectId,
  organizationId: ObjectId,
  branchName: string,
  // Read by: users, employees modules
}

departments: {
  _id: ObjectId,
  branchId: ObjectId,
  departmentName: string,
  managerId: ObjectId,
  // Read by: users, employees, reports modules
}
```

#### Access Patterns

| Module | Collection | Access Type | Purpose |
|--------|------------|-------------|---------|
| **organization-module** | organizations, branches, departments | Read/Write | Full CRUD operations |
| **users-module** | organizations, branches | Read | Scope validation |
| **employees-module** | branches, departments | Read | Assignment validation |
| **reports-module** | organizations, branches, departments | Read | Report context data |
| **payments-module** | organizations | Read | Subscription association |

### 2. Redis Cache

#### Cached Data by Organization Module

```typescript
// Cache keys managed by organization module
`org:${orgId}:profile` - Organization profile data (TTL: 1 hour)
`org:${orgId}:harmonic_code` - Current harmonic code (TTL: until quarter end)
`org:${orgId}:branches` - Branch list (TTL: 30 minutes)
`branch:${branchId}:departments` - Department list (TTL: 30 minutes)
`org:${orgId}:hierarchy` - Full org structure (TTL: 1 hour)
```

#### Cross-Module Cache Access

```typescript
// Example: Reports Module reading cached org data
@Injectable()
export class ReportsService {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async getOrganizationContext(orgId: string) {
    const cached = await this.redis.get(`org:${orgId}:profile`);
    if (cached) return JSON.parse(cached);
    
    // Fallback to database if cache miss
    return await this.organizationService.findById(orgId);
  }
}
```

### 3. BullMQ Queues

#### Queues Owned by Organization Module

```typescript
Queue: 'astrology'
- Jobs: harmonic-code-calculation, birth-chart-generation
- Consumers: astrology-calculation-service (within org module)
- Producers: organization-service, cron-service

Queue: 'organization-events'
- Jobs: notify-org-created, notify-org-updated
- Consumers: email-service, audit-service
- Producers: organization-service, branch-service, department-service
```

### 4. WebSocket Namespaces

```typescript
// Organization-specific WebSocket events
namespace: '/organizations'

// Events emitted by organization module
emit('organization:updated', { orgId, changes })
emit('branch:created', { branchId, orgId })
emit('department:created', { deptId, branchId })
emit('harmonic:updated', { orgId, newCode })

// Clients listening: admin-panel, leader-dashboard
```

## Module Interaction Flows

### Flow 1: Organization Creation

```
1. Owner Registration (users-module)
   ↓
2. Create Organization (organization-module)
   ↓
3. Calculate Astrology Data (astrology-service)
   ↓
4. Generate Harmonic Code (astrology-service)
   ↓
5. Emit 'organization.created' event
   ↓
6. Email Notification (email-module)
   ↓
7. Initialize Subscription (payments-module)
```

### Flow 2: Department Employee Assignment

```
1. Employee Created (employees-module)
   ↓
2. Validate Department Exists (organization-module)
   ↓
3. Check User Access to Branch (users-module + organization-module)
   ↓
4. Assign Employee to Department (employees-module)
   ↓
5. Emit 'employee.assigned' event
   ↓
6. Update Department Stats (organization-module listener)
   ↓
7. Invalidate Cache (organization-module)
```

### Flow 3: Quarterly Harmonic Update

```
1. Cron Trigger (cron-module)
   ↓
2. Emit 'quarterly.update.triggered' event
   ↓
3. Organization Module Listener Receives Event
   ↓
4. Check Active Subscription (payments-module)
   ↓
5. Queue Harmonic Calculation (astrology queue)
   ↓
6. Update Harmonic Code (organization-module)
   ↓
7. Emit 'harmonic_code.updated' event
   ↓
8. Trigger Report Regeneration (reports-module)
```

### Flow 4: Branch-Level Data Segregation

```
1. Leader Requests Employee List (employees-module)
   ↓
2. Get Leader's Assigned Branches (users-module)
   ↓
3. Validate Branch Access (organization-module)
   ↓
4. Filter Employees by Branches (employees-module)
   ↓
5. Return Scope-Limited Data
```

## Guard and Decorator Integrations

### Organization Scope Guard

```typescript
// Used by other modules to enforce organization-level access
@Injectable()
export class OrganizationScopeGuard implements CanActivate {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.params.organizationId || request.body.organizationId;

    return await this.organizationService.userHasAccessToOrg(user.id, orgId);
  }
}

// Usage in other modules
@Controller('employees')
export class EmployeesController {
  @Get(':organizationId/employees')
  @UseGuards(JwtAuthGuard, OrganizationScopeGuard)
  async getEmployees(@Param('organizationId') orgId: string) {
    // Only accessible if user has access to this organization
  }
}
```

### Branch Scope Decorator

```typescript
// Custom decorator for branch-level access control
export const RequireBranchAccess = () => {
  return applyDecorators(
    SetMetadata('require-branch-access', true),
    UseGuards(BranchAccessGuard),
  );
};

// Used by employees-module and reports-module
@Get('branches/:branchId/employees')
@RequireBranchAccess()
async getBranchEmployees(@Param('branchId') branchId: string) {
  // Branch access validated by organization-module guard
}
```

## Error Propagation

### Organization Module Error Handling

```typescript
// Errors thrown by organization module
export class OrganizationNotFoundException extends NotFoundException {
  constructor(orgId: string) {
    super(`Organization ${orgId} not found`);
  }
}

export class BranchAccessDeniedException extends ForbiddenException {
  constructor(branchId: string) {
    super(`Access denied to branch ${branchId}`);
  }
}

// Other modules catch and handle these errors
try {
  await this.organizationService.validateBranchAccess(userId, branchId);
} catch (error) {
  if (error instanceof BranchAccessDeniedException) {
    // Handle access denial
  }
}
```

## Performance Considerations

### 1. Caching Strategy

```typescript
// Organization module caches frequently accessed data
// Other modules read from cache to reduce DB load

// Cache warming on organization creation
async createOrganization(data: CreateOrgDto) {
  const org = await this.organizationRepository.create(data);
  
  // Warm cache for immediate subsequent requests
  await this.cacheService.set(`org:${org._id}:profile`, org, 3600);
  await this.cacheService.set(`org:${org._id}:hierarchy`, 
    await this.buildHierarchy(org._id), 3600);
  
  return org;
}
```

### 2. Batch Operations

```typescript
// Organization module provides batch APIs for efficiency
async getBranchesByOrganization(orgId: string): Promise<Branch[]> {
  // Used by employees-module to reduce round trips
}

async getDepartmentsByBranches(branchIds: string[]): Promise<Department[]> {
  // Bulk fetch for report generation
}
```

### 3. Lazy Loading

```typescript
// Organization hierarchy loaded on-demand
async getFullHierarchy(orgId: string) {
  // Only called when full tree is needed (e.g., admin panel)
  // Regular operations use targeted queries
}
```

## Testing Integration Points

### Mock Organization Service for Other Modules

```typescript
// Test helper provided by organization module
export const mockOrganizationService = {
  findById: jest.fn(),
  validateBranchAccess: jest.fn().mockResolvedValue(true),
  getDepartmentById: jest.fn(),
  userHasAccessToOrg: jest.fn().mockResolvedValue(true),
};

// Usage in employees-module tests
describe('EmployeesService', () => {
  let service: EmployeesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: OrganizationService, useValue: mockOrganizationService },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });
});
```

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Complete