# Database Schema - Astrology & Harmonic Energy Engine

## Overview

This document defines the database schemas for the Astrology & Harmonic Energy Engine module. The system uses a hybrid database approach:
- **MongoDB** for flexible astrological data, harmonic codes, and energy patterns
- **PostgreSQL** for structured calculation history and audit trails

### MongoDB (astrological data, harmonic codes)

MongoDB stores the dynamic and complex nested structures associated with astrological calculations, birth charts, harmonic energy codes, and compatibility scores.

#### Collections

##### 1. birth_charts

Stores complete birth chart data for employees, candidates, and companies.

```javascript
{
  _id: ObjectId,
  entity_type: String, // "employee", "candidate", "company"
  entity_id: String, // Reference to User/Company ID
  organization_id: String, // Reference to Organization
  
  // Birth/Founding Data
  birth_data: {
    date: ISODate,
    time: String, // "HH:mm" format
    timezone: String, // "Asia/Kolkata"
    latitude: Number,
    longitude: Number,
    location: String // "Mumbai, India"
  },
  
  // Planetary Positions
  planets: [
    {
      name: String, // "Sun", "Moon", "Mercury", etc.
      sign: String, // "Aries", "Taurus", etc.
      degree: Number, // 0-360
      house: Number, // 1-12
      retrograde: Boolean,
      dignity: String, // "domicile", "exaltation", "detriment", "fall"
    }
  ],
  
  // Houses
  houses: [
    {
      number: Number, // 1-12
      sign: String,
      degree: Number,
      cusp: Number,
      ruler: String // Planetary ruler
    }
  ],
  
  // Aspects
  aspects: [
    {
      planet1: String,
      planet2: String,
      aspect_type: String, // "conjunction", "opposition", "trine", "square", "sextile"
      angle: Number,
      orb: Number,
      strength: String // "major", "minor"
    }
  ],
  
  // Calculated Values
  calculated_data: {
    ascendant: {
      sign: String,
      degree: Number
    },
    midheaven: {
      sign: String,
      degree: Number
    },
    moon_phase: String,
    dominant_element: String, // "Fire", "Earth", "Air", "Water"
    dominant_quality: String, // "Cardinal", "Fixed", "Mutable"
    chart_ruler: String
  },
  
  // Metadata
  calculation_version: String, // "1.0.0"
  calculated_at: ISODate,
  calculated_by: String, // Service identifier
  last_updated: ISODate,
  status: String, // "active", "archived"
  
  // Indexes
  created_at: ISODate,
  updated_at: ISODate
}

// Indexes
db.birth_charts.createIndex({ "entity_id": 1, "entity_type": 1 }, { unique: true })
db.birth_charts.createIndex({ "organization_id": 1 })
db.birth_charts.createIndex({ "status": 1 })
db.birth_charts.createIndex({ "created_at": -1 })
```

##### 2. harmonic_codes

Stores harmonic energy codes and their quarterly evolutions.

```javascript
{
  _id: ObjectId,
  entity_type: String, // "employee", "candidate", "company"
  entity_id: String,
  organization_id: String,
  birth_chart_id: ObjectId, // Reference to birth_charts
  
  // Current Harmonic Code
  current_code: {
    version: String, // "2025-Q4"
    generated_at: ISODate,
    quarter: String, // "Q1", "Q2", "Q3", "Q4"
    year: Number,
    
    // Harmonic Values
    primary_harmonic: Number, // Main frequency
    secondary_harmonics: [Number], // Supporting frequencies
    energy_signature: String, // Unique identifier
    
    // Energy Patterns
    energy_levels: {
      physical: Number, // 0-100
      emotional: Number,
      mental: Number,
      spiritual: Number,
      social: Number
    },
    
    // Dimensional Analysis
    dimensions: {
      leadership: Number,
      creativity: Number,
      analytical: Number,
      communication: Number,
      empathy: Number,
      resilience: Number,
      adaptability: Number,
      focus: Number
    },
    
    // Harmonic Resonances
    resonances: [
      {
        type: String, // "amplifying", "dampening", "neutral"
        frequency: Number,
        strength: Number, // 0-1
        effect: String
      }
    ]
  },
  
  // Historical Codes
  historical_codes: [
    {
      version: String,
      quarter: String,
      year: Number,
      generated_at: ISODate,
      energy_signature: String,
      primary_harmonic: Number,
      delta_from_previous: {
        primary_change: Number,
        energy_shifts: Object,
        dimension_changes: Object
      }
    }
  ],
  
  // Next Scheduled Update
  next_update: {
    scheduled_date: ISODate,
    quarter: String,
    year: Number,
    status: String // "pending", "in_progress", "completed"
  },
  
  // Metadata
  calculation_version: String,
  auto_update_enabled: Boolean,
  subscription_active: Boolean,
  
  created_at: ISODate,
  updated_at: ISODate
}

// Indexes
db.harmonic_codes.createIndex({ "entity_id": 1, "entity_type": 1 })
db.harmonic_codes.createIndex({ "organization_id": 1 })
db.harmonic_codes.createIndex({ "next_update.scheduled_date": 1, "next_update.status": 1 })
db.harmonic_codes.createIndex({ "current_code.quarter": 1, "current_code.year": 1 })
```

##### 3. compatibility_scores

Stores calculated compatibility scores across multiple dimensions.

```javascript
{
  _id: ObjectId,
  organization_id: String,
  
  // Entity Pairing
  subject_entity: {
    type: String, // "employee", "candidate"
    id: String,
    name: String
  },
  
  target_entity: {
    type: String, // "job_role", "department", "company", "industry", "employee"
    id: String,
    name: String
  },
  
  compatibility_type: String, // "role", "department", "company", "industry", "interpersonal"
  
  // Scores
  scores: {
    overall: Number, // 0-100
    
    // Dimensional Scores
    personality_match: Number,
    behavioral_alignment: Number,
    energy_resonance: Number,
    harmonic_compatibility: Number,
    cultural_fit: Number,
    communication_style: Number,
    work_style_match: Number,
    value_alignment: Number
  },
  
  // Detailed Analysis
  analysis: {
    strengths: [
      {
        aspect: String,
        description: String,
        score: Number
      }
    ],
    challenges: [
      {
        aspect: String,
        description: String,
        severity: String, // "low", "medium", "high"
        mitigation: String
      }
    ],
    recommendations: [String]
  },
  
  // Astrological Factors
  astrological_factors: {
    synastry_aspects: [
      {
        aspect_type: String,
        planets: [String],
        impact: String, // "positive", "negative", "neutral"
        description: String
      }
    ],
    element_balance: {
      fire: Number,
      earth: Number,
      air: Number,
      water: Number,
      compatibility_score: Number
    },
    house_overlays: [
      {
        house: Number,
        planet: String,
        interpretation: String
      }
    ]
  },
  
  // Harmonic Analysis
  harmonic_analysis: {
    frequency_match: Number, // 0-1
    energy_pattern_alignment: Number,
    resonance_type: String, // "harmonic", "dissonant", "neutral"
    optimal_interaction_times: [String] // Quarterly patterns
  },
  
  // Calculation Metadata
  calculation_metadata: {
    version: String,
    algorithm_version: String,
    calculated_at: ISODate,
    based_on_quarter: String,
    confidence_level: Number, // 0-1
    data_completeness: Number // 0-1
  },
  
  // Validity Period
  valid_from: ISODate,
  valid_until: ISODate,
  status: String, // "active", "outdated", "archived"
  
  created_at: ISODate,
  updated_at: ISODate
}

// Indexes
db.compatibility_scores.createIndex({ "subject_entity.id": 1, "target_entity.id": 1, "compatibility_type": 1 })
db.compatibility_scores.createIndex({ "organization_id": 1, "status": 1 })
db.compatibility_scores.createIndex({ "valid_until": 1 })
db.compatibility_scores.createIndex({ "scores.overall": -1 })
```

##### 4. energy_patterns

Stores analyzed energy patterns for trend analysis and predictions.

```javascript
{
  _id: ObjectId,
  entity_type: String,
  entity_id: String,
  organization_id: String,
  
  // Pattern Analysis
  pattern_type: String, // "cyclical", "trending", "stable", "volatile"
  
  // Time Series Data
  time_series: [
    {
      quarter: String,
      year: Number,
      date: ISODate,
      
      energy_snapshot: {
        physical: Number,
        emotional: Number,
        mental: Number,
        spiritual: Number,
        social: Number
      },
      
      dimensional_snapshot: Object, // Same structure as harmonic_codes.dimensions
      
      notable_events: [String],
      environmental_factors: [String]
    }
  ],
  
  // Pattern Insights
  insights: {
    dominant_trend: String,
    cycle_length: Number, // In quarters
    volatility_index: Number,
    
    peak_periods: [
      {
        quarter: String,
        year: Number,
        dimensions: [String]
      }
    ],
    
    low_periods: [
      {
        quarter: String,
        year: Number,
        dimensions: [String]
      }
    ],
    
    seasonal_patterns: [
      {
        season: String, // "Q1", "Q2", etc.
        typical_behavior: String,
        energy_characteristics: Object
      }
    ]
  },
  
  // Predictions
  predictions: {
    next_quarter: {
      forecast_date: ISODate,
      predicted_energy: Object,
      predicted_dimensions: Object,
      confidence: Number,
      key_factors: [String]
    },
    annual_outlook: String
  },
  
  analysis_date: ISODate,
  created_at: ISODate,
  updated_at: ISODate
}

// Indexes
db.energy_patterns.createIndex({ "entity_id": 1, "entity_type": 1 })
db.energy_patterns.createIndex({ "organization_id": 1 })
db.energy_patterns.createIndex({ "analysis_date": -1 })
```

##### 5. astrological_reference_data

Master reference data for astrological calculations.

```javascript
{
  _id: ObjectId,
  
  // Reference Type
  reference_type: String, // "planetary_meanings", "house_meanings", "aspect_interpretations", "sign_characteristics"
  
  // Reference Data
  data: {
    key: String, // "sun_aries", "mercury_retrograde", "10th_house"
    
    // General Information
    name: String,
    category: String,
    
    // Interpretations
    interpretations: {
      general: String,
      in_relationships: String,
      in_career: String,
      in_communication: String,
      in_leadership: String
    },
    
    // Keywords
    keywords: [String],
    
    // Energy Attributes
    energy_attributes: {
      element: String,
      quality: String,
      polarity: String,
      ruling_planet: String
    },
    
    // Behavioral Traits
    traits: {
      positive: [String],
      negative: [String],
      neutral: [String]
    },
    
    // Compatibility Factors
    compatibility: {
      harmonious_with: [String],
      challenging_with: [String],
      neutral_with: [String]
    }
  },
  
  // Version Control
  version: String,
  effective_from: ISODate,
  effective_until: ISODate,
  status: String, // "active", "deprecated"
  
  created_at: ISODate,
  updated_at: ISODate
}

// Indexes
db.astrological_reference_data.createIndex({ "reference_type": 1, "data.key": 1 }, { unique: true })
db.astrological_reference_data.createIndex({ "status": 1, "effective_from": 1 })
```

### PostgreSQL (calculation history)

PostgreSQL stores structured calculation history, audit trails, and performance metrics for compliance and optimization.

#### Tables

##### 1. calculation_jobs

Tracks all calculation jobs executed by the engine.

```sql
CREATE TABLE calculation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(50) NOT NULL, -- 'birth_chart', 'harmonic_code', 'compatibility', 'energy_pattern'
  
  -- Entity Information
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  organization_id VARCHAR(100) NOT NULL,
  
  -- Job Details
  job_status VARCHAR(20) NOT NULL, -- 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
  priority INTEGER DEFAULT 5, -- 1-10, 10 is highest
  
  -- Input Data
  input_data JSONB NOT NULL,
  calculation_params JSONB,
  
  -- Output References
  output_collection VARCHAR(50), -- MongoDB collection name
  output_document_id VARCHAR(100), -- MongoDB document _id
  
  -- Execution Details
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  execution_time_ms INTEGER,
  
  -- Error Handling
  error_code VARCHAR(50),
  error_message TEXT,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Performance Metrics
  cpu_time_ms INTEGER,
  memory_used_mb DECIMAL(10, 2),
  api_calls_made INTEGER,
  
  -- Versioning
  algorithm_version VARCHAR(20) NOT NULL,
  engine_version VARCHAR(20) NOT NULL,
  
  -- Audit
  triggered_by VARCHAR(100), -- User ID or 'system'
  trigger_reason VARCHAR(100), -- 'manual', 'quarterly_update', 'data_change'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_calculation_jobs_entity ON calculation_jobs(entity_type, entity_id);
CREATE INDEX idx_calculation_jobs_org ON calculation_jobs(organization_id);
CREATE INDEX idx_calculation_jobs_status ON calculation_jobs(job_status, created_at DESC);
CREATE INDEX idx_calculation_jobs_type ON calculation_jobs(job_type, job_status);
CREATE INDEX idx_calculation_jobs_scheduled ON calculation_jobs(job_status, started_at) WHERE job_status = 'pending';
CREATE INDEX idx_calculation_jobs_output ON calculation_jobs(output_collection, output_document_id);
```

##### 2. quarterly_update_schedule

Manages the quarterly harmonic code update schedule.

```sql
CREATE TABLE quarterly_update_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Schedule Information
  quarter VARCHAR(2) NOT NULL, -- 'Q1', 'Q2', 'Q3', 'Q4'
  year INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  
  -- Execution Window
  execution_start_time TIME NOT NULL, -- e.g., '02:00:00' for 2 AM
  execution_end_time TIME NOT NULL,
  
  -- Batch Processing
  batch_size INTEGER DEFAULT 100,
  total_entities INTEGER,
  processed_entities INTEGER DEFAULT 0,
  failed_entities INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) NOT NULL, -- 'scheduled', 'in_progress', 'completed', 'failed', 'cancelled'
  
  -- Execution Tracking
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  
  -- Error Summary
  error_summary JSONB,
  
  -- Metadata
  created_by VARCHAR(100) DEFAULT 'system',
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_quarter_year UNIQUE (quarter, year)
);

-- Indexes
CREATE INDEX idx_quarterly_schedule_date ON quarterly_update_schedule(scheduled_date, status);
CREATE INDEX idx_quarterly_schedule_status ON quarterly_update_schedule(status, year DESC, quarter DESC);
```

##### 3. entity_update_queue

Queue for tracking individual entity updates during quarterly regeneration.

```sql
CREATE TABLE entity_update_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Schedule Reference
  schedule_id UUID REFERENCES quarterly_update_schedule(id) ON DELETE CASCADE,
  
  -- Entity Information
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  organization_id VARCHAR(100) NOT NULL,
  
  -- Subscription Status
  subscription_active BOOLEAN NOT NULL,
  subscription_tier VARCHAR(50),
  
  -- Processing Status
  queue_status VARCHAR(20) NOT NULL, -- 'queued', 'processing', 'completed', 'failed', 'skipped'
  priority INTEGER DEFAULT 5,
  
  -- Job References
  birth_chart_job_id UUID REFERENCES calculation_jobs(id),
  harmonic_code_job_id UUID REFERENCES calculation_jobs(id),
  compatibility_jobs JSONB, -- Array of job IDs
  
  -- Execution Details
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Previous Values (for delta tracking)
  previous_harmonic_code VARCHAR(100),
  previous_energy_signature VARCHAR(100),
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_entity_schedule UNIQUE (schedule_id, entity_type, entity_id)
);

-- Indexes
CREATE INDEX idx_entity_queue_schedule ON entity_update_queue(schedule_id, queue_status);
CREATE INDEX idx_entity_queue_entity ON entity_update_queue(entity_type, entity_id);
CREATE INDEX idx_entity_queue_status ON entity_update_queue(queue_status, priority DESC, queued_at);
CREATE INDEX idx_entity_queue_org ON entity_update_queue(organization_id, subscription_active);
```

##### 4. calculation_audit_log

Comprehensive audit trail for all calculation activities.

```sql
CREATE TABLE calculation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Job Reference
  job_id UUID REFERENCES calculation_jobs(id) ON DELETE SET NULL,
  
  -- Audit Information
  event_type VARCHAR(50) NOT NULL, -- 'job_created', 'job_started', 'job_completed', 'job_failed', 'data_modified'
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Entity Context
  entity_type VARCHAR(50),
  entity_id VARCHAR(100),
  organization_id VARCHAR(100),
  
  -- User Context
  user_id VARCHAR(100),
  user_role VARCHAR(50),
  user_ip_address INET,
  
  -- Changes
  before_state JSONB,
  after_state JSONB,
  changes_summary TEXT,
  
  -- System Context
  service_name VARCHAR(100),
  service_version VARCHAR(20),
  server_instance VARCHAR(100),
  request_id VARCHAR(100),
  
  -- Additional Metadata
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_log_job ON calculation_audit_log(job_id);
CREATE INDEX idx_audit_log_entity ON calculation_audit_log(entity_type, entity_id, event_timestamp DESC);
CREATE INDEX idx_audit_log_org ON calculation_audit_log(organization_id, event_timestamp DESC);
CREATE INDEX idx_audit_log_event ON calculation_audit_log(event_type, event_timestamp DESC);
CREATE INDEX idx_audit_log_user ON calculation_audit_log(user_id, event_timestamp DESC);
CREATE INDEX idx_audit_log_timestamp ON calculation_audit_log(event_timestamp DESC);
```

##### 5. performance_metrics

Stores performance metrics for optimization and monitoring.

```sql
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metric Information
  metric_type VARCHAR(50) NOT NULL, -- 'calculation_time', 'api_latency', 'batch_throughput', 'error_rate'
  metric_category VARCHAR(50) NOT NULL, -- 'birth_chart', 'harmonic_code', 'compatibility', 'system'
  
  -- Time Period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  granularity VARCHAR(20) NOT NULL, -- 'minute', 'hour', 'day', 'week'
  
  -- Metric Values
  metric_value DECIMAL(12, 4) NOT NULL,
  metric_unit VARCHAR(20), -- 'ms', 'count', 'percentage', 'mb'
  
  -- Statistical Data
  min_value DECIMAL(12, 4),
  max_value DECIMAL(12, 4),
  avg_value DECIMAL(12, 4),
  median_value DECIMAL(12, 4),
  percentile_95 DECIMAL(12, 4),
  percentile_99 DECIMAL(12, 4),
  sample_count INTEGER,
  
  -- Dimensions
  organization_id VARCHAR(100),
  algorithm_version VARCHAR(20),
  
  -- Additional Context
  tags JSONB,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_metrics_type_time ON performance_metrics(metric_type, metric_category, period_start DESC);
CREATE INDEX idx_metrics_period ON performance_metrics(period_start, period_end);
CREATE INDEX idx_metrics_org ON performance_metrics(organization_id, metric_type, period_start DESC);
CREATE INDEX idx_metrics_version ON performance_metrics(algorithm_version, metric_type);
```

##### 6. algorithm_versions

Tracks algorithm versions and their deployment history.

```sql
CREATE TABLE algorithm_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Version Information
  version_number VARCHAR(20) NOT NULL UNIQUE,
  version_name VARCHAR(100),
  
  -- Algorithm Details
  algorithm_type VARCHAR(50) NOT NULL, -- 'birth_chart', 'harmonic_code', 'compatibility', 'energy_pattern'
  
  -- Changes
  changelog TEXT NOT NULL,
  breaking_changes TEXT,
  improvements TEXT,
  bug_fixes TEXT,
  
  -- Technical Details
  calculation_method TEXT,
  dependencies JSONB,
  configuration JSONB,
  
  -- Validation
  test_results JSONB,
  accuracy_metrics JSONB,
  performance_benchmarks JSONB,
  
  -- Deployment
  status VARCHAR(20) NOT NULL, -- 'development', 'testing', 'staging', 'production', 'deprecated'
  deployed_at TIMESTAMP WITH TIME ZONE,
  deprecated_at TIMESTAMP WITH TIME ZONE,
  
  -- Backward Compatibility
  compatible_with_versions TEXT[],
  migration_required BOOLEAN DEFAULT FALSE,
  migration_script TEXT,
  
  -- Audit
  created_by VARCHAR(100) NOT NULL,
  approved_by VARCHAR(100),
  approval_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_algorithm_versions_type ON algorithm_versions(algorithm_type, version_number DESC);
CREATE INDEX idx_algorithm_versions_status ON algorithm_versions(status, deployed_at DESC);
```

## Migration Strategy

### Initial Setup

#### Phase 1: MongoDB Collections (Week 1)
1. **Create MongoDB database**: `planetshr_astrology`
2. **Deploy collections** in order:
   - `astrological_reference_data` (master data first)
   - `birth_charts`
   - `harmonic_codes`
   - `compatibility_scores`
   - `energy_patterns`
3. **Seed reference data**: Import planetary meanings, house interpretations, aspect definitions
4. **Validate indexes**: Ensure all indexes are created and optimized
5. **Test data insertion**: Verify document structure and validation rules

#### Phase 2: PostgreSQL Tables (Week 2)
1. **Create PostgreSQL database**: `planetshr_calc_history`
2. **Deploy tables** in order:
   - `algorithm_versions`
   - `calculation_jobs`
   - `quarterly_update_schedule`
   - `entity_update_queue`
   - `calculation_audit_log`
   - `performance_metrics`
3. **Set up foreign key constraints**: Verify referential integrity
4. **Configure partitioning**: Set up time-based partitioning for audit logs
5. **Test relationships**: Validate cascading deletes and updates

#### Phase 3: Integration & Testing (Week 3)
1. **Cross-database integration**: Test MongoDB ↔ PostgreSQL data flow
2. **Load testing**: Verify performance under expected load
3. **Backup procedures**: Establish backup and restore processes
4. **Monitoring setup**: Configure database monitoring and alerts
5. **Documentation**: Finalize schema documentation and ERD diagrams

### Data Migration Approach

#### For Existing Data (if applicable)
1. **Assessment Phase**:
   - Audit existing data structure and quality
   - Identify data transformation requirements
   - Map old schema to new schema
   - Calculate migration duration and resource needs

2. **Migration Strategy**:
   - **Parallel Run**: Run old and new systems in parallel for validation period
   - **Incremental Migration**: Migrate data in batches by organization
   - **Validation**: Compare old vs. new calculations for consistency
   - **Rollback Plan**: Maintain old system until new system is validated

3. **Migration Scripts**:
```bash
# MongoDB Migration
mongodump --uri="mongodb://old-server/db" --out=/backup/
mongorestore --uri="mongodb://new-server/planetshr_astrology" /backup/ --transformNamespace="old.*=new.*"

# PostgreSQL Migration
pg_dump -h old-server -U user old_db > backup.sql
psql -h new-server -U user planetshr_calc_history < backup_transformed.sql
```

### Schema Versioning

#### Version Control Strategy
1. **Schema Migration Files**: Numbered migration files for each change
   - `001_initial_schema.sql`
   - `002_add_energy_patterns.sql`
   - `003_optimize_indexes.sql`

2. **Version Tracking Table**:
```sql
CREATE TABLE schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  migration_type VARCHAR(20), -- 'schema', 'data', 'index'
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  applied_by VARCHAR(100),
  execution_time_ms INTEGER,
  rollback_script TEXT
);
```

3. **Migration Tools**:
   - **MongoDB**: Custom migration scripts with version tracking
   - **PostgreSQL**: Flyway or Liquibase for versioned migrations
   - **Rollback Support**: Every migration includes rollback script

### Backup & Recovery

#### Backup Strategy
1. **MongoDB Backups**:
   - **Frequency**: Daily full backups, hourly incrementals
   - **Retention**: 30 days rolling, 12 monthly snapshots
   - **Method**: mongodump with compression
   - **Storage**: S3-compatible object storage with versioning

2. **PostgreSQL Backups**:
   - **Frequency**: Daily full backups, continuous WAL archiving
   - **Retention**: 30 days rolling, 12 monthly snapshots
   - **Method**: pg_dump + WAL archiving
   - **Point-in-time Recovery**: Enabled for last 30 days

#### Disaster Recovery
1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Recovery Procedures**:
   - Automated restore scripts tested quarterly
   - Multi-region replication for critical data
   - Documented step-by-step recovery process

### Performance Optimization

#### Indexing Strategy
1. **MongoDB**: Compound indexes optimized for common query patterns
2. **PostgreSQL**: B-tree indexes with partial indexes for filtered queries
3. **Index Monitoring**: Regular analysis of index usage and slow queries
4. **Index Maintenance**: Quarterly review and optimization

#### Partitioning Strategy
1. **PostgreSQL Tables**:
   - `calculation_audit_log`: Partitioned by month
   - `performance_metrics`: Partitioned by week
   - Automated partition creation via cron job
   - Automated partition archival after 12 months

#### Caching Strategy
1. **Redis Cache**: Cache frequently accessed reference data
2. **Application Cache**: In-memory cache for algorithm versions
3. **TTL Strategy**: 24 hours for reference data, 1 hour for calculations

### Monitoring & Maintenance

#### Health Checks
1. **Database Connectivity**: Automated health check every minute
2. **Index Health**: Weekly index fragmentation analysis
3. **Disk Space**: Automated alerts at 70% capacity
4. **Query Performance**: Slow query logging and analysis

#### Regular Maintenance Tasks
1. **Daily**: Backup verification, slow query review
2. **Weekly**: Index optimization, statistics update
3. **Monthly**: Partition maintenance, capacity planning review
4. **Quarterly**: Schema review, performance tuning, disaster recovery test

### Security Considerations

#### Access Control
1. **MongoDB**: Role-based access with principle of least privilege
2. **PostgreSQL**: Schema-level permissions with row-level security
3. **Encryption**: At-rest encryption for both databases
4. **Audit Logging**: All schema changes and admin actions logged

#### Data Privacy
1. **PII Handling**: Birth data classified as sensitive PII
2. **Retention Policy**: Automated data purging per retention rules
3. **GDPR Compliance**: Data export and deletion procedures
4. **Anonymization**: Test data generation scripts for non-production

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Complete