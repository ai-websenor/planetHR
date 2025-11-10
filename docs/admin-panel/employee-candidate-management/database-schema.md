# Database Schema - Employee & Candidate Management

## Overview

This document defines the MongoDB schemas for employee and candidate management, including personal information, professional background, astrological data, and organizational relationships.

### MongoDB (employee profiles, candidates)

The system uses MongoDB for flexible document storage of employee and candidate data, supporting complex nested structures for astrological information and hierarchical organizational relationships.

## Schema Definitions

### Employee Schema

```typescript
// Collection: employees
{
  _id: ObjectId,
  
  // Personal Information
  personalInfo: {
    firstName: String,          // Required
    lastName: String,           // Required
    email: String,              // Required, unique, indexed
    phoneNumber: String,
    dateOfBirth: Date,          // Required for astrological calculations
    placeOfBirth: {
      city: String,             // Required
      state: String,
      country: String,          // Required
      latitude: Number,         // Required for chart calculations
      longitude: Number,        // Required for chart calculations
      timezone: String          // IANA timezone format
    },
    timeOfBirth: {
      hour: Number,             // 0-23, Required
      minute: Number,           // 0-59, Required
      second: Number            // 0-59, Optional
    },
    gender: String,             // Enum: 'male', 'female', 'other', 'prefer-not-to-say'
    nationality: String,
    profilePhoto: String        // URL to profile image
  },

  // Professional Information
  professionalInfo: {
    employeeId: String,         // Company-specific employee ID, unique, indexed
    jobTitle: String,           // Required
    jobRole: ObjectId,          // Reference to JobRole, indexed
    department: ObjectId,       // Reference to Department, Required, indexed
    branch: ObjectId,           // Reference to Branch, indexed
    managerId: ObjectId,        // Reference to Employee (manager), indexed
    dateOfJoining: Date,        // Required
    employmentType: String,     // Enum: 'full-time', 'part-time', 'contract', 'intern'
    workLocation: String,       // Enum: 'on-site', 'remote', 'hybrid'
    experience: {
      totalYears: Number,
      relevantYears: Number,
      previousCompanies: [{
        companyName: String,
        role: String,
        duration: String,
        responsibilities: String
      }]
    },
    education: [{
      degree: String,
      institution: String,
      fieldOfStudy: String,
      graduationYear: Number,
      grade: String
    }],
    skills: [String],
    certifications: [{
      name: String,
      issuingOrganization: String,
      issueDate: Date,
      expiryDate: Date,
      credentialId: String
    }]
  },

  // Organizational Hierarchy
  organizationInfo: {
    organizationId: ObjectId,   // Reference to Organization, Required, indexed
    branchId: ObjectId,         // Reference to Branch, indexed
    departmentId: ObjectId,     // Reference to Department, Required, indexed
    reportingTo: ObjectId,      // Reference to Employee (direct manager)
    reportingChain: [ObjectId], // Array of manager IDs up the hierarchy
    accessibleBy: [{            // Role-based visibility
      userId: ObjectId,         // Owner, Leader, or Manager ID
      userRole: String,         // Enum: 'owner', 'leader', 'manager'
      scope: String             // 'organization', 'branch', 'department'
    }]
  },

  // Astrological Data
  astrologicalData: {
    birthChart: {
      sunSign: String,
      moonSign: String,
      ascendant: String,
      planets: [{
        name: String,           // 'Sun', 'Moon', 'Mercury', etc.
        sign: String,           // Zodiac sign
        house: Number,          // 1-12
        degree: Number,         // 0-29.99
        retrograde: Boolean
      }],
      houses: [{
        number: Number,         // 1-12
        sign: String,
        degree: Number
      }],
      aspects: [{
        planet1: String,
        planet2: String,
        aspectType: String,     // 'conjunction', 'trine', 'square', etc.
        orb: Number
      }]
    },
    harmonicEnergyCode: {
      currentCode: String,      // Current quarter's code
      codeHistory: [{
        code: String,
        effectiveDate: Date,
        expiryDate: Date,
        quarter: String         // 'Q1 2025', 'Q2 2025', etc.
      }],
      energyPattern: {
        primary: String,        // Primary energy type
        secondary: String,      // Secondary energy type
        intensity: Number       // 1-10 scale
      }
    },
    calculationMetadata: {
      lastCalculated: Date,
      calculationVersion: String,
      dataSource: String        // API or service used
    }
  },

  // Report Generation Status
  reportStatus: {
    personalityReport: {
      generated: Boolean,
      lastGenerated: Date,
      reportId: ObjectId,
      status: String            // 'pending', 'processing', 'completed', 'failed'
    },
    behaviorReport: {
      generated: Boolean,
      lastGenerated: Date,
      reportId: ObjectId,
      status: String
    },
    jobRoleCompatibility: {
      generated: Boolean,
      lastGenerated: Date,
      reportId: ObjectId,
      status: String,
      score: Number             // 0-100
    },
    departmentCompatibility: {
      generated: Boolean,
      lastGenerated: Date,
      reportId: ObjectId,
      status: String,
      score: Number
    },
    companyCompatibility: {
      generated: Boolean,
      lastGenerated: Date,
      reportId: ObjectId,
      status: String,
      score: Number
    },
    industryCompatibility: {
      generated: Boolean,
      lastGenerated: Date,
      reportId: ObjectId,
      status: String,
      score: Number
    },
    qaReport: {
      generated: Boolean,
      lastGenerated: Date,
      reportId: ObjectId,
      status: String
    },
    trainingReport: {
      generated: Boolean,
      lastGenerated: Date,
      reportId: ObjectId,
      status: String
    },
    lastQuarterlyUpdate: Date,
    nextQuarterlyUpdate: Date,
    autoUpdateEnabled: Boolean  // Based on subscription status
  },

  // Metadata
  status: String,               // Enum: 'active', 'inactive', 'on-leave', 'terminated'
  tags: [String],               // Custom tags for filtering
  notes: String,                // Admin notes
  
  // Audit Fields
  createdBy: ObjectId,          // Reference to User
  updatedBy: ObjectId,          // Reference to User
  createdAt: Date,              // Auto-generated
  updatedAt: Date,              // Auto-generated
  deletedAt: Date,              // Soft delete
  isDeleted: Boolean,           // Default: false
  
  // Indexes
  indexes: [
    { email: 1 },
    { 'professionalInfo.employeeId': 1 },
    { 'organizationInfo.organizationId': 1, 'organizationInfo.departmentId': 1 },
    { 'organizationInfo.branchId': 1 },
    { 'professionalInfo.managerId': 1 },
    { status: 1, isDeleted: 1 },
    { 'organizationInfo.accessibleBy.userId': 1 }
  ]
}
```

### Candidate Schema

```typescript
// Collection: candidates
{
  _id: ObjectId,
  
  // Personal Information
  personalInfo: {
    firstName: String,          // Required
    lastName: String,           // Required
    email: String,              // Required, unique, indexed
    phoneNumber: String,
    dateOfBirth: Date,          // Required for astrological calculations
    placeOfBirth: {
      city: String,             // Required
      state: String,
      country: String,          // Required
      latitude: Number,         // Required
      longitude: Number,        // Required
      timezone: String
    },
    timeOfBirth: {
      hour: Number,             // 0-23, Required
      minute: Number,           // 0-59, Required
      second: Number            // 0-59, Optional
    },
    gender: String,
    nationality: String,
    profilePhoto: String,
    resumeUrl: String,          // URL to resume document
    portfolioUrl: String,       // Personal website or portfolio
    linkedInUrl: String,
    githubUrl: String
  },

  // Application Information
  applicationInfo: {
    appliedForPosition: String, // Job title
    appliedForRole: ObjectId,   // Reference to JobRole
    appliedForDepartment: ObjectId, // Reference to Department
    appliedForBranch: ObjectId, // Reference to Branch
    applicationDate: Date,      // Required
    applicationSource: String,  // 'website', 'referral', 'recruiter', 'job-board', etc.
    referredBy: ObjectId,       // Reference to Employee if referral
    currentStage: String,       // 'screening', 'interview', 'assessment', 'offer', 'rejected', 'hired'
    stageHistory: [{
      stage: String,
      status: String,           // 'pending', 'completed', 'passed', 'failed'
      startDate: Date,
      endDate: Date,
      notes: String,
      evaluatedBy: ObjectId     // Reference to User
    }],
    interviewSchedule: [{
      interviewType: String,    // 'phone', 'video', 'in-person', 'technical', 'hr'
      scheduledDate: Date,
      interviewers: [ObjectId], // References to Users
      status: String,           // 'scheduled', 'completed', 'cancelled', 'rescheduled'
      feedback: String,
      rating: Number            // 1-10
    }]
  },

  // Professional Background
  professionalBackground: {
    totalExperience: Number,    // Years
    relevantExperience: Number, // Years
    expectedSalary: {
      currency: String,
      min: Number,
      max: Number
    },
    noticePeriod: Number,       // Days
    currentCompany: String,
    currentDesignation: String,
    workExperience: [{
      companyName: String,
      designation: String,
      duration: {
        from: Date,
        to: Date,
        current: Boolean
      },
      responsibilities: String,
      achievements: String,
      reasonForLeaving: String
    }],
    education: [{
      degree: String,
      institution: String,
      fieldOfStudy: String,
      graduationYear: Number,
      grade: String
    }],
    skills: [String],
    certifications: [{
      name: String,
      issuingOrganization: String,
      issueDate: Date,
      expiryDate: Date,
      credentialId: String
    }]
  },

  // Organizational Context
  organizationInfo: {
    organizationId: ObjectId,   // Reference to Organization, Required, indexed
    branchId: ObjectId,         // Reference to Branch
    departmentId: ObjectId,     // Reference to Department
    assignedRecruiter: ObjectId, // Reference to User (Manager/Leader)
    hiringManager: ObjectId,    // Reference to User
    accessibleBy: [{
      userId: ObjectId,
      userRole: String,
      scope: String
    }]
  },

  // Astrological Data (same structure as Employee)
  astrologicalData: {
    birthChart: { /* Same as Employee schema */ },
    harmonicEnergyCode: { /* Same as Employee schema */ },
    calculationMetadata: {
      lastCalculated: Date,
      calculationVersion: String,
      dataSource: String
    }
  },

  // Assessment & Compatibility
  assessmentData: {
    jobRoleCompatibility: {
      calculated: Boolean,
      score: Number,            // 0-100
      reportId: ObjectId,
      calculatedAt: Date
    },
    departmentCompatibility: {
      calculated: Boolean,
      score: Number,
      reportId: ObjectId,
      calculatedAt: Date
    },
    companyCompatibility: {
      calculated: Boolean,
      score: Number,
      reportId: ObjectId,
      calculatedAt: Date
    },
    industryCompatibility: {
      calculated: Boolean,
      score: Number,
      reportId: ObjectId,
      calculatedAt: Date
    },
    personalityReport: {
      generated: Boolean,
      reportId: ObjectId,
      generatedAt: Date
    },
    overallFitScore: Number     // Aggregate score 0-100
  },

  // Hiring Decision
  hiringDecision: {
    status: String,             // 'pending', 'offer-extended', 'offer-accepted', 'offer-rejected', 'hired', 'rejected'
    offerDetails: {
      offeredPosition: String,
      offeredSalary: Number,
      currency: String,
      joiningDate: Date,
      offerLetterUrl: String,
      offerExtendedDate: Date,
      offerExpiryDate: Date
    },
    rejectionReason: String,
    rejectionDate: Date,
    rejectedBy: ObjectId,       // Reference to User
    hiredAsEmployee: ObjectId,  // Reference to Employee if hired
    hiredDate: Date
  },

  // Metadata
  status: String,               // 'active', 'on-hold', 'withdrawn', 'hired', 'rejected'
  tags: [String],
  notes: String,
  
  // Audit Fields
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date,
  isDeleted: Boolean,
  
  // Indexes
  indexes: [
    { email: 1 },
    { 'applicationInfo.currentStage': 1 },
    { 'organizationInfo.organizationId': 1, 'organizationInfo.departmentId': 1 },
    { 'applicationInfo.appliedForRole': 1 },
    { status: 1, isDeleted: 1 },
    { 'organizationInfo.accessibleBy.userId': 1 },
    { 'hiringDecision.status': 1 }
  ]
}
```

### Bulk Import Job Schema

```typescript
// Collection: bulk_import_jobs
{
  _id: ObjectId,
  
  // Job Information
  jobInfo: {
    jobType: String,            // 'employee', 'candidate'
    fileName: String,           // Original uploaded file name
    fileUrl: String,            // S3 or storage URL
    fileSize: Number,           // Bytes
    totalRecords: Number,       // Total rows in file
    validRecords: Number,       // Records passed validation
    invalidRecords: Number,     // Records failed validation
    processedRecords: Number,   // Successfully imported
    failedRecords: Number       // Failed during import
  },

  // Organization Context
  organizationId: ObjectId,     // Required, indexed
  branchId: ObjectId,           // Optional
  departmentId: ObjectId,       // Optional
  defaultManagerId: ObjectId,   // Default manager for all imports
  
  // Processing Status
  status: String,               // 'uploaded', 'validating', 'validated', 'processing', 'completed', 'failed', 'partially-completed'
  startedAt: Date,
  completedAt: Date,
  processingDuration: Number,   // Milliseconds
  
  // Validation Results
  validationErrors: [{
    rowNumber: Number,
    field: String,
    value: String,
    errorMessage: String,
    errorType: String           // 'required', 'format', 'duplicate', 'invalid-reference'
  }],
  
  // Import Results
  importResults: [{
    rowNumber: Number,
    status: String,             // 'success', 'failed', 'skipped'
    employeeId: ObjectId,       // Reference to created Employee/Candidate
    candidateId: ObjectId,
    errorMessage: String
  }],
  
  // Error Summary
  errorSummary: {
    validationErrors: Number,
    importErrors: Number,
    duplicateEmails: Number,
    missingRequiredFields: Number,
    invalidDateFormats: Number,
    invalidReferences: Number
  },
  
  // User Context
  uploadedBy: ObjectId,         // Reference to User, Required
  uploadedByRole: String,       // 'owner', 'leader', 'manager'
  
  // Audit Fields
  createdAt: Date,
  updatedAt: Date,
  
  // Indexes
  indexes: [
    { organizationId: 1, status: 1 },
    { uploadedBy: 1 },
    { createdAt: -1 }
  ]
}
```

## Relationships

### Employee Relationships

```
Organization (1) -----> (N) Employees
Branch (1) -----> (N) Employees
Department (1) -----> (N) Employees
JobRole (1) -----> (N) Employees
Employee (Manager) (1) -----> (N) Employees (Reports)
Employee (1) -----> (N) Reports (personalityReport, compatibilityReports, etc.)
User (Owner/Leader/Manager) (1) -----> (N) Employees (accessibleBy)
```

### Candidate Relationships

```
Organization (1) -----> (N) Candidates
Branch (1) -----> (N) Candidates
Department (1) -----> (N) Candidates
JobRole (1) -----> (N) Candidates
User (Recruiter/Hiring Manager) (1) -----> (N) Candidates
Employee (Referrer) (1) -----> (N) Candidates (referredBy)
Candidate (1) -----> (1) Employee (when hired)
```

## Indexes Strategy

### Performance Indexes

```javascript
// Employee Collection
db.employees.createIndex({ email: 1 }, { unique: true })
db.employees.createIndex({ "professionalInfo.employeeId": 1 }, { unique: true, sparse: true })
db.employees.createIndex({ "organizationInfo.organizationId": 1, "organizationInfo.departmentId": 1 })
db.employees.createIndex({ "organizationInfo.branchId": 1 })
db.employees.createIndex({ "professionalInfo.managerId": 1 })
db.employees.createIndex({ status: 1, isDeleted: 1 })
db.employees.createIndex({ "organizationInfo.accessibleBy.userId": 1 })
db.employees.createIndex({ "reportStatus.nextQuarterlyUpdate": 1 })

// Candidate Collection
db.candidates.createIndex({ email: 1 }, { unique: true })
db.candidates.createIndex({ "applicationInfo.currentStage": 1 })
db.candidates.createIndex({ "organizationInfo.organizationId": 1, "organizationInfo.departmentId": 1 })
db.candidates.createIndex({ "applicationInfo.appliedForRole": 1 })
db.candidates.createIndex({ status: 1, isDeleted: 1 })
db.candidates.createIndex({ "organizationInfo.accessibleBy.userId": 1 })
db.candidates.createIndex({ "hiringDecision.status": 1 })

// Bulk Import Jobs Collection
db.bulk_import_jobs.createIndex({ organizationId: 1, status: 1 })
db.bulk_import_jobs.createIndex({ uploadedBy: 1 })
db.bulk_import_jobs.createIndex({ createdAt: -1 })
```

## Data Validation Rules

### Employee Validation

```javascript
// MongoDB Schema Validation for Employee
{
  $jsonSchema: {
    bsonType: "object",
    required: ["personalInfo", "professionalInfo", "organizationInfo", "status"],
    properties: {
      personalInfo: {
        bsonType: "object",
        required: ["firstName", "lastName", "email", "dateOfBirth", "placeOfBirth", "timeOfBirth"],
        properties: {
          email: { bsonType: "string", pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" },
          dateOfBirth: { bsonType: "date" },
          placeOfBirth: {
            required: ["city", "country", "latitude", "longitude"],
            properties: {
              latitude: { bsonType: "number", minimum: -90, maximum: 90 },
              longitude: { bsonType: "number", minimum: -180, maximum: 180 }
            }
          },
          timeOfBirth: {
            required: ["hour", "minute"],
            properties: {
              hour: { bsonType: "int", minimum: 0, maximum: 23 },
              minute: { bsonType: "int", minimum: 0, maximum: 59 }
            }
          }
        }
      },
      professionalInfo: {
        bsonType: "object",
        required: ["jobTitle", "jobRole", "department", "dateOfJoining"],
        properties: {
          employmentType: { enum: ["full-time", "part-time", "contract", "intern"] },
          workLocation: { enum: ["on-site", "remote", "hybrid"] }
        }
      },
      status: { enum: ["active", "inactive", "on-leave", "terminated"] },
      isDeleted: { bsonType: "bool" }
    }
  }
}
```

### Candidate Validation

```javascript
// MongoDB Schema Validation for Candidate
{
  $jsonSchema: {
    bsonType: "object",
    required: ["personalInfo", "applicationInfo", "organizationInfo", "status"],
    properties: {
      personalInfo: {
        bsonType: "object",
        required: ["firstName", "lastName", "email", "dateOfBirth", "placeOfBirth", "timeOfBirth"],
        properties: {
          email: { bsonType: "string", pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" }
        }
      },
      applicationInfo: {
        bsonType: "object",
        required: ["appliedForPosition", "applicationDate", "currentStage"],
        properties: {
          currentStage: { enum: ["screening", "interview", "assessment", "offer", "rejected", "hired"] }
        }
      },
      status: { enum: ["active", "on-hold", "withdrawn", "hired", "rejected"] },
      isDeleted: { bsonType: "bool" }
    }
  }
}
```

## Migration Strategy

### Phase 1: Initial Setup (Week 1)

1. **Create Collections**
   - Create `employees`, `candidates`, and `bulk_import_jobs` collections
   - Apply schema validation rules
   - Create performance indexes

2. **Seed Reference Data**
   - Import default astrological calculation parameters
   - Set up harmonic energy code templates
   - Configure report generation triggers

### Phase 2: Data Migration (Week 2-3)

1. **Import Existing Data**
   ```javascript
   // Migration script structure
   const migrationSteps = [
     'validate_source_data',
     'transform_personal_info',
     'transform_professional_info',
     'calculate_astrological_data',
     'generate_harmonic_codes',
     'establish_relationships',
     'verify_data_integrity'
   ];
   ```

2. **Relationship Establishment**
   - Map existing employee hierarchies
   - Link employees to departments and branches
   - Establish manager-employee relationships
   - Set up role-based access control arrays

3. **Data Validation**
   - Verify all required fields populated
   - Validate date formats and birth data
   - Check coordinate accuracy for birth places
   - Confirm organizational hierarchy integrity

### Phase 3: Backward Compatibility (Week 3-4)

1. **Dual-Write Strategy**
   - Write to both old and new schemas during transition
   - Maintain data consistency across systems
   - Monitor write performance and errors

2. **Read Migration**
   - Gradually shift reads from old to new schema
   - Implement fallback mechanisms
   - Monitor query performance

3. **Cleanup**
   - Remove old schema once migration validated
   - Archive historical data
   - Update all application references

### Migration Scripts

```javascript
// Example migration script for employee data
async function migrateEmployees() {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const oldEmployees = await OldEmployeeModel.find({ migrated: false }).limit(100);
    
    for (const oldEmp of oldEmployees) {
      // Transform data structure
      const newEmployee = {
        personalInfo: {
          firstName: oldEmp.first_name,
          lastName: oldEmp.last_name,
          email: oldEmp.email,
          dateOfBirth: new Date(oldEmp.dob),
          placeOfBirth: {
            city: oldEmp.birth_city,
            country: oldEmp.birth_country,
            latitude: oldEmp.birth_lat,
            longitude: oldEmp.birth_lng,
            timezone: oldEmp.timezone
          },
          timeOfBirth: {
            hour: parseInt(oldEmp.birth_time.split(':')[0]),
            minute: parseInt(oldEmp.birth_time.split(':')[1])
          }
        },
        professionalInfo: {
          jobTitle: oldEmp.designation,
          department: oldEmp.dept_id,
          dateOfJoining: new Date(oldEmp.joining_date),
          employmentType: oldEmp.emp_type
        },
        organizationInfo: {
          organizationId: oldEmp.org_id,
          departmentId: oldEmp.dept_id,
          reportingTo: oldEmp.manager_id
        },
        status: oldEmp.active ? 'active' : 'inactive',
        createdAt: oldEmp.created_at,
        updatedAt: oldEmp.updated_at
      };
      
      // Create new employee record
      await NewEmployeeModel.create([newEmployee], { session });
      
      // Mark as migrated in old system
      await OldEmployeeModel.updateOne(
        { _id: oldEmp._id },
        { $set: { migrated: true, migrated_at: new Date() } },
        { session }
      );
    }
    
    await session.commitTransaction();
    console.log(`Migrated ${oldEmployees.length} employees successfully`);
  } catch (error) {
    await session.abortTransaction();
    console.error('Migration failed:', error);
    throw error;
  } finally {
    session.endSession();
  }
}
```

### Rollback Strategy

1. **Snapshot Creation**
   - Create full database snapshot before migration
   - Store snapshots in separate MongoDB instance or S3
   - Document snapshot locations and timestamps

2. **Rollback Triggers**
   - Data integrity violation (>5% error rate)
   - Performance degradation (>200ms query latency)
   - Application errors (>1% error rate)

3. **Rollback Process**
   ```javascript
   // Rollback script
   async function rollbackMigration(snapshotId) {
     // Restore from snapshot
     await restoreSnapshot(snapshotId);
     
     // Revert application configuration
     await updateAppConfig({ useNewSchema: false });
     
     // Clear new schema data
     await clearNewCollections();
     
     // Notify stakeholders
     await sendRollbackNotification();
   }
   ```

### Post-Migration Validation

1. **Data Integrity Checks**
   - Compare record counts between old and new schemas
   - Validate critical field mappings
   - Verify relationship integrity
   - Confirm calculation accuracy (astrological data)

2. **Performance Benchmarks**
   - Query response time comparison
   - Write operation latency
   - Index utilization analysis
   - Memory usage monitoring

3. **Application Testing**
   - End-to-end user flow testing
   - Role-based access validation
   - Report generation verification
   - Bulk import functionality testing

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Completed