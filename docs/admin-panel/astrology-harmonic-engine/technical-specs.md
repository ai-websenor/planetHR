# Technical Specifications - Astrology & Harmonic Energy Engine

## Architecture Overview

This module is part of a monolithic application architecture with well-defined internal modules and layers.

The Astrology & Harmonic Energy Engine serves as the core calculation and analysis backbone of the PlanetsHR platform. Built within the NestJS monolithic architecture, it processes astrological birth charts, computes harmonic energy codes, and generates compatibility scores across multiple dimensions (job role, department, company, industry).

The module follows a three-tier layered architecture:
- **Presentation Layer**: REST API controllers exposing calculation endpoints
- **Business Logic Layer**: Core astrological algorithms, harmonic computation, and scoring engines
- **Data Access Layer**: MongoDB repositories for astrological data and PostgreSQL for calculation history

Key architectural principles:
- **Modular Design**: Three primary services (Astrology Calculation, Harmonic Energy, Compatibility Scoring) with clear separation of concerns
- **Queue-Based Processing**: Heavy calculations processed asynchronously using BullMQ
- **Caching Strategy**: Redis-based caching for frequently accessed birth charts and harmonic codes
- **Event-Driven Updates**: Quarterly harmonic code regeneration triggered by scheduled cron jobs
- **Multi-tenant Isolation**: Organization-scoped data access with role-based permissions

## Application Modules

### astrology-calculation-service

**Responsibility:**
- Calculate birth charts (natal charts) from employee/candidate birth data
- Generate planetary positions, house placements, and aspects
- Perform astrological analysis for personality traits and behavioral patterns
- Compute company astrological profiles from founding date/time
- Provide astrological interpretation for compatibility assessment
- Interface with external astrology APIs (e.g., AstroSeek, Swiss Ephemeris)

**Layer:** Business Logic Layer (with Presentation Layer endpoints)

**Dependencies:**
- `employees` module - Employee birth data retrieval
- `organizations` module - Company founding data
- `reports` module - Astrological analysis integration into reports
- External: Swiss Ephemeris library for astronomical calculations
- External: AstroSeek or similar API for advanced calculations

**Exposed APIs:**
- `POST /api/astrology/birth-chart` - Generate birth chart from birth data
- `POST /api/astrology/company-chart` - Generate company astrological profile
- `GET /api/astrology/birth-chart/:employeeId` - Retrieve cached birth chart
- `POST /api/astrology/analyze-compatibility` - Astrological compatibility analysis
- `GET /api/astrology/planetary-transits/:date` - Get planetary positions for date

### harmonic-energy-service

**Responsibility:**
- Generate harmonic energy codes from birth chart data
- Calculate quarterly harmonic code updates based on planetary transits
- Analyze energy pattern shifts and evolution over time
- Compute harmonic resonance between individuals and organizations
- Track historical harmonic code changes for trend analysis
- Trigger quarterly report regeneration when codes change

**Layer:** Business Logic Layer

**Dependencies:**
- `astrology-calculation-service` - Birth chart data as input
- `cron` module - Quarterly update scheduling
- `reports` module - Trigger report regeneration on code changes
- `employees` module - Employee data for code generation
- `queue` module (BullMQ) - Asynchronous processing of bulk updates

**Exposed APIs:**
- `POST /api/harmonic/generate-code` - Generate harmonic code from birth chart
- `POST /api/harmonic/quarterly-update` - Trigger quarterly code recalculation
- `GET /api/harmonic/code/:employeeId` - Retrieve current harmonic code
- `GET /api/harmonic/history/:employeeId` - Retrieve historical code changes
- `POST /api/harmonic/analyze-pattern` - Analyze energy pattern evolution

### compatibility-scoring-service

**Responsibility:**
- Calculate job role compatibility scores
- Compute department compatibility based on team harmonic resonance
- Analyze company compatibility using cultural and astrological alignment
- Determine industry compatibility scores
- Generate one-to-one compatibility scores for team interactions
- Provide multi-dimensional compatibility matrices for teams

**Layer:** Business Logic Layer (with Presentation Layer endpoints)

**Dependencies:**
- `astrology-calculation-service` - Astrological data for scoring
- `harmonic-energy-service` - Harmonic codes for energy matching
- `employees` module - Employee role and department data
- `organizations` module - Company and department profiles
- `reports` module - Integration of scores into reports
- AI/LLM service - Enhanced compatibility insights

**Exposed APIs:**
- `POST /api/compatibility/job-role` - Calculate job role compatibility
- `POST /api/compatibility/department` - Calculate department fit score
- `POST /api/compatibility/company` - Calculate company alignment score
- `POST /api/compatibility/industry` - Calculate industry suitability score
- `POST /api/compatibility/one-to-one` - Individual interaction compatibility
- `POST /api/compatibility/team-matrix` - Multi-person compatibility analysis


## Layered Architecture

### Presentation Layer
**Controllers & API Endpoints:**
- `AstrologyController`: Birth chart and company chart generation endpoints
- `HarmonicEnergyController`: Harmonic code management and quarterly updates
- `CompatibilityController`: Multi-dimensional compatibility scoring endpoints

**DTOs (Data Transfer Objects):**
- `BirthChartRequestDto`: Birth date, time, location validation
- `GenerateHarmonicCodeDto`: Employee ID and calculation parameters
- `CompatibilityScoreRequestDto`: Employee/role/company identifiers
- `QuarterlyUpdateDto`: Trigger parameters for bulk updates

**Validation & Guards:**
- `@UseGuards(JwtAuthGuard, RolesGuard)` - Authentication and authorization
- `@Roles(UserRole.OWNER, UserRole.LEADER, UserRole.MANAGER)` - Role-based access
- Input validation using `class-validator` decorators
- Swagger/OpenAPI documentation decorators

**Error Handling:**
- Custom exception filters for astrological calculation errors
- HTTP status code mapping (400 for invalid birth data, 503 for external API failures)
- Structured error responses with user-friendly messages

### Business Logic Layer
**Core Services:**

**AstrologyCalculationService:**
- Swiss Ephemeris integration for precise astronomical calculations
- Planetary position calculation (Sun, Moon, planets, nodes)
- House system calculation (Placidus, Whole Sign, Equal House)
- Aspect calculation (conjunctions, trines, squares, oppositions)
- Astrological interpretation algorithms for personality traits
- Company chart generation from founding date/time/location

**HarmonicEnergyService:**
- Proprietary harmonic energy code algorithm
- Quarterly transit analysis for code updates
- Energy pattern evolution tracking
- Harmonic resonance calculation between entities
- Historical trend analysis and pattern recognition
- Batch processing for organization-wide quarterly updates

**CompatibilityScoreService:**
- Multi-dimensional scoring algorithms:
  - Job Role: Skills, personality traits, astrological indicators (40% weight)
  - Department: Team dynamics, harmonic resonance, cultural fit (25% weight)
  - Company: Organizational values, energy alignment, culture match (20% weight)
  - Industry: Sector-specific traits, energy patterns, career suitability (15% weight)
- Weighted composite scoring with configurable parameters
- One-to-one compatibility matrix for interpersonal dynamics
- Team compatibility analysis using group harmonic patterns

**Queue Processors:**
- `BirthChartProcessor`: Asynchronous birth chart calculation for bulk imports
- `QuarterlyUpdateProcessor`: Scheduled harmonic code recalculation
- `CompatibilityBatchProcessor`: Bulk compatibility scoring for departments

**Utility Services:**
- `GeocodingService`: Convert location strings to latitude/longitude
- `TimezoneService`: Handle timezone conversions for birth times
- `ValidationService`: Birth data validation and normalization

### Data Access Layer
**MongoDB Repositories (Mongoose):**

**BirthChartSchema:**
- Employee reference and birth data
- Calculated planetary positions and house placements
- Astrological aspects and interpretations
- Cache timestamp and TTL
- Organization and access scope

**HarmonicCodeSchema:**
- Employee/company reference
- Current harmonic energy code
- Calculation date and effective quarter
- Historical code changes (embedded array)
- Energy pattern metadata

**CompatibilityScoreSchema:**
- Source and target identifiers (employee, role, department, company)
- Score type (job_role, department, company, industry)
- Calculated score (0-100 scale)
- Contributing factors and weights
- Calculation timestamp and validity period

**PostgreSQL Repositories (TypeORM):**

**CalculationHistory:**
- Calculation type and parameters
- Input data snapshot
- Output results
- Processing time and performance metrics
- Error logs and retry attempts
- Audit trail for compliance

**QuarterlyUpdateLog:**
- Update execution timestamp
- Affected employees count
- Success/failure statistics
- Code change summary
- Report regeneration triggers

**Caching Layer:**
- `Redis` for birth chart caching (TTL: 90 days)
- Harmonic code caching (invalidate on quarterly updates)
- Compatibility score caching (TTL: 30 days)

## API Endpoints

### Astrology Calculation Endpoints

**POST /api/astrology/birth-chart**
- **Purpose**: Generate birth chart from birth data
- **Auth**: JWT required, Roles: Owner, Leader, Manager
- **Request Body**: 
  ```json
  {
    "employeeId": "string",
    "birthDate": "YYYY-MM-DD",
    "birthTime": "HH:MM:SS",
    "birthLocation": "City, Country",
    "latitude": "number (optional)",
    "longitude": "number (optional)"
  }
  ```
- **Response**: Birth chart with planetary positions, houses, aspects
- **Processing**: Synchronous for individual, queued for bulk

**POST /api/astrology/company-chart**
- **Purpose**: Generate company astrological profile
- **Auth**: JWT required, Roles: Owner only
- **Request Body**: Company founding date, time, location
- **Response**: Company chart and energy profile

**GET /api/astrology/birth-chart/:employeeId**
- **Purpose**: Retrieve cached birth chart
- **Auth**: JWT required, role-based scope filtering
- **Response**: Cached birth chart or 404 if not found

### Harmonic Energy Endpoints

**POST /api/harmonic/generate-code**
- **Purpose**: Generate harmonic energy code
- **Auth**: JWT required, Roles: Owner, Leader, Manager
- **Request Body**: Employee ID or birth chart data
- **Response**: Harmonic energy code and metadata
- **Side Effects**: Stores code in database

**POST /api/harmonic/quarterly-update**
- **Purpose**: Trigger quarterly code recalculation
- **Auth**: System cron job or Owner manual trigger
- **Request Body**: Organization ID, effective quarter
- **Response**: Job ID for async processing
- **Side Effects**: Queues bulk update, triggers report regeneration

**GET /api/harmonic/code/:employeeId**
- **Purpose**: Retrieve current harmonic code
- **Auth**: JWT required, scope-based access
- **Response**: Current code and calculation date

**GET /api/harmonic/history/:employeeId**
- **Purpose**: Retrieve historical code changes
- **Auth**: JWT required, Owner/Leader only
- **Response**: Array of historical codes with timestamps

### Compatibility Scoring Endpoints

**POST /api/compatibility/job-role**
- **Purpose**: Calculate job role compatibility
- **Auth**: JWT required, Roles: Owner, Leader, Manager
- **Request Body**: 
  ```json
  {
    "employeeId": "string",
    "jobRoleId": "string",
    "includeDetails": "boolean"
  }
  ```
- **Response**: Compatibility score (0-100) with factor breakdown

**POST /api/compatibility/department**
- **Purpose**: Calculate department fit score
- **Request Body**: Employee ID, department ID
- **Response**: Score with team harmonic resonance analysis

**POST /api/compatibility/company**
- **Purpose**: Calculate company alignment score
- **Request Body**: Employee ID, organization ID
- **Response**: Score with cultural and energy alignment factors

**POST /api/compatibility/industry**
- **Purpose**: Calculate industry suitability
- **Request Body**: Employee ID, industry type
- **Response**: Score with sector-specific trait analysis

**POST /api/compatibility/team-matrix**
- **Purpose**: Multi-person compatibility analysis
- **Request Body**: Array of employee IDs
- **Response**: N×N compatibility matrix with pairwise scores

## Database Schemas

### MongoDB Schemas (Mongoose)

**BirthChart Collection:**
```typescript
{
  _id: ObjectId,
  employeeId: ObjectId (ref: 'Employee'),
  organizationId: ObjectId (ref: 'Organization'),
  birthData: {
    date: Date,
    time: String, // HH:MM:SS
    location: String,
    latitude: Number,
    longitude: Number,
    timezone: String
  },
  planets: [
    {
      name: String, // Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
      sign: String, // Aries, Taurus, etc.
      degree: Number, // 0-360
      house: Number, // 1-12
      retrograde: Boolean
    }
  ],
  houses: [
    {
      number: Number, // 1-12
      sign: String,
      degree: Number
    }
  ],
  aspects: [
    {
      planet1: String,
      planet2: String,
      type: String, // conjunction, trine, square, opposition, sextile
      orb: Number, // deviation from exact aspect
      applying: Boolean
    }
  ],
  interpretation: {
    sunSign: String,
    moonSign: String,
    risingSign: String,
    dominantElement: String, // Fire, Earth, Air, Water
    dominantModality: String, // Cardinal, Fixed, Mutable
    personalityTraits: [String],
    strengths: [String],
    challenges: [String]
  },
  calculatedAt: Date,
  cacheExpiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**HarmonicCode Collection:**
```typescript
{
  _id: ObjectId,
  entityType: String, // 'employee' or 'company'
  entityId: ObjectId,
  organizationId: ObjectId (ref: 'Organization'),
  currentCode: {
    value: String, // Proprietary harmonic code format
    frequency: Number,
    dominantEnergy: String,
    secondaryEnergies: [String],
    calculatedAt: Date,
    effectiveQuarter: String // Q1-2025, Q2-2025, etc.
  },
  history: [
    {
      code: String,
      frequency: Number,
      effectiveQuarter: String,
      calculatedAt: Date,
      changeReason: String // quarterly_update, manual_recalculation, correction
    }
  ],
  energyPattern: {
    evolutionTrend: String, // ascending, descending, stable, oscillating
    changeVelocity: Number, // rate of change
    harmonicResonance: Number // 0-100 stability score
  },
  nextUpdateDue: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**CompatibilityScore Collection:**
```typescript
{
  _id: ObjectId,
  scoreType: String, // job_role, department, company, industry, one_to_one
  sourceType: String, // employee, candidate
  sourceId: ObjectId,
  targetType: String, // job_role, department, company, industry, employee
  targetId: ObjectId,
  organizationId: ObjectId (ref: 'Organization'),
  score: {
    overall: Number, // 0-100
    factors: [
      {
        name: String,
        weight: Number, // percentage
        score: Number, // 0-100
        details: String
      }
    ],
    confidenceLevel: Number, // 0-100
    methodology: String // algorithm version
  },
  astrologicalFactors: {
    sunSignCompatibility: Number,
    moonSignCompatibility: Number,
    risingSignCompatibility: Number,
    venusAlignment: Number,
    marsAlignment: Number,
    aspectHarmony: Number
  },
  harmonicFactors: {
    energyResonance: Number,
    frequencyAlignment: Number,
    patternCompatibility: Number
  },
  calculatedAt: Date,
  validUntil: Date,
  metadata: {
    calculationTimeMs: Number,
    dataVersion: String,
    usedCache: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### PostgreSQL Schemas (TypeORM)

**calculation_history Table:**
```sql
CREATE TABLE calculation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_type VARCHAR(50) NOT NULL, -- birth_chart, harmonic_code, compatibility_score
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  organization_id UUID NOT NULL,
  input_parameters JSONB NOT NULL,
  output_result JSONB,
  status VARCHAR(20) NOT NULL, -- pending, success, failed, retrying
  processing_time_ms INTEGER,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  executed_by_user_id UUID,
  executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calc_history_org ON calculation_history(organization_id);
CREATE INDEX idx_calc_history_entity ON calculation_history(entity_type, entity_id);
CREATE INDEX idx_calc_history_type ON calculation_history(calculation_type);
CREATE INDEX idx_calc_history_status ON calculation_history(status);
```

**quarterly_update_log Table:**
```sql
CREATE TABLE quarterly_update_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  quarter_period VARCHAR(10) NOT NULL, -- Q1-2025, Q2-2025
  execution_started_at TIMESTAMP NOT NULL,
  execution_completed_at TIMESTAMP,
  total_employees INTEGER NOT NULL,
  successful_updates INTEGER DEFAULT 0,
  failed_updates INTEGER DEFAULT 0,
  codes_changed INTEGER DEFAULT 0,
  reports_triggered INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL, -- running, completed, failed, partial
  error_summary TEXT,
  performance_metrics JSONB, -- { avgTimePerEmployee, totalProcessingTime, etc. }
  triggered_by VARCHAR(50) NOT NULL, -- cron_job, manual_admin
  triggered_by_user_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quarterly_log_org ON quarterly_update_log(organization_id);
CREATE INDEX idx_quarterly_log_period ON quarterly_update_log(quarter_period);
CREATE INDEX idx_quarterly_log_status ON quarterly_update_log(status);
```

## Caching Strategy

### Redis Caching Architecture

**Cache Keys Pattern:**
- Birth Charts: `birth_chart:{employeeId}`
- Harmonic Codes: `harmonic_code:{entityType}:{entityId}`
- Compatibility Scores: `compat_score:{scoreType}:{sourceId}:{targetId}`
- Planetary Positions: `planetary_positions:{date}`

**TTL (Time-to-Live) Strategy:**
- **Birth Charts**: 90 days (rarely change after initial calculation)
- **Harmonic Codes**: Invalidated on quarterly updates, otherwise 90 days
- **Compatibility Scores**: 30 days (recalculate monthly for accuracy)
- **Planetary Positions**: 365 days (historical data, never changes)

**Cache Warming:**
- Pre-calculate and cache birth charts on employee creation
- Warm harmonic code cache after quarterly updates
- Generate compatibility scores for active employees on department changes

**Cache Invalidation:**
- **Manual Triggers**: 
  - Employee birth data correction → invalidate birth chart and harmonic code
  - Department reassignment → invalidate department compatibility scores
  - Company profile update → invalidate company compatibility scores
- **Automatic Triggers**:
  - Quarterly harmonic update → invalidate all harmonic codes for organization
  - Report regeneration → invalidate related compatibility scores

**Fallback Strategy:**
- On cache miss: Calculate on-demand and store in cache
- On Redis failure: Direct database query with performance logging
- Graceful degradation: Return cached data even if slightly stale during high load

**Performance Optimization:**
- Batch cache operations for bulk employee imports
- Pipelined Redis commands for multi-key operations
- Compression for large birth chart data structures
- Cache hit/miss rate monitoring with alerts (<80% hit rate threshold)

**Memory Management:**
- Max memory policy: `allkeys-lru` (evict least recently used keys)
- Estimated memory per employee: ~50KB (birth chart + harmonic code + 4 compatibility scores)
- Capacity planning: Support 10,000 employees per organization = ~500MB

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Status:** Complete