# Error Handling - Organization Management

## Error Scenarios Matrix

| Scenario | Error Code | HTTP Status | User Message | Resolution |
|----------|------------|-------------|--------------|------------|
| Organization not found | ORG_001 | 404 | Organization not found | Verify organization ID and ensure it exists |
| Duplicate organization name | ORG_002 | 409 | An organization with this name already exists | Choose a different organization name |
| Invalid astrological data | ORG_003 | 400 | Invalid birth date or time for astrological calculation | Provide valid date in format YYYY-MM-DD and time in HH:MM format |
| Missing required company data | ORG_004 | 400 | Required fields missing: {field_names} | Complete all mandatory fields: name, founding date, industry |
| Unauthorized organization access | ORG_005 | 403 | You don't have permission to access this organization | Contact organization owner for access |
| Organization limit exceeded | ORG_006 | 403 | Subscription plan limit reached | Upgrade subscription plan to create more organizations |
| Branch not found | BRN_001 | 404 | Branch not found | Verify branch ID and ensure it exists in the organization |
| Duplicate branch name | BRN_002 | 409 | A branch with this name already exists in the organization | Choose a different branch name |
| Branch has active employees | BRN_003 | 409 | Cannot delete branch with active employees | Remove or reassign all employees before deletion |
| Branch limit exceeded | BRN_004 | 403 | Maximum branch limit reached for your plan | Upgrade subscription or remove unused branches |
| Department not found | DEPT_001 | 404 | Department not found | Verify department ID and ensure it exists |
| Duplicate department name | DEPT_002 | 409 | A department with this name already exists in the branch | Choose a different department name |
| Invalid department template | DEPT_003 | 400 | Department template not found or invalid | Select a valid template from available options |
| Department has active employees | DEPT_004 | 409 | Cannot delete department with active employees | Remove or reassign all employees before deletion |
| Invalid hierarchical structure | DEPT_005 | 400 | Invalid parent department reference | Ensure parent department exists and no circular references |
| Department limit exceeded | DEPT_006 | 403 | Maximum department limit reached for branch | Upgrade plan or remove unused departments |
| Astrology service unavailable | ASTRO_001 | 503 | Astrological calculation service temporarily unavailable | Retry after a few minutes or contact support |
| Invalid birth location | ASTRO_002 | 400 | Invalid location coordinates for astrological calculation | Provide valid latitude/longitude or city name |
| Harmonic calculation failed | ASTRO_003 | 500 | Failed to generate harmonic energy code | Verify astrological data and retry |
| Missing timezone data | ASTRO_004 | 400 | Timezone information required for accurate calculation | Provide timezone or UTC offset |
| Invalid industry classification | IND_001 | 400 | Invalid industry category selected | Choose from predefined industry list |
| Cultural values validation failed | CUL_001 | 400 | Cultural values must have at least 3 entries | Provide minimum 3 cultural values |
| Invalid energy mapping data | ENR_001 | 400 | Harmonic energy values must be between 0-100 | Correct energy values to valid range |
| Branch isolation violation | SEC_001 | 403 | Cross-branch data access not permitted | Access only branches within your scope |
| Organization owner transfer failed | OWN_001 | 400 | Cannot transfer ownership to non-existent user | Verify target user exists and has appropriate role |
| Template loading failed | TPL_001 | 500 | Failed to load department templates | Retry or create departments manually |
| Concurrent update conflict | CONC_001 | 409 | Organization data was modified by another user | Refresh data and retry operation |
| Invalid organization status | STAT_001 | 400 | Operation not allowed for {status} organization | Activate organization before performing this action |
| Subscription inactive | SUB_001 | 402 | Active subscription required for this operation | Renew or activate subscription |
| Data migration in progress | MIG_001 | 423 | Organization data migration in progress | Wait for migration to complete |
| Bulk operation partial failure | BULK_001 | 207 | {success_count} of {total_count} operations completed | Review error details for failed items |
| Invalid role assignment | ROLE_001 | 400 | Cannot assign role {role} at organization level | Verify role is appropriate for organizational context |
| Export generation failed | EXP_001 | 500 | Failed to generate organization structure export | Retry export operation or contact support |
| Import validation failed | IMP_001 | 400 | Import file validation failed: {errors} | Correct file format and retry import |
| Circular hierarchy detected | HIR_001 | 400 | Circular reference detected in organizational hierarchy | Remove circular dependencies in structure |
| Branch region conflict | REG_001 | 409 | Branch location conflicts with existing regional setup | Verify regional settings and branch allocation |
| Department capacity exceeded | CAP_001 | 400 | Department employee capacity limit reached | Increase capacity or create additional department |
| Invalid fiscal year configuration | FIS_001 | 400 | Fiscal year dates overlap or invalid | Provide non-overlapping fiscal year period |
| Audit log retrieval failed | AUD_001 | 500 | Failed to retrieve organization audit logs | Retry or contact support for assistance |
| Integration sync failed | INT_001 | 502 | Failed to sync with external HRMS system | Check integration credentials and connectivity |
| Rate limit exceeded | RATE_001 | 429 | Too many requests. Please try again later | Wait {retry_after} seconds before retrying |
| Archive operation failed | ARC_001 | 500 | Failed to archive organization data | Ensure no active processes and retry |
| Restore operation failed | RES_001 | 500 | Failed to restore archived organization | Verify archive integrity and retry |

## Common Error Codes

### ORG - Organization Errors (ORG_XXX)
**Range**: ORG_001 to ORG_999

- **ORG_001**: Resource not found - organization does not exist
- **ORG_002**: Duplicate resource - organization name conflict
- **ORG_003**: Validation failure - astrological data invalid
- **ORG_004**: Missing required data - mandatory fields not provided
- **ORG_005**: Authorization failure - insufficient permissions
- **ORG_006**: Quota exceeded - subscription limit reached

**Error Response Format**:
```json
{
  "statusCode": 400,
  "errorCode": "ORG_004",
  "message": "Required fields missing: founding_date, industry",
  "details": {
    "missingFields": ["founding_date", "industry"],
    "providedFields": ["name", "owner_id"]
  },
  "timestamp": "2025-11-10T10:30:00Z",
  "path": "/api/v1/organizations"
}
```

### BRN - Branch Errors (BRN_XXX)
**Range**: BRN_001 to BRN_999

- **BRN_001**: Resource not found - branch does not exist
- **BRN_002**: Duplicate resource - branch name conflict within organization
- **BRN_003**: Constraint violation - branch has dependencies
- **BRN_004**: Quota exceeded - branch limit reached

**Error Response Format**:
```json
{
  "statusCode": 409,
  "errorCode": "BRN_003",
  "message": "Cannot delete branch with active employees",
  "details": {
    "branchId": "branch_12345",
    "employeeCount": 47,
    "action": "reassign_or_remove_employees"
  },
  "timestamp": "2025-11-10T10:30:00Z",
  "path": "/api/v1/branches/branch_12345"
}
```

### DEPT - Department Errors (DEPT_XXX)
**Range**: DEPT_001 to DEPT_999

- **DEPT_001**: Resource not found - department does not exist
- **DEPT_002**: Duplicate resource - department name conflict
- **DEPT_003**: Validation failure - invalid template reference
- **DEPT_004**: Constraint violation - department has dependencies
- **DEPT_005**: Data integrity - invalid hierarchical reference
- **DEPT_006**: Quota exceeded - department limit reached

**Error Response Format**:
```json
{
  "statusCode": 400,
  "errorCode": "DEPT_005",
  "message": "Invalid parent department reference",
  "details": {
    "departmentId": "dept_789",
    "parentId": "dept_999",
    "issue": "circular_reference_detected",
    "hierarchyPath": ["dept_789", "dept_456", "dept_999", "dept_789"]
  },
  "timestamp": "2025-11-10T10:30:00Z",
  "path": "/api/v1/departments/dept_789"
}
```

### ASTRO - Astrology Service Errors (ASTRO_XXX)
**Range**: ASTRO_001 to ASTRO_999

- **ASTRO_001**: Service unavailable - astrology calculation service down
- **ASTRO_002**: Validation failure - invalid location data
- **ASTRO_003**: Processing failure - harmonic calculation error
- **ASTRO_004**: Missing data - timezone information required

**Error Response Format**:
```json
{
  "statusCode": 503,
  "errorCode": "ASTRO_001",
  "message": "Astrological calculation service temporarily unavailable",
  "details": {
    "service": "astrology-api",
    "retryAfter": 300,
    "fallbackAvailable": false
  },
  "timestamp": "2025-11-10T10:30:00Z",
  "path": "/api/v1/organizations/astrology/calculate"
}
```

### IND/CUL/ENR - Configuration Errors
**Range**: IND_001, CUL_001, ENR_001

- **IND_001**: Invalid industry classification
- **CUL_001**: Cultural values validation failure
- **ENR_001**: Harmonic energy mapping data invalid

### SEC - Security Errors (SEC_XXX)
**Range**: SEC_001 to SEC_999

- **SEC_001**: Access control violation - branch isolation breach

**Error Response Format**:
```json
{
  "statusCode": 403,
  "errorCode": "SEC_001",
  "message": "Cross-branch data access not permitted",
  "details": {
    "userRole": "LEADER",
    "userScope": ["branch_001", "branch_002"],
    "attemptedAccess": "branch_005",
    "organizationId": "org_123"
  },
  "timestamp": "2025-11-10T10:30:00Z",
  "path": "/api/v1/branches/branch_005/employees"
}
```

### SYSTEM - System Errors
**Range**: Various (OWN_XXX, TPL_XXX, CONC_XXX, etc.)

- **OWN_001**: Ownership transfer failure
- **TPL_001**: Template system failure
- **CONC_001**: Concurrent modification conflict
- **STAT_001**: Invalid status transition
- **SUB_001**: Subscription validation failure
- **MIG_001**: Data migration lock
- **BULK_001**: Partial bulk operation failure
- **RATE_001**: API rate limit exceeded

## Error Propagation

### Layer Architecture

```
Controller Layer
    ↓ (HTTP Exception)
Exception Filter
    ↓ (Formatted Response)
Client Response
```

### 1. Service Layer → Controller Layer

**Service Layer** throws domain-specific exceptions:

```typescript
// organization.service.ts
async createOrganization(dto: CreateOrganizationDto) {
  const existing = await this.findByName(dto.name);
  if (existing) {
    throw new OrganizationException(
      'ORG_002',
      'An organization with this name already exists',
      HttpStatus.CONFLICT,
      { existingId: existing.id, attemptedName: dto.name }
    );
  }
  
  try {
    const astrologyData = await this.astrologyService.calculate(dto.birthData);
    return await this.organizationRepository.create({ ...dto, astrologyData });
  } catch (error) {
    if (error instanceof AstrologyServiceException) {
      throw new OrganizationException(
        'ASTRO_001',
        'Astrological calculation service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
        { originalError: error.message }
      );
    }
    throw error;
  }
}
```

**Controller Layer** catches and re-throws with HTTP context:

```typescript
// organization.controller.ts
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
async create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: User) {
  try {
    return await this.organizationService.createOrganization(dto);
  } catch (error) {
    if (error instanceof OrganizationException) {
      throw new HttpException(
        {
          statusCode: error.httpStatus,
          errorCode: error.code,
          message: error.message,
          details: error.details,
          timestamp: new Date().toISOString(),
          path: '/api/v1/organizations'
        },
        error.httpStatus
      );
    }
    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
```

### 2. Module Interaction Error Flow

**Cross-Module Communication**:

```typescript
// organization.service.ts
async createWithDepartments(orgDto: CreateOrgDto, deptTemplateId: string) {
  let organization;
  
  try {
    // Step 1: Create organization
    organization = await this.create(orgDto);
    
    // Step 2: Calculate astrology
    const astrologyData = await this.astrologyService.calculate(orgDto.birthData);
    await this.update(organization.id, { astrologyData });
    
    // Step 3: Apply department template
    const departments = await this.departmentService.applyTemplate(
      organization.id,
      deptTemplateId
    );
    
    return { organization, departments };
    
  } catch (error) {
    // Rollback on failure
    if (organization) {
      await this.rollbackOrganization(organization.id);
    }
    
    // Propagate specific error
    if (error instanceof DepartmentTemplateException) {
      throw new OrganizationException(
        'TPL_001',
        'Failed to apply department template',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { 
          organizationId: organization?.id,
          templateId: deptTemplateId,
          originalError: error.message 
        }
      );
    }
    
    throw error;
  }
}
```

### 3. Global Exception Filter

**All exceptions are caught by global filter**:

```typescript
// http-exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      errorResponse = {
        statusCode: status,
        errorCode: exceptionResponse['errorCode'] || 'UNKNOWN',
        message: exceptionResponse['message'] || exception.message,
        details: exceptionResponse['details'] || {},
        timestamp: new Date().toISOString(),
        path: request.url
      };
    } else if (exception instanceof MongoError) {
      errorResponse = this.handleMongoError(exception, request.url);
      status = errorResponse.statusCode;
    } else {
      // Unhandled exception
      this.logger.error('Unhandled exception', exception);
      errorResponse = {
        statusCode: 500,
        errorCode: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: {},
        timestamp: new Date().toISOString(),
        path: request.url
      };
    }

    // Log error for monitoring
    this.logger.error(
      `Error ${errorResponse.errorCode}: ${errorResponse.message}`,
      { exception, errorResponse, user: request['user']?.id }
    );

    response.status(status).json(errorResponse);
  }

  private handleMongoError(error: MongoError, path: string): ErrorResponse {
    if (error.code === 11000) {
      return {
        statusCode: 409,
        errorCode: 'DUPLICATE_KEY',
        message: 'Resource already exists',
        details: { duplicateFields: Object.keys(error['keyPattern'] || {}) },
        timestamp: new Date().toISOString(),
        path
      };
    }
    return {
      statusCode: 500,
      errorCode: 'DATABASE_ERROR',
      message: 'Database operation failed',
      details: { mongoError: error.message },
      timestamp: new Date().toISOString(),
      path
    };
  }
}
```

### 4. Validation Error Propagation

**Class-validator errors are automatically caught**:

```typescript
// Global validation pipe configuration
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors: ValidationError[]) => {
      const formattedErrors = errors.map(error => ({
        field: error.property,
        constraints: error.constraints,
        value: error.value
      }));
      
      return new HttpException(
        {
          statusCode: 400,
          errorCode: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: { validationErrors: formattedErrors },
          timestamp: new Date().toISOString()
        },
        HttpStatus.BAD_REQUEST
      );
    }
  })
);
```

### 5. Async Error Handling

**Queue-based operations**:

```typescript
// organization.processor.ts
@Processor('organization')
export class OrganizationProcessor {
  @Process('calculate-harmonic-energy')
  async processHarmonicCalculation(job: Job) {
    try {
      const { organizationId } = job.data;
      const result = await this.astrologyService.calculateHarmonic(organizationId);
      return result;
    } catch (error) {
      // Log error
      this.logger.error(`Harmonic calculation failed for ${job.data.organizationId}`, error);
      
      // Store error in job
      await job.log(`Error: ${error.message}`);
      
      // Retry logic (handled by BullMQ)
      throw error;
    }
  }
}
```

### 6. WebSocket Error Propagation

**Real-time event errors**:

```typescript
// organization.gateway.ts
@WebSocketGateway()
export class OrganizationGateway {
  @SubscribeMessage('organization:update')
  async handleUpdate(client: Socket, payload: UpdateOrgDto) {
    try {
      const result = await this.organizationService.update(payload.id, payload.data);
      client.emit('organization:updated', result);
      return { success: true };
    } catch (error) {
      client.emit('organization:error', {
        errorCode: error.code || 'WS_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return { success: false, error: error.message };
    }
  }
}
```

### 7. Error Response Format

**Standard error response structure**:

```typescript
interface ErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  path: string;
  requestId?: string;
  stack?: string; // Only in development
}
```

**Example responses**:

```json
{
  "statusCode": 404,
  "errorCode": "ORG_001",
  "message": "Organization not found",
  "details": {
    "organizationId": "org_12345"
  },
  "timestamp": "2025-11-10T10:30:00Z",
  "path": "/api/v1/organizations/org_12345",
  "requestId": "req_abc123"
}
```

### 8. Client Error Handling Guidelines

**Recommended client-side handling**:

```typescript
// Example client error handler
async function handleOrganizationOperation() {
  try {
    const response = await api.createOrganization(data);
    return response;
  } catch (error) {
    const { errorCode, message, details } = error.response.data;
    
    switch (errorCode) {
      case 'ORG_002':
        showError('Organization name already exists. Please choose another name.');
        break;
      case 'ASTRO_001':
        showError('Service temporarily unavailable. Please try again in a few minutes.');
        setTimeout(retry, details.retryAfter * 1000);
        break;
      case 'SUB_001':
        redirectToSubscription();
        break;
      default:
        showError(message || 'An unexpected error occurred');
    }
  }
}
```

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Production Ready