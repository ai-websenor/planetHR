# Technical Specifications - Employee & Candidate Management

## Architecture Overview

This module is part of a monolithic NestJS application architecture with well-defined internal modules and layers. The Employee & Candidate Management module handles all aspects of employee and candidate data lifecycle, from data entry and validation to storage and retrieval. It integrates with the astrology calculation engine, report generation services, and role-based access control system to provide comprehensive employee management capabilities.

The module follows a layered architecture pattern with clear separation of concerns:
- **Presentation Layer**: Controllers handling HTTP requests and WebSocket events
- **Business Logic Layer**: Services implementing core business rules and validation
- **Data Access Layer**: Repositories and Mongoose schemas for data persistence

The module supports multi-tenant architecture with organization-level data isolation and hierarchical access control (Owner → Leader → Manager) ensuring users only access data within their authorized scope.

## Application Modules

### employee-service

**Responsibility:**
Manages complete employee lifecycle including profile creation, updates, deletion, and retrieval. Handles employee birth details for astrological calculations, professional background management, department assignments, and reporting relationships. Implements role-scoped data filtering to ensure users only access employees within their authorized organizational scope. Triggers report generation workflow upon employee creation or updates. Emits WebSocket events for real-time profile updates.

**Layer:** Business Logic Layer (with Presentation Layer controllers)

**Dependencies:**
- `auth-service` - User authentication and role validation
- `organization-service` - Department and branch validation
- `astrology-service` - Birth chart calculations
- `report-service` - Report generation triggering
- `user-service` - Manager assignment validation
- `email-service` - Notification delivery
- `queue-service` - Async report generation job creation

**Exposed APIs:**
- `POST /api/v1/employees` - Create new employee profile
- `GET /api/v1/employees` - List employees (role-scoped)
- `GET /api/v1/employees/:id` - Get employee details
- `PUT /api/v1/employees/:id` - Update employee profile
- `DELETE /api/v1/employees/:id` - Soft delete employee
- `GET /api/v1/employees/:id/reports` - Get employee reports
- Internal: `getEmployeesByDepartment(departmentId)` - Department employee list
- Internal: `validateEmployeeAccess(userId, employeeId)` - Permission check
- Internal: `getEmployeesByManager(managerId)` - Manager's employee list

### candidate-service

**Responsibility:**
Manages candidate data for pre-employment assessment and analysis. Handles candidate profile creation with birth details, generates candidate reports for hiring decisions, and provides candidate-to-employee conversion capabilities. Implements similar astrological and compatibility analysis as employees but with candidate-specific workflows. Supports bulk candidate import for recruitment campaigns and maintains candidate pipeline status tracking.

**Layer:** Business Logic Layer (with Presentation Layer controllers)

**Dependencies:**
- `auth-service` - User authentication and role validation
- `organization-service` - Department and position validation
- `astrology-service` - Birth chart calculations for candidates
- `report-service` - Candidate report generation
- `employee-service` - Candidate-to-employee conversion
- `email-service` - Candidate communication
- `queue-service` - Async candidate analysis jobs

**Exposed APIs:**
- `POST /api/v1/candidates` - Create candidate profile
- `GET /api/v1/candidates` - List candidates (role-scoped)
- `GET /api/v1/candidates/:id` - Get candidate details
- `PUT /api/v1/candidates/:id` - Update candidate profile
- `DELETE /api/v1/candidates/:id` - Remove candidate
- `POST /api/v1/candidates/:id/convert-to-employee` - Convert to employee
- `GET /api/v1/candidates/:id/reports` - Get candidate reports
- Internal: `getCandidatesByPosition(positionId)` - Position-specific candidates
- Internal: `getCandidateAnalysis(candidateId)` - Compatibility analysis

### data-import-service

**Responsibility:**
Handles bulk data import operations for employees and candidates. Processes CSV/Excel file uploads, validates data integrity, performs batch validation of birth details and organizational references, and creates employee/candidate records in bulk. Implements asynchronous processing for large datasets with progress tracking and error reporting. Provides data mapping templates and validation rules for successful imports.

**Layer:** Business Logic Layer (with Presentation Layer controllers)

**Dependencies:**
- `employee-service` - Bulk employee creation
- `candidate-service` - Bulk candidate creation
- `organization-service` - Department/branch validation
- `astrology-service` - Batch birth chart validation
- `user-service` - Manager reference validation
- `queue-service` - Async bulk processing jobs
- `file-storage-service` - Import file handling
- `email-service` - Import completion notifications

**Exposed APIs:**
- `POST /api/v1/import/employees` - Upload employee import file
- `POST /api/v1/import/candidates` - Upload candidate import file
- `GET /api/v1/import/status/:jobId` - Check import job status
- `GET /api/v1/import/template/employees` - Download employee import template
- `GET /api/v1/import/template/candidates` - Download candidate import template
- `GET /api/v1/import/errors/:jobId` - Get import error details
- Internal: `validateImportData(data, type)` - Data validation
- Internal: `processImportBatch(records, type)` - Batch processing


## Layered Architecture

### Presentation Layer

**Components:**
- `EmployeesController` - RESTful endpoints for employee management
- `CandidatesController` - RESTful endpoints for candidate management
- `ImportController` - File upload and bulk import endpoints
- `EmployeeGateway` - WebSocket gateway for real-time employee updates

**Responsibilities:**
- HTTP request/response handling
- Request validation using DTOs (Data Transfer Objects)
- Authentication guard application (`@UseGuards(JwtAuthGuard, RolesGuard)`)
- Role-based authorization (`@Roles(UserRole.OWNER, UserRole.LEADER, UserRole.MANAGER)`)
- Swagger/OpenAPI documentation (`@ApiOperation`, `@ApiResponse`)
- File upload handling with multer middleware
- WebSocket event emission for real-time updates
- Response formatting and status code management

**Key DTOs:**
- `CreateEmployeeDto` - Employee creation validation
- `UpdateEmployeeDto` - Employee update validation
- `CreateCandidateDto` - Candidate creation validation
- `BulkImportDto` - Import file validation
- `EmployeeFilterDto` - Search and filter parameters
- `AssignManagerDto` - Manager assignment validation

### Business Logic Layer

**Services:**
- `EmployeeService` - Core employee business logic
- `CandidateService` - Candidate management logic
- `DataImportService` - Bulk import processing
- `EmployeeValidationService` - Complex validation rules
- `EmployeeReportTriggerService` - Report generation orchestration

**Responsibilities:**
- Business rule enforcement and validation
- Role-based data scoping (Owner/Leader/Manager hierarchy)
- Employee-department assignment validation
- Manager-employee relationship validation
- Birth detail validation for astrological calculations
- Report generation workflow triggering
- Bulk data processing and validation
- Candidate-to-employee conversion logic
- WebSocket event publishing
- Background job queue management
- Transaction management for complex operations
- Cache invalidation coordination

**Key Business Rules:**
- Employees can only be assigned to departments within user's scope
- Managers must belong to the same department or parent department
- Birth details must be valid for astrological calculations (date, time, location)
- Employee deletion is soft delete with cascade to related data
- Report generation triggered automatically on employee creation/update
- Quarterly report regeneration for active subscription holders
- Leaders can only access employees in their assigned branches
- Managers can only access employees in their assigned department

### Data Access Layer

**Repositories:**
- `EmployeeRepository` - Employee data persistence
- `CandidateRepository` - Candidate data persistence
- `EmployeeHistoryRepository` - Audit trail storage

**Mongoose Schemas:**
- `EmployeeSchema` - Employee document structure
- `CandidateSchema` - Candidate document structure
- `EmployeeBirthDetailsSchema` - Embedded birth information
- `ProfessionalBackgroundSchema` - Embedded professional data

**Responsibilities:**
- MongoDB CRUD operations via Mongoose ODM
- Complex aggregation queries for reporting
- Data relationships and population
- Indexing for query optimization
- Soft delete implementation
- Audit trail creation
- Data validation at schema level
- Multi-tenant data isolation
- Query optimization and pagination
- Transaction support for atomic operations

**Key Indexes:**
- `organizationId, departmentId` - Department-scoped queries
- `managerId` - Manager's employee lookup
- `email` - Unique employee email validation
- `birthDate, birthTime, birthPlace` - Astrological queries
- `status, deletedAt` - Active employee filtering
- `createdAt` - Quarterly regeneration queries

## API Endpoints

### Employee Management Endpoints

#### Create Employee
```
POST /api/v1/employees
Authorization: Bearer {jwt_token}
Roles: Owner, Leader, Manager
Body: CreateEmployeeDto
Response: 201 Created - Employee profile with initial reports
```

#### List Employees (Role-Scoped)
```
GET /api/v1/employees?departmentId={id}&page={n}&limit={n}
Authorization: Bearer {jwt_token}
Roles: Owner, Leader, Manager
Response: 200 OK - Paginated employee list
```

#### Get Employee Details
```
GET /api/v1/employees/:id
Authorization: Bearer {jwt_token}
Roles: Owner, Leader, Manager
Response: 200 OK - Complete employee profile
```

#### Update Employee Profile
```
PUT /api/v1/employees/:id
Authorization: Bearer {jwt_token}
Roles: Owner, Leader, Manager
Body: UpdateEmployeeDto
Response: 200 OK - Updated employee profile
```

#### Delete Employee
```
DELETE /api/v1/employees/:id
Authorization: Bearer {jwt_token}
Roles: Owner, Leader, Manager
Response: 204 No Content
```

#### Assign Manager
```
PUT /api/v1/employees/:id/manager
Authorization: Bearer {jwt_token}
Roles: Owner, Leader
Body: { managerId: string }
Response: 200 OK - Updated employee with new manager
```

#### Get Employee Reports
```
GET /api/v1/employees/:id/reports
Authorization: Bearer {jwt_token}
Roles: Owner, Leader, Manager
Response: 200 OK - List of employee reports
```

### Candidate Management Endpoints

#### Create Candidate
```
POST /api/v1/candidates
Authorization: Bearer {jwt_token}
Roles: Owner, Leader, Manager
Body: CreateCandidateDto
Response: 201 Created - Candidate profile with assessment
```

#### List Candidates
```
GET /api/v1/candidates?positionId={id}&status={status}&page={n}
Authorization: Bearer {jwt_token}
Roles: Owner, Leader, Manager
Response: 200 OK - Paginated candidate list
```

#### Get Candidate Details
```
GET /api/v1/candidates/:id
Authorization: Bearer {jwt_token}
Roles: Owner, Leader, Manager
Response: 200 OK - Complete candidate profile
```

#### Update Candidate
```
PUT /api/v1/candidates/:id
Authorization: Bearer {jwt_token}
Roles: Owner, Leader, Manager
Body: UpdateCandidateDto
Response: 200 OK - Updated candidate profile
```

#### Convert Candidate to Employee
```
POST /api/v1/candidates/:id/convert-to-employee
Authorization: Bearer {jwt_token}
Roles: Owner, Leader
Body: { departmentId, managerId, startDate }
Response: 201 Created - New employee record
```

#### Delete Candidate
```
DELETE /api/v1/candidates/:id
Authorization: Bearer {jwt_token}
Roles: Owner, Leader, Manager
Response: 204 No Content
```

### Bulk Import Endpoints

#### Upload Employee Import File
```
POST /api/v1/import/employees
Authorization: Bearer {jwt_token}
Roles: Owner, Leader
Content-Type: multipart/form-data
Body: { file: CSV/Excel, departmentId?: string }
Response: 202 Accepted - { jobId, status: 'processing' }
```

#### Upload Candidate Import File
```
POST /api/v1/import/candidates
Authorization: Bearer {jwt_token}
Roles: Owner, Leader
Content-Type: multipart/form-data
Body: { file: CSV/Excel, positionId?: string }
Response: 202 Accepted - { jobId, status: 'processing' }
```

#### Check Import Status
```
GET /api/v1/import/status/:jobId
Authorization: Bearer {jwt_token}
Response: 200 OK - { jobId, status, progress, totalRecords, processedRecords }
```

#### Download Import Template
```
GET /api/v1/import/template/employees
Authorization: Bearer {jwt_token}
Response: 200 OK - CSV template file
```

#### Get Import Errors
```
GET /api/v1/import/errors/:jobId
Authorization: Bearer {jwt_token}
Response: 200 OK - { jobId, errors: [{ row, field, error }] }
```

## Database Schemas

### Employee Schema

```typescript
{
  _id: ObjectId,
  organizationId: ObjectId, // ref: 'Organization'
  departmentId: ObjectId, // ref: 'Department'
  managerId: ObjectId, // ref: 'User'
  
  // Personal Information
  personalInfo: {
    firstName: string,
    lastName: string,
    email: string, // unique
    phone: string,
    dateOfBirth: Date,
    gender: enum ['male', 'female', 'other'],
    nationality: string,
    profilePhoto?: string
  },
  
  // Birth Details for Astrology
  birthDetails: {
    birthDate: Date,
    birthTime: string, // HH:mm format
    birthPlace: {
      city: string,
      state: string,
      country: string,
      latitude: number,
      longitude: number,
      timezone: string
    },
    calculatedChartData: {
      sunSign: string,
      moonSign: string,
      ascendant: string,
      planetaryPositions: Object,
      harmonicCode: string, // Current harmonic energy code
      lastCalculated: Date
    }
  },
  
  // Professional Background
  professionalInfo: {
    employeeId: string, // Company employee ID
    jobTitle: string,
    jobRole: string,
    department: string,
    joiningDate: Date,
    employmentType: enum ['full-time', 'part-time', 'contract', 'intern'],
    workLocation: string,
    experienceYears: number,
    qualifications: [{
      degree: string,
      institution: string,
      year: number,
      field: string
    }],
    skills: [string],
    certifications: [{
      name: string,
      issuer: string,
      issueDate: Date,
      expiryDate?: Date
    }]
  },
  
  // Reporting Relationship
  reportingStructure: {
    managerId: ObjectId, // ref: 'User'
    managerName: string,
    departmentId: ObjectId, // ref: 'Department'
    departmentName: string,
    branchId: ObjectId, // ref: 'Branch'
    branchName: string
  },
  
  // Reports & Analysis
  reports: {
    personalityReportId: ObjectId, // ref: 'Report'
    behaviorReportId: ObjectId, // ref: 'Report'
    compatibilityReportIds: [ObjectId], // refs: 'Report'
    trainingReportId: ObjectId, // ref: 'Report'
    lastGeneratedAt: Date,
    nextRegenerationDate: Date
  },
  
  // Status & Metadata
  status: enum ['active', 'inactive', 'terminated', 'on-leave'],
  subscriptionActive: boolean,
  
  // Audit Fields
  createdBy: ObjectId, // ref: 'User'
  updatedBy: ObjectId, // ref: 'User'
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date,
  deletedBy?: ObjectId
}

// Indexes
Index: { organizationId: 1, departmentId: 1 }
Index: { managerId: 1 }
Index: { email: 1 }, unique: true
Index: { 'birthDetails.birthDate': 1, 'birthDetails.birthTime': 1 }
Index: { status: 1, deletedAt: 1 }
Index: { createdAt: 1 }
Index: { 'reports.nextRegenerationDate': 1 }
```

### Candidate Schema

```typescript
{
  _id: ObjectId,
  organizationId: ObjectId, // ref: 'Organization'
  positionId: ObjectId, // ref: 'JobPosition'
  
  // Personal Information
  personalInfo: {
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    dateOfBirth: Date,
    gender: enum ['male', 'female', 'other'],
    nationality: string,
    resumeUrl?: string,
    profilePhoto?: string
  },
  
  // Birth Details for Astrology
  birthDetails: {
    birthDate: Date,
    birthTime: string,
    birthPlace: {
      city: string,
      state: string,
      country: string,
      latitude: number,
      longitude: number,
      timezone: string
    },
    calculatedChartData: {
      sunSign: string,
      moonSign: string,
      ascendant: string,
      planetaryPositions: Object,
      harmonicCode: string,
      lastCalculated: Date
    }
  },
  
  // Professional Background
  professionalInfo: {
    currentJobTitle?: string,
    totalExperience: number,
    appliedPosition: string,
    appliedDepartment: string,
    expectedSalary?: number,
    noticePeriod?: number, // in days
    qualifications: [{
      degree: string,
      institution: string,
      year: number,
      field: string
    }],
    skills: [string],
    certifications: [{
      name: string,
      issuer: string,
      issueDate: Date
    }],
    previousEmployment: [{
      company: string,
      title: string,
      duration: string,
      responsibilities: string
    }]
  },
  
  // Application Status
  applicationStatus: {
    status: enum ['applied', 'screening', 'interview', 'assessment', 'offer', 'rejected', 'hired'],
    currentStage: string,
    appliedDate: Date,
    lastUpdated: Date,
    notes: string,
    interviewSchedule?: [{
      date: Date,
      interviewer: ObjectId, // ref: 'User'
      type: string,
      feedback?: string
    }]
  },
  
  // Candidate Reports
  reports: {
    compatibilityReportId: ObjectId, // ref: 'Report'
    assessmentReportId: ObjectId, // ref: 'Report'
    lastGeneratedAt: Date
  },
  
  // Conversion to Employee
  convertedToEmployee: {
    converted: boolean,
    employeeId?: ObjectId, // ref: 'Employee'
    conversionDate?: Date,
    convertedBy?: ObjectId // ref: 'User'
  },
  
  // Audit Fields
  createdBy: ObjectId, // ref: 'User'
  updatedBy: ObjectId, // ref: 'User'
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date
}

// Indexes
Index: { organizationId: 1, positionId: 1 }
Index: { email: 1, organizationId: 1 }
Index: { 'applicationStatus.status': 1 }
Index: { 'convertedToEmployee.converted': 1 }
Index: { createdAt: 1 }
```

### Import Job Schema

```typescript
{
  _id: ObjectId,
  organizationId: ObjectId, // ref: 'Organization'
  userId: ObjectId, // ref: 'User' - who initiated
  
  // Import Details
  importType: enum ['employee', 'candidate'],
  fileUrl: string,
  fileName: string,
  fileSize: number,
  
  // Processing Status
  status: enum ['pending', 'processing', 'completed', 'failed', 'partial'],
  progress: {
    totalRecords: number,
    processedRecords: number,
    successfulRecords: number,
    failedRecords: number,
    currentRow: number
  },
  
  // Results
  results: {
    createdIds: [ObjectId],
    errors: [{
      row: number,
      field: string,
      value: any,
      error: string
    }],
    warnings: [{
      row: number,
      field: string,
      message: string
    }]
  },
  
  // Metadata
  startedAt: Date,
  completedAt?: Date,
  estimatedCompletionTime?: Date,
  
  // Audit
  createdAt: Date,
  updatedAt: Date
}

// Indexes
Index: { organizationId: 1, userId: 1 }
Index: { status: 1 }
Index: { createdAt: 1 }
```

## Caching Strategy

### Redis Cache Implementation

**Cache Keys Pattern:**
```
employees:{organizationId}:list
employees:{organizationId}:{departmentId}:list
employees:{organizationId}:employee:{employeeId}
employees:{organizationId}:manager:{managerId}:list
candidates:{organizationId}:list
candidates:{organizationId}:position:{positionId}:list
reports:{employeeId}:summary
```

**Cache TTL (Time To Live):**
- Employee list by department: 15 minutes
- Individual employee profile: 30 minutes
- Employee reports summary: 1 hour
- Manager's employee list: 15 minutes
- Candidate list: 10 minutes
- Import job status: 5 minutes

**Cache Invalidation Strategy:**

1. **Write-Through Cache**: Update cache immediately after database write
2. **Invalidation Triggers**:
   - Employee creation → Invalidate department list, manager list, organization list
   - Employee update → Invalidate employee profile, department list
   - Employee deletion → Invalidate all related lists and profile
   - Manager reassignment → Invalidate both old and new manager lists
   - Department transfer → Invalidate both department lists
   - Report generation → Invalidate employee reports summary

3. **Bulk Operations**: Invalidate entire organization cache after bulk imports

**Cache-Aside Pattern Implementation:**
```typescript
// Read pattern
async getEmployee(id: string) {
  const cached = await redis.get(`employees:${orgId}:employee:${id}`);
  if (cached) return JSON.parse(cached);
  
  const employee = await this.employeeRepository.findById(id);
  await redis.setex(
    `employees:${orgId}:employee:${id}`,
    1800, // 30 minutes
    JSON.stringify(employee)
  );
  return employee;
}

// Write pattern
async updateEmployee(id: string, data: UpdateEmployeeDto) {
  const updated = await this.employeeRepository.update(id, data);
  
  // Update cache
  await redis.setex(
    `employees:${orgId}:employee:${id}`,
    1800,
    JSON.stringify(updated)
  );
  
  // Invalidate related lists
  await redis.del(
    `employees:${orgId}:${updated.departmentId}:list`,
    `employees:${orgId}:manager:${updated.managerId}:list`
  );
  
  return updated;
}
```

**Query Result Caching:**
- Complex aggregation queries cached for 30 minutes
- Role-scoped employee lists cached per user
- Search results cached with query hash as key

**Cache Warming:**
- Pre-load frequently accessed data on application startup
- Periodic cache warming for department employee lists
- Lazy loading for individual employee profiles

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Draft