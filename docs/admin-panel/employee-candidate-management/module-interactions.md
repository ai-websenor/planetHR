# Module Interactions - Employee & Candidate Management

## Overview

This document describes how this module interacts with other internal modules in the monolith.

## Internal Module Dependencies

### Direct Dependencies

#### 1. Authentication & Authorization Module
- **Purpose**: User identity verification and role-based access control
- **Integration Points**:
  - JWT token validation for all employee/candidate operations
  - Role verification (Owner, Leader, Manager)
  - Scope-based access filtering
- **Data Flow**: Incoming requests → Auth verification → Employee service operations

#### 2. Organization Management Module
- **Purpose**: Company, branch, and department context
- **Integration Points**:
  - Validate department assignments during employee creation
  - Retrieve organizational hierarchy for access control
  - Branch and department relationship validation
- **Data Flow**: Employee assignment → Organization validation → Assignment confirmation

#### 3. Report Generation Module
- **Purpose**: Trigger and manage employee analysis reports
- **Integration Points**:
  - Emit employee creation events to trigger report generation
  - Provide employee data for report compilation
  - Update employee records with report references
- **Data Flow**: Employee created → Event emitted → Report generation initiated

#### 4. AI Services Module
- **Purpose**: LLM analysis and astrological calculations
- **Integration Points**:
  - Send birth details for astrological analysis
  - Request harmonic energy code calculations
  - Provide professional background for AI personality analysis
- **Data Flow**: Employee data → AI analysis request → Results stored in reports

#### 5. Email Notification Module
- **Purpose**: User notifications for employee/candidate events
- **Integration Points**:
  - Send notifications on employee profile creation
  - Alert managers about new employee assignments
  - Notify about bulk import completion
- **Data Flow**: Employee event → Email service → Notification sent

#### 6. Subscription Management Module
- **Purpose**: Validate subscription limits and features
- **Integration Points**:
  - Check employee count limits during creation
  - Verify subscription status for quarterly updates
  - Enforce feature access based on subscription tier
- **Data Flow**: Employee creation → Subscription validation → Proceed or reject

### Indirect Dependencies

#### 1. Audit Logging Module
- **Purpose**: Track all employee data changes
- **Integration Points**:
  - Log employee creation, updates, deletions
  - Record data access by users
  - Track bulk import operations
- **Data Flow**: Employee operation → Audit log entry created

#### 2. Job Queue Module (BullMQ)
- **Purpose**: Asynchronous processing of heavy operations
- **Integration Points**:
  - Queue bulk import processing
  - Schedule report generation jobs
  - Handle quarterly update triggers
- **Data Flow**: Bulk operation → Queue job → Background processing

## Communication Patterns

### 1. Event-Driven Communication

#### Employee Lifecycle Events

**Event: `employee.created`**
```typescript
{
  eventType: 'employee.created',
  timestamp: '2025-11-11T10:30:00Z',
  payload: {
    employeeId: 'emp_123456',
    organizationId: 'org_abc',
    departmentId: 'dept_xyz',
    managerId: 'mgr_789',
    birthDetails: {
      date: '1990-05-15',
      time: '14:30',
      location: 'New York, NY'
    },
    professionalInfo: {
      role: 'Software Engineer',
      department: 'Engineering'
    }
  }
}
```
**Consumers**: Report Generation, Email Notification, Audit Logging

**Event: `employee.updated`**
```typescript
{
  eventType: 'employee.updated',
  timestamp: '2025-11-11T11:15:00Z',
  payload: {
    employeeId: 'emp_123456',
    updatedFields: ['department', 'manager'],
    previousValues: {
      departmentId: 'dept_old',
      managerId: 'mgr_old'
    },
    newValues: {
      departmentId: 'dept_new',
      managerId: 'mgr_new'
    },
    updatedBy: 'user_leader_01'
  }
}
```
**Consumers**: Report Regeneration, Email Notification, Audit Logging

**Event: `employee.deleted`**
```typescript
{
  eventType: 'employee.deleted',
  timestamp: '2025-11-11T12:00:00Z',
  payload: {
    employeeId: 'emp_123456',
    organizationId: 'org_abc',
    deletedBy: 'user_owner_01',
    softDelete: true
  }
}
```
**Consumers**: Report Archival, Audit Logging

**Event: `bulk.import.completed`**
```typescript
{
  eventType: 'bulk.import.completed',
  timestamp: '2025-11-11T13:45:00Z',
  payload: {
    importId: 'import_789',
    organizationId: 'org_abc',
    totalRecords: 150,
    successCount: 145,
    failureCount: 5,
    employeeIds: ['emp_001', 'emp_002', ...],
    errors: [
      { row: 23, error: 'Invalid birth date format' }
    ]
  }
}
```
**Consumers**: Report Generation Queue, Email Notification, Audit Logging

#### Candidate Lifecycle Events

**Event: `candidate.added`**
```typescript
{
  eventType: 'candidate.added',
  timestamp: '2025-11-11T14:20:00Z',
  payload: {
    candidateId: 'cand_456',
    organizationId: 'org_abc',
    targetDepartment: 'dept_xyz',
    targetRole: 'Senior Developer',
    evaluatedBy: 'mgr_789'
  }
}
```
**Consumers**: Report Generation, Email Notification

### 2. Synchronous Service Calls

#### Organization Validation Pattern
```typescript
// Employee Service → Organization Service
class EmployeeService {
  async createEmployee(data: CreateEmployeeDto) {
    // Validate department exists and user has access
    const department = await this.organizationService.validateDepartmentAccess(
      data.departmentId,
      currentUser.id,
      currentUser.role
    );
    
    if (!department) {
      throw new ForbiddenException('Invalid department or access denied');
    }
    
    // Proceed with employee creation
    return this.employeeRepository.create(data);
  }
}
```

#### Subscription Validation Pattern
```typescript
// Employee Service → Subscription Service
class EmployeeService {
  async validateEmployeeLimit(organizationId: string) {
    const currentCount = await this.employeeRepository.countByOrg(organizationId);
    const subscription = await this.subscriptionService.getSubscription(organizationId);
    
    if (currentCount >= subscription.employeeLimit) {
      throw new PaymentRequiredException('Employee limit reached. Upgrade subscription.');
    }
  }
}
```

### 3. Queue-Based Asynchronous Communication

#### Bulk Import Processing
```typescript
// Data Import Service → Job Queue → Employee Service
@Processor('employee-import')
class EmployeeImportProcessor {
  @Process('process-batch')
  async processBatch(job: Job<BulkImportData>) {
    const { rows, organizationId, importId } = job.data;
    
    const results = await Promise.allSettled(
      rows.map(row => this.employeeService.createEmployee(row))
    );
    
    // Emit completion event
    this.eventEmitter.emit('bulk.import.completed', {
      importId,
      results
    });
  }
}
```

#### Report Generation Trigger
```typescript
// Employee Service → Report Queue → Report Service
class EmployeeService {
  async createEmployee(data: CreateEmployeeDto) {
    const employee = await this.employeeRepository.create(data);
    
    // Queue report generation (8 reports)
    await this.reportQueue.add('generate-all-reports', {
      employeeId: employee.id,
      reportTypes: [
        'personality',
        'behavior',
        'job-compatibility',
        'dept-compatibility',
        'company-compatibility',
        'industry-compatibility',
        'qa-system',
        'training'
      ]
    });
    
    return employee;
  }
}
```

### 4. WebSocket Real-time Updates

#### Profile Update Broadcast
```typescript
// Employee Service → WebSocket Gateway
class EmployeeService {
  async updateEmployee(id: string, data: UpdateEmployeeDto) {
    const employee = await this.employeeRepository.update(id, data);
    
    // Broadcast to connected managers/leaders
    this.websocketGateway.emitToRoom(
      `org_${employee.organizationId}`,
      'employee.profile.updated',
      {
        employeeId: employee.id,
        updatedFields: Object.keys(data)
      }
    );
    
    return employee;
  }
}
```

## Shared Resources

### 1. Database (MongoDB)

#### Shared Collections

**Organizations Collection**
- **Accessed By**: Employee Service, Organization Service, Report Service
- **Access Pattern**: Read-only by Employee Service for validation
- **Concurrency**: No write conflicts (read-only)

**Users Collection**
- **Accessed By**: Employee Service, Auth Service, Organization Service
- **Access Pattern**: Read for manager validation, access control
- **Concurrency**: No write conflicts (read-only)

**Employees Collection**
- **Owned By**: Employee Service (primary owner)
- **Accessed By**: Report Service (read), AI Service (read), Audit Service (read)
- **Access Pattern**: Write by Employee Service, read by others
- **Concurrency**: Write locks during updates, read replicas for reports

**Candidates Collection**
- **Owned By**: Candidate Service (primary owner)
- **Accessed By**: Report Service (read), Organization Service (read)
- **Access Pattern**: Write by Candidate Service, read by others
- **Concurrency**: Minimal conflicts (candidate data is relatively static)

#### Index Strategy
```typescript
// Employee Collection Indexes
{
  organizationId: 1,
  departmentId: 1,
  isActive: 1
}
// For role-scoped queries

{
  managerId: 1,
  isActive: 1
}
// For manager's employee list

{
  'birthDetails.date': 1
}
// For astrological calculations

{
  email: 1,
  organizationId: 1
}
// Unique constraint
```

### 2. Redis Cache

#### Cached Data Structures

**Employee Access Scope Cache**
```typescript
// Key pattern: scope:{userId}:{role}
// Value: Set of accessible employee IDs
// TTL: 1 hour
{
  key: 'scope:mgr_789:manager',
  value: ['emp_001', 'emp_002', 'emp_003'],
  ttl: 3600
}
```

**Department Employee Count**
```typescript
// Key pattern: dept_count:{deptId}
// Value: Number of employees
// TTL: 5 minutes
{
  key: 'dept_count:dept_xyz',
  value: 25,
  ttl: 300
}
```

**Organization Employee Limit**
```typescript
// Key pattern: org_limit:{orgId}
// Value: { current: number, max: number }
// TTL: 1 hour
{
  key: 'org_limit:org_abc',
  value: { current: 145, max: 200 },
  ttl: 3600
}
```

#### Cache Invalidation Strategy
- **Employee Created**: Invalidate department count, organization limit, manager scope
- **Employee Updated**: Invalidate old and new department counts, access scopes if manager changed
- **Employee Deleted**: Invalidate all related caches

### 3. BullMQ Job Queues

#### Queue Definitions

**employee-import Queue**
- **Purpose**: Process bulk employee import files
- **Concurrency**: 5 jobs simultaneously
- **Priority**: Normal
- **Retry**: 3 attempts with exponential backoff
- **Timeout**: 10 minutes per batch

**employee-report-generation Queue**
- **Purpose**: Generate all 8 reports for new employees
- **Concurrency**: 10 jobs (AI API rate limiting consideration)
- **Priority**: High for new employees, Normal for updates
- **Retry**: 5 attempts (AI service may be temporarily unavailable)
- **Timeout**: 15 minutes per employee (8 reports × AI processing time)

**quarterly-update Queue**
- **Purpose**: Regenerate reports based on harmonic code changes
- **Concurrency**: 20 jobs (batch processing)
- **Priority**: Low (background process)
- **Retry**: 3 attempts
- **Timeout**: 20 minutes per batch

### 4. Shared Services

#### Astrological Calculation Service
- **Consumers**: Employee Service, Report Service, AI Service
- **Rate Limit**: 100 requests/minute per organization
- **Caching**: Birth chart results cached for 90 days
- **Failover**: Queued retry if service unavailable

#### Harmonic Energy Code Service
- **Consumers**: Employee Service, Report Service, Quarterly Update Service
- **Update Frequency**: Calculated quarterly
- **Caching**: Current harmonic codes cached permanently, recalculated quarterly
- **Data Storage**: Stored in employee document for quick access

#### File Storage Service
- **Consumers**: Bulk Import Service, Report Service
- **Storage Type**: AWS S3 or compatible object storage
- **Access Pattern**: 
  - Import files: Write by Data Import, Read by Employee Service
  - Generated reports: Write by Report Service, Read by Employee/Candidate Services
- **Retention**: Import files (30 days), Report PDFs (indefinite)

## Module Communication Flow Diagrams

### Employee Creation Flow
```
User Request (POST /employees)
    ↓
Auth Module (JWT validation, role check)
    ↓
Organization Module (department validation)
    ↓
Subscription Module (employee limit check)
    ↓
Employee Service (create employee record)
    ↓
├─→ Report Queue (generate 8 reports - async)
├─→ Email Service (notify manager - async)
└─→ Audit Log (record creation - async)
    ↓
Response to User
```

### Bulk Import Flow
```
User Upload (CSV file)
    ↓
Data Import Service (parse and validate)
    ↓
Job Queue (create batch jobs)
    ↓
Employee Import Processor (parallel processing)
    ├─→ Employee Service (create records)
    ├─→ Organization Module (validate departments)
    └─→ Subscription Module (check limits)
    ↓
Bulk Import Completed Event
    ├─→ Report Queue (generate reports for all)
    ├─→ Email Service (summary notification)
    └─→ Audit Log (import summary)
```

### Role-Scoped Data Access Flow
```
User Request (GET /employees)
    ↓
Auth Module (identify user role & scope)
    ↓
Cache Check (scope:{userId}:{role})
    ├─→ Cache Hit: Return cached employee IDs
    └─→ Cache Miss:
        ↓
    Organization Module (get accessible departments)
        ↓
    Employee Service (filter by departments)
        ↓
    Cache Write (store scope for 1 hour)
        ↓
Employee Service (fetch employee details)
    ↓
Response with filtered employee list
```

### Quarterly Update Flow
```
Cron Trigger (quarterly schedule)
    ↓
Quarterly Update Service (identify active subscriptions)
    ↓
Employee Service (fetch all employees by organization)
    ↓
Harmonic Energy Service (calculate new codes)
    ↓
Job Queue (batch employees for report regeneration)
    ↓
Report Service (regenerate 8 reports per employee)
    ↓
├─→ Employee Service (update harmonic codes)
├─→ Email Service (notify managers of updates)
└─→ Audit Log (quarterly update completion)
```

## Error Handling and Resilience

### Inter-Module Error Handling

#### Graceful Degradation
- **Organization Service Unavailable**: Use cached department data, allow operation with warning
- **Subscription Service Unavailable**: Allow employee creation, queue subscription validation for retry
- **Email Service Failure**: Log error, continue operation, retry notification later
- **Report Service Failure**: Employee created successfully, report generation queued for retry

#### Circuit Breaker Pattern
```typescript
// Applied to external AI service calls
@Injectable()
class EmployeeReportService {
  private circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 60000
  });
  
  async generateReport(employeeId: string) {
    return this.circuitBreaker.execute(async () => {
      return this.aiService.analyzeEmployee(employeeId);
    });
  }
}
```

#### Retry Strategies
- **Transient Failures**: Exponential backoff (1s, 2s, 4s, 8s, 16s)
- **Rate Limit Errors**: Linear backoff with jitter
- **Database Locks**: Immediate retry up to 3 times
- **Queue Job Failures**: BullMQ automatic retry with backoff

## Performance Considerations

### Optimization Strategies

#### Database Query Optimization
- Use projection to fetch only required fields
- Implement pagination for large employee lists
- Use aggregation pipeline for complex filtering
- Create compound indexes for common query patterns

#### Caching Strategy
- Cache frequently accessed data (employee counts, access scopes)
- Use cache-aside pattern for employee details
- Implement cache warming for organization-wide queries
- Set appropriate TTLs based on data volatility

#### Asynchronous Processing
- Queue heavy operations (report generation, bulk imports)
- Use batch processing for multiple employees
- Implement job prioritization (new employees > updates)
- Set reasonable timeout values to prevent resource exhaustion

#### Rate Limiting
- Implement per-organization rate limits for AI services
- Use token bucket algorithm for API calls
- Queue excess requests instead of rejecting
- Provide feedback to users about rate limit status

**Document Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** Complete