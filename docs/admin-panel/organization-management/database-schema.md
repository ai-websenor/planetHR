# Database Schema - Organization Management

## Overview

### MongoDB (organization data, branches, departments)

This document defines the MongoDB schema for the Organization Management module, including organizations, branches, departments, and related entities. All schemas use Mongoose ODM with TypeScript support.

---

## Collections

### 1. Organizations Collection

**Collection Name:** `organizations`

**Schema Definition:**

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum IndustryType {
  TECHNOLOGY = 'technology',
  FINANCE = 'finance',
  HEALTHCARE = 'healthcare',
  MANUFACTURING = 'manufacturing',
  RETAIL = 'retail',
  EDUCATION = 'education',
  CONSULTING = 'consulting',
  OTHER = 'other',
}

export enum CulturalValueType {
  INNOVATION = 'innovation',
  COLLABORATION = 'collaboration',
  EXCELLENCE = 'excellence',
  INTEGRITY = 'integrity',
  CUSTOMER_FOCUS = 'customer_focus',
  DIVERSITY = 'diversity',
  SUSTAINABILITY = 'sustainability',
  AGILITY = 'agility',
}

@Schema({ timestamps: true })
export class AstrologicalData {
  @Prop({ required: true, type: Date })
  foundingDate: Date;

  @Prop({ required: true })
  foundingTime: string; // HH:MM format

  @Prop({ required: true })
  foundingCity: string;

  @Prop({ required: true })
  foundingCountry: string;

  @Prop({ required: true, type: Number })
  latitude: number;

  @Prop({ required: true, type: Number })
  longitude: number;

  @Prop({ type: Object })
  birthChart: Record<string, any>; // Calculated astrological chart data

  @Prop({ type: Date })
  calculatedAt: Date;
}

@Schema({ timestamps: true })
export class HarmonicEnergyCode {
  @Prop({ required: true })
  primaryCode: string; // Main harmonic code

  @Prop({ type: [String] })
  secondaryCodes: string[]; // Supporting harmonic codes

  @Prop({ type: Number, min: 0, max: 100 })
  energyLevel: number;

  @Prop({ type: Object })
  harmonicPatterns: Record<string, any>; // Detailed harmonic analysis

  @Prop({ type: Date, required: true })
  effectiveFrom: Date;

  @Prop({ type: Date })
  effectiveUntil: Date; // Null for current active code

  @Prop({ type: Date })
  calculatedAt: Date;
}

@Schema({ timestamps: true })
export class Organization extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  legalName: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ 
    required: true, 
    enum: Object.values(IndustryType),
    default: IndustryType.OTHER 
  })
  industry: IndustryType;

  @Prop({ trim: true })
  subIndustry: string;

  @Prop({ 
    type: [String], 
    enum: Object.values(CulturalValueType),
    default: [] 
  })
  culturalValues: CulturalValueType[];

  @Prop({ type: String })
  missionStatement: string;

  @Prop({ type: String })
  visionStatement: string;

  @Prop({ type: AstrologicalData, required: true })
  astrologicalData: AstrologicalData;

  @Prop({ type: [HarmonicEnergyCode], default: [] })
  harmonicEnergyCodes: HarmonicEnergyCode[];

  @Prop({ type: String })
  website: string;

  @Prop({ type: String })
  logoUrl: string;

  @Prop({ type: Object })
  contactInfo: {
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };

  @Prop({ type: Number, default: 0 })
  employeeCount: number;

  @Prop({ type: Types.ObjectId, ref: 'Subscription' })
  subscriptionId: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Object })
  settings: {
    autoGenerateReports: boolean;
    quarterlyUpdateEnabled: boolean;
    notificationPreferences: {
      email: boolean;
      inApp: boolean;
    };
  };
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

// Indexes
OrganizationSchema.index({ ownerId: 1 });
OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ isActive: 1 });
OrganizationSchema.index({ 'harmonicEnergyCodes.effectiveFrom': 1 });
```

**Key Fields:**
- `ownerId`: Reference to the organization owner (Super Admin)
- `astrologicalData`: Complete astrological profile for organization
- `harmonicEnergyCodes`: Array of harmonic codes with historical tracking
- `culturalValues`: Multi-select cultural value definitions
- `industry`: Sector classification for analysis

---

### 2. Branches Collection

**Collection Name:** `branches`

**Schema Definition:**

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum BranchStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Schema({ timestamps: true })
export class Branch extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  code: string; // Unique within organization

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  leaderId: Types.ObjectId; // Leader assigned to this branch

  @Prop({ type: String })
  description: string;

  @Prop({ 
    required: true, 
    enum: Object.values(BranchStatus),
    default: BranchStatus.ACTIVE 
  })
  status: BranchStatus;

  @Prop({ type: Object })
  location: {
    city: string;
    state: string;
    country: string;
    timezone: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };

  @Prop({ type: Object })
  contactInfo: {
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };

  @Prop({ type: Number, default: 0 })
  departmentCount: number;

  @Prop({ type: Number, default: 0 })
  employeeCount: number;

  @Prop({ type: Date })
  establishedDate: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Object })
  settings: {
    dataIsolation: boolean; // Enforce strict data segregation
    inheritOrgSettings: boolean;
  };
}

export const BranchSchema = SchemaFactory.createForClass(Branch);

// Indexes
BranchSchema.index({ organizationId: 1, code: 1 }, { unique: true });
BranchSchema.index({ organizationId: 1, isActive: 1 });
BranchSchema.index({ leaderId: 1 });
BranchSchema.index({ status: 1 });
```

**Key Fields:**
- `code`: Unique identifier within organization (e.g., "HQ", "NYC", "LON")
- `organizationId`: Parent organization reference
- `leaderId`: Assigned leader for branch management
- `dataIsolation`: Enforces branch-level data segregation

---

### 3. Departments Collection

**Collection Name:** `departments`

**Schema Definition:**

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DepartmentType {
  ENGINEERING = 'engineering',
  PRODUCT = 'product',
  SALES = 'sales',
  MARKETING = 'marketing',
  HUMAN_RESOURCES = 'human_resources',
  FINANCE = 'finance',
  OPERATIONS = 'operations',
  CUSTOMER_SUPPORT = 'customer_support',
  LEGAL = 'legal',
  EXECUTIVE = 'executive',
  CUSTOM = 'custom',
}

export enum DepartmentSource {
  TEMPLATE = 'template',
  MANUAL = 'manual',
  IMPORTED = 'imported',
}

@Schema({ timestamps: true })
export class Department extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  code: string; // Unique within branch

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  managerId: Types.ObjectId; // Department manager

  @Prop({ 
    required: true, 
    enum: Object.values(DepartmentType),
    default: DepartmentType.CUSTOM 
  })
  type: DepartmentType;

  @Prop({ 
    required: true, 
    enum: Object.values(DepartmentSource),
    default: DepartmentSource.MANUAL 
  })
  source: DepartmentSource;

  @Prop({ type: Types.ObjectId, ref: 'DepartmentTemplate' })
  templateId: Types.ObjectId; // Reference if created from template

  @Prop({ type: String })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  parentDepartmentId: Types.ObjectId; // For hierarchical structure

  @Prop({ type: [Types.ObjectId], ref: 'Department', default: [] })
  subDepartmentIds: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  level: number; // Hierarchy level (0 = top level)

  @Prop({ type: Number, default: 0 })
  employeeCount: number;

  @Prop({ type: [String], default: [] })
  responsibilities: string[];

  @Prop({ type: [String], default: [] })
  keyFunctions: string[];

  @Prop({ type: Object })
  budgetInfo: {
    annualBudget: number;
    currency: string;
    fiscalYear: string;
  };

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Object })
  customFields: Record<string, any>; // Flexible additional data
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

// Indexes
DepartmentSchema.index({ organizationId: 1, branchId: 1, code: 1 }, { unique: true });
DepartmentSchema.index({ branchId: 1, isActive: 1 });
DepartmentSchema.index({ managerId: 1 });
DepartmentSchema.index({ parentDepartmentId: 1 });
DepartmentSchema.index({ type: 1 });
DepartmentSchema.index({ source: 1 });
```

**Key Fields:**
- `code`: Unique identifier within branch (e.g., "ENG", "SALES", "HR")
- `type`: Predefined or custom department classification
- `source`: Tracks creation method (template vs manual)
- `parentDepartmentId`: Enables hierarchical department structures
- `level`: Depth in organizational hierarchy

---

### 4. Department Templates Collection

**Collection Name:** `department_templates`

**Schema Definition:**

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DepartmentType } from './department.schema';

export enum TemplateCategory {
  STANDARD = 'standard',
  INDUSTRY_SPECIFIC = 'industry_specific',
  CUSTOM = 'custom',
}

@Schema({ timestamps: true })
export class DepartmentTemplate extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ 
    required: true, 
    enum: Object.values(DepartmentType) 
  })
  type: DepartmentType;

  @Prop({ 
    required: true, 
    enum: Object.values(TemplateCategory),
    default: TemplateCategory.STANDARD 
  })
  category: TemplateCategory;

  @Prop({ type: String })
  description: string;

  @Prop({ type: [String], default: [] })
  industries: string[]; // Applicable industries

  @Prop({ type: [String], default: [] })
  responsibilities: string[];

  @Prop({ type: [String], default: [] })
  keyFunctions: string[];

  @Prop({ type: [String], default: [] })
  typicalRoles: string[]; // Common job roles in this department

  @Prop({ type: Object })
  structureTemplate: {
    suggestedSubDepartments: Array<{
      name: string;
      type: DepartmentType;
      description: string;
    }>;
    hierarchyLevel: number;
  };

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  isSystemTemplate: boolean; // Platform-provided vs user-created

  @Prop({ type: Number, default: 0 })
  usageCount: number; // Track popularity
}

export const DepartmentTemplateSchema = SchemaFactory.createForClass(DepartmentTemplate);

// Indexes
DepartmentTemplateSchema.index({ type: 1, category: 1 });
DepartmentTemplateSchema.index({ isActive: 1, isSystemTemplate: 1 });
DepartmentTemplateSchema.index({ industries: 1 });
```

**Key Fields:**
- `type`: Department classification for template matching
- `category`: Template categorization for filtering
- `structureTemplate`: Suggested organizational structure
- `isSystemTemplate`: Distinguishes platform vs user templates

---

### 5. Organizational Settings Collection

**Collection Name:** `organizational_settings`

**Schema Definition:**

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class OrganizationalSettings extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, unique: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Object })
  reportGeneration: {
    autoGenerate: boolean;
    defaultReportTypes: string[];
    notifyOnCompletion: boolean;
  };

  @Prop({ type: Object })
  harmonicUpdates: {
    quarterlyAutoUpdate: boolean;
    notificationDaysBefore: number;
    autoApprove: boolean;
  };

  @Prop({ type: Object })
  branchSettings: {
    allowMultipleBranches: boolean;
    enforceDataIsolation: boolean;
    requireLeaderAssignment: boolean;
  };

  @Prop({ type: Object })
  departmentSettings: {
    allowCustomDepartments: boolean;
    maxHierarchyLevels: number;
    requireManagerAssignment: boolean;
    enableTemplates: boolean;
  };

  @Prop({ type: Object })
  accessControl: {
    crossBranchAccess: boolean;
    dataVisibilityScope: string; // 'branch' | 'department' | 'organization'
  };

  @Prop({ type: Object })
  integrations: {
    astrology: {
      provider: string;
      apiKey: string;
      autoCalculate: boolean;
    };
    harmonicEnergy: {
      enabled: boolean;
      calculationFrequency: string; // 'quarterly' | 'monthly'
    };
  };
}

export const OrganizationalSettingsSchema = SchemaFactory.createForClass(OrganizationalSettings);

// Indexes
OrganizationalSettingsSchema.index({ organizationId: 1 }, { unique: true });
```

**Key Fields:**
- `organizationId`: One-to-one relationship with organization
- `harmonicUpdates`: Quarterly update automation configuration
- `branchSettings`: Multi-branch management policies
- `departmentSettings`: Department creation and hierarchy rules

---

## Relationships

### Entity Relationship Diagram

```
Organizations (1) ──── (Many) Branches
                 │
                 └──── (1) OrganizationalSettings
                 │
                 └──── (1) Subscription
                 │
                 └──── (1) User (Owner)

Branches (1) ──── (Many) Departments
         │
         └──── (1) User (Leader)

Departments (1) ──── (1) User (Manager)
            │
            └──── (Many) Employees
            │
            └──── (1) DepartmentTemplate (optional)
            │
            └──── (1) Department (Parent, optional)
            │
            └──── (Many) Departments (Children)
```

### Relationship Constraints

1. **Organization → Branches**: One-to-Many
   - Cascading delete: Soft delete branches when organization deleted
   - Access control: Owner has full access to all branches

2. **Branch → Departments**: One-to-Many
   - Cascading delete: Soft delete departments when branch deleted
   - Data isolation: Department queries filtered by branch

3. **Department → Department**: Self-referential hierarchy
   - Parent-child relationships for organizational structure
   - Maximum hierarchy depth configurable (default: 5 levels)

4. **DepartmentTemplate → Department**: One-to-Many
   - Reference tracking for template usage analytics
   - Template updates don't affect existing departments

---

## Indexes and Performance

### Primary Indexes

```javascript
// Organizations
{ ownerId: 1 }
{ slug: 1 } (unique)
{ isActive: 1 }
{ 'harmonicEnergyCodes.effectiveFrom': 1 }

// Branches
{ organizationId: 1, code: 1 } (unique)
{ organizationId: 1, isActive: 1 }
{ leaderId: 1 }
{ status: 1 }

// Departments
{ organizationId: 1, branchId: 1, code: 1 } (unique)
{ branchId: 1, isActive: 1 }
{ managerId: 1 }
{ parentDepartmentId: 1 }
{ type: 1 }

// Department Templates
{ type: 1, category: 1 }
{ isActive: 1, isSystemTemplate: 1 }
{ industries: 1 }
```

### Composite Indexes for Common Queries

```javascript
// Find active departments by branch
db.departments.createIndex({ branchId: 1, isActive: 1, type: 1 });

// Find branches with their leaders
db.branches.createIndex({ organizationId: 1, leaderId: 1, isActive: 1 });

// Query current harmonic codes
db.organizations.createIndex({ 
  'harmonicEnergyCodes.effectiveUntil': 1,
  isActive: 1 
});
```

---

## Data Validation Rules

### Organization Validation

```typescript
// Custom validators
class OrganizationValidation {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @IsEnum(IndustryType)
  industry: IndustryType;

  @ValidateNested()
  @Type(() => AstrologicalDataDto)
  astrologicalData: AstrologicalDataDto;

  @IsArray()
  @IsEnum(CulturalValueType, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  culturalValues: CulturalValueType[];
}

// Astrological data validation
class AstrologicalDataDto {
  @IsDate()
  @IsNotEmpty()
  foundingDate: Date;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  foundingTime: string;

  @IsNotEmpty()
  @IsString()
  foundingCity: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}
```

### Branch Validation

```typescript
class BranchValidation {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @Matches(/^[A-Z0-9_-]+$/)
  @MaxLength(20)
  code: string; // Uppercase alphanumeric with hyphens/underscores

  @IsMongoId()
  organizationId: string;

  @IsEnum(BranchStatus)
  status: BranchStatus;
}
```

### Department Validation

```typescript
class DepartmentValidation {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @Matches(/^[A-Z0-9_-]+$/)
  @MaxLength(20)
  code: string;

  @IsMongoId()
  branchId: string;

  @IsEnum(DepartmentType)
  type: DepartmentType;

  @IsOptional()
  @IsMongoId()
  parentDepartmentId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  level?: number;
}
```

---

## Migration Strategy

### Phase 1: Initial Schema Creation (Week 1)
1. Create base collections with indexes
2. Deploy system department templates
3. Set up validation rules and constraints
4. Initialize default organizational settings

### Phase 2: Data Seeding (Week 1-2)
1. Import standard department templates
2. Create industry-specific templates
3. Set up default cultural values catalog
4. Initialize harmonic code calculation tables

### Phase 3: Migration Tools (Week 2)
1. Bulk organization import utility
2. Branch/department CSV import
3. Hierarchical structure validator
4. Data integrity checker

### Phase 4: Rollout (Week 3)
1. Gradual organization onboarding
2. Monitoring and performance tuning
3. Index optimization based on query patterns
4. Schema versioning implementation

### Migration Scripts

```typescript
// Example migration script structure
export class CreateOrganizationSchema1699632000000 implements MigrationInterface {
  public async up(): Promise<void> {
    await db.createCollection('organizations', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'slug', 'ownerId', 'industry', 'astrologicalData'],
          properties: {
            name: { bsonType: 'string', minLength: 2, maxLength: 100 },
            slug: { bsonType: 'string', pattern: '^[a-z0-9-]+$' },
            industry: { enum: Object.values(IndustryType) },
            // ... additional schema validation
          }
        }
      }
    });

    await db.collection('organizations').createIndexes([
      { key: { ownerId: 1 } },
      { key: { slug: 1 }, unique: true },
      { key: { isActive: 1 } }
    ]);
  }

  public async down(): Promise<void> {
    await db.collection('organizations').drop();
  }
}
```

### Rollback Procedures

1. **Schema Changes**: Maintain backward compatibility for 2 versions
2. **Data Migrations**: Atomic operations with transaction support
3. **Index Updates**: Online index building to avoid downtime
4. **Backup Strategy**: Pre-migration snapshots with point-in-time recovery

### Testing Strategy

1. **Unit Tests**: Schema validation and constraint testing
2. **Integration Tests**: Cross-collection relationship verification
3. **Performance Tests**: Query performance with production-scale data
4. **Migration Tests**: Up/down migration validation in staging

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-10  
**Status:** Production Ready