# Error Handling - Employee & Candidate Management

## Error Scenarios Matrix

| Scenario | Error Code | HTTP Status | User Message | Resolution |
|----------|------------|-------------|--------------|------------|
| Employee not found | EMP_001 | 404 | Employee record not found | Verify employee ID and ensure employee exists in the system |
| Candidate not found | CND_001 | 404 | Candidate record not found | Verify candidate ID and ensure candidate exists in the system |
| Invalid birth details | EMP_002 | 400 | Invalid birth date or time provided | Provide valid birth date (YYYY-MM-DD) and time (HH:MM) in correct format |
| Missing required fields | EMP_003 | 400 | Required fields are missing: [field_names] | Complete all mandatory fields: name, birth details, department |
| Duplicate employee entry | EMP_004 | 409 | Employee with this email/ID already exists | Use unique email address or check existing employee records |
| Invalid department assignment | EMP_005 | 400 | Department does not exist or not accessible | Select valid department from your accessible departments |
| Invalid manager assignment | EMP_006 | 400 | Manager does not exist or not in same department hierarchy | Assign manager within the same organizational branch |
| Unauthorized access | EMP_007 | 403 | You do not have permission to access this employee | Contact your administrator for access permissions |
| Role scope violation | EMP_008 | 403 | Employee is outside your management scope | You can only manage employees within your assigned departments |
| Bulk import validation failed | IMP_001 | 400 | Import file contains validation errors | Review error report and correct invalid entries in rows: [row_numbers] |
| Invalid file format | IMP_002 | 400 | File format not supported. Use CSV or Excel | Upload file in .csv or .xlsx format |
| File size exceeded | IMP_003 | 413 | File size exceeds maximum limit of 10MB | Reduce file size or split into multiple smaller files |
| Bulk import partial failure | IMP_004 | 207 | Some records failed to import | Review error report for failed records and retry import |
| Employee already has reports | EMP_009 | 409 | Cannot delete employee with existing reports | Archive employee instead of deletion to maintain report history |
| Invalid professional background | EMP_010 | 400 | Professional details contain invalid data | Verify experience years, qualification, and role information |
| Department capacity exceeded | EMP_011 | 400 | Department has reached maximum employee capacity | Contact administrator to increase department capacity |
| Manager capacity exceeded | EMP_012 | 400 | Manager has reached maximum direct report limit | Assign employee to different manager or increase manager capacity |
| Inactive organization | ORG_001 | 403 | Organization subscription is inactive | Renew subscription to continue managing employees |
| Report generation in progress | EMP_013 | 409 | Employee reports are currently being generated | Wait for report generation to complete before updating employee |
| Invalid candidate status transition | CND_002 | 400 | Cannot transition candidate from [current] to [target] status | Follow valid status flow: Applied → Screening → Interview → Offer/Rejected |
| Candidate already converted | CND_003 | 409 | Candidate has already been converted to employee | View employee record instead of candidate record |
| Missing birth chart data | EMP_014 | 400 | Birth time required for astrological analysis | Provide accurate birth time for complete analysis |
| Invalid date range | EMP_015 | 400 | Start date cannot be after end date | Ensure employment start date is before end date |
| Circular reporting relationship | EMP_016 | 400 | Cannot assign manager - creates circular reporting chain | Select different manager to avoid circular reporting structure |
| Employee profile locked | EMP_017 | 423 | Employee profile is locked during report regeneration | Wait for quarterly update to complete before editing |
| Invalid role assignment | EMP_018 | 400 | Role does not exist in company role catalog | Select valid role from company's defined roles |
| Astrology service unavailable | SYS_001 | 503 | Astrological analysis service temporarily unavailable | Reports will be generated when service is restored |
| Database connection error | SYS_002 | 500 | Unable to connect to database | System administrators have been notified. Try again later |
| Harmonic code calculation failed | SYS_003 | 500 | Error calculating harmonic energy codes | Technical team notified. Employee profile saved, reports pending |
| Invalid email format | EMP_019 | 400 | Email address format is invalid | Provide valid email address in format: user@domain.com |
| Phone number format error | EMP_020 | 400 | Phone number format is invalid | Use format: +[country_code][number] (e.g., +1234567890) |
| Concurrent update conflict | EMP_021 | 409 | Employee record was modified by another user | Refresh page and reapply your changes |
| Export limit exceeded | EMP_022 | 400 | Export request exceeds limit of 1000 employees | Apply filters to reduce result set or contact support for bulk export |
| Invalid search query | EMP_023 | 400 | Search query contains invalid characters or operators | Use alphanumeric characters and supported operators: AND, OR |
| Branch access violation | EMP_024 | 403 | Employee belongs to different branch | You can only access employees in your assigned branches |
| Candidate conversion failed | CND_004 | 500 | Error converting candidate to employee | Check candidate data completeness and try again |
| Missing department assignment | EMP_025 | 400 | Department assignment is required for employees | Assign employee to a department before saving |
| Invalid employment type | EMP_026 | 400 | Employment type not recognized | Use valid types: Full-time, Part-time, Contract, Intern |
| Rate limit exceeded | SYS_004 | 429 | Too many requests. Please slow down | Wait 60 seconds before making additional requests |
| Invalid pagination parameters | EMP_027 | 400 | Page number or size is invalid | Use positive integers for page (≥1) and size (1-100) |
| Archive operation failed | EMP_028 | 500 | Unable to archive employee record | Contact support if issue persists |
| Restore operation failed | EMP_029 | 500 | Unable to restore archived employee | Verify employee is in archived state and try again |
| Invalid filter criteria | EMP_030 | 400 | Filter contains unsupported fields or operators | Use supported fields: department, role, status, manager |
| Batch operation limit exceeded | EMP_031 | 400 | Batch operation limited to 100 records at a time | Split operation into smaller batches |
| Missing manager assignment | EMP_032 | 400 | Manager assignment required for non-executive roles | Assign reporting manager or mark as executive role |
| Invalid qualification format | EMP_033 | 400 | Qualification data format is invalid | Provide degree, institution, and year in correct format |
| Experience data validation failed | EMP_034 | 400 | Work experience contains overlapping dates or gaps | Review employment history for date consistency |
| Profile picture upload failed | EMP_035 | 500 | Unable to upload profile picture | Ensure file is JPEG/PNG, max 2MB, and try again |
| Unsupported file type | IMP_005 | 415 | File type not supported for import | Use .csv or .xlsx files only |
| Template version mismatch | IMP_006 | 400 | Import template version is outdated | Download latest template from system settings |
| Duplicate entries in import | IMP_007 | 400 | Import file contains duplicate records | Remove duplicate entries and re-upload |
| Character encoding error | IMP_008 | 400 | File encoding not supported | Save file with UTF-8 encoding |
| WebSocket connection failed | WS_001 | 500 | Real-time updates unavailable | Page will not auto-update. Refresh manually for latest data |

## Common Error Codes

### Validation Errors (4xx)

#### EMP_002: Invalid Birth Details
**Context**: Birth date or time format validation failure during employee profile creation

**Causes**:
- Birth date in incorrect format (expected: YYYY-MM-DD)
- Birth time in incorrect format (expected: HH:MM in 24-hour format)
- Future birth date provided
- Birth date before 1900 or unrealistic values
- Missing birth time when required for astrological analysis

**Response Structure**:
```json
{
  "error": {
    "code": "EMP_002",
    "message": "Invalid birth date or time provided",
    "details": {
      "field": "birthDate",
      "provided": "13/31/2024",
      "expected": "YYYY-MM-DD (e.g., 1990-12-31)",
      "constraint": "Must be valid past date between 1900 and today"
    }
  }
}
```

**Resolution Steps**:
1. Validate date format before submission
2. Use date picker UI components for accurate input
3. Verify birth time in 24-hour format (00:00 to 23:59)
4. Ensure birth date is in the past
5. Contact data owner if birth time is unknown (required for analysis)

---

#### EMP_005: Invalid Department Assignment
**Context**: Attempting to assign employee to non-existent or inaccessible department

**Causes**:
- Department ID does not exist in the system
- Department belongs to different branch (cross-branch violation)
- User lacks permissions to assign to target department
- Department is archived or inactive
- Organization structure not yet configured

**Response Structure**:
```json
{
  "error": {
    "code": "EMP_005",
    "message": "Department does not exist or not accessible",
    "details": {
      "departmentId": "dept-xyz-789",
      "userId": "user-123",
      "accessibleDepartments": ["dept-abc-456", "dept-def-789"],
      "reason": "Department outside user's management scope"
    }
  }
}
```

**Resolution Steps**:
1. Retrieve list of accessible departments via GET `/api/departments/accessible`
2. Verify department exists and is active
3. Ensure department is within user's role scope (Leader/Manager)
4. Contact Owner to grant access to additional departments if needed
5. Use department selector UI component that filters by access permissions

---

#### IMP_001: Bulk Import Validation Failed
**Context**: CSV/Excel import contains invalid data preventing processing

**Causes**:
- Missing required columns in import file
- Data type mismatches (e.g., text in date fields)
- Invalid foreign key references (department IDs, manager IDs)
- Duplicate entries within import file
- Row-level validation failures (email format, phone format)
- Template version incompatibility

**Response Structure**:
```json
{
  "error": {
    "code": "IMP_001",
    "message": "Import file contains validation errors",
    "details": {
      "totalRows": 150,
      "validRows": 142,
      "errorRows": 8,
      "errors": [
        {
          "row": 5,
          "field": "email",
          "value": "invalid-email",
          "error": "Invalid email format"
        },
        {
          "row": 12,
          "field": "departmentId",
          "value": "dept-999",
          "error": "Department does not exist"
        },
        {
          "row": 23,
          "field": "birthDate",
          "value": "32/13/1990",
          "error": "Invalid date format. Use YYYY-MM-DD"
        }
      ],
      "downloadErrorReport": "/api/imports/errors/import-session-abc123.csv"
    }
  }
}
```

**Resolution Steps**:
1. Download error report CSV from provided URL
2. Correct invalid entries based on error descriptions
3. Use latest import template from system (GET `/api/imports/template`)
4. Validate department and manager IDs against system data
5. Remove duplicate entries (email addresses, employee IDs)
6. Re-upload corrected file
7. Consider partial import if errors affect minority of records

---

### Authorization Errors (403)

#### EMP_007: Unauthorized Access
**Context**: User attempting to access employee record outside their permissions

**Causes**:
- Manager trying to access employee in different department
- Leader trying to access employee in different branch
- User token expired or invalid
- Role permissions changed but token not refreshed
- Cross-organizational access attempt

**Response Structure**:
```json
{
  "error": {
    "code": "EMP_007",
    "message": "You do not have permission to access this employee",
    "details": {
      "employeeId": "emp-123-xyz",
      "userRole": "MANAGER",
      "userDepartments": ["dept-sales"],
      "employeeDepartment": "dept-engineering",
      "requiredPermission": "employees.read.all"
    }
  }
}
```

**Resolution Steps**:
1. Verify employee exists in your assigned departments
2. Contact Leader/Owner to request access if needed
3. Refresh authentication token if recently granted permissions
4. Use role-scoped employee list endpoints to see accessible employees
5. Check audit logs to verify permission changes

---

#### EMP_008: Role Scope Violation
**Context**: Action violates hierarchical role-based access control

**Causes**:
- Manager attempting to access Leader-scoped data
- Leader attempting to access different branch
- Insufficient privileges for requested operation
- Attempting to modify employee outside management hierarchy

**Response Structure**:
```json
{
  "error": {
    "code": "EMP_008",
    "message": "Employee is outside your management scope",
    "details": {
      "userRole": "MANAGER",
      "userScope": "Single department: Sales - North",
      "employeeLocation": "Engineering - Backend",
      "action": "UPDATE_EMPLOYEE",
      "requiredRole": "LEADER or OWNER"
    }
  }
}
```

**Resolution Steps**:
1. Confirm employee is within your role scope
2. Request elevated permissions from Owner if legitimate need
3. Use filtered employee lists that automatically apply scope
4. Escalate request to Leader/Owner for cross-department actions
5. Review organizational hierarchy if unclear about reporting structure

---

### Conflict Errors (409)

#### EMP_004: Duplicate Employee Entry
**Context**: Attempting to create employee with existing unique identifier

**Causes**:
- Email address already registered in system
- Employee ID conflicts with existing record
- Phone number already in use (if enforced as unique)
- Candidate already converted to employee
- Recent deletion not yet processed (soft delete timing)

**Response Structure**:
```json
{
  "error": {
    "code": "EMP_004",
    "message": "Employee with this email/ID already exists",
    "details": {
      "conflictField": "email",
      "conflictValue": "john.doe@company.com",
      "existingEmployeeId": "emp-789-abc",
      "existingEmployeeName": "John Doe",
      "existingEmployeeStatus": "ACTIVE",
      "createdAt": "2024-08-15T10:30:00Z"
    }
  }
}
```

**Resolution Steps**:
1. Search for existing employee by email/ID
2. Update existing record instead of creating new one
3. Verify if duplicate is intentional (same person, different role)
4. If employee left and rejoined, restore archived record
5. Use unique email per employee (add +tag if needed for testing)
6. Contact administrator if duplicate appears to be data error

---

#### EMP_009: Employee Already Has Reports
**Context**: Attempting to delete employee with generated analysis reports

**Causes**:
- Employee has one or more static reports generated
- Reports are referenced in audit trails
- Historical data preservation requirements
- Training recommendations exist
- AI chat history references employee

**Response Structure**:
```json
{
  "error": {
    "code": "EMP_009",
    "message": "Cannot delete employee with existing reports",
    "details": {
      "employeeId": "emp-456-def",
      "reportCount": 8,
      "reports": [
        "Personality Assessment",
        "Role Compatibility",
        "Department Compatibility",
        "Company Compatibility",
        "Industry Compatibility",
        "Behavioral Analysis",
        "Q&A Assessment",
        "Training Recommendations"
      ],
      "alternativeAction": "Archive employee instead",
      "archiveEndpoint": "PUT /api/employees/emp-456-def/archive"
    }
  }
}
```

**Resolution Steps**:
1. Use archive operation instead of delete: `PUT /api/employees/{id}/archive`
2. Archived employees remain in system but hidden from active lists
3. Reports remain accessible for historical reference
4. Archived employees can be restored if needed
5. Contact Owner if permanent deletion is required for compliance

---

### System Errors (5xx)

#### SYS_001: Astrology Service Unavailable
**Context**: External astrological calculation service is unreachable

**Causes**:
- Astrology API service downtime
- Network connectivity issues
- API rate limits exceeded
- Service maintenance window
- Invalid API credentials

**Response Structure**:
```json
{
  "error": {
    "code": "SYS_001",
    "message": "Astrological analysis service temporarily unavailable",
    "details": {
      "service": "Astrology Calculation Engine",
      "status": "UNAVAILABLE",
      "estimatedRecovery": "2025-11-11T14:00:00Z",
      "impact": "Employee profile saved. Reports will be generated when service recovers.",
      "retryPolicy": "Automatic retry every 15 minutes",
      "employeeId": "emp-new-123"
    }
  }
}
```

**Resolution Steps**:
1. Employee profile is saved successfully despite service failure
2. System will automatically retry report generation
3. Monitor service status page for recovery updates
4. Reports will be queued and processed when service returns
5. Check back in 30-60 minutes for completed reports
6. Contact support if service unavailable for >2 hours

---

#### SYS_003: Harmonic Code Calculation Failed
**Context**: Error during proprietary harmonic energy code computation

**Causes**:
- Incomplete birth data for calculations
- Algorithm processing error
- Mathematical computation overflow
- Invalid astrological chart data
- Database write failure during code storage

**Response Structure**:
```json
{
  "error": {
    "code": "SYS_003",
    "message": "Error calculating harmonic energy codes",
    "details": {
      "employeeId": "emp-789-xyz",
      "calculationStage": "Harmonic pattern analysis",
      "profileSaved": true,
      "reportsStatus": "PENDING",
      "technicalTeamNotified": true,
      "incidentId": "INC-2025-1111-0042",
      "nextAction": "Engineering team will investigate and retry calculation"
    }
  }
}
```

**Resolution Steps**:
1. Employee profile has been saved successfully
2. Technical team automatically notified with incident ID
3. Verify birth date and time are accurate and complete
4. System will retry calculation automatically
5. Reports will be generated once issue is resolved
6. Reference incident ID when contacting support
7. Typical resolution time: 2-4 hours

---

## Error Propagation

### Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer (Controllers/REST API)              │
│  - HTTP status code mapping                             │
│  - Error response formatting                            │
│  - User-friendly message generation                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Business Logic Layer (Services)                        │
│  - Business rule validation                             │
│  - Domain-specific error generation                     │
│  - Error context enrichment                             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Data Access Layer (Repositories)                       │
│  - Database constraint violations                       │
│  - Connection errors                                    │
│  - Query execution failures                             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  External Services Layer                                │
│  - Astrology API failures                               │
│  - Harmonic code service errors                         │
│  - AI/LLM service timeouts                              │
└─────────────────────────────────────────────────────────┘
```

### Error Flow Examples

#### Example 1: Invalid Department Assignment

**Origin**: Business Logic Layer (EmployeeService)

```typescript
// 1. Service Layer Detection
class EmployeeService {
  async createEmployee(data: CreateEmployeeDto, userId: string) {
    // Validate department access
    const hasAccess = await this.authorizationService.canAccessDepartment(
      userId, 
      data.departmentId
    );
    
    if (!hasAccess) {
      throw new BusinessRuleException({
        code: 'EMP_005',
        message: 'Department does not exist or not accessible',
        context: { userId, departmentId: data.departmentId }
      });
    }
  }
}

// 2. Exception Filter (NestJS)
@Catch(BusinessRuleException)
class BusinessRuleExceptionFilter implements ExceptionFilter {
  catch(exception: BusinessRuleException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    response.status(400).json({
      error: {
        code: exception.code,
        message: exception.message,
        details: exception.context
      }
    });
  }
}

// 3. Client receives HTTP 400 with structured error
```

**Propagation Steps**:
1. **Service Layer**: Business rule violation detected
2. **Exception Thrown**: BusinessRuleException with code EMP_005
3. **Filter Intercepts**: NestJS exception filter catches exception
4. **HTTP Response**: Formatted as 400 Bad Request with error details
5. **Client Handling**: Frontend displays user-friendly error message

---

#### Example 2: Database Connection Failure

**Origin**: Data Access Layer (Repository)

```typescript
// 1. Repository Layer
class EmployeeRepository {
  async save(employee: Employee): Promise<Employee> {
    try {
      return await this.employeeModel.create(employee);
    } catch (error) {
      if (error.name === 'MongoNetworkError') {
        throw new DatabaseException({
          code: 'SYS_002',
          message: 'Unable to connect to database',
          originalError: error
        });
      }
      throw error;
    }
  }
}

// 2. Service Layer - Passes through
class EmployeeService {
  async createEmployee(data: CreateEmployeeDto) {
    // Exception propagates through without catching
    return await this.employeeRepository.save(data);
  }
}

// 3. Global Exception Filter
@Catch(DatabaseException)
class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: DatabaseException, host: ArgumentsHost) {
    // Log to monitoring service
    this.logger.error('Database error', exception);
    
    // Alert system administrators
    this.alertService.notifyAdmins(exception);
    
    // Return generic error to client
    const response = host.switchToHttp().getResponse();
    response.status(500).json({
      error: {
        code: exception.code,
        message: exception.message,
        details: {
          incident: this.generateIncidentId(),
          timestamp: new Date().toISOString()
        }
      }
    });
  }
}
```

**Propagation Steps**:
1. **Repository**: MongoDB connection fails
2. **Exception Wrapped**: Converted to DatabaseException (SYS_002)
3. **Service Layer**: Exception passes through uncaught
4. **Global Filter**: Catches at application level
5. **Logging**: Error logged to monitoring system
6. **Alerting**: System administrators notified
7. **Client Response**: HTTP 500 with generic message (no internal details exposed)

---

#### Example 3: External Service Failure (Astrology API)

**Origin**: External Services Layer

```typescript
// 1. External Service Client
class AstrologyServiceClient {
  async calculateBirthChart(birthData: BirthData): Promise<BirthChart> {
    try {
      const response = await this.httpClient.post('/calculate', birthData);
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.response?.status === 503) {
        throw new ExternalServiceException({
          code: 'SYS_001',
          message: 'Astrological analysis service temporarily unavailable',
          service: 'Astrology Calculation Engine',
          retryable: true
        });
      }
      throw error;
    }
  }
}

// 2. Service Layer - Handles gracefully
class EmployeeService {
  async createEmployee(data: CreateEmployeeDto): Promise<Employee> {
    // Save employee first
    const employee = await this.employeeRepository.save(data);
    
    try {
      // Attempt report generation
      await this.reportService.generateReports(employee.id);
    } catch (error) {
      if (error instanceof ExternalServiceException && error.retryable) {
        // Queue for retry
        await this.reportQueue.add('generate-reports', {
          employeeId: employee.id,
          retryCount: 0
        });
        
        // Return partial success
        return {
          ...employee,
          _meta: {
            reportsStatus: 'PENDING',
            message: 'Reports will be generated when service is available'
          }
        };
      }
      throw error; // Non-retryable errors propagate
    }
    
    return employee;
  }
}

// 3. Controller returns 201 with warning
@Post()
async create(@Body() data: CreateEmployeeDto) {
  const result = await this.employeeService.createEmployee(data);
  
  if (result._meta?.reportsStatus === 'PENDING') {
    return {
      status: 201,
      data: result,
      warning: {
        code: 'SYS_001',
        message: result._meta.message
      }
    };
  }
  
  return { status: 201, data: result };
}
```

**Propagation Steps**:
1. **External Service**: Astrology API unavailable
2. **Client Wrapper**: Catches and converts to ExternalServiceException
3. **Service Layer**: Catches exception, saves employee, queues retry
4. **Controller**: Returns HTTP 201 (success) with warning metadata
5. **Background Queue**: Retries report generation periodically
6. **Client Handling**: Shows success with warning about pending reports

---

### Error Context Enrichment

Each layer adds relevant context as errors propagate upward:

**Data Layer Context**:
- Database operation type (INSERT, UPDATE, DELETE)
- Collection/table name
- Query parameters
- Constraint violations

**Business Layer Context**:
- User ID and role
- Business entity IDs (employee, department)
- Validation rule violated
- Required vs provided values

**Presentation Layer Context**:
- HTTP method and endpoint
- Request timestamp
- Client IP address
- User-friendly message
- Resolution suggestions

### Error Logging Strategy

**Local Development**:
- Full stack traces logged to console
- Error details visible in responses
- No external logging services

**Staging Environment**:
- Structured JSON logging
- Error tracking service integration (e.g., Sentry)
- Detailed context for debugging
- Sanitized sensitive data

**Production Environment**:
- Minimal client-facing error details
- Comprehensive server-side logging
- Real-time alerting for critical errors
- Audit trail for compliance
- Performance metrics tracking

### Retry and Recovery Policies

| Error Type | Retry Strategy | Max Retries | Backoff |
|------------|---------------|-------------|---------|
| Database connection | Exponential backoff | 3 | 1s, 2s, 4s |
| Astrology service | Queue-based retry | 10 | 15 min intervals |
| Harmonic calculation | Immediate + Queue | 2 + Queue | 30s, then queue |
| Email notifications | Queue-based | 5 | 5 min intervals |
| WebSocket events | No retry (fire-and-forget) | 0 | N/A |
| File uploads | Client-side retry | User-controlled | N/A |

**Document Version:** 1.0  
**Last Updated:** 2025-11-10  
**Status:** Complete