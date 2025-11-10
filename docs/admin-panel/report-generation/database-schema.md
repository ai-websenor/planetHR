# Database Schema - AI-Powered Report Generation

## Overview

This document defines the database schemas for the AI-Powered Report Generation module. The system uses a polyglot persistence approach with MongoDB for storing flexible report content and analysis data, and PostgreSQL for structured report metadata and versioning.

### MongoDB (generated reports, analysis data)

MongoDB stores the generated reports, AI analysis results, astrological calculations, and harmonic energy data. The schema is designed for flexible document structures that accommodate varying report types and analysis outputs.

#### Collection: `reports`

```javascript
{
  _id: ObjectId,
  reportId: String,                    // UUID for cross-database reference
  employeeId: String,                  // Reference to employees collection
  organizationId: String,              // Reference to organizations collection
  departmentId: String,                // Reference to departments collection
  reportType: String,                  // Enum: see Report Types below
  version: Number,                     // Report version for quarterly regeneration
  generationDate: Date,
  expiryDate: Date,                    // For quarterly regeneration tracking
  status: String,                      // 'generating', 'completed', 'failed', 'archived'
  
  // Report Content
  content: {
    summary: String,                   // Executive summary
    score: Number,                     // Overall compatibility/assessment score (0-100)
    sections: [
      {
        sectionId: String,
        title: String,
        content: String,               // Rich text/markdown content
        subsections: [
          {
            title: String,
            content: String,
            insights: [String],
            recommendations: [String]
          }
        ],
        visualizations: [
          {
            type: String,              // 'chart', 'graph', 'diagram'
            data: Object,              // Visualization configuration
            imageUrl: String           // Optional stored image reference
          }
        ]
      }
    ],
    keyInsights: [String],             // Bullet points of main findings
    actionItems: [String],             // Recommended actions
    warnings: [String]                 // Potential concerns or red flags
  },
  
  // Source Data References
  analysisIds: [String],               // References to analysis_data collection
  astrologicalDataId: String,          // Reference to astrological_data collection
  harmonicEnergyCodeId: String,        // Reference to harmonic_energy_codes collection
  
  // Metadata
  generatedBy: String,                 // User ID who triggered generation
  processingTimeMs: Number,
  llmTokensUsed: Number,
  llmModel: String,
  
  // Access Control
  visibleToRoles: [String],            // ['owner', 'leader', 'manager']
  visibleToDepartments: [String],      // Department IDs with access
  visibleToBranches: [String],         // Branch IDs with access
  
  // Audit
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date                      // Soft delete
}
```

**Report Types:**
- `personality_role_specific` - Role-specific personality assessment
- `behavior_company_specific` - Company-specific behavioral analysis
- `compatibility_job_role` - Job role compatibility
- `compatibility_department` - Department compatibility
- `compatibility_company` - Company compatibility
- `compatibility_industry` - Industry compatibility
- `questionnaire_qa` - Employee questionnaires and Q&A
- `training_development` - Training and development recommendations

**Indexes:**
```javascript
db.reports.createIndex({ reportId: 1 }, { unique: true })
db.reports.createIndex({ employeeId: 1, reportType: 1 })
db.reports.createIndex({ organizationId: 1, status: 1 })
db.reports.createIndex({ departmentId: 1, generationDate: -1 })
db.reports.createIndex({ expiryDate: 1 }, { sparse: true })
db.reports.createIndex({ status: 1, createdAt: -1 })
db.reports.createIndex({ "visibleToDepartments": 1 })
```

#### Collection: `analysis_data`

```javascript
{
  _id: ObjectId,
  analysisId: String,                  // UUID for reference
  employeeId: String,
  reportId: String,                    // Associated report
  analysisType: String,                // 'personality', 'compatibility', 'behavior', 'training'
  
  // AI Analysis Results
  llmAnalysis: {
    prompt: String,                    // Original prompt sent to LLM
    response: String,                  // Raw LLM response
    model: String,                     // Model used (e.g., 'gpt-4')
    temperature: Number,
    tokensUsed: {
      prompt: Number,
      completion: Number,
      total: Number
    },
    processingTimeMs: Number,
    confidence: Number                 // 0-1 confidence score
  },
  
  // Structured Analysis Output
  analysisResults: {
    traits: [
      {
        name: String,                  // Trait name
        score: Number,                 // 0-100 score
        description: String,
        impact: String,                // 'high', 'medium', 'low'
        context: String                // Role/company/industry context
      }
    ],
    strengths: [String],
    weaknesses: [String],
    opportunities: [String],
    risks: [String],
    compatibilityFactors: [
      {
        factor: String,
        score: Number,
        weight: Number,
        reasoning: String
      }
    ]
  },
  
  // Context Data
  contextData: {
    jobRole: Object,                   // Job role details at time of analysis
    department: Object,                // Department details
    company: Object,                   // Company profile
    industry: Object                   // Industry parameters
  },
  
  // Audit
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.analysis_data.createIndex({ analysisId: 1 }, { unique: true })
db.analysis_data.createIndex({ employeeId: 1, analysisType: 1 })
db.analysis_data.createIndex({ reportId: 1 })
db.analysis_data.createIndex({ createdAt: -1 })
```

#### Collection: `astrological_data`

```javascript
{
  _id: ObjectId,
  astroDataId: String,                 // UUID for reference
  employeeId: String,
  organizationId: String,
  
  // Birth Information
  birthData: {
    date: Date,
    time: String,                      // HH:MM format
    location: {
      city: String,
      country: String,
      latitude: Number,
      longitude: Number,
      timezone: String
    },
    coordinates: {
      type: "Point",
      coordinates: [Number, Number]    // [longitude, latitude]
    }
  },
  
  // Birth Chart
  birthChart: {
    sun: {
      sign: String,
      degree: Number,
      house: Number,
      retrograde: Boolean
    },
    moon: {
      sign: String,
      degree: Number,
      house: Number,
      retrograde: Boolean
    },
    ascendant: {
      sign: String,
      degree: Number
    },
    planets: [
      {
        name: String,                  // 'Mercury', 'Venus', 'Mars', etc.
        sign: String,
        degree: Number,
        house: Number,
        retrograde: Boolean
      }
    ],
    houses: [
      {
        number: Number,
        sign: String,
        degree: Number
      }
    ]
  },
  
  // Aspects
  aspects: [
    {
      planet1: String,
      planet2: String,
      aspectType: String,              // 'conjunction', 'opposition', 'trine', etc.
      orb: Number,
      strength: Number                 // 0-1 strength rating
    }
  ],
  
  // Interpretations
  interpretations: {
    personality: String,
    strengths: [String],
    challenges: [String],
    careerIndications: [String],
    relationshipPatterns: [String]
  },
  
  // Calculation Metadata
  calculationEngine: String,           // Engine/API used
  calculationDate: Date,
  version: String,                     // Calculation version
  
  // Audit
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.astrological_data.createIndex({ astroDataId: 1 }, { unique: true })
db.astrological_data.createIndex({ employeeId: 1 })
db.astrological_data.createIndex({ organizationId: 1 })
db.astrological_data.createIndex({ "birthData.coordinates": "2dsphere" })
```

#### Collection: `harmonic_energy_codes`

```javascript
{
  _id: ObjectId,
  harmonicCodeId: String,              // UUID for reference
  employeeId: String,
  organizationId: String,
  
  // Quarterly Code
  currentQuarter: {
    year: Number,
    quarter: Number,                   // 1-4
    startDate: Date,
    endDate: Date,
    code: String,                      // Generated harmonic code
    frequency: Number,                 // Hz frequency value
    wavelength: Number
  },
  
  // Code Components
  energyComponents: {
    primary: {
      value: Number,
      color: String,
      meaning: String,
      influence: Number                // 0-100 influence strength
    },
    secondary: {
      value: Number,
      color: String,
      meaning: String,
      influence: Number
    },
    tertiary: {
      value: Number,
      color: String,
      meaning: String,
      influence: Number
    }
  },
  
  // Energy Pattern Analysis
  energyPattern: {
    dominant: String,                  // Dominant energy type
    balance: Number,                   // -100 to 100 balance score
    stability: Number,                 // 0-100 stability rating
    intensity: Number,                 // 0-100 intensity level
    resonance: [
      {
        type: String,
        frequency: Number,
        strength: Number
      }
    ]
  },
  
  // Compatibility Factors
  compatibility: {
    jobRole: Number,                   // 0-100 compatibility
    department: Number,
    company: Number,
    industry: Number,
    teamDynamics: Number
  },
  
  // Historical Codes
  previousQuarters: [
    {
      year: Number,
      quarter: Number,
      code: String,
      frequency: Number,
      generatedAt: Date
    }
  ],
  
  // Next Generation
  nextRegenerationDate: Date,
  autoRegenerateEnabled: Boolean,
  
  // Calculation Metadata
  calculationMethod: String,
  basedOnAstroDataId: String,
  
  // Audit
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.harmonic_energy_codes.createIndex({ harmonicCodeId: 1 }, { unique: true })
db.harmonic_energy_codes.createIndex({ employeeId: 1 })
db.harmonic_energy_codes.createIndex({ "currentQuarter.year": 1, "currentQuarter.quarter": 1 })
db.harmonic_energy_codes.createIndex({ nextRegenerationDate: 1 })
db.harmonic_energy_codes.createIndex({ organizationId: 1 })
```

#### Collection: `training_recommendations`

```javascript
{
  _id: ObjectId,
  recommendationId: String,            // UUID for reference
  employeeId: String,
  reportId: String,                    // Associated training report
  generatedDate: Date,
  
  // Skill Gap Analysis
  skillGaps: [
    {
      skillName: String,
      currentLevel: Number,            // 0-100 current proficiency
      requiredLevel: Number,           // 0-100 required proficiency
      gap: Number,                     // Difference
      priority: String,                // 'critical', 'high', 'medium', 'low'
      impactArea: String,              // 'role', 'team', 'department', 'company'
      reasoning: String
    }
  ],
  
  // Training Programs
  recommendations: [
    {
      programId: String,
      title: String,
      description: String,
      provider: String,
      duration: String,
      format: String,                  // 'online', 'in-person', 'hybrid'
      estimatedCost: Number,
      currency: String,
      targetSkills: [String],
      expectedOutcome: String,
      priority: Number,                // 1-10 priority ranking
      prerequisites: [String],
      certificationAvailable: Boolean
    }
  ],
  
  // Development Path
  developmentPath: {
    shortTerm: [                       // 0-6 months
      {
        goal: String,
        actions: [String],
        metrics: [String],
        estimatedCompletion: Date
      }
    ],
    mediumTerm: [                      // 6-12 months
      {
        goal: String,
        actions: [String],
        metrics: [String],
        estimatedCompletion: Date
      }
    ],
    longTerm: [                        // 12+ months
      {
        goal: String,
        actions: [String],
        metrics: [String],
        estimatedCompletion: Date
      }
    ]
  },
  
  // Progress Tracking
  implementationStatus: {
    started: Boolean,
    startDate: Date,
    completedRecommendations: [String],
    inProgressRecommendations: [String],
    notStartedRecommendations: [String],
    lastReviewDate: Date
  },
  
  // Audit
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.training_recommendations.createIndex({ recommendationId: 1 }, { unique: true })
db.training_recommendations.createIndex({ employeeId: 1, generatedDate: -1 })
db.training_recommendations.createIndex({ reportId: 1 })
```

#### Collection: `questionnaire_responses`

```javascript
{
  _id: ObjectId,
  responseId: String,                  // UUID for reference
  employeeId: String,
  reportId: String,                    // Associated Q&A report
  questionnaireType: String,           // 'self_assessment', 'manager_review', 'peer_feedback'
  
  // Questions and Answers
  responses: [
    {
      questionId: String,
      question: String,
      questionType: String,            // 'multiple_choice', 'rating', 'text', 'boolean'
      answer: Mixed,                   // Type depends on questionType
      score: Number,                   // Optional scoring
      aiAnalysis: String,              // LLM analysis of the response
      flagged: Boolean,                // Flag for HR review
      flagReason: String
    }
  ],
  
  // Overall Analysis
  aggregateAnalysis: {
    overallScore: Number,
    strengthAreas: [String],
    concernAreas: [String],
    recommendations: [String],
    followUpQuestions: [String]
  },
  
  // Response Metadata
  completedDate: Date,
  timeSpentMinutes: Number,
  completionRate: Number,              // Percentage of questions answered
  
  // Review Status
  reviewStatus: String,                // 'pending', 'reviewed', 'actioned'
  reviewedBy: String,                  // User ID
  reviewedDate: Date,
  reviewNotes: String,
  
  // Audit
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.questionnaire_responses.createIndex({ responseId: 1 }, { unique: true })
db.questionnaire_responses.createIndex({ employeeId: 1, questionnaireType: 1 })
db.questionnaire_responses.createIndex({ reportId: 1 })
db.questionnaire_responses.createIndex({ reviewStatus: 1 })
```

### PostgreSQL (report metadata, versioning)

PostgreSQL stores structured metadata, versioning information, and relational data that requires ACID compliance and complex queries.

#### Table: `report_metadata`

```sql
CREATE TABLE report_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id VARCHAR(255) NOT NULL UNIQUE,  -- Links to MongoDB reports._id
  employee_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  department_id UUID,
  branch_id UUID,
  
  -- Report Classification
  report_type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,  -- 'personality', 'compatibility', 'training', 'qa'
  version INTEGER NOT NULL DEFAULT 1,
  is_latest BOOLEAN NOT NULL DEFAULT true,
  
  -- Generation Information
  generation_started_at TIMESTAMP NOT NULL,
  generation_completed_at TIMESTAMP,
  generation_duration_ms INTEGER,
  status VARCHAR(20) NOT NULL,  -- 'queued', 'processing', 'completed', 'failed', 'archived'
  
  -- Scheduling
  scheduled_regeneration_date DATE,
  auto_regenerate_enabled BOOLEAN DEFAULT true,
  last_regeneration_date TIMESTAMP,
  regeneration_count INTEGER DEFAULT 0,
  
  -- Access Control
  created_by UUID NOT NULL,
  access_level VARCHAR(20) NOT NULL,  -- 'organization', 'branch', 'department', 'manager'
  visibility_scope JSONB,  -- Flexible visibility rules
  
  -- Performance Metrics
  llm_tokens_used INTEGER,
  llm_cost_usd DECIMAL(10, 4),
  processing_queue_time_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT check_status CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'archived')),
  CONSTRAINT check_report_type CHECK (report_type IN (
    'personality_role_specific',
    'behavior_company_specific',
    'compatibility_job_role',
    'compatibility_department',
    'compatibility_company',
    'compatibility_industry',
    'questionnaire_qa',
    'training_development'
  ))
);

-- Indexes
CREATE INDEX idx_report_metadata_employee ON report_metadata(employee_id);
CREATE INDEX idx_report_metadata_organization ON report_metadata(organization_id);
CREATE INDEX idx_report_metadata_department ON report_metadata(department_id);
CREATE INDEX idx_report_metadata_status ON report_metadata(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_report_metadata_type_version ON report_metadata(employee_id, report_type, version);
CREATE INDEX idx_report_metadata_regeneration ON report_metadata(scheduled_regeneration_date) 
  WHERE auto_regenerate_enabled = true AND status = 'completed';
CREATE INDEX idx_report_metadata_latest ON report_metadata(employee_id, report_type, is_latest) 
  WHERE is_latest = true AND deleted_at IS NULL;
CREATE INDEX idx_report_metadata_visibility ON report_metadata USING GIN(visibility_scope);
```

#### Table: `report_versions`

```sql
CREATE TABLE report_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id VARCHAR(255) NOT NULL,  -- Links to MongoDB reports
  employee_id UUID NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  version INTEGER NOT NULL,
  
  -- Version Details
  version_name VARCHAR(100),  -- Optional friendly name
  quarter_year INTEGER,
  quarter_number INTEGER,  -- 1-4
  
  -- Content References
  mongodb_document_id VARCHAR(255) NOT NULL,  -- MongoDB ObjectId
  content_hash VARCHAR(64),  -- SHA-256 hash for change detection
  
  -- Version Metadata
  generated_at TIMESTAMP NOT NULL,
  generated_by UUID NOT NULL,
  generation_trigger VARCHAR(50) NOT NULL,  -- 'manual', 'scheduled', 'harmonic_update', 'data_change'
  
  -- Change Summary
  changes_from_previous JSONB,  -- Structured change log
  change_summary TEXT,
  significant_changes BOOLEAN DEFAULT false,
  
  -- Comparison Metrics
  score_change DECIMAL(5, 2),  -- Change in overall score
  key_differences TEXT[],
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT fk_version_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  CONSTRAINT fk_version_created_by FOREIGN KEY (generated_by) REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT unique_employee_type_version UNIQUE (employee_id, report_type, version)
);

-- Indexes
CREATE INDEX idx_report_versions_report ON report_versions(report_id);
CREATE INDEX idx_report_versions_employee ON report_versions(employee_id, report_type, version DESC);
CREATE INDEX idx_report_versions_quarter ON report_versions(quarter_year, quarter_number);
CREATE INDEX idx_report_versions_generated ON report_versions(generated_at DESC);
```

#### Table: `report_generation_queue`

```sql
CREATE TABLE report_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  
  -- Queue Information
  priority INTEGER NOT NULL DEFAULT 5,  -- 1-10, higher = more urgent
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'
  queue_position INTEGER,
  
  -- Scheduling
  scheduled_for TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Processing Details
  worker_id VARCHAR(100),  -- Identifier of processing worker
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  
  -- Request Context
  requested_by UUID NOT NULL,
  request_reason VARCHAR(100),  -- 'new_employee', 'quarterly_update', 'manual_request', 'data_correction'
  request_metadata JSONB,
  
  -- Dependencies
  depends_on_queue_id UUID,  -- For sequential processing
  blocks_queue_ids UUID[],  -- Queue items waiting on this
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT fk_queue_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  CONSTRAINT fk_queue_requested_by FOREIGN KEY (requested_by) REFERENCES users(id),
  CONSTRAINT fk_queue_depends_on FOREIGN KEY (depends_on_queue_id) REFERENCES report_generation_queue(id),
  
  -- Constraints
  CONSTRAINT check_queue_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  CONSTRAINT check_priority CHECK (priority BETWEEN 1 AND 10)
);

-- Indexes
CREATE INDEX idx_queue_status_priority ON report_generation_queue(status, priority DESC, created_at) 
  WHERE status IN ('pending', 'processing');
CREATE INDEX idx_queue_employee ON report_generation_queue(employee_id, status);
CREATE INDEX idx_queue_scheduled ON report_generation_queue(scheduled_for) 
  WHERE status = 'pending' AND scheduled_for IS NOT NULL;
CREATE INDEX idx_queue_worker ON report_generation_queue(worker_id, status);
```

#### Table: `report_access_log`

```sql
CREATE TABLE report_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  employee_id UUID NOT NULL,
  
  -- Access Details
  accessed_by UUID NOT NULL,
  access_type VARCHAR(20) NOT NULL,  -- 'view', 'download', 'share', 'print'
  access_method VARCHAR(20),  -- 'web', 'api', 'mobile'
  
  -- Context
  user_role VARCHAR(20) NOT NULL,
  department_id UUID,
  branch_id UUID,
  
  -- Authorization
  authorized BOOLEAN NOT NULL DEFAULT true,
  authorization_level VARCHAR(50),
  access_scope VARCHAR(50),  -- 'full', 'summary', 'limited'
  
  -- Session Information
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  
  -- Audit
  accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT fk_access_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  CONSTRAINT fk_access_user FOREIGN KEY (accessed_by) REFERENCES users(id),
  CONSTRAINT fk_access_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_access_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- Indexes
CREATE INDEX idx_access_log_report ON report_access_log(report_id, accessed_at DESC);
CREATE INDEX idx_access_log_user ON report_access_log(accessed_by, accessed_at DESC);
CREATE INDEX idx_access_log_employee ON report_access_log(employee_id, accessed_at DESC);
CREATE INDEX idx_access_log_unauthorized ON report_access_log(accessed_at DESC) WHERE authorized = false;
CREATE INDEX idx_access_log_date ON report_access_log(accessed_at) 
  WHERE accessed_at > CURRENT_DATE - INTERVAL '90 days';
```

#### Table: `report_scores`

```sql
CREATE TABLE report_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id VARCHAR(255) NOT NULL,
  employee_id UUID NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  version INTEGER NOT NULL,
  
  -- Overall Scores
  overall_score DECIMAL(5, 2) NOT NULL,  -- 0-100
  confidence_level DECIMAL(3, 2),  -- 0-1
  
  -- Dimension Scores
  personality_score DECIMAL(5, 2),
  behavior_score DECIMAL(5, 2),
  compatibility_score DECIMAL(5, 2),
  potential_score DECIMAL(5, 2),
  
  -- Detailed Breakdowns
  dimension_scores JSONB,  -- Flexible structure for various dimensions
  factor_weights JSONB,  -- Weights used in score calculation
  
  -- Benchmarking
  percentile_rank DECIMAL(5, 2),  -- Compared to similar roles/departments
  department_average DECIMAL(5, 2),
  company_average DECIMAL(5, 2),
  industry_average DECIMAL(5, 2),
  
  -- Trends
  score_trend VARCHAR(20),  -- 'improving', 'stable', 'declining'
  previous_score DECIMAL(5, 2),
  score_change DECIMAL(5, 2),
  
  -- Metadata
  calculated_at TIMESTAMP NOT NULL,
  calculation_method VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT fk_scores_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  
  -- Constraints
  CONSTRAINT check_overall_score CHECK (overall_score BETWEEN 0 AND 100),
  CONSTRAINT check_confidence CHECK (confidence_level BETWEEN 0 AND 1)
);

-- Indexes
CREATE INDEX idx_scores_report ON report_scores(report_id);
CREATE INDEX idx_scores_employee ON report_scores(employee_id, report_type, version DESC);
CREATE INDEX idx_scores_type_score ON report_scores(report_type, overall_score DESC);
CREATE INDEX idx_scores_dimension ON report_scores USING GIN(dimension_scores);
```

#### Table: `report_generation_errors`

```sql
CREATE TABLE report_generation_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID,
  employee_id UUID NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  
  -- Error Information
  error_type VARCHAR(50) NOT NULL,  -- 'llm_timeout', 'astro_api_error', 'data_missing', etc.
  error_code VARCHAR(20),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  
  -- Context
  processing_stage VARCHAR(50),  -- 'data_collection', 'ai_analysis', 'compilation', etc.
  input_data JSONB,
  
  -- Resolution
  retry_attempted BOOLEAN DEFAULT false,
  retry_successful BOOLEAN,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  
  -- Timestamps
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT fk_error_queue FOREIGN KEY (queue_id) REFERENCES report_generation_queue(id),
  CONSTRAINT fk_error_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Indexes
CREATE INDEX idx_errors_employee ON report_generation_errors(employee_id, occurred_at DESC);
CREATE INDEX idx_errors_type ON report_generation_errors(error_type, occurred_at DESC);
CREATE INDEX idx_errors_unresolved ON report_generation_errors(occurred_at DESC) 
  WHERE resolved_at IS NULL;
CREATE INDEX idx_errors_queue ON report_generation_errors(queue_id);
```

## Migration Strategy

### Phase 1: Initial Setup (Week 1)

**PostgreSQL Setup:**
1. Create all tables in the correct dependency order:
   - Core reference tables (organizations, branches, departments, users, employees)
   - Report metadata tables
   - Versioning and queue tables
   - Audit and logging tables
2. Apply all indexes and constraints
3. Set up row-level security policies for multi-tenant isolation
4. Create database roles and permissions
5. Configure connection pooling (recommended: PgBouncer)

**MongoDB Setup:**
1. Create database and collections
2. Apply all indexes (can be done in background for large collections)
3. Set up replica set for high availability
4. Configure sharding strategy based on organizationId for large-scale deployments
5. Create database users with appropriate permissions
6. Enable MongoDB authentication and encryption at rest

### Phase 2: Data Migration (Week 2-3)

**For Existing System (if applicable):**
1. Export existing report data to staging environment
2. Transform data to match new schema:
   - Split relational data → PostgreSQL
   - Move document data → MongoDB
   - Generate missing UUIDs and references
3. Run data validation scripts
4. Perform test migrations with subset of data
5. Execute full migration during maintenance window
6. Verify data integrity with checksums and row counts

**For New System:**
1. Seed initial reference data (report types, categories)
2. Create default templates and configurations
3. Set up initial admin users and permissions

### Phase 3: Application Integration (Week 3-4)

**Database Abstraction Layer:**
1. Implement repository pattern for data access
2. Create unified service layer that orchestrates PostgreSQL + MongoDB operations
3. Implement transaction management for cross-database operations
4. Add connection retry logic and circuit breakers
5. Implement caching layer (Redis) for frequently accessed data

**Data Consistency:**
1. Implement eventual consistency patterns for cross-database references
2. Create background jobs for data synchronization verification
3. Set up monitoring for replication lag and sync failures
4. Implement compensating transactions for failure scenarios

### Phase 4: Testing & Validation (Week 4-5)

**Performance Testing:**
1. Load test report generation with 1000+ concurrent requests
2. Validate query performance with production-like data volumes
3. Test quarterly regeneration at scale
4. Monitor database resource utilization

**Data Integrity Testing:**
1. Verify referential integrity between PostgreSQL and MongoDB
2. Test cascading deletes and soft delete scenarios
3. Validate access control across both databases
4. Test backup and restore procedures

**Functional Testing:**
1. End-to-end report generation workflows
2. Version management and comparison
3. Queue processing under various load conditions
4. Error handling and retry mechanisms

### Phase 5: Deployment & Monitoring (Week 5-6)

**Production Rollout:**
1. Deploy database changes during maintenance window
2. Run smoke tests post-deployment
3. Enable monitoring and alerting
4. Gradually ramp up traffic (canary deployment)

**Monitoring Setup:**
1. Database performance metrics (query times, connection pools)
2. Replication lag monitoring
3. Storage utilization alerts
4. Query slow log analysis
5. Cross-database consistency checks

### Rollback Strategy

**Immediate Rollback (< 1 hour):**
1. Revert application to previous version
2. Restore database from pre-migration snapshot
3. Redirect traffic to backup environment

**Post-Migration Issues:**
1. Keep previous database snapshots for 30 days
2. Maintain data transformation scripts for reverse migration
3. Document rollback procedures and test quarterly

### Backup & Recovery

**Backup Strategy:**
- **PostgreSQL**: Continuous archiving with point-in-time recovery (PITR)
  - Full backups: Daily at 2 AM UTC
  - WAL archiving: Continuous
  - Retention: 30 days
  
- **MongoDB**: 
  - Full backups: Every 6 hours
  - Oplog backups: Continuous
  - Retention: 30 days
  - Cross-region replication for disaster recovery

**Recovery Procedures:**
1. Documented RTO (Recovery Time Objective): 1 hour
2. RPO (Recovery Point Objective): 5 minutes
3. Quarterly disaster recovery drills
4. Automated backup verification

### Optimization Strategies

**PostgreSQL:**
1. Partition large tables by date (report_access_log, report_generation_errors)
2. Implement table inheritance for report_versions by year
3. Use materialized views for complex aggregations
4. Configure autovacuum for optimal performance
5. Implement connection pooling with PgBouncer

**MongoDB:**
1. Shard by organizationId for horizontal scaling
2. Use compound indexes for complex queries
3. Implement TTL indexes for automatic data expiration
4. Configure appropriate read/write concerns
5. Use aggregation pipeline for complex analytics

### Security Measures

**PostgreSQL:**
1. Row-level security for multi-tenant isolation
2. Encrypted connections (SSL/TLS)
3. Database encryption at rest
4. Regular security audits
5. Principle of least privilege for database users

**MongoDB:**
1. SCRAM authentication
2. Field-level encryption for sensitive data
3. Role-based access control
4. Audit logging enabled
5. Network encryption (TLS)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Production Ready