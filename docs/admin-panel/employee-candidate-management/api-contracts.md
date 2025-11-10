# API Contracts - Employee & Candidate Management

## Overview

This document defines all API endpoints (internal and external) for the Employee & Candidate Management module within the PlanetsHR NestJS monolithic application.

## Authentication & Authorization

All endpoints require JWT authentication via `Authorization: Bearer <token>` header unless specified otherwise.

Role-based access control is enforced through NestJS Guards:
- `@UseGuards(JwtAuthGuard, RolesGuard)`
- `@Roles(UserRole.OWNER, UserRole.LEADER, UserRole.MANAGER)`

## External APIs

### Employee Management Endpoints

#### 1. Create Employee

**Endpoint:** `POST /api/v1/employees`

**Roles:** Owner, Leader, Manager

**Request Body:**
```json
{
  "personalInfo": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "dateOfBirth": "YYYY-MM-DD",
    "timeOfBirth": "HH:MM:SS",
    "placeOfBirth": {
      "city": "string",
      "state": "string",
      "country": "string",
      "latitude": "number",
      "longitude": "number"
    },
    "gender": "male|female|other",
    "address": {
      "street": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "country": "string"
    }
  },
  "professionalInfo": {
    "employeeId": "string",
    "jobTitle": "string",
    "department": "string (ObjectId reference)",
    "manager": "string (ObjectId reference)",
    "dateOfJoining": "YYYY-MM-DD",
    "employmentType": "full-time|part-time|contract|intern",
    "experienceYears": "number",
    "previousCompanies": ["string"],
    "qualifications": [
      {
        "degree": "string",
        "institution": "string",
        "year": "number"
      }
    ],
    "skills": ["string"],
    "certifications": ["string"]
  },
  "organizationInfo": {
    "organizationId": "string (ObjectId reference)",
    "branchId": "string (ObjectId reference)",
    "departmentId": "string (ObjectId reference)"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "employeeId": "string (ObjectId)",
    "personalInfo": { },
    "professionalInfo": { },
    "organizationInfo": { },
    "reportGenerationStatus": "queued",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  },
  "message": "Employee created successfully. Reports are being generated."
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors
- `403 Forbidden` - User lacks permission for specified department
- `409 Conflict` - Employee with email already exists

---

#### 2. Get Employee Details

**Endpoint:** `GET /api/v1/employees/:employeeId`

**Roles:** Owner, Leader, Manager

**Path Parameters:**
- `employeeId` - Employee ObjectId

**Query Parameters:**
- `includeReports` (optional, boolean) - Include report generation status
- `includeManager` (optional, boolean) - Populate manager details

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "employeeId": "string",
    "personalInfo": { },
    "professionalInfo": {
      "manager": {
        "id": "string",
        "name": "string",
        "email": "string"
      }
    },
    "organizationInfo": { },
    "astrologyData": {
      "sunSign": "string",
      "moonSign": "string",
      "ascendant": "string",
      "harmonicCode": "string",
      "lastCalculated": "timestamp"
    },
    "reportStatus": {
      "personalityReport": "completed|pending|failed",
      "behaviorReport": "completed|pending|failed",
      "roleCompatibility": "completed|pending|failed",
      "departmentCompatibility": "completed|pending|failed",
      "companyCompatibility": "completed|pending|failed",
      "industryCompatibility": "completed|pending|failed",
      "qaReport": "completed|pending|failed",
      "trainingReport": "completed|pending|failed",
      "lastGenerated": "timestamp",
      "nextUpdate": "timestamp"
    },
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Error Responses:**
- `403 Forbidden` - User lacks access to this employee
- `404 Not Found` - Employee not found

---

#### 3. Update Employee

**Endpoint:** `PUT /api/v1/employees/:employeeId`

**Roles:** Owner, Leader, Manager

**Request Body:** (Partial update supported)
```json
{
  "personalInfo": { },
  "professionalInfo": { },
  "organizationInfo": { }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "employeeId": "string",
    "updated": true,
    "reportsRegenerationQueued": true
  },
  "message": "Employee updated successfully. Reports will be regenerated."
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors
- `403 Forbidden` - User lacks permission
- `404 Not Found` - Employee not found

---

#### 4. Delete Employee

**Endpoint:** `DELETE /api/v1/employees/:employeeId`

**Roles:** Owner, Leader, Manager

**Query Parameters:**
- `hardDelete` (optional, boolean, default: false) - Permanent deletion vs soft delete

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Employee deleted successfully",
  "data": {
    "employeeId": "string",
    "deletedAt": "timestamp",
    "hardDelete": false
  }
}
```

**Error Responses:**
- `403 Forbidden` - User lacks permission
- `404 Not Found` - Employee not found

---

#### 5. List Employees

**Endpoint:** `GET /api/v1/employees`

**Roles:** Owner, Leader, Manager

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `departmentId` (optional, string) - Filter by department
- `branchId` (optional, string) - Filter by branch
- `managerId` (optional, string) - Filter by manager
- `employmentType` (optional, string) - Filter by employment type
- `search` (optional, string) - Search by name or email
- `sortBy` (optional, string, default: "createdAt") - Sort field
- `sortOrder` (optional, "asc"|"desc", default: "desc")

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "employeeId": "string",
        "name": "string",
        "email": "string",
        "jobTitle": "string",
        "department": { "id": "string", "name": "string" },
        "manager": { "id": "string", "name": "string" },
        "employmentType": "string",
        "dateOfJoining": "date",
        "reportStatus": "all_completed|pending|failed"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    }
  }
}
```

---

#### 6. Bulk Import Employees

**Endpoint:** `POST /api/v1/employees/bulk-import`

**Roles:** Owner, Leader, Manager

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (CSV/Excel file)
- `departmentId` (string) - Target department
- `branchId` (optional, string) - Target branch
- `managerId` (optional, string) - Default manager for all employees
- `validateOnly` (optional, boolean, default: false) - Dry-run validation

**CSV Format:**
```csv
firstName,lastName,email,phone,dateOfBirth,timeOfBirth,birthCity,birthState,birthCountry,latitude,longitude,jobTitle,employmentType,dateOfJoining,experienceYears
John,Doe,john.doe@example.com,+1234567890,1990-05-15,14:30:00,New York,NY,USA,40.7128,-74.0060,Software Engineer,full-time,2024-01-15,5
```

**Response:** `202 Accepted`
```json
{
  "success": true,
  "data": {
    "importJobId": "string",
    "status": "queued",
    "totalRecords": 150,
    "validRecords": 145,
    "invalidRecords": 5,
    "errors": [
      {
        "row": 3,
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "message": "Bulk import queued successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid file format or structure
- `403 Forbidden` - User lacks permission for target department
- `413 Payload Too Large` - File exceeds size limit

---

#### 7. Get Bulk Import Status

**Endpoint:** `GET /api/v1/employees/bulk-import/:importJobId`

**Roles:** Owner, Leader, Manager

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "importJobId": "string",
    "status": "completed|processing|failed",
    "progress": {
      "total": 150,
      "processed": 150,
      "successful": 145,
      "failed": 5
    },
    "results": {
      "createdEmployees": ["employeeId1", "employeeId2"],
      "failedRows": [
        {
          "row": 3,
          "data": { },
          "error": "Duplicate email address"
        }
      ]
    },
    "startedAt": "timestamp",
    "completedAt": "timestamp"
  }
}
```

---

#### 8. Get Employee by Manager

**Endpoint:** `GET /api/v1/employees/by-manager/:managerId`

**Roles:** Owner, Leader, Manager

**Query Parameters:**
- Same pagination and filtering as List Employees

**Response:** Same as List Employees with filtered results

---

#### 9. Update Employee Department

**Endpoint:** `PATCH /api/v1/employees/:employeeId/department`

**Roles:** Owner, Leader

**Request Body:**
```json
{
  "departmentId": "string",
  "managerId": "string (optional)",
  "effectiveDate": "YYYY-MM-DD (optional, default: now)",
  "reason": "string (optional)"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "employeeId": "string",
    "previousDepartment": "string",
    "newDepartment": "string",
    "effectiveDate": "date",
    "reportsRegenerationQueued": true
  },
  "message": "Department updated successfully"
}
```

---

### Candidate Management Endpoints

#### 10. Create Candidate

**Endpoint:** `POST /api/v1/candidates`

**Roles:** Owner, Leader, Manager

**Request Body:**
```json
{
  "personalInfo": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "dateOfBirth": "YYYY-MM-DD",
    "timeOfBirth": "HH:MM:SS",
    "placeOfBirth": {
      "city": "string",
      "state": "string",
      "country": "string",
      "latitude": "number",
      "longitude": "number"
    }
  },
  "applicationInfo": {
    "appliedPosition": "string",
    "targetDepartment": "string (ObjectId reference)",
    "resumeUrl": "string (optional)",
    "coverLetterUrl": "string (optional)",
    "applicationDate": "YYYY-MM-DD",
    "source": "job-board|referral|direct|linkedin|other",
    "referredBy": "string (optional)"
  },
  "professionalBackground": {
    "experienceYears": "number",
    "currentCompany": "string (optional)",
    "currentRole": "string (optional)",
    "previousCompanies": ["string"],
    "qualifications": [
      {
        "degree": "string",
        "institution": "string",
        "year": "number"
      }
    ],
    "skills": ["string"],
    "certifications": ["string"]
  },
  "organizationInfo": {
    "organizationId": "string (ObjectId reference)",
    "branchId": "string (ObjectId reference, optional)"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "candidateId": "string (ObjectId)",
    "personalInfo": { },
    "applicationInfo": { },
    "professionalBackground": { },
    "analysisStatus": "queued",
    "createdAt": "timestamp"
  },
  "message": "Candidate created successfully. Analysis reports are being generated."
}
```

---

#### 11. Get Candidate Details

**Endpoint:** `GET /api/v1/candidates/:candidateId`

**Roles:** Owner, Leader, Manager

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "candidateId": "string",
    "personalInfo": { },
    "applicationInfo": {
      "status": "new|screening|interview|offer|rejected|hired",
      "appliedPosition": "string",
      "targetDepartment": { }
    },
    "professionalBackground": { },
    "astrologyData": {
      "sunSign": "string",
      "moonSign": "string",
      "ascendant": "string",
      "harmonicCode": "string"
    },
    "compatibilityReports": {
      "roleCompatibility": {
        "status": "completed|pending|failed",
        "score": 85,
        "summary": "string"
      },
      "departmentCompatibility": {
        "status": "completed|pending|failed",
        "score": 78,
        "summary": "string"
      },
      "companyCompatibility": {
        "status": "completed|pending|failed",
        "score": 90,
        "summary": "string"
      },
      "industryCompatibility": {
        "status": "completed|pending|failed",
        "score": 82,
        "summary": "string"
      }
    },
    "interviewHistory": [
      {
        "date": "timestamp",
        "interviewer": "string",
        "round": "string",
        "feedback": "string",
        "rating": "number"
      }
    ],
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

---

#### 12. Update Candidate Status

**Endpoint:** `PATCH /api/v1/candidates/:candidateId/status`

**Roles:** Owner, Leader, Manager

**Request Body:**
```json
{
  "status": "screening|interview|offer|rejected|hired",
  "notes": "string (optional)",
  "rejectionReason": "string (required if status=rejected)",
  "offerDetails": {
    "salary": "number",
    "joiningDate": "YYYY-MM-DD",
    "benefits": ["string"]
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "candidateId": "string",
    "previousStatus": "string",
    "newStatus": "string",
    "updatedAt": "timestamp"
  }
}
```

---

#### 13. Convert Candidate to Employee

**Endpoint:** `POST /api/v1/candidates/:candidateId/convert-to-employee`

**Roles:** Owner, Leader

**Request Body:**
```json
{
  "employeeId": "string",
  "jobTitle": "string",
  "departmentId": "string",
  "managerId": "string",
  "dateOfJoining": "YYYY-MM-DD",
  "employmentType": "full-time|part-time|contract|intern",
  "salary": "number (optional)",
  "additionalInfo": { }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "employeeId": "string",
    "candidateId": "string",
    "conversionDate": "timestamp",
    "candidateArchived": true
  },
  "message": "Candidate successfully converted to employee"
}
```

---

#### 14. List Candidates

**Endpoint:** `GET /api/v1/candidates`

**Roles:** Owner, Leader, Manager

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `status` (optional, string) - Filter by application status
- `targetDepartment` (optional, string) - Filter by department
- `appliedPosition` (optional, string) - Filter by position
- `source` (optional, string) - Filter by application source
- `search` (optional, string) - Search by name or email
- `sortBy` (optional, string, default: "applicationDate")
- `sortOrder` (optional, "asc"|"desc", default: "desc")

**Response:** Similar to List Employees with candidate-specific fields

---

#### 15. Add Interview Feedback

**Endpoint:** `POST /api/v1/candidates/:candidateId/interviews`

**Roles:** Owner, Leader, Manager

**Request Body:**
```json
{
  "interviewDate": "YYYY-MM-DD",
  "interviewerName": "string",
  "interviewerId": "string (optional)",
  "round": "phone-screen|technical|behavioral|final",
  "feedback": "string",
  "rating": "number (1-10)",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendation": "strongly-recommend|recommend|neutral|not-recommend"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "candidateId": "string",
    "interviewId": "string",
    "feedback": { }
  }
}
```

---

### Reporting Relationship Endpoints

#### 16. Get Manager's Direct Reports

**Endpoint:** `GET /api/v1/employees/managers/:managerId/direct-reports`

**Roles:** Owner, Leader, Manager

**Query Parameters:**
- `includeIndirectReports` (optional, boolean, default: false)
- `departmentId` (optional, string)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "managerId": "string",
    "managerName": "string",
    "directReports": [
      {
        "employeeId": "string",
        "name": "string",
        "email": "string",
        "jobTitle": "string",
        "department": "string"
      }
    ],
    "indirectReports": [
      {
        "employeeId": "string",
        "name": "string",
        "reportingChain": ["managerId1", "managerId2"]
      }
    ],
    "totalDirectReports": 5,
    "totalIndirectReports": 12
  }
}
```

---

#### 17. Update Reporting Manager

**Endpoint:** `PATCH /api/v1/employees/:employeeId/manager`

**Roles:** Owner, Leader

**Request Body:**
```json
{
  "newManagerId": "string",
  "effectiveDate": "YYYY-MM-DD (optional)",
  "reason": "string (optional)"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "employeeId": "string",
    "previousManager": "string",
    "newManager": "string",
    "effectiveDate": "date"
  }
}
```

---

#### 18. Get Organizational Hierarchy

**Endpoint:** `GET /api/v1/employees/hierarchy`

**Roles:** Owner, Leader

**Query Parameters:**
- `departmentId` (optional, string)
- `branchId` (optional, string)
- `depth` (optional, number, default: all levels)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "hierarchy": [
      {
        "employeeId": "string",
        "name": "string",
        "jobTitle": "string",
        "level": 0,
        "directReports": [
          {
            "employeeId": "string",
            "name": "string",
            "jobTitle": "string",
            "level": 1,
            "directReports": []
          }
        ]
      }
    ]
  }
}
```

---

## Internal APIs

### Employee Service Internal APIs

#### 1. Validate Employee Access

**Method:** `validateEmployeeAccess(userId: string, employeeId: string): Promise<boolean>`

**Purpose:** Verify if a user has permission to access an employee's data based on role and organizational scope.

**Returns:**
```typescript
{
  hasAccess: boolean;
  scope: 'own_department' | 'multiple_departments' | 'organization';
  restrictions: string[];
}
```

---

#### 2. Get Employees by Scope

**Method:** `getEmployeesByUserScope(userId: string, filters?: FilterDto): Promise<Employee[]>`

**Purpose:** Retrieve employees visible to a user based on their role and permissions.

**Parameters:**
- `userId` - User making the request
- `filters` - Optional filtering criteria

**Returns:** Array of Employee objects within user's scope

---

#### 3. Queue Report Generation

**Method:** `queueReportGeneration(employeeId: string, reportTypes: ReportType[]): Promise<void>`

**Purpose:** Add employee report generation jobs to BullMQ queue.

**Parameters:**
- `employeeId` - Employee for whom reports should be generated
- `reportTypes` - Array of report types to generate

**Integration:** Called by report-generation service

---

#### 4. Update Harmonic Code

**Method:** `updateHarmonicCode(employeeId: string, harmonicCode: string): Promise<void>`

**Purpose:** Update employee's harmonic energy code (called quarterly by cron service).

**Parameters:**
- `employeeId` - Employee identifier
- `harmonicCode` - New harmonic code value

---

#### 5. Get Employee Astrology Data

**Method:** `getAstrologyData(employeeId: string): Promise<AstrologyData>`

**Purpose:** Retrieve employee's astrological information for report generation.

**Returns:**
```typescript
{
  dateOfBirth: Date;
  timeOfBirth: string;
  placeOfBirth: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
  sunSign: string;
  moonSign: string;
  ascendant: string;
  harmonicCode: string;
  planetPositions: object;
}
```

---

#### 6. Bulk Validate Employees

**Method:** `validateBulkImportData(data: EmployeeImportDto[]): Promise<ValidationResult>`

**Purpose:** Validate employee data before bulk import processing.

**Returns:**
```typescript
{
  valid: EmployeeImportDto[];
  invalid: {
    row: number;
    data: EmployeeImportDto;
    errors: ValidationError[];
  }[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}
```

---

#### 7. Emit Employee Events

**Method:** `emitEmployeeEvent(eventType: string, payload: any): void`

**Purpose:** Publish WebSocket events for real-time updates.

**Event Types:**
- `employee.created`
- `employee.updated`
- `employee.deleted`
- `employee.profile.updated`
- `employee.department.changed`
- `employee.manager.changed`

---

### Candidate Service Internal APIs

#### 8. Get Candidate Compatibility Data

**Method:** `getCandidateCompatibilityData(candidateId: string): Promise<CompatibilityData>`

**Purpose:** Retrieve candidate data for compatibility analysis.

**Returns:**
```typescript
{
  candidateId: string;
  astrologyData: AstrologyData;
  professionalBackground: object;
  targetRole: string;
  targetDepartment: string;
  organizationId: string;
}
```

---

#### 9. Archive Candidate

**Method:** `archiveCandidate(candidateId: string, reason: string): Promise<void>`

**Purpose:** Archive candidate after conversion to employee or rejection.

**Parameters:**
- `candidateId` - Candidate identifier
- `reason` - Archival reason (converted/rejected/withdrawn)

---

#### 10. Update Compatibility Scores

**Method:** `updateCompatibilityScores(candidateId: string, scores: CompatibilityScores): Promise<void>`

**Purpose:** Update candidate compatibility analysis results.

**Parameters:**
```typescript
{
  candidateId: string;
  scores: {
    roleCompatibility: number;
    departmentCompatibility: number;
    companyCompatibility: number;
    industryCompatibility: number;
    overallScore: number;
  };
}
```

---

### Data Import Service Internal APIs

#### 11. Process Import Job

**Method:** `processImportJob(jobId: string): Promise<ImportResult>`

**Purpose:** Process bulk employee import from queued job.

**Returns:**
```typescript
{
  jobId: string;
  status: 'completed' | 'failed';
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: ImportError[];
  createdEmployeeIds: string[];
}
```

---

#### 12. Validate Import Format

**Method:** `validateImportFile(file: Buffer, fileType: string): Promise<boolean>`

**Purpose:** Validate CSV/Excel file format and structure.

**Returns:** Boolean indicating if file format is valid

---

#### 13. Parse Import Data

**Method:** `parseImportFile(file: Buffer, fileType: string): Promise<EmployeeImportDto[]>`

**Purpose:** Extract employee data from uploaded file.

**Returns:** Array of parsed employee data objects

---

## WebSocket Events

### Event: `employee.profile.updated`

**Emitted When:** Employee personal or professional information is updated

**Payload:**
```json
{
  "event": "employee.profile.updated",
  "data": {
    "employeeId": "string",
    "updatedFields": ["personalInfo.email", "professionalInfo.jobTitle"],
    "updatedBy": "string (userId)",
    "timestamp": "ISO timestamp"
  }
}
```

**Subscribers:** 
- Admin panel (real-time employee list updates)
- Report generation service (trigger report regeneration)

---

### Event: `employee.created`

**Payload:**
```json
{
  "event": "employee.created",
  "data": {
    "employeeId": "string",
    "name": "string",
    "email": "string",
    "departmentId": "string",
    "createdBy": "string (userId)",
    "timestamp": "ISO timestamp"
  }
}
```

---

### Event: `employee.department.changed`

**Payload:**
```json
{
  "event": "employee.department.changed",
  "data": {
    "employeeId": "string",
    "previousDepartment": "string",
    "newDepartment": "string",
    "effectiveDate": "date",
    "changedBy": "string (userId)",
    "timestamp": "ISO timestamp"
  }
}
```

---

## Error Response Format

All API endpoints follow a consistent error response structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "fieldName",
      "constraint": "validation constraint violated"
    },
    "timestamp": "ISO timestamp",
    "path": "/api/v1/employees/123"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_ENTRY` - Unique constraint violation
- `SCOPE_VIOLATION` - User attempting to access out-of-scope resource
- `IMPORT_ERROR` - Bulk import processing error
- `REPORT_GENERATION_FAILED` - Report generation failed

---

## Rate Limiting

All API endpoints are subject to rate limiting:

- **Standard Endpoints:** 100 requests per minute per user
- **Bulk Import:** 5 requests per hour per user
- **List Endpoints:** 60 requests per minute per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699564800
```

---

## API Versioning

All endpoints are versioned using URL path versioning: `/api/v1/...`

Future versions will maintain backward compatibility or provide migration guides.

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-10  
**Status:** Complete