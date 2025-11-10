# API Contracts - Organization Management

## Overview

This document defines all API endpoints (internal and external) for the Organization Management module within the PlanetsHR monolithic NestJS application.

## External APIs

### Organization Management

#### Create Organization
```http
POST /api/v1/organizations
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "TechCorp Inc.",
  "foundingDate": "2010-05-15T10:30:00Z",
  "foundingPlace": {
    "city": "San Francisco",
    "state": "California",
    "country": "USA",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "timezone": "America/Los_Angeles"
  },
  "industry": "TECHNOLOGY",
  "subIndustry": "Software Development",
  "culturalValues": [
    "Innovation",
    "Collaboration",
    "Customer-Centric",
    "Transparency"
  ],
  "companySize": "MEDIUM",
  "website": "https://techcorp.com",
  "description": "Leading enterprise software solutions provider"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "org_7a8b9c0d1e2f3g4h",
    "name": "TechCorp Inc.",
    "foundingDate": "2010-05-15T10:30:00Z",
    "foundingPlace": {
      "city": "San Francisco",
      "state": "California",
      "country": "USA",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "timezone": "America/Los_Angeles"
    },
    "industry": "TECHNOLOGY",
    "subIndustry": "Software Development",
    "culturalValues": ["Innovation", "Collaboration", "Customer-Centric", "Transparency"],
    "companySize": "MEDIUM",
    "website": "https://techcorp.com",
    "description": "Leading enterprise software solutions provider",
    "astrologicalData": {
      "sunSign": "TAURUS",
      "moonSign": "GEMINI",
      "ascendant": "LEO",
      "dominantElements": ["EARTH", "AIR"],
      "planetaryPositions": {
        "sun": { "sign": "TAURUS", "degree": 24.5, "house": 10 },
        "moon": { "sign": "GEMINI", "degree": 12.3, "house": 11 },
        "mercury": { "sign": "ARIES", "degree": 28.7, "house": 9 }
      }
    },
    "harmonicEnergyCode": {
      "primaryCode": "HEC-2010-05-142-SF",
      "energyPattern": "EXPANSION_INNOVATION",
      "frequencyLevel": 7.8,
      "quarterlyUpdateDate": "2026-02-01T00:00:00Z"
    },
    "ownerId": "user_1a2b3c4d5e6f7g8h",
    "status": "ACTIVE",
    "createdAt": "2025-11-11T10:00:00Z",
    "updatedAt": "2025-11-11T10:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid founding date or location data
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User not authorized to create organizations
- `409 Conflict` - Organization with this name already exists

---

#### Get Organization Details
```http
GET /api/v1/organizations/:organizationId
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `organizationId` (string, required) - Organization UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "org_7a8b9c0d1e2f3g4h",
    "name": "TechCorp Inc.",
    "foundingDate": "2010-05-15T10:30:00Z",
    "foundingPlace": {
      "city": "San Francisco",
      "state": "California",
      "country": "USA",
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "industry": "TECHNOLOGY",
    "culturalValues": ["Innovation", "Collaboration"],
    "astrologicalData": { /* ... */ },
    "harmonicEnergyCode": { /* ... */ },
    "branchCount": 5,
    "departmentCount": 23,
    "employeeCount": 450,
    "status": "ACTIVE"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User does not have access to this organization
- `404 Not Found` - Organization not found

---

#### Update Organization
```http
PATCH /api/v1/organizations/:organizationId
Authorization: Bearer <jwt_token>
```

**Request Body (Partial Update):**
```json
{
  "name": "TechCorp International Inc.",
  "culturalValues": ["Innovation", "Collaboration", "Sustainability", "Diversity"],
  "website": "https://techcorp-intl.com",
  "description": "Global enterprise software solutions provider"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "org_7a8b9c0d1e2f3g4h",
    "name": "TechCorp International Inc.",
    "culturalValues": ["Innovation", "Collaboration", "Sustainability", "Diversity"],
    "website": "https://techcorp-intl.com",
    "updatedAt": "2025-11-11T14:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid update data
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Only OWNER role can update organization
- `404 Not Found` - Organization not found

---

#### Get Organization Astrological Analysis
```http
GET /api/v1/organizations/:organizationId/astrology
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "organizationId": "org_7a8b9c0d1e2f3g4h",
    "birthChart": {
      "sunSign": "TAURUS",
      "moonSign": "GEMINI",
      "ascendant": "LEO",
      "planetaryPositions": { /* ... */ }
    },
    "harmonicEnergyCode": {
      "primaryCode": "HEC-2010-05-142-SF",
      "energyPattern": "EXPANSION_INNOVATION",
      "frequencyLevel": 7.8,
      "currentQuarter": "Q1_2026",
      "nextUpdateDate": "2026-02-01T00:00:00Z"
    },
    "compatibility": {
      "optimalIndustries": ["TECHNOLOGY", "CONSULTING", "FINANCE"],
      "optimalDepartmentTypes": ["ENGINEERING", "INNOVATION_LAB", "R_AND_D"],
      "culturalStrengths": ["Innovation-driven", "Communication-focused", "Leadership-oriented"]
    },
    "calculatedAt": "2025-11-11T10:00:00Z"
  }
}
```

---

### Branch Management

#### Create Branch
```http
POST /api/v1/organizations/:organizationId/branches
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Silicon Valley Headquarters",
  "code": "SV-HQ",
  "type": "HEADQUARTERS",
  "location": {
    "address": "123 Innovation Drive",
    "city": "Palo Alto",
    "state": "California",
    "country": "USA",
    "postalCode": "94301",
    "latitude": 37.4419,
    "longitude": -122.1430
  },
  "contactInfo": {
    "email": "sv-hq@techcorp.com",
    "phone": "+1-650-555-0100",
    "fax": "+1-650-555-0101"
  },
  "managerId": "user_9h8g7f6e5d4c3b2a",
  "operationalHours": {
    "timezone": "America/Los_Angeles",
    "workdays": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    "startTime": "09:00",
    "endTime": "18:00"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "branch_5f6g7h8i9j0k1l2m",
    "organizationId": "org_7a8b9c0d1e2f3g4h",
    "name": "Silicon Valley Headquarters",
    "code": "SV-HQ",
    "type": "HEADQUARTERS",
    "location": { /* ... */ },
    "contactInfo": { /* ... */ },
    "managerId": "user_9h8g7f6e5d4c3b2a",
    "operationalHours": { /* ... */ },
    "status": "ACTIVE",
    "departmentCount": 0,
    "employeeCount": 0,
    "createdAt": "2025-11-11T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid branch data
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User not authorized (requires OWNER or LEADER role)
- `404 Not Found` - Organization not found
- `409 Conflict` - Branch code already exists in organization

---

#### List Branches
```http
GET /api/v1/organizations/:organizationId/branches
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (number, optional, default: 1) - Page number
- `limit` (number, optional, default: 20) - Items per page
- `status` (string, optional) - Filter by status: ACTIVE, INACTIVE
- `type` (string, optional) - Filter by type: HEADQUARTERS, REGIONAL, SATELLITE
- `search` (string, optional) - Search by name or code

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "branches": [
      {
        "id": "branch_5f6g7h8i9j0k1l2m",
        "name": "Silicon Valley Headquarters",
        "code": "SV-HQ",
        "type": "HEADQUARTERS",
        "location": { "city": "Palo Alto", "state": "California", "country": "USA" },
        "departmentCount": 8,
        "employeeCount": 200,
        "status": "ACTIVE"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

#### Update Branch
```http
PATCH /api/v1/branches/:branchId
Authorization: Bearer <jwt_token>
```

**Request Body (Partial Update):**
```json
{
  "name": "Silicon Valley Innovation Hub",
  "contactInfo": {
    "email": "innovation-hub@techcorp.com",
    "phone": "+1-650-555-0200"
  },
  "status": "ACTIVE"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "branch_5f6g7h8i9j0k1l2m",
    "name": "Silicon Valley Innovation Hub",
    "contactInfo": { /* ... */ },
    "updatedAt": "2025-11-11T15:00:00Z"
  }
}
```

---

#### Delete Branch
```http
DELETE /api/v1/branches/:branchId
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Branch successfully deleted",
  "data": {
    "id": "branch_5f6g7h8i9j0k1l2m",
    "deletedAt": "2025-11-11T16:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Branch has active departments or employees
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Only OWNER can delete branches
- `404 Not Found` - Branch not found

---

### Department Management

#### Create Department (From Template)
```http
POST /api/v1/branches/:branchId/departments/from-template
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "templateId": "tpl_engineering_standard",
  "customizations": {
    "name": "Backend Engineering",
    "code": "BE-ENG",
    "managerId": "user_3b4c5d6e7f8g9h0i"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "dept_1m2n3o4p5q6r7s8t",
    "branchId": "branch_5f6g7h8i9j0k1l2m",
    "organizationId": "org_7a8b9c0d1e2f3g4h",
    "name": "Backend Engineering",
    "code": "BE-ENG",
    "type": "ENGINEERING",
    "templateId": "tpl_engineering_standard",
    "managerId": "user_3b4c5d6e7f8g9h0i",
    "roles": [
      {
        "title": "Senior Backend Engineer",
        "level": "SENIOR",
        "requiredSkills": ["Node.js", "TypeScript", "MongoDB", "System Design"],
        "responsibilities": ["Architecture design", "Code review", "Mentoring"]
      }
    ],
    "status": "ACTIVE",
    "createdAt": "2025-11-11T11:00:00Z"
  }
}
```

---

#### Create Department (Manual)
```http
POST /api/v1/branches/:branchId/departments
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Machine Learning Research",
  "code": "ML-RES",
  "type": "RESEARCH_AND_DEVELOPMENT",
  "description": "Advanced ML and AI research initiatives",
  "managerId": "user_4c5d6e7f8g9h0i1j",
  "parentDepartmentId": null,
  "roles": [
    {
      "title": "ML Research Scientist",
      "level": "SENIOR",
      "requiredSkills": ["Python", "TensorFlow", "PyTorch", "Research Methodology"],
      "responsibilities": [
        "Conduct original ML research",
        "Publish research papers",
        "Mentor junior researchers"
      ],
      "requiredEducation": "PhD in Computer Science or related field",
      "experienceYears": 5
    }
  ],
  "budget": {
    "annualBudget": 2000000,
    "currency": "USD",
    "fiscalYear": 2026
  },
  "kpis": [
    {
      "name": "Research Publications",
      "target": 12,
      "period": "ANNUAL"
    },
    {
      "name": "Patent Filings",
      "target": 5,
      "period": "ANNUAL"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "dept_2n3o4p5q6r7s8t9u",
    "branchId": "branch_5f6g7h8i9j0k1l2m",
    "organizationId": "org_7a8b9c0d1e2f3g4h",
    "name": "Machine Learning Research",
    "code": "ML-RES",
    "type": "RESEARCH_AND_DEVELOPMENT",
    "managerId": "user_4c5d6e7f8g9h0i1j",
    "roles": [ /* ... */ ],
    "status": "ACTIVE",
    "employeeCount": 0,
    "createdAt": "2025-11-11T11:30:00Z"
  }
}
```

---

#### List Departments
```http
GET /api/v1/branches/:branchId/departments
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (number, optional) - Page number
- `limit` (number, optional) - Items per page
- `type` (string, optional) - Filter by department type
- `status` (string, optional) - Filter by status
- `managerId` (string, optional) - Filter by manager
- `includeSubDepartments` (boolean, optional) - Include nested departments

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "departments": [
      {
        "id": "dept_1m2n3o4p5q6r7s8t",
        "name": "Backend Engineering",
        "code": "BE-ENG",
        "type": "ENGINEERING",
        "managerId": "user_3b4c5d6e7f8g9h0i",
        "managerName": "John Smith",
        "employeeCount": 25,
        "status": "ACTIVE",
        "subDepartments": []
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "totalPages": 1
    }
  }
}
```

---

#### Get Department Details
```http
GET /api/v1/departments/:departmentId
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "dept_1m2n3o4p5q6r7s8t",
    "branchId": "branch_5f6g7h8i9j0k1l2m",
    "organizationId": "org_7a8b9c0d1e2f3g4h",
    "name": "Backend Engineering",
    "code": "BE-ENG",
    "type": "ENGINEERING",
    "description": "Backend services and API development",
    "managerId": "user_3b4c5d6e7f8g9h0i",
    "manager": {
      "id": "user_3b4c5d6e7f8g9h0i",
      "name": "John Smith",
      "email": "john.smith@techcorp.com",
      "role": "MANAGER"
    },
    "roles": [ /* ... */ ],
    "employees": [
      {
        "id": "emp_7s8t9u0v1w2x3y4z",
        "name": "Alice Johnson",
        "role": "Senior Backend Engineer",
        "joinDate": "2023-06-15"
      }
    ],
    "employeeCount": 25,
    "status": "ACTIVE",
    "createdAt": "2025-11-11T11:00:00Z",
    "updatedAt": "2025-11-11T11:00:00Z"
  }
}
```

---

#### Update Department
```http
PATCH /api/v1/departments/:departmentId
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Backend & DevOps Engineering",
  "description": "Backend services, API development, and DevOps infrastructure",
  "managerId": "user_5e6f7g8h9i0j1k2l",
  "roles": [
    {
      "title": "Senior Backend Engineer",
      "level": "SENIOR",
      "requiredSkills": ["Node.js", "TypeScript", "MongoDB", "System Design", "Docker", "Kubernetes"]
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "dept_1m2n3o4p5q6r7s8t",
    "name": "Backend & DevOps Engineering",
    "managerId": "user_5e6f7g8h9i0j1k2l",
    "updatedAt": "2025-11-11T16:30:00Z"
  }
}
```

---

#### Delete Department
```http
DELETE /api/v1/departments/:departmentId
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `force` (boolean, optional) - Force delete even with active employees (requires reassignment)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Department successfully deleted",
  "data": {
    "id": "dept_1m2n3o4p5q6r7s8t",
    "deletedAt": "2025-11-11T17:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Department has active employees and force=false
- `403 Forbidden` - User not authorized
- `404 Not Found` - Department not found

---

### Department Templates

#### List Available Templates
```http
GET /api/v1/department-templates
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `industry` (string, optional) - Filter by industry
- `type` (string, optional) - Filter by department type
- `search` (string, optional) - Search template name/description

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "tpl_engineering_standard",
        "name": "Standard Engineering Department",
        "type": "ENGINEERING",
        "industry": "TECHNOLOGY",
        "description": "Standard software engineering team structure",
        "roles": [
          {
            "title": "Engineering Manager",
            "level": "MANAGER",
            "requiredSkills": ["Leadership", "Technical Architecture", "Project Management"]
          },
          {
            "title": "Senior Software Engineer",
            "level": "SENIOR",
            "requiredSkills": ["Programming", "System Design", "Code Review"]
          },
          {
            "title": "Software Engineer",
            "level": "MID",
            "requiredSkills": ["Programming", "Testing", "Collaboration"]
          }
        ],
        "recommendedSize": {
          "min": 5,
          "max": 50,
          "optimal": 15
        }
      }
    ]
  }
}
```

---

#### Get Template Details
```http
GET /api/v1/department-templates/:templateId
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "tpl_engineering_standard",
    "name": "Standard Engineering Department",
    "type": "ENGINEERING",
    "industry": "TECHNOLOGY",
    "description": "Standard software engineering team structure with hierarchical roles",
    "roles": [ /* ... */ ],
    "recommendedSize": { /* ... */ },
    "compatibilityFactors": {
      "astrologicalPreferences": ["GEMINI", "AQUARIUS", "VIRGO"],
      "energyPatterns": ["ANALYTICAL_PRECISION", "INNOVATIVE_EXPLORATION"]
    },
    "metadata": {
      "usageCount": 1247,
      "successRate": 87.5,
      "averagePerformance": 8.2
    }
  }
}
```

---

## Internal APIs

### Astrology Calculation Service

#### Calculate Organization Birth Chart
```typescript
interface CalculateOrganizationChartRequest {
  foundingDate: Date;
  foundingLocation: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
}

interface CalculateOrganizationChartResponse {
  birthChart: {
    sunSign: AstrologicalSign;
    moonSign: AstrologicalSign;
    ascendant: AstrologicalSign;
    planetaryPositions: Record<Planet, PlanetaryPosition>;
    houses: HousePosition[];
    aspects: Aspect[];
  };
  dominantElements: Element[];
  dominantModalities: Modality[];
  calculatedAt: Date;
}
```

**Usage:**
```typescript
const chart = await this.astrologyService.calculateOrganizationChart({
  foundingDate: organization.foundingDate,
  foundingLocation: organization.foundingPlace
});
```

---

#### Calculate Harmonic Energy Code
```typescript
interface CalculateHarmonicCodeRequest {
  birthChart: BirthChart;
  organizationType: string;
  industry: string;
  currentDate?: Date;
}

interface CalculateHarmonicCodeResponse {
  primaryCode: string;
  energyPattern: EnergyPattern;
  frequencyLevel: number;
  quarterlyPhases: QuarterlyPhase[];
  nextUpdateDate: Date;
  compatibilityIndicators: {
    optimalRoleTypes: string[];
    optimalDepartmentTypes: string[];
    challengingCombinations: string[];
  };
}
```

**Usage:**
```typescript
const harmonicCode = await this.astrologyService.calculateHarmonicCode({
  birthChart: orgChart,
  organizationType: 'CORPORATION',
  industry: organization.industry
});
```

---

#### Get Quarterly Energy Update
```typescript
interface GetQuarterlyUpdateRequest {
  harmonicCode: string;
  targetQuarter: Date;
}

interface GetQuarterlyUpdateResponse {
  updatedCode: string;
  energyShift: {
    previousPattern: EnergyPattern;
    currentPattern: EnergyPattern;
    shiftIntensity: number;
  };
  recommendedAdjustments: {
    organizationalFocus: string[];
    hiringGuidance: string[];
    departmentAlignment: string[];
  };
  nextUpdateDate: Date;
}
```

---

### Organization Service (Internal)

#### Get Organization With Access Control
```typescript
interface GetOrganizationRequest {
  organizationId: string;
  userId: string;
  userRole: UserRole;
}

interface GetOrganizationResponse {
  organization: Organization;
  accessScope: {
    branches: string[];
    departments: string[];
    permissions: Permission[];
  };
}
```

**Usage:**
```typescript
const result = await this.organizationService.getOrganizationWithAccess({
  organizationId: 'org_7a8b9c0d1e2f3g4h',
  userId: currentUser.id,
  userRole: currentUser.role
});
```

---

#### Validate Organization Hierarchy
```typescript
interface ValidateHierarchyRequest {
  organizationId: string;
  branchId?: string;
  departmentId?: string;
  userId: string;
}

interface ValidateHierarchyResponse {
  isValid: boolean;
  userAccessLevel: 'ORGANIZATION' | 'BRANCH' | 'DEPARTMENT' | 'NONE';
  accessibleBranches: string[];
  accessibleDepartments: string[];
}
```

---

### Branch Service (Internal)

#### Get Branch Hierarchy
```typescript
interface GetBranchHierarchyRequest {
  branchId: string;
  includeInactive?: boolean;
}

interface GetBranchHierarchyResponse {
  branch: Branch;
  departments: Department[];
  subDepartments: Record<string, Department[]>;
  totalEmployees: number;
  organizationChart: OrganizationChartNode;
}
```

---

#### Validate Branch Access
```typescript
interface ValidateBranchAccessRequest {
  branchId: string;
  userId: string;
  requiredPermission: Permission;
}

interface ValidateBranchAccessResponse {
  hasAccess: boolean;
  userRole: UserRole;
  scopeLevel: 'FULL' | 'PARTIAL' | 'NONE';
  restrictions: string[];
}
```

---

### Department Service (Internal)

#### Get Department Compatibility Score
```typescript
interface GetDepartmentCompatibilityRequest {
  departmentId: string;
  employeeId: string;
}

interface GetDepartmentCompatibilityResponse {
  compatibilityScore: number; // 0-100
  factors: {
    astrologicalAlignment: number;
    harmonicResonance: number;
    roleCompatibility: number;
    teamDynamics: number;
  };
  recommendations: string[];
  concerns: string[];
}
```

---

#### Bulk Create Departments
```typescript
interface BulkCreateDepartmentsRequest {
  branchId: string;
  departments: Array<{
    templateId?: string;
    customData?: Partial<Department>;
  }>;
}

interface BulkCreateDepartmentsResponse {
  created: Department[];
  failed: Array<{
    index: number;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}
```

---

### WebSocket Events

#### Organization Updated Event
```typescript
interface OrganizationUpdatedEvent {
  event: 'organization.updated';
  data: {
    organizationId: string;
    updatedFields: string[];
    updatedBy: string;
    timestamp: Date;
    affectedBranches?: string[];
    affectedDepartments?: string[];
  };
}
```

**Emission:**
```typescript
this.websocketGateway.emit('organization.updated', {
  organizationId: org.id,
  updatedFields: ['name', 'culturalValues'],
  updatedBy: currentUser.id,
  timestamp: new Date()
});
```

---

#### Harmonic Energy Updated Event
```typescript
interface HarmonicEnergyUpdatedEvent {
  event: 'harmonic.energy.updated';
  data: {
    organizationId: string;
    previousCode: string;
    newCode: string;
    quarter: string;
    impactLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    timestamp: Date;
  };
}
```

---

## Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ORG_001",
    "message": "Organization not found",
    "details": {
      "organizationId": "org_invalid123",
      "requestedBy": "user_abc123"
    },
    "timestamp": "2025-11-11T10:00:00Z",
    "path": "/api/v1/organizations/org_invalid123"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| ORG_001 | 404 | Organization not found |
| ORG_002 | 409 | Organization name already exists |
| ORG_003 | 400 | Invalid astrological data |
| BRANCH_001 | 404 | Branch not found |
| BRANCH_002 | 409 | Branch code already exists |
| BRANCH_003 | 400 | Cannot delete branch with active employees |
| DEPT_001 | 404 | Department not found |
| DEPT_002 | 409 | Department code already exists |
| DEPT_003 | 400 | Invalid template ID |
| AUTH_001 | 401 | Unauthorized - Invalid token |
| AUTH_002 | 403 | Forbidden - Insufficient permissions |
| HIERARCHY_001 | 400 | Invalid organizational hierarchy |

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Status:** Complete