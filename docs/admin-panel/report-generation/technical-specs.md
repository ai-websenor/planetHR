# Technical Specifications - AI-Powered Report Generation

## Architecture Overview

This module is part of a monolithic application architecture with well-defined internal modules and layers.

The AI-Powered Report Generation module follows a modular monolithic architecture where each service operates as a distinct internal module with clear boundaries and responsibilities. The architecture is designed to handle complex, multi-step report generation workflows that combine astrological calculations, harmonic energy analysis, and LLM-powered AI insights.

**Key Architectural Principles:**
- **Separation of Concerns**: Each service has a single, well-defined responsibility
- **Internal Module Communication**: Services communicate through NestJS dependency injection
- **Queue-Based Processing**: Heavy AI and calculation operations use BullMQ queues
- **Event-Driven Updates**: WebSocket notifications for real-time progress tracking
- **Data Consistency**: MongoDB transactions for multi-document operations
- **Caching Layer**: Redis-based caching for frequently accessed astrological and harmonic data

**Data Flow Architecture:**
```
Employee Input → Validation → Astrology Service → Harmonic Energy Service →
AI Analysis Service → LLM Integration Service → Report Generation Service →
Report Compilation & Storage → Role-Based Access Control → User Dashboard
```

**Scalability Considerations:**
- Queue-based processing allows horizontal scaling of worker processes
- MongoDB sharding support for multi-tenant data isolation
- Redis clustering for distributed caching
- Modular structure enables future microservices migration if needed

## Application Modules

### report-generation-service

**Responsibility:**
Orchestrates the end-to-end report generation pipeline, managing the creation, compilation, storage, and retrieval of all 8 report types. Acts as the primary coordinator between all other services and handles report versioning, quarterly regeneration scheduling, and role-based access control.

**Layer:** Business Logic Layer (with Presentation Layer endpoints)

**Dependencies:**
- `ai-analysis-service` - For personality and behavioral analysis
- `astrology-service` - For astrological calculations and birth chart data
- `harmonic-energy-service` - For energy code calculations
- `llm-integration-service` - For AI-powered insights and natural language generation
- `users-service` - For role-based access validation
- `organizations-service` - For company and department data
- `employees-service` - For employee and candidate information
- `cron-service` - For quarterly regeneration scheduling

**Exposed APIs:**
- `generateEmployeeReports(employeeId: string): Promise<ReportGenerationJob>` - Initiates full report generation for an employee
- `getReportsByEmployee(employeeId: string, userId: string): Promise<Report[]>` - Retrieves all reports with access control
- `getReportById(reportId: string, userId: string): Promise<Report>` - Fetches specific report with validation
- `regenerateReports(employeeIds: string[]): Promise<void>` - Triggers quarterly batch regeneration
- `getReportGenerationStatus(jobId: string): Promise<JobStatus>` - Checks progress of report generation
- `exportReportPDF(reportId: string, userId: string): Promise<Buffer>` - Generates PDF export of report

**Internal Methods:**
- `compilePersonalityReport(analysisData: AnalysisData): Promise<Report>`
- `compileBehavioralReport(analysisData: AnalysisData): Promise<Report>`
- `compileCompatibilityReports(compatibilityData: CompatibilityData): Promise<Report[]>`
- `compileQnAReport(questionData: QuestionData): Promise<Report>`
- `compileTrainingReport(trainingData: TrainingData): Promise<Report>`
- `validateReportAccess(reportId: string, userId: string): Promise<boolean>`

### ai-analysis-service

**Responsibility:**
Processes employee data to generate personality assessments, behavioral analysis, compatibility scores, and training recommendations. Combines astrological insights, harmonic energy patterns, and structured data analysis to produce input for LLM processing.

**Layer:** Business Logic Layer

**Dependencies:**
- `astrology-service` - For astrological interpretation data
- `harmonic-energy-service` - For energy pattern analysis
- `employees-service` - For employee profile data
- `organizations-service` - For company culture and industry context

**Exposed APIs:**
- `analyzePersonality(employeeId: string, roleContext: RoleContext): Promise<PersonalityAnalysis>` - Generates role-specific personality assessment
- `analyzeBehavior(employeeId: string, companyContext: CompanyContext): Promise<BehavioralAnalysis>` - Produces company-specific behavioral analysis
- `calculateJobRoleCompatibility(employeeId: string, roleId: string): Promise<CompatibilityScore>` - Computes job role alignment
- `calculateDepartmentCompatibility(employeeId: string, departmentId: string): Promise<CompatibilityScore>` - Assesses department fit
- `calculateCompanyCompatibility(employeeId: string, organizationId: string): Promise<CompatibilityScore>` - Evaluates company alignment
- `calculateIndustryCompatibility(employeeId: string, industry: string): Promise<CompatibilityScore>` - Determines industry suitability
- `generateTrainingRecommendations(employeeId: string, performanceData: PerformanceData): Promise<TrainingRecommendation[]>` - Creates personalized training plan
- `generateEmployeeQuestions(employeeId: string, context: QuestionContext): Promise<Question[]>` - Produces AI-powered questionnaire

**Internal Methods:**
- `combineAstrologicalAndHarmonicInsights(astroData: AstroData, harmonicData: HarmonicData): Promise<CombinedInsights>`
- `mapPersonalityTraits(insights: CombinedInsights, roleRequirements: RoleRequirements): Promise<PersonalityMapping>`
- `assessCompatibilityFactors(employeeProfile: EmployeeProfile, targetContext: TargetContext): Promise<CompatibilityFactors>`

### astrology-service

**Responsibility:**
Performs comprehensive astrological calculations including birth chart generation, planetary positions, house placements, aspects, and astrological interpretations. Provides the foundational astrological data required for personality and compatibility analysis.

**Layer:** Business Logic Layer (with external API integration)

**Dependencies:**
- `external-astrology-api` - Third-party astrology calculation service (e.g., AstroAPI)
- `cache-service` - Redis caching for calculated birth charts

**Exposed APIs:**
- `calculateBirthChart(birthData: BirthData): Promise<BirthChart>` - Generates complete natal chart
- `getPlanetaryPositions(birthData: BirthData): Promise<PlanetaryPositions>` - Calculates planet positions at birth
- `getHousePlacements(birthChart: BirthChart): Promise<HousePlacements>` - Determines house placements
- `calculateAspects(birthChart: BirthChart): Promise<Aspect[]>` - Computes planetary aspects
- `interpretBirthChart(birthChart: BirthChart): Promise<AstrologicalInterpretation>` - Provides astrological interpretation
- `compareBirthCharts(chart1: BirthChart, chart2: BirthChart): Promise<SynastrySummary>` - Analyzes compatibility between two charts
- `calculateTransits(birthChart: BirthChart, targetDate: Date): Promise<Transit[]>` - Determines current planetary transits

**Internal Methods:**
- `validateBirthData(birthData: BirthData): ValidationResult`
- `normalizePlanetaryData(rawData: ExternalAstroData): PlanetaryPositions`
- `cacheChart(chartId: string, chartData: BirthChart, ttl: number): Promise<void>`
- `retrieveCachedChart(chartId: string): Promise<BirthChart | null>`

### harmonic-energy-service

**Responsibility:**
Calculates proprietary harmonic energy codes based on astrological data, birth information, and temporal cycles. Manages quarterly harmonic code updates and tracks energy pattern evolution over time for dynamic report regeneration.

**Layer:** Business Logic Layer

**Dependencies:**
- `astrology-service` - For base astrological calculations
- `employees-service` - For employee birth data
- `cron-service` - For quarterly recalculation scheduling

**Exposed APIs:**
- `calculateHarmonicCode(birthData: BirthData, calculationDate: Date): Promise<HarmonicCode>` - Generates harmonic energy code for specific date
- `getCurrentHarmonicCode(employeeId: string): Promise<HarmonicCode>` - Retrieves current active harmonic code
- `getHistoricalHarmonicCodes(employeeId: string, startDate: Date, endDate: Date): Promise<HarmonicCode[]>` - Fetches historical energy patterns
- `detectHarmonicCodeChange(employeeId: string): Promise<boolean>` - Checks if quarterly update resulted in code change
- `batchRecalculateHarmonicCodes(employeeIds: string[]): Promise<BatchCalculationResult>` - Performs bulk quarterly recalculation
- `analyzeHarmonicCompatibility(code1: HarmonicCode, code2: HarmonicCode): Promise<HarmonicCompatibilityScore>` - Compares two harmonic codes
- `generateEnergyPattern(harmonicCode: HarmonicCode): Promise<EnergyPattern>` - Creates visual energy pattern representation

**Internal Methods:**
- `applyHarmonicFormula(planetaryData: PlanetaryData, temporalFactors: TemporalFactors): HarmonicCode`
- `calculateQuarterlyShift(currentCode: HarmonicCode, newCode: HarmonicCode): ShiftAnalysis`
- `storeHistoricalCode(employeeId: string, code: HarmonicCode, quarter: Quarter): Promise<void>`
- `validateCodeIntegrity(harmonicCode: HarmonicCode): boolean`

### llm-integration-service

**Responsibility:**
Manages all interactions with Large Language Model APIs (OpenAI GPT-4/GPT-5) for natural language generation, report narrative creation, AI chat functionality, and intelligent question generation. Handles prompt engineering, token management, and response formatting.

**Layer:** Business Logic Layer (with external API integration)

**Dependencies:**
- `openai-api` - External OpenAI API integration
- `mastra-ai-api` - Mastra.ai agent orchestration platform
- `cache-service` - Response caching for similar queries

**Exposed APIs:**
- `generatePersonalityNarrative(analysisData: PersonalityAnalysis): Promise<string>` - Creates human-readable personality report
- `generateBehavioralNarrative(analysisData: BehavioralAnalysis): Promise<string>` - Produces behavioral analysis narrative
- `generateCompatibilityExplanation(compatibilityScore: CompatibilityScore, context: CompatibilityContext): Promise<string>` - Explains compatibility findings
- `generateTrainingPlan(recommendations: TrainingRecommendation[]): Promise<string>` - Creates comprehensive training plan narrative
- `generateEmployeeQuestions(employeeProfile: EmployeeProfile, context: QuestionContext): Promise<Question[]>` - AI-generated questionnaire
- `handleChatQuery(query: string, employeeContext: EmployeeContext, userRole: UserRole): Promise<ChatResponse>` - Processes real-time AI chat queries
- `generateInsightSummary(reportData: ReportData): Promise<string>` - Creates executive summary of findings
- `explainCompatibilityFactors(factors: CompatibilityFactors): Promise<string>` - Detailed explanation of compatibility elements

**Internal Methods:**
- `buildPrompt(templateType: PromptTemplate, data: any): string`
- `callOpenAI(prompt: string, options: LLMOptions): Promise<LLMResponse>`
- `callMastraAgent(agentType: AgentType, input: AgentInput): Promise<AgentResponse>`
- `parseAndFormatResponse(rawResponse: string): FormattedResponse`
- `trackTokenUsage(requestId: string, tokensUsed: number): void`
- `implementRetryLogic(apiCall: () => Promise<any>, maxRetries: number): Promise<any>`
- `validateResponseQuality(response: string, expectedCriteria: QualityCriteria): ValidationResult`


## Layered Architecture

### Presentation Layer

**Components:**
- **REST API Controllers**: Handle HTTP requests for report generation, retrieval, and management
- **WebSocket Gateway**: Real-time report generation progress notifications
- **GraphQL Resolvers** (optional): Alternative query interface for complex report data retrieval
- **Swagger/OpenAPI Documentation**: Auto-generated API documentation

**Controllers:**
- `ReportController` - Main report generation and retrieval endpoints
  - `POST /api/reports/generate/:employeeId` - Trigger report generation
  - `GET /api/reports/employee/:employeeId` - Fetch all employee reports
  - `GET /api/reports/:reportId` - Retrieve specific report
  - `GET /api/reports/:reportId/export` - Export report as PDF
  - `GET /api/reports/status/:jobId` - Check generation progress

**WebSocket Events:**
- `report.generation.started` - Emitted when report generation begins
- `report.generation.progress` - Progress updates (astrology calculated, AI analysis complete, etc.)
- `report.completed` - Final report ready notification
- `report.error` - Error during generation

**Authentication & Authorization:**
- JWT-based authentication using `JwtAuthGuard`
- Role-based access control using `RolesGuard`
- Report access validation based on user hierarchy (Owner → Leader → Manager)
- Organization-scoped data isolation

**Request/Response Handling:**
- DTO validation using `class-validator`
- Data transformation using `class-transformer`
- Exception filters for consistent error responses
- Rate limiting on report generation endpoints

### Business Logic Layer

**Core Services:**
- `ReportGenerationService` - Orchestration of report generation workflow
- `AIAnalysisService` - Personality, behavior, and compatibility analysis
- `AstrologyService` - Astrological calculations and interpretations
- `HarmonicEnergyService` - Harmonic code calculations and tracking
- `LLMIntegrationService` - AI/LLM interactions and narrative generation

**Business Rules & Workflows:**

1. **Report Generation Workflow:**
   - Validate employee data completeness
   - Queue report generation job in BullMQ
   - Calculate birth chart (Astrology Service)
   - Calculate harmonic energy code (Harmonic Energy Service)
   - Perform AI analysis (AI Analysis Service)
   - Generate narratives (LLM Integration Service)
   - Compile 8 report types (Report Generation Service)
   - Store compiled reports in MongoDB
   - Emit completion notification via WebSocket

2. **Compatibility Calculation Logic:**
   - Extract employee astrological profile
   - Retrieve target context (role/department/company/industry)
   - Calculate multi-dimensional compatibility factors
   - Apply weighted scoring algorithm
   - Generate compatibility explanation via LLM

3. **Quarterly Regeneration Logic:**
   - Cron job triggers quarterly (scheduled via `CronService`)
   - Recalculate harmonic codes for all active employees
   - Detect code changes requiring report regeneration
   - Queue batch regeneration jobs
   - Update report versions with change tracking

4. **Training Recommendation Logic:**
   - Analyze skill gaps from role requirements vs. employee profile
   - Identify behavioral improvement areas
   - Generate personalized training suggestions via LLM
   - Prioritize recommendations based on impact and feasibility

**Queue Management:**
- `report-generation-queue` - Main report generation jobs
- `harmonic-recalculation-queue` - Quarterly harmonic code updates
- `llm-processing-queue` - AI narrative generation (rate-limited)
- `report-export-queue` - PDF generation for exports

**Domain Models:**
- `Report` - Compiled report entity with versioning
- `PersonalityAnalysis` - Role-specific personality assessment
- `BehavioralAnalysis` - Company-specific behavior analysis
- `CompatibilityScore` - Multi-dimensional compatibility metrics
- `HarmonicCode` - Energy pattern representation
- `BirthChart` - Astrological chart data
- `TrainingRecommendation` - Development suggestions

### Data Access Layer

**Database Repositories:**
- `ReportRepository` - MongoDB repository for report documents
- `AnalysisRepository` - Storage for intermediate analysis data
- `HarmonicCodeRepository` - Historical harmonic code tracking
- `BirthChartRepository` - Cached astrological calculations

**MongoDB Collections:**
- `reports` - Compiled report documents (all 8 types)
  - Indexed by: `employeeId`, `reportType`, `generatedAt`, `organizationId`
- `personality_analyses` - Raw personality analysis data
- `behavioral_analyses` - Raw behavioral analysis data
- `compatibility_scores` - Multi-dimensional compatibility calculations
- `harmonic_codes` - Historical energy code records
  - Indexed by: `employeeId`, `calculationDate`, `quarter`
- `birth_charts` - Cached astrological chart data
  - TTL index for automatic cleanup after 1 year
- `training_recommendations` - Personalized development plans
- `employee_questions` - Generated Q&A data

**PostgreSQL Tables (Metadata & Versioning):**
- `report_versions` - Report versioning and change tracking
  - Columns: `id`, `report_id`, `version_number`, `change_summary`, `created_at`
- `report_generation_logs` - Audit trail of generation events
  - Columns: `id`, `employee_id`, `job_id`, `status`, `started_at`, `completed_at`, `error_details`

**Data Access Patterns:**
- Repository pattern for database abstraction
- Mongoose ODM for MongoDB operations
- TypeORM for PostgreSQL operations
- Transaction support for multi-document consistency
- Soft deletes for audit compliance
- Aggregation pipelines for complex reporting queries

**Caching Strategy Integration:**
- Redis caching for frequently accessed birth charts (TTL: 30 days)
- Harmonic code caching (TTL: until next quarterly update)
- Report metadata caching (TTL: 1 hour)
- LLM response caching for identical prompts (TTL: 7 days)

**Data Migration & Seeding:**
- Database migration scripts for schema updates
- Seed data for development/testing environments
- Backup strategy for report data retention

## API Endpoints

### Report Generation Endpoints

#### POST `/api/reports/generate/:employeeId`
**Description:** Initiates comprehensive report generation for a specific employee.  
**Authentication:** Required (JWT)  
**Authorization:** Owner, Leader, Manager (with scope validation)

**Request:**
```typescript
// Path Parameters
employeeId: string

// Request Body (optional - for regeneration options)
{
  "forceRegenerate": boolean,  // Force regeneration even if recent reports exist
  "reportTypes": string[]      // Specific report types to generate (defaults to all 8)
}
```

**Response (202 Accepted):**
```json
{
  "status": "accepted",
  "jobId": "uuid-v4",
  "message": "Report generation initiated",
  "estimatedCompletionTime": "2025-11-11T10:45:00Z",
  "websocketChannel": "reports:uuid-v4"
}
```

#### GET `/api/reports/employee/:employeeId`
**Description:** Retrieves all reports for a specific employee with role-based filtering.  
**Authentication:** Required (JWT)  
**Authorization:** Owner, Leader, Manager (with scope validation)

**Request:**
```typescript
// Path Parameters
employeeId: string

// Query Parameters
reportType?: string         // Filter by specific report type
version?: number           // Retrieve specific version (defaults to latest)
includeHistorical?: boolean // Include previous versions
```

**Response (200 OK):**
```json
{
  "employeeId": "emp-uuid",
  "employeeName": "John Doe",
  "reports": [
    {
      "reportId": "report-uuid",
      "reportType": "PERSONALITY_ROLE_SPECIFIC",
      "version": 2,
      "generatedAt": "2025-11-10T14:30:00Z",
      "summary": "Role-specific personality analysis",
      "status": "completed",
      "downloadUrl": "/api/reports/report-uuid/download"
    }
    // ... 7 more reports
  ],
  "lastUpdated": "2025-11-10T14:35:00Z"
}
```

#### GET `/api/reports/:reportId`
**Description:** Retrieves detailed content of a specific report.  
**Authentication:** Required (JWT)  
**Authorization:** Role-based with access validation

**Response (200 OK):**
```json
{
  "reportId": "report-uuid",
  "reportType": "PERSONALITY_ROLE_SPECIFIC",
  "employeeId": "emp-uuid",
  "employeeName": "John Doe",
  "version": 2,
  "generatedAt": "2025-11-10T14:30:00Z",
  "content": {
    "executiveSummary": "...",
    "detailedAnalysis": {
      "personalityTraits": [...],
      "strengths": [...],
      "developmentAreas": [...],
      "roleAlignment": {...}
    },
    "recommendations": [...],
    "astrologicalBasis": {...},
    "harmonicEnergyPattern": {...}
  },
  "metadata": {
    "aiModelUsed": "gpt-4-turbo",
    "astrologicalSystem": "Western Tropical",
    "harmonicCodeVersion": "Q4-2025"
  }
}
```

#### GET `/api/reports/:reportId/export`
**Description:** Exports report as PDF document.  
**Authentication:** Required (JWT)  
**Authorization:** Role-based with access validation

**Response (200 OK):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="report-personality-john-doe-20251110.pdf"

[Binary PDF data]
```

#### GET `/api/reports/status/:jobId`
**Description:** Checks the status of a report generation job.  
**Authentication:** Required (JWT)

**Response (200 OK):**
```json
{
  "jobId": "uuid-v4",
  "status": "processing",
  "progress": {
    "currentStep": "AI_ANALYSIS",
    "completedSteps": ["VALIDATION", "ASTROLOGY_CALCULATION", "HARMONIC_CALCULATION"],
    "totalSteps": 7,
    "percentComplete": 57
  },
  "estimatedTimeRemaining": "00:02:30",
  "startedAt": "2025-11-11T10:30:00Z"
}
```

### Compatibility Analysis Endpoints

#### POST `/api/reports/compatibility/calculate`
**Description:** Calculates compatibility between employee and target context.  
**Authentication:** Required (JWT)  
**Authorization:** Owner, Leader, Manager

**Request:**
```json
{
  "employeeId": "emp-uuid",
  "compatibilityType": "JOB_ROLE | DEPARTMENT | COMPANY | INDUSTRY",
  "targetId": "target-uuid",  // Role ID, Department ID, or Organization ID
  "targetIndustry": "Technology"  // Required if compatibilityType is INDUSTRY
}
```

**Response (200 OK):**
```json
{
  "compatibilityScore": 87.5,
  "scoreBreakdown": {
    "personalityAlignment": 90,
    "behavioralFit": 85,
    "astrologicalCompatibility": 88,
    "harmonicEnergyAlignment": 87
  },
  "explanation": "Strong compatibility with high alignment across all dimensions...",
  "strengths": ["Communication style", "Work ethic", "Cultural values"],
  "potentialChallenges": ["Stress management approach"],
  "recommendations": ["Regular check-ins", "Mentorship opportunities"]
}
```

### Batch Operations Endpoints

#### POST `/api/reports/batch/regenerate`
**Description:** Triggers batch regeneration for quarterly updates.  
**Authentication:** Required (JWT)  
**Authorization:** Owner only (typically system/cron triggered)

**Request:**
```json
{
  "employeeIds": ["emp-uuid-1", "emp-uuid-2"],
  "reason": "QUARTERLY_HARMONIC_UPDATE | MANUAL_REFRESH",
  "priority": "HIGH | NORMAL | LOW"
}
```

**Response (202 Accepted):**
```json
{
  "batchJobId": "batch-uuid",
  "employeeCount": 150,
  "estimatedCompletionTime": "2025-11-11T16:00:00Z",
  "queuedJobs": ["job-uuid-1", "job-uuid-2", "..."]
}
```

### Training Recommendations Endpoint

#### GET `/api/reports/training/:employeeId`
**Description:** Retrieves personalized training recommendations.  
**Authentication:** Required (JWT)  
**Authorization:** Owner, Leader, Manager

**Response (200 OK):**
```json
{
  "employeeId": "emp-uuid",
  "generatedAt": "2025-11-10T14:30:00Z",
  "recommendations": [
    {
      "area": "Leadership Skills",
      "priority": "HIGH",
      "rationale": "Analysis indicates strong potential for team leadership...",
      "suggestedPrograms": ["Advanced Leadership Workshop", "Executive Coaching"],
      "estimatedDuration": "3 months",
      "expectedImpact": "Significant improvement in team management capabilities"
    }
  ],
  "skillGaps": [...],
  "developmentPlan": {...}
}
```

## Database Schemas

### MongoDB Schemas

#### Report Schema
```typescript
{
  _id: ObjectId,
  reportId: string,              // UUID
  employeeId: string,            // Reference to Employee
  organizationId: string,        // For multi-tenant isolation
  departmentId: string,
  reportType: enum [
    'PERSONALITY_ROLE_SPECIFIC',
    'BEHAVIORAL_COMPANY_SPECIFIC',
    'COMPATIBILITY_JOB_ROLE',
    'COMPATIBILITY_DEPARTMENT',
    'COMPATIBILITY_COMPANY',
    'COMPATIBILITY_INDUSTRY',
    'QNA_EMPLOYEE_QUESTIONNAIRE',
    'TRAINING_DEVELOPMENT'
  ],
  version: number,               // Incremental version number
  status: enum ['GENERATING', 'COMPLETED', 'FAILED'],
  
  content: {
    executiveSummary: string,
    detailedAnalysis: Object,    // Report-type specific structure
    recommendations: Array<Object>,
    astrologicalBasis: Object,
    harmonicEnergyPattern: Object,
    llmGeneratedNarrative: string
  },
  
  sourceData: {
    birthChartId: string,
    harmonicCodeId: string,
    aiAnalysisId: string
  },
  
  metadata: {
    aiModelUsed: string,
    astrologicalSystem: string,
    harmonicCodeVersion: string,
    generationDuration: number,   // milliseconds
    tokensUsed: number
  },
  
  accessControl: {
    visibleToRoles: Array<string>,  // ['OWNER', 'LEADER', 'MANAGER']
    departmentRestriction: string,
    branchRestriction: string
  },
  
  generatedAt: Date,
  lastModified: Date,
  expiresAt: Date,               // Optional TTL for old versions
  isDeleted: boolean,
  deletedAt: Date
}

// Indexes
Index: { employeeId: 1, reportType: 1, version: -1 }
Index: { organizationId: 1, generatedAt: -1 }
Index: { status: 1, generatedAt: -1 }
Index: { reportId: 1 } (unique)
```

#### Birth Chart Schema
```typescript
{
  _id: ObjectId,
  chartId: string,               // UUID
  employeeId: string,
  
  birthData: {
    dateOfBirth: Date,
    timeOfBirth: string,         // HH:MM:SS
    placeOfBirth: {
      city: string,
      country: string,
      latitude: number,
      longitude: number,
      timezone: string
    }
  },
  
  calculatedData: {
    sunSign: string,
    moonSign: string,
    ascendant: string,
    planetaryPositions: Array<{
      planet: string,
      sign: string,
      degree: number,
      house: number,
      retrograde: boolean
    }>,
    housePlacements: Array<{
      house: number,
      sign: string,
      degree: number
    }>,
    aspects: Array<{
      planet1: string,
      planet2: string,
      aspectType: string,        // Conjunction, Trine, Square, etc.
      orb: number
    }>
  },
  
  interpretation: {
    personality: string,
    strengths: Array<string>,
    challenges: Array<string>,
    careerIndications: string,
    relationshipStyle: string
  },
  
  calculatedAt: Date,
  externalAPIUsed: string,       // Source of calculation
  cacheUntil: Date,              // TTL for caching
  isDeleted: boolean
}

// Indexes
Index: { employeeId: 1 } (unique)
Index: { chartId: 1 } (unique)
Index: { cacheUntil: 1 } (TTL index)
```

#### Harmonic Code Schema
```typescript
{
  _id: ObjectId,
  codeId: string,                // UUID
  employeeId: string,
  
  calculationDate: Date,
  quarter: string,               // "Q1-2025", "Q2-2025", etc.
  
  harmonicCode: {
    primaryCode: string,         // Proprietary code format
    secondaryCode: string,
    energyPattern: Array<number>, // Numerical representation
    dominantFrequencies: Array<string>,
    energyLevel: number          // 0-100 scale
  },
  
  derivedFrom: {
    birthChartId: string,
    planetaryInfluences: Object,
    temporalFactors: Object
  },
  
  changeAnalysis: {
    previousCodeId: string,
    codeChanged: boolean,
    changeSignificance: enum ['MINOR', 'MODERATE', 'MAJOR'],
    changedElements: Array<string>
  },
  
  compatibilityMatrix: Object,   // Pre-calculated compatibility with company/roles
  
  calculatedAt: Date,
  validUntil: Date,              // End of quarter
  isActive: boolean,
  isDeleted: boolean
}

// Indexes
Index: { employeeId: 1, calculationDate: -1 }
Index: { employeeId: 1, isActive: 1 }
Index: { quarter: 1 }
Index: { validUntil: 1 }
```

#### AI Analysis Schema
```typescript
{
  _id: ObjectId,
  analysisId: string,            // UUID
  employeeId: string,
  analysisType: enum [
    'PERSONALITY',
    'BEHAVIORAL',
    'COMPATIBILITY',
    'TRAINING'
  ],
  
  inputData: {
    birthChartData: Object,
    harmonicCodeData: Object,
    employeeProfile: Object,
    contextData: Object          // Role, department, company context
  },
  
  analysisResults: {
    personalityTraits: Array<{
      trait: string,
      score: number,             // 0-100
      explanation: string
    }>,
    behavioralPatterns: Array<Object>,
    compatibilityFactors: Object,
    skillGaps: Array<Object>,
    strengths: Array<string>,
    developmentAreas: Array<string>
  },
  
  llmProcessing: {
    promptUsed: string,
    modelVersion: string,
    tokensUsed: number,
    responseQuality: number      // Internal quality score
  },
  
  analyzedAt: Date,
  version: number,
  isDeleted: boolean
}

// Indexes
Index: { employeeId: 1, analysisType: 1, version: -1 }
Index: { analysisId: 1 } (unique)
Index: { analyzedAt: -1 }
```

#### Training Recommendation Schema
```typescript
{
  _id: ObjectId,
  recommendationId: string,      // UUID
  employeeId: string,
  
  recommendations: Array<{
    area: string,
    priority: enum ['HIGH', 'MEDIUM', 'LOW'],
    rationale: string,
    suggestedPrograms: Array<string>,
    estimatedDuration: string,
    expectedImpact: string,
    prerequisites: Array<string>,
    resources: Array<{
      type: string,              // Course, Workshop, Coaching, etc.
      title: string,
      provider: string,
      url: string
    }>
  }>,
  
  skillGaps: Array<{
    skill: string,
    currentLevel: number,        // 0-10 scale
    requiredLevel: number,
    gap: number,
    importanceForRole: number
  }>,
  
  developmentPlan: {
    shortTerm: Array<Object>,    // 0-3 months
    mediumTerm: Array<Object>,   // 3-12 months
    longTerm: Array<Object>,     // 1+ years
    estimatedCost: number,
    estimatedTimeInvestment: string
  },
  
  generatedAt: Date,
  validUntil: Date,
  implementationStatus: enum ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
  isDeleted: boolean
}

// Indexes
Index: { employeeId: 1, generatedAt: -1 }
Index: { recommendationId: 1 } (unique)
```

### PostgreSQL Schemas

#### report_versions Table
```sql
CREATE TABLE report_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id VARCHAR(255) NOT NULL,
  employee_id VARCHAR(255) NOT NULL,
  version_number INTEGER NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  
  change_summary TEXT,
  change_type VARCHAR(50),        -- 'QUARTERLY_UPDATE', 'MANUAL_REGENERATION', 'CORRECTION'
  
  harmonic_code_changed BOOLEAN DEFAULT FALSE,
  astrological_data_updated BOOLEAN DEFAULT FALSE,
  ai_model_upgraded BOOLEAN DEFAULT FALSE,
  
  previous_version_id UUID REFERENCES report_versions(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  
  UNIQUE(report_id, version_number)
);

CREATE INDEX idx_report_versions_report_id ON report_versions(report_id);
CREATE INDEX idx_report_versions_employee_id ON report_versions(employee_id);
CREATE INDEX idx_report_versions_created_at ON report_versions(created_at DESC);
```

#### report_generation_logs Table
```sql
CREATE TABLE report_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(255) UNIQUE NOT NULL,
  employee_id VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255) NOT NULL,
  
  status VARCHAR(50) NOT NULL,    -- 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'
  report_types JSON,              -- Array of report types being generated
  
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  
  steps_completed JSON,           -- Array of completed processing steps
  current_step VARCHAR(100),
  
  error_details TEXT,
  retry_count INTEGER DEFAULT 0,
  
  triggered_by VARCHAR(50),       -- 'USER', 'CRON', 'SYSTEM'
  triggered_by_user_id VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_generation_logs_job_id ON report_generation_logs(job_id);
CREATE INDEX idx_generation_logs_employee_id ON report_generation_logs(employee_id);
CREATE INDEX idx_generation_logs_status ON report_generation_logs(status);
CREATE INDEX idx_generation_logs_created_at ON report_generation_logs(created_at DESC);
```

## Caching Strategy

### Redis Caching Implementation

#### Birth Chart Caching
- **Cache Key Pattern:** `birth_chart:{employeeId}`
- **TTL:** 30 days (2,592,000 seconds)
- **Invalidation:** Manual regeneration request or employee birth data update
- **Rationale:** Birth charts are computationally expensive to calculate and rarely change

```typescript
// Cache Implementation
async getCachedBirthChart(employeeId: string): Promise<BirthChart | null> {
  const cacheKey = `birth_chart:${employeeId}`;
  const cachedData = await this.redisClient.get(cacheKey);
  
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  return null;
}

async cacheBirthChart(employeeId: string, chartData: BirthChart): Promise<void> {
  const cacheKey = `birth_chart:${employeeId}`;
  const ttl = 30 * 24 * 60 * 60; // 30 days
  await this.redisClient.setex(cacheKey, ttl, JSON.stringify(chartData));
}
```

#### Harmonic Code Caching
- **Cache Key Pattern:** `harmonic_code:{employeeId}:current`
- **TTL:** Until end of current quarter (dynamic calculation)
- **Invalidation:** Quarterly recalculation or manual update
- **Rationale:** Harmonic codes are valid for entire quarter and frequently accessed during report generation

```typescript
async getCachedHarmonicCode(employeeId: string): Promise<HarmonicCode | null> {
  const cacheKey = `harmonic_code:${employeeId}:current`;
  const cachedData = await this.redisClient.get(cacheKey);
  
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  return null;
}

async cacheHarmonicCode(employeeId: string, codeData: HarmonicCode): Promise<void> {
  const cacheKey = `harmonic_code:${employeeId}:current`;
  const quarterEnd = this.calculateQuarterEnd();
  const ttl = Math.floor((quarterEnd.getTime() - Date.now()) / 1000);
  await this.redisClient.setex(cacheKey, ttl, JSON.stringify(codeData));
}
```

#### LLM Response Caching
- **Cache Key Pattern:** `llm_response:{promptHash}`
- **TTL:** 7 days (604,800 seconds)
- **Invalidation:** TTL expiration or AI model upgrade
- **Rationale:** Identical prompts with same context produce same results; reduces API costs and latency

```typescript
async getCachedLLMResponse(prompt: string): Promise<string | null> {
  const promptHash = this.hashPrompt(prompt);
  const cacheKey = `llm_response:${promptHash}`;
  return await this.redisClient.get(cacheKey);
}

async cacheLLMResponse(prompt: string, response: string): Promise<void> {
  const promptHash = this.hashPrompt(prompt);
  const cacheKey = `llm_response:${promptHash}`;
  const ttl = 7 * 24 * 60 * 60; // 7 days
  await this.redisClient.setex(cacheKey, ttl, response);
}
```

#### Report Metadata Caching
- **Cache Key Pattern:** `report_metadata:{employeeId}:list`
- **TTL:** 1 hour (3,600 seconds)
- **Invalidation:** New report generation or report update
- **Rationale:** Frequently accessed by dashboards; reduces MongoDB queries

```typescript
async getCachedReportList(employeeId: string): Promise<ReportMetadata[] | null> {
  const cacheKey = `report_metadata:${employeeId}:list`;
  const cachedData = await this.redisClient.get(cacheKey);
  
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  return null;
}

async cacheReportList(employeeId: string, reports: ReportMetadata[]): Promise<void> {
  const cacheKey = `report_metadata:${employeeId}:list`;
  const ttl = 60 * 60; // 1 hour
  await this.redisClient.setex(cacheKey, ttl, JSON.stringify(reports));
}

async invalidateReportCache(employeeId: string): Promise<void> {
  const cacheKey = `report_metadata:${employeeId}:list`;
  await this.redisClient.del(cacheKey);
}
```

#### Compatibility Score Caching
- **Cache Key Pattern:** `compatibility:{employeeId}:{targetType}:{targetId}`
- **TTL:** 24 hours (86,400 seconds)
- **Invalidation:** Harmonic code update or employee profile change
- **Rationale:** Compatibility calculations are complex but stable within reporting period

```typescript
async getCachedCompatibility(
  employeeId: string,
  targetType: string,
  targetId: string
): Promise<CompatibilityScore | null> {
  const cacheKey = `compatibility:${employeeId}:${targetType}:${targetId}`;
  const cachedData = await this.redisClient.get(cacheKey);
  
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  return null;
}
```

#### Organization Context Caching
- **Cache Key Pattern:** `org_context:{organizationId}`
- **TTL:** 6 hours (21,600 seconds)
- **Invalidation:** Organization profile update
- **Rationale:** Company astrological data and culture values used across multiple employees

### Cache Invalidation Strategies

1. **Time-based Expiration:** TTL set based on data volatility
2. **Event-driven Invalidation:** Cache cleared on specific data updates
3. **Versioned Caching:** Include version number in cache key for gradual rollover
4. **Lazy Invalidation:** Stale data acceptable for short periods; regenerate on miss

### Cache Warm-up Strategy

- **Startup Warm-up:** Pre-cache active employees' birth charts and current harmonic codes
- **Predictive Caching:** Cache data for employees likely to need reports soon
- **Background Refresh:** Async refresh of expiring cache entries during low-traffic periods

### Monitoring & Metrics

- Cache hit/miss ratios per cache type
- Average cache response times
- Cache memory usage and eviction rates
- Cost savings from LLM response caching

**Document Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** Production Ready