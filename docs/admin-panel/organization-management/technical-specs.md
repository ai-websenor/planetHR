# Technical Specifications - Organization Management

## Architecture Overview

This module is part of a monolithic application architecture with well-defined internal modules and layers.

The Organization Management module implements a multi-tenant organizational hierarchy system within the PlanetsHR monolithic NestJS application. It provides comprehensive company profile management, astrological data integration, and hierarchical branch/department structures with role-based data segregation.

**Key Architectural Principles:**
- **Multi-tenancy**: Complete data isolation per organization with branch-level segregation
- **Hierarchical Design**: Three-tier structure (Organization → Branch → Department)
- **Event-Driven Updates**: WebSocket events for real-time organizational changes
- **Astrological Integration**: Embedded astrology calculation engine for harmonic energy mapping
- **Template-Based Configuration**: Pre-configured department templates with customization support

**Technology Stack:**
- NestJS v11.x modules with dependency injection
- MongoDB with Mongoose ODM for document storage
- WebSocket (Socket.io) for real-time notifications
- Class-validator for DTO validation
- Swagger/OpenAPI documentation

## Application Modules

### organization-service

**Responsibility:**
- Company profile creation and management
- Astrological data storage and harmonic energy code calculation
- Industry classification and cultural values definition
- Organization-level settings and configuration
- Multi-tenant data isolation enforcement
- Integration with astrology-calculation-service for harmonic mapping

**Layer:** Business Logic + Data Access

**Dependencies:**
- `astrology-calculation-service` - For harmonic energy code calculations
- `auth-service` - For owner/leader authentication and authorization
- `subscription-service` - For validating active subscriptions
- `email-service` - For organization setup notifications
- MongoDB - Organization data persistence

**Exposed APIs:**
```typescript
// Internal module methods
createOrganization(dto: CreateOrganizationDto): Promise<Organization>
updateOrganization(id: string, dto: UpdateOrganizationDto): Promise<Organization>
getOrganizationById(id: string): Promise<Organization>
getOrganizationByOwner(ownerId: string): Promise<Organization>
calculateHarmonicEnergy(organizationId: string): Promise<HarmonicEnergyCode>
validateOrganizationAccess(userId: string, organizationId: string): Promise<boolean>
getIndustryCompatibilityMatrix(organizationId: string): Promise<CompatibilityMatrix>
```

**Key Components:**
- `OrganizationController` - REST API endpoints for organization CRUD
- `OrganizationService` - Core business logic
- `OrganizationRepository` - Data access layer
- `HarmonicEnergyMapper` - Organization energy pattern calculation

### branch-service

**Responsibility:**
- Multi-branch management within organizations
- Branch-level data segregation and access control
- Leader assignment to branches
- Branch-specific configuration and settings
- Cross-branch access prevention
- Branch hierarchy validation

**Layer:** Business Logic + Data Access

**Dependencies:**
- `organization-service` - Parent organization validation
- `auth-service` - Leader role validation and assignment
- `employee-service` - Branch employee association
- `department-service` - Branch department management
- MongoDB - Branch data persistence

**Exposed APIs:**
```typescript
// Internal module methods
createBranch(organizationId: string, dto: CreateBranchDto): Promise<Branch>
updateBranch(branchId: string, dto: UpdateBranchDto): Promise<Branch>
getBranchesByOrganization(organizationId: string): Promise<Branch[]>
getBranchById(branchId: string): Promise<Branch>
assignLeaderToBranch(branchId: string, leaderId: string): Promise<Branch>
removeLeaderFromBranch(branchId: string, leaderId: string): Promise<Branch>
validateBranchAccess(userId: string, branchId: string): Promise<boolean>
getBranchHierarchy(branchId: string): Promise<BranchHierarchy>
deleteBranch(branchId: string): Promise<void>
```

**Key Components:**
- `BranchController` - REST API endpoints for branch management
- `BranchService` - Branch business logic and validation
- `BranchRepository` - Data access layer
- `BranchAccessGuard` - Role-based branch access control

### department-service

**Responsibility:**
- Department creation using templates or manual configuration
- Department hierarchy management within branches
- Manager assignment to departments
- Department-specific settings and attributes
- Template library management (HR, Engineering, Sales, etc.)
- Custom department configuration
- Department-level employee grouping

**Layer:** Business Logic + Data Access

**Dependencies:**
- `branch-service` - Parent branch validation
- `organization-service` - Organization context
- `auth-service` - Manager role validation
- `employee-service` - Department employee management
- MongoDB - Department and template data persistence

**Exposed APIs:**
```typescript
// Internal module methods
createDepartmentFromTemplate(branchId: string, templateId: string, dto: CreateFromTemplateDto): Promise<Department>
createCustomDepartment(branchId: string, dto: CreateDepartmentDto): Promise<Department>
updateDepartment(departmentId: string, dto: UpdateDepartmentDto): Promise<Department>
getDepartmentsByBranch(branchId: string): Promise<Department[]>
getDepartmentById(departmentId: string): Promise<Department>
assignManagerToDepartment(departmentId: string, managerId: string): Promise<Department>
removeManagerFromDepartment(departmentId: string, managerId: string): Promise<Department>
validateDepartmentAccess(userId: string, departmentId: string): Promise<boolean>
getAvailableTemplates(): Promise<DepartmentTemplate[]>
createDepartmentTemplate(dto: CreateTemplateDto): Promise<DepartmentTemplate>
deleteDepartment(departmentId: string): Promise<void>
```

**Key Components:**
- `DepartmentController` - REST API endpoints for department management
- `DepartmentService` - Department business logic
- `DepartmentTemplateService` - Template management
- `DepartmentRepository` - Data access layer
- `DepartmentAccessGuard` - Department-level access control

### astrology-calculation-service

**Responsibility:**
- Astrological data processing for organizations
- Birth chart calculation for company founding dates
- Harmonic energy code generation
- Planetary position calculations
- Astrological compatibility matrix computation
- Quarterly harmonic code updates
- Integration with external astrology APIs (if needed)

**Layer:** Business Logic + Integration

**Dependencies:**
- `organization-service` - Organization astrological data
- `employee-service` - Employee birth data for compatibility
- External Astrology API (optional) - Third-party calculations
- Redis - Caching for calculation results
- BullMQ - Async calculation queue processing

**Exposed APIs:**
```typescript
// Internal module methods
calculateOrganizationHarmonicCode(organizationData: AstrologicalData): Promise<HarmonicEnergyCode>
generateBirthChart(birthData: BirthData): Promise<BirthChart>
calculateCompatibilityMatrix(orgCode: HarmonicEnergyCode, employeeCode: HarmonicEnergyCode): Promise<CompatibilityScore>
calculateIndustryAlignment(orgData: AstrologicalData, industry: string): Promise<AlignmentScore>
scheduledQuarterlyUpdate(organizationId: string): Promise<void>
getPlanetaryPositions(date: Date, location: Location): Promise<PlanetaryPositions>
getCachedHarmonicCode(organizationId: string): Promise<HarmonicEnergyCode | null>
invalidateCache(organizationId: string): Promise<void>
```

**Key Components:**
- `AstrologyCalculationService` - Core calculation engine
- `HarmonicCodeGenerator` - Energy pattern generation
- `BirthChartService` - Astrological chart creation
- `CompatibilityCalculator` - Organization-employee compatibility
- `AstrologyQueueProcessor` - Async calculation processing


## Layered Architecture

### Presentation Layer

**Controllers (REST API + WebSocket)**

**Organization Controller** (`src/modules/organizations/controllers/organization.controller.ts`)
- `POST /organizations` - Create new organization with astrological data
- `GET /organizations/:id` - Get organization details
- `PATCH /organizations/:id` - Update organization profile
- `DELETE /organizations/:id` - Soft delete organization
- `GET /organizations/:id/harmonic-energy` - Get harmonic energy code
- `POST /organizations/:id/recalculate-energy` - Trigger energy recalculation

**Branch Controller** (`src/modules/organizations/controllers/branch.controller.ts`)
- `POST /organizations/:orgId/branches` - Create branch
- `GET /organizations/:orgId/branches` - List all branches
- `GET /branches/:id` - Get branch details
- `PATCH /branches/:id` - Update branch
- `DELETE /branches/:id` - Delete branch
- `POST /branches/:id/leaders` - Assign leader to branch
- `DELETE /branches/:id/leaders/:leaderId` - Remove leader

**Department Controller** (`src/modules/organizations/controllers/department.controller.ts`)
- `POST /branches/:branchId/departments` - Create department (template or custom)
- `GET /branches/:branchId/departments` - List departments in branch
- `GET /departments/:id` - Get department details
- `PATCH /departments/:id` - Update department
- `DELETE /departments/:id` - Delete department
- `POST /departments/:id/managers` - Assign manager
- `DELETE /departments/:id/managers/:managerId` - Remove manager
- `GET /department-templates` - List available templates
- `POST /department-templates` - Create custom template (Owner only)

**WebSocket Gateway** (`src/modules/organizations/gateways/organization.gateway.ts`)
- `organization.updated` - Broadcast organization changes
- `branch.created` - Notify branch creation
- `department.created` - Notify department creation
- `harmonic-energy.updated` - Notify energy code updates

**Guards & Decorators**
- `@UseGuards(JwtAuthGuard, RolesGuard)` - Authentication and authorization
- `@Roles(UserRole.OWNER)` - Owner-only endpoints
- `@Roles(UserRole.OWNER, UserRole.LEADER)` - Owner/Leader access
- `@OrganizationAccess()` - Custom organization access validation
- `@BranchAccess()` - Branch-level access control
- `@DepartmentAccess()` - Department-level access control

**DTO Validation**
- `CreateOrganizationDto` - Validates company profile and astrological data
- `UpdateOrganizationDto` - Partial update validation
- `CreateBranchDto` - Branch creation validation
- `CreateDepartmentDto` - Custom department validation
- `CreateFromTemplateDto` - Template-based creation validation

### Business Logic Layer

**Organization Service** (`src/modules/organizations/services/organization.service.ts`)
- Organization CRUD operations with multi-tenant isolation
- Astrological data validation and storage
- Industry classification and cultural values management
- Harmonic energy code orchestration with astrology service
- Owner assignment and validation
- Organization settings management
- Subscription status validation for features

**Branch Service** (`src/modules/organizations/services/branch.service.ts`)
- Branch creation and management within organizations
- Leader assignment and permission validation
- Branch hierarchy validation (prevent circular references)
- Cross-branch access prevention logic
- Branch-level data segregation enforcement
- Branch deletion with cascade handling

**Department Service** (`src/modules/organizations/services/department.service.ts`)
- Department creation from templates or custom configuration
- Template library management and CRUD
- Manager assignment and validation
- Department hierarchy within branches
- Department-level access control
- Custom attributes and configuration management

**Astrology Calculation Service** (`src/modules/organizations/services/astrology-calculation.service.ts`)
- Birth chart calculation from company founding data
- Harmonic energy code generation algorithm
- Planetary position calculations
- Compatibility matrix computation (org-employee, org-industry)
- Quarterly harmonic code update scheduling
- Caching layer for expensive calculations
- External API integration (if using third-party astrology service)

**Domain Services**
- `HarmonicEnergyMapper` - Maps astrological data to energy codes
- `IndustryCompatibilityService` - Industry alignment calculations
- `OrganizationHierarchyService` - Manages org/branch/dept relationships
- `AccessControlService` - Role-based access validation across hierarchy
- `TemplateLibraryService` - Pre-configured department templates

**Event Publishers**
- `OrganizationEventPublisher` - WebSocket event broadcasting
- `HarmonicEnergyEventPublisher` - Energy update notifications
- `HierarchyChangeEventPublisher` - Branch/department change events

### Data Access Layer

**Mongoose Schemas** (`src/modules/organizations/schemas/`)

**Organization Schema**
```typescript
{
  _id: ObjectId
  name: string
  ownerId: ObjectId (ref: User)
  astrological_data: {
    founding_date: Date
    founding_time: string
    founding_location: {
      latitude: number
      longitude: number
      city: string
      country: string
    }
    timezone: string
  }
  harmonic_energy_code: {
    code: string
    calculated_at: Date
    next_update: Date
    planetary_positions: Object
  }
  industry: {
    sector: string
    sub_sector: string
    classification_code: string
  }
  cultural_values: [
    {
      name: string
      description: string
      priority: number
    }
  ]
  settings: Object
  is_active: boolean
  subscription_status: string
  created_at: Date
  updated_at: Date
  deleted_at: Date (nullable)
}
```

**Branch Schema**
```typescript
{
  _id: ObjectId
  organization_id: ObjectId (ref: Organization)
  name: string
  code: string (unique per organization)
  location: {
    address: string
    city: string
    state: string
    country: string
    postal_code: string
  }
  leader_ids: [ObjectId] (ref: User)
  settings: Object
  is_active: boolean
  created_at: Date
  updated_at: Date
  deleted_at: Date (nullable)
}
```

**Department Schema**
```typescript
{
  _id: ObjectId
  branch_id: ObjectId (ref: Branch)
  organization_id: ObjectId (ref: Organization)
  name: string
  code: string (unique per branch)
  template_id: ObjectId (ref: DepartmentTemplate, nullable)
  manager_ids: [ObjectId] (ref: User)
  custom_attributes: Object
  settings: Object
  is_active: boolean
  created_at: Date
  updated_at: Date
  deleted_at: Date (nullable)
}
```

**DepartmentTemplate Schema**
```typescript
{
  _id: ObjectId
  name: string
  description: string
  category: string (HR, Engineering, Sales, etc.)
  default_attributes: Object
  suggested_roles: [string]
  is_system_template: boolean
  created_by: ObjectId (ref: User, nullable for system templates)
  is_active: boolean
  created_at: Date
  updated_at: Date
}
```

**Repositories** (`src/modules/organizations/repositories/`)
- `OrganizationRepository` - CRUD operations with multi-tenant filtering
- `BranchRepository` - Branch data access with organization scoping
- `DepartmentRepository` - Department data access with branch scoping
- `DepartmentTemplateRepository` - Template library management
- Base repository pattern with common methods (findById, findAll, create, update, softDelete)

**Indexes**
- Organization: `ownerId`, `is_active`, `subscription_status`
- Branch: `organization_id`, `code + organization_id (unique)`, `leader_ids`
- Department: `branch_id`, `organization_id`, `code + branch_id (unique)`, `manager_ids`
- DepartmentTemplate: `category`, `is_system_template`, `is_active`

## API Endpoints

### Organization Endpoints

#### Create Organization
- **Endpoint**: `POST /api/v1/organizations`
- **Auth**: Required (JWT)
- **Roles**: Owner (during registration) or System Admin
- **Request Body**:
```json
{
  "name": "Acme Corporation",
  "astrological_data": {
    "founding_date": "2010-03-15",
    "founding_time": "09:30:00",
    "founding_location": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "city": "San Francisco",
      "country": "USA"
    },
    "timezone": "America/Los_Angeles"
  },
  "industry": {
    "sector": "Technology",
    "sub_sector": "Software",
    "classification_code": "NAICS-541511"
  },
  "cultural_values": [
    {
      "name": "Innovation",
      "description": "Continuous improvement and creativity",
      "priority": 1
    }
  ]
}
```
- **Response**: `201 Created`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Acme Corporation",
  "harmonic_energy_code": {
    "code": "HE-7A3F92B1",
    "calculated_at": "2025-11-11T10:00:00Z",
    "next_update": "2026-02-11T00:00:00Z"
  },
  "created_at": "2025-11-11T10:00:00Z"
}
```

#### Get Organization Details
- **Endpoint**: `GET /api/v1/organizations/:id`
- **Auth**: Required (JWT)
- **Roles**: Owner, Leader, Manager (organization-scoped)
- **Response**: `200 OK`

#### Update Organization
- **Endpoint**: `PATCH /api/v1/organizations/:id`
- **Auth**: Required (JWT)
- **Roles**: Owner
- **Request Body**: Partial update of organization fields

#### Get Harmonic Energy Code
- **Endpoint**: `GET /api/v1/organizations/:id/harmonic-energy`
- **Auth**: Required (JWT)
- **Roles**: Owner, Leader
- **Response**: `200 OK` with detailed harmonic energy data

#### Recalculate Harmonic Energy
- **Endpoint**: `POST /api/v1/organizations/:id/recalculate-energy`
- **Auth**: Required (JWT)
- **Roles**: Owner
- **Response**: `202 Accepted` (queued for processing)

### Branch Endpoints

#### Create Branch
- **Endpoint**: `POST /api/v1/organizations/:orgId/branches`
- **Auth**: Required (JWT)
- **Roles**: Owner
- **Request Body**:
```json
{
  "name": "San Francisco Office",
  "code": "SF-01",
  "location": {
    "address": "123 Market Street",
    "city": "San Francisco",
    "state": "CA",
    "country": "USA",
    "postal_code": "94103"
  }
}
```
- **Response**: `201 Created`

#### List Branches
- **Endpoint**: `GET /api/v1/organizations/:orgId/branches`
- **Auth**: Required (JWT)
- **Roles**: Owner, Leader (filtered by access)
- **Query Params**: `page`, `limit`, `is_active`
- **Response**: `200 OK` with paginated branch list

#### Get Branch Details
- **Endpoint**: `GET /api/v1/branches/:id`
- **Auth**: Required (JWT)
- **Roles**: Owner, Leader (branch-scoped)
- **Response**: `200 OK`

#### Update Branch
- **Endpoint**: `PATCH /api/v1/branches/:id`
- **Auth**: Required (JWT)
- **Roles**: Owner
- **Request Body**: Partial update of branch fields

#### Assign Leader to Branch
- **Endpoint**: `POST /api/v1/branches/:id/leaders`
- **Auth**: Required (JWT)
- **Roles**: Owner
- **Request Body**:
```json
{
  "leader_id": "507f1f77bcf86cd799439012"
}
```
- **Response**: `200 OK`

#### Remove Leader from Branch
- **Endpoint**: `DELETE /api/v1/branches/:id/leaders/:leaderId`
- **Auth**: Required (JWT)
- **Roles**: Owner
- **Response**: `200 OK`

#### Delete Branch
- **Endpoint**: `DELETE /api/v1/branches/:id`
- **Auth**: Required (JWT)
- **Roles**: Owner
- **Response**: `200 OK` (soft delete)

### Department Endpoints

#### Create Department
- **Endpoint**: `POST /api/v1/branches/:branchId/departments`
- **Auth**: Required (JWT)
- **Roles**: Owner, Leader (branch-scoped)
- **Request Body** (Template-based):
```json
{
  "template_id": "507f1f77bcf86cd799439013",
  "name": "Human Resources",
  "code": "HR-01",
  "custom_attributes": {
    "budget": 500000,
    "team_size": 10
  }
}
```
- **Request Body** (Custom):
```json
{
  "name": "Special Projects",
  "code": "SP-01",
  "custom_attributes": {
    "focus_area": "Innovation",
    "reporting_frequency": "monthly"
  }
}
```
- **Response**: `201 Created`

#### List Departments in Branch
- **Endpoint**: `GET /api/v1/branches/:branchId/departments`
- **Auth**: Required (JWT)
- **Roles**: Owner, Leader, Manager (branch-scoped)
- **Query Params**: `page`, `limit`, `is_active`
- **Response**: `200 OK` with paginated department list

#### Get Department Details
- **Endpoint**: `GET /api/v1/departments/:id`
- **Auth**: Required (JWT)
- **Roles**: Owner, Leader, Manager (department-scoped)
- **Response**: `200 OK`

#### Update Department
- **Endpoint**: `PATCH /api/v1/departments/:id`
- **Auth**: Required (JWT)
- **Roles**: Owner, Leader (branch-scoped)
- **Request Body**: Partial update of department fields

#### Assign Manager to Department
- **Endpoint**: `POST /api/v1/departments/:id/managers`
- **Auth**: Required (JWT)
- **Roles**: Owner, Leader (branch-scoped)
- **Request Body**:
```json
{
  "manager_id": "507f1f77bcf86cd799439014"
}
```
- **Response**: `200 OK`

#### Remove Manager from Department
- **Endpoint**: `DELETE /api/v1/departments/:id/managers/:managerId`
- **Auth**: Required (JWT)
- **Roles**: Owner, Leader (branch-scoped)
- **Response**: `200 OK`

#### Delete Department
- **Endpoint**: `DELETE /api/v1/departments/:id`
- **Auth**: Required (JWT)
- **Roles**: Owner, Leader (branch-scoped)
- **Response**: `200 OK` (soft delete)

### Department Template Endpoints

#### List Available Templates
- **Endpoint**: `GET /api/v1/department-templates`
- **Auth**: Required (JWT)
- **Roles**: Owner, Leader, Manager
- **Query Params**: `category`, `is_system_template`
- **Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439013",
      "name": "Human Resources",
      "description": "Standard HR department template",
      "category": "HR",
      "default_attributes": {
        "functions": ["Recruitment", "Employee Relations", "Payroll"],
        "reporting_structure": "Direct to CEO"
      },
      "suggested_roles": ["HR Manager", "Recruiter", "HR Coordinator"],
      "is_system_template": true
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

#### Create Custom Template
- **Endpoint**: `POST /api/v1/department-templates`
- **Auth**: Required (JWT)
- **Roles**: Owner
- **Request Body**:
```json
{
  "name": "Data Science Team",
  "description": "AI and analytics department",
  "category": "Engineering",
  "default_attributes": {
    "tech_stack": ["Python", "TensorFlow", "Spark"],
    "team_structure": "Pod-based"
  },
  "suggested_roles": ["Data Scientist", "ML Engineer", "Data Analyst"]
}
```
- **Response**: `201 Created`

## Database Schemas

Detailed schema definitions are maintained in `database-schema.md`. Key relationships:

**Entity Relationships:**
```
Organization (1) ──> (*) Branch
Branch (1) ──> (*) Department
Organization (1) ──> (1) Owner (User)
Branch (*) ──> (*) Leader (User)
Department (*) ──> (*) Manager (User)
DepartmentTemplate (1) ──> (*) Department
Organization (1) ──> (1) HarmonicEnergyCode
```

**Multi-tenancy Strategy:**
- All branch and department queries are scoped by `organization_id`
- Branch access is validated against leader assignments
- Department access is validated against manager assignments or parent branch access
- Indexes ensure efficient organization-scoped queries

**Soft Delete Pattern:**
- All entities use `deleted_at` timestamp for soft deletion
- Queries automatically filter out soft-deleted records
- Cascade soft-delete: Organization → Branches → Departments

## Caching Strategy

**Redis Caching Layers:**

1. **Harmonic Energy Code Cache**
   - **Key Pattern**: `harmonic:org:{organizationId}`
   - **TTL**: Until next quarterly update date
   - **Invalidation**: Manual recalculation, quarterly update job
   - **Purpose**: Avoid expensive astrological calculations

2. **Organization Hierarchy Cache**
   - **Key Pattern**: `hierarchy:org:{organizationId}`
   - **TTL**: 1 hour
   - **Invalidation**: Branch/department creation, updates, deletions
   - **Purpose**: Fast access control validation

3. **Department Templates Cache**
   - **Key Pattern**: `templates:all`, `templates:category:{category}`
   - **TTL**: 24 hours
   - **Invalidation**: Template creation, updates
   - **Purpose**: Reduce database queries for template listings

4. **User Access Scope Cache**
   - **Key Pattern**: `access:user:{userId}:org:{organizationId}`
   - **TTL**: 30 minutes
   - **Invalidation**: Role changes, branch/department assignments
   - **Purpose**: Fast authorization checks

**Cache-Aside Pattern:**
```typescript
async getOrganizationHierarchy(orgId: string) {
  const cacheKey = `hierarchy:org:${orgId}`;
  
  // Try cache first
  const cached = await this.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fetch from database
  const hierarchy = await this.buildHierarchy(orgId);
  
  // Store in cache
  await this.redis.setex(cacheKey, 3600, JSON.stringify(hierarchy));
  
  return hierarchy;
}
```

**Cache Warming:**
- Organization hierarchy is pre-cached on organization creation
- Department templates are loaded into cache on application startup
- Harmonic energy codes are cached during calculation

**Cache Invalidation Events:**
- WebSocket events trigger cache invalidation on connected instances
- Queue jobs handle distributed cache invalidation
- TTL-based expiration as fallback for stale data

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Status:** Complete