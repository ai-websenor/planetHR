# API Contracts - AI-Powered Report Generation

## Overview

This document defines all API endpoints (internal and external) for the AI-Powered Report Generation module.

## External APIs

### Report Generation Endpoints

#### Generate Employee Report

```http
POST /api/v1/reports/generate
```

**Description**: Initiates generation of all 8 report types for a specific employee.

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader (scope-limited), Manager (scope-limited)

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "employeeId": "string (ObjectId)",
  "reportTypes": ["string"] | null,
  "priority": "high" | "normal" | "low",
  "regenerate": boolean
}
```

**Field Descriptions**:
- `employeeId` (required): MongoDB ObjectId of the employee
- `reportTypes` (optional): Array of specific report types to generate. If null, generates all 8 reports
  - Valid values: `personality_role`, `behavior_company`, `compatibility_job`, `compatibility_department`, `compatibility_company`, `compatibility_industry`, `qa_system`, `training_development`
- `priority` (optional): Queue priority level (default: `normal`)
- `regenerate` (optional): Force regeneration even if reports exist (default: `false`)

**Response Success (202 Accepted)**:
```json
{
  "status": "accepted",
  "jobId": "string (UUID)",
  "employeeId": "string (ObjectId)",
  "reportTypes": ["string"],
  "estimatedCompletionTime": "ISO8601 datetime",
  "message": "Report generation initiated successfully"
}
```

**Response Error (400 Bad Request)**:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid report type specified",
  "details": ["Invalid report type: invalid_type"]
}
```

**Response Error (403 Forbidden)**:
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "You do not have access to this employee's reports"
}
```

**Response Error (404 Not Found)**:
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Employee not found"
}
```

---

#### Get Report Status

```http
GET /api/v1/reports/status/:jobId
```

**Description**: Retrieves the current status of a report generation job.

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader, Manager (scope-limited)

**Path Parameters**:
- `jobId` (required): UUID of the report generation job

**Response Success (200 OK)**:
```json
{
  "jobId": "string (UUID)",
  "status": "queued" | "processing" | "completed" | "failed",
  "progress": {
    "current": number,
    "total": number,
    "percentage": number
  },
  "completedReports": ["string"],
  "failedReports": [{
    "type": "string",
    "error": "string",
    "timestamp": "ISO8601 datetime"
  }],
  "startedAt": "ISO8601 datetime",
  "completedAt": "ISO8601 datetime" | null,
  "estimatedTimeRemaining": number | null
}
```

**Response Error (404 Not Found)**:
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Job not found"
}
```

---

#### Get Employee Reports

```http
GET /api/v1/reports/employee/:employeeId
```

**Description**: Retrieves all generated reports for a specific employee.

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader, Manager (scope-limited)

**Path Parameters**:
- `employeeId` (required): MongoDB ObjectId of the employee

**Query Parameters**:
- `reportTypes` (optional): Comma-separated list of report types to retrieve
- `version` (optional): Report version number (default: latest)
- `includeArchived` (optional): Include archived versions (default: `false`)

**Response Success (200 OK)**:
```json
{
  "employeeId": "string (ObjectId)",
  "employeeName": "string",
  "reports": [
    {
      "reportId": "string (ObjectId)",
      "type": "string",
      "version": number,
      "status": "active" | "archived",
      "generatedAt": "ISO8601 datetime",
      "validUntil": "ISO8601 datetime",
      "summary": {
        "overallScore": number,
        "keyInsights": ["string"],
        "criticalFlags": ["string"]
      },
      "downloadUrl": "string (URL)"
    }
  ],
  "metadata": {
    "totalReports": number,
    "lastGenerated": "ISO8601 datetime",
    "nextScheduledUpdate": "ISO8601 datetime" | null
  }
}
```

**Response Error (403 Forbidden)**:
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Access denied to employee reports"
}
```

---

#### Get Report Details

```http
GET /api/v1/reports/:reportId
```

**Description**: Retrieves detailed content of a specific report.

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader, Manager (scope-limited)

**Path Parameters**:
- `reportId` (required): MongoDB ObjectId of the report

**Query Parameters**:
- `format` (optional): Response format (`json` | `pdf` | `html`) (default: `json`)

**Response Success (200 OK - JSON Format)**:
```json
{
  "reportId": "string (ObjectId)",
  "employeeId": "string (ObjectId)",
  "type": "string",
  "version": number,
  "generatedAt": "ISO8601 datetime",
  "validUntil": "ISO8601 datetime",
  "content": {
    "summary": {
      "overallScore": number,
      "scoreBreakdown": {
        "category1": number,
        "category2": number
      },
      "keyFindings": ["string"]
    },
    "detailedAnalysis": {
      "sections": [
        {
          "title": "string",
          "content": "string (markdown)",
          "insights": ["string"],
          "recommendations": ["string"]
        }
      ]
    },
    "astrologyData": {
      "birthChart": object,
      "planetaryPositions": object,
      "aspects": object
    },
    "harmonicEnergy": {
      "currentCode": "string",
      "energyPattern": object,
      "resonanceScore": number
    },
    "aiAnalysis": {
      "model": "string",
      "confidence": number,
      "insights": object
    }
  },
  "metadata": {
    "generationTime": number,
    "dataVersion": "string",
    "processingEngine": "string"
  }
}
```

**Response Success (200 OK - PDF Format)**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="report_<reportId>.pdf"

<Binary PDF Data>
```

---

#### Bulk Report Generation

```http
POST /api/v1/reports/bulk-generate
```

**Description**: Initiates report generation for multiple employees simultaneously.

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader

**Request Body**:
```json
{
  "employeeIds": ["string (ObjectId)"],
  "reportTypes": ["string"] | null,
  "priority": "high" | "normal" | "low",
  "batchSize": number,
  "scheduleAt": "ISO8601 datetime" | null
}
```

**Field Descriptions**:
- `employeeIds` (required): Array of employee ObjectIds (max: 500)
- `reportTypes` (optional): Specific report types to generate
- `priority` (optional): Queue priority
- `batchSize` (optional): Number of concurrent generations (default: 10, max: 50)
- `scheduleAt` (optional): Scheduled generation time (default: immediate)

**Response Success (202 Accepted)**:
```json
{
  "status": "accepted",
  "batchId": "string (UUID)",
  "totalEmployees": number,
  "estimatedCompletionTime": "ISO8601 datetime",
  "message": "Bulk report generation initiated"
}
```

---

#### Get Bulk Generation Status

```http
GET /api/v1/reports/bulk-status/:batchId
```

**Description**: Retrieves status of bulk report generation.

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader

**Path Parameters**:
- `batchId` (required): UUID of the bulk generation batch

**Response Success (200 OK)**:
```json
{
  "batchId": "string (UUID)",
  "status": "queued" | "processing" | "completed" | "partial_failure" | "failed",
  "progress": {
    "total": number,
    "completed": number,
    "failed": number,
    "inProgress": number,
    "percentage": number
  },
  "details": [
    {
      "employeeId": "string (ObjectId)",
      "status": "completed" | "failed" | "processing",
      "completedReports": number,
      "error": "string" | null
    }
  ],
  "startedAt": "ISO8601 datetime",
  "completedAt": "ISO8601 datetime" | null
}
```

---

### Report Management Endpoints

#### Update Report

```http
PATCH /api/v1/reports/:reportId
```

**Description**: Updates report metadata or triggers regeneration.

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader

**Path Parameters**:
- `reportId` (required): MongoDB ObjectId of the report

**Request Body**:
```json
{
  "action": "archive" | "regenerate" | "update_metadata",
  "metadata": object | null
}
```

**Response Success (200 OK)**:
```json
{
  "reportId": "string (ObjectId)",
  "action": "string",
  "status": "success",
  "message": "Report updated successfully"
}
```

---

#### Delete Report

```http
DELETE /api/v1/reports/:reportId
```

**Description**: Soft deletes a report (archives it).

**Authentication**: JWT Bearer Token

**Authorization**: Owner

**Path Parameters**:
- `reportId` (required): MongoDB ObjectId of the report

**Query Parameters**:
- `permanent` (optional): Permanently delete (default: `false`)

**Response Success (200 OK)**:
```json
{
  "reportId": "string (ObjectId)",
  "status": "deleted",
  "message": "Report deleted successfully"
}
```

---

### Quarterly Update Endpoints

#### Get Quarterly Update Schedule

```http
GET /api/v1/reports/quarterly-schedule
```

**Description**: Retrieves the quarterly update schedule for all employees.

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader, Manager

**Query Parameters**:
- `departmentId` (optional): Filter by department
- `branchId` (optional): Filter by branch
- `upcoming` (optional): Only show upcoming updates (default: `false`)

**Response Success (200 OK)**:
```json
{
  "schedules": [
    {
      "employeeId": "string (ObjectId)",
      "employeeName": "string",
      "department": "string",
      "nextUpdate": "ISO8601 datetime",
      "lastUpdate": "ISO8601 datetime",
      "harmonicCodeChangeDate": "ISO8601 datetime",
      "subscriptionActive": boolean
    }
  ],
  "summary": {
    "totalEmployees": number,
    "activeSubscriptions": number,
    "upcomingUpdates": number,
    "nextBatchDate": "ISO8601 datetime"
  }
}
```

---

#### Trigger Quarterly Update

```http
POST /api/v1/reports/quarterly-update
```

**Description**: Manually triggers quarterly report regeneration.

**Authentication**: JWT Bearer Token

**Authorization**: Owner

**Request Body**:
```json
{
  "scope": "organization" | "branch" | "department" | "employee",
  "targetId": "string (ObjectId)" | null,
  "force": boolean
}
```

**Response Success (202 Accepted)**:
```json
{
  "status": "accepted",
  "updateId": "string (UUID)",
  "scope": "string",
  "affectedEmployees": number,
  "estimatedCompletionTime": "ISO8601 datetime"
}
```

---

### Report Analytics Endpoints

#### Get Report Analytics

```http
GET /api/v1/reports/analytics
```

**Description**: Retrieves analytics and insights across generated reports.

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader

**Query Parameters**:
- `scope` (required): `organization` | `branch` | `department`
- `scopeId` (optional): ID of the scope entity
- `startDate` (optional): ISO8601 datetime
- `endDate` (optional): ISO8601 datetime
- `metrics` (optional): Comma-separated list of metrics

**Response Success (200 OK)**:
```json
{
  "scope": "string",
  "period": {
    "start": "ISO8601 datetime",
    "end": "ISO8601 datetime"
  },
  "metrics": {
    "totalReportsGenerated": number,
    "averageGenerationTime": number,
    "reportDistribution": {
      "personality_role": number,
      "behavior_company": number,
      "compatibility_job": number,
      "compatibility_department": number,
      "compatibility_company": number,
      "compatibility_industry": number,
      "qa_system": number,
      "training_development": number
    },
    "averageCompatibilityScores": {
      "job": number,
      "department": number,
      "company": number,
      "industry": number
    },
    "trends": {
      "improving": number,
      "declining": number,
      "stable": number
    },
    "criticalFlags": {
      "total": number,
      "byCategory": object
    }
  },
  "insights": [
    {
      "type": "string",
      "severity": "info" | "warning" | "critical",
      "message": "string",
      "affectedEmployees": number
    }
  ]
}
```

---

### Report Export Endpoints

#### Export Reports

```http
POST /api/v1/reports/export
```

**Description**: Exports multiple reports in various formats.

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader

**Request Body**:
```json
{
  "reportIds": ["string (ObjectId)"],
  "format": "pdf" | "csv" | "excel" | "json",
  "includeCharts": boolean,
  "includeRawData": boolean,
  "emailTo": "string (email)" | null
}
```

**Response Success (200 OK)**:
```json
{
  "exportId": "string (UUID)",
  "status": "processing",
  "downloadUrl": "string (URL)" | null,
  "expiresAt": "ISO8601 datetime",
  "message": "Export initiated successfully"
}
```

---

#### Download Export

```http
GET /api/v1/reports/export/:exportId/download
```

**Description**: Downloads the exported report package.

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader

**Path Parameters**:
- `exportId` (required): UUID of the export job

**Response Success (200 OK)**:
```
Content-Type: application/zip
Content-Disposition: attachment; filename="reports_export_<timestamp>.zip"

<Binary ZIP Data>
```

---

## Internal APIs

### Internal Module Communication

#### AI Analysis Service

##### Analyze Employee Personality

```typescript
// Internal method call
analyzePersonality(params: PersonalityAnalysisParams): Promise<PersonalityAnalysisResult>

interface PersonalityAnalysisParams {
  employeeId: string;
  roleId: string;
  astrologyData: AstrologyData;
  harmonicCode: HarmonicEnergyCode;
  context: AnalysisContext;
}

interface PersonalityAnalysisResult {
  traits: PersonalityTrait[];
  strengths: string[];
  weaknesses: string[];
  roleAlignment: number;
  insights: string[];
  confidence: number;
  rawLLMResponse: object;
}
```

##### Analyze Compatibility

```typescript
// Internal method call
analyzeCompatibility(params: CompatibilityAnalysisParams): Promise<CompatibilityResult>

interface CompatibilityAnalysisParams {
  employeeId: string;
  targetType: 'job' | 'department' | 'company' | 'industry';
  targetId: string;
  employeeData: EmployeeProfile;
  targetData: TargetProfile;
  astrologyData: AstrologyData;
  harmonicCode: HarmonicEnergyCode;
}

interface CompatibilityResult {
  overallScore: number;
  dimensionScores: {
    cultural: number;
    technical: number;
    interpersonal: number;
    values: number;
  };
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  confidence: number;
}
```

##### Generate Training Recommendations

```typescript
// Internal method call
generateTrainingRecommendations(params: TrainingAnalysisParams): Promise<TrainingRecommendations>

interface TrainingAnalysisParams {
  employeeId: string;
  currentSkills: Skill[];
  roleRequirements: RoleRequirement[];
  performanceData: PerformanceMetrics;
  compatibilityScores: CompatibilityScores;
}

interface TrainingRecommendations {
  priorityAreas: PriorityArea[];
  recommendedPrograms: TrainingProgram[];
  skillGaps: SkillGap[];
  developmentPath: DevelopmentPath;
  estimatedTimeframe: number;
  expectedImpact: ImpactAssessment;
}
```

---

#### Astrology Service

##### Calculate Birth Chart

```typescript
// Internal method call
calculateBirthChart(params: BirthChartParams): Promise<BirthChartData>

interface BirthChartParams {
  birthDate: Date;
  birthTime: string;
  birthPlace: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
}

interface BirthChartData {
  sunSign: string;
  moonSign: string;
  ascendant: string;
  planetaryPositions: PlanetPosition[];
  houses: House[];
  aspects: Aspect[];
  dominantElements: ElementBalance;
  chartMetadata: ChartMetadata;
}
```

##### Get Astrological Insights

```typescript
// Internal method call
getAstrologicalInsights(params: InsightParams): Promise<AstrologicalInsights>

interface InsightParams {
  birthChart: BirthChartData;
  analysisType: 'personality' | 'career' | 'relationships' | 'growth';
  context: object;
}

interface AstrologicalInsights {
  coreTraits: string[];
  strengths: string[];
  challenges: string[];
  careerIndications: string[];
  interpersonalStyle: string[];
  growthAreas: string[];
  confidence: number;
}
```

---

#### Harmonic Energy Service

##### Calculate Harmonic Code

```typescript
// Internal method call
calculateHarmonicCode(params: HarmonicCodeParams): Promise<HarmonicEnergyCode>

interface HarmonicCodeParams {
  birthDate: Date;
  calculationDate: Date;
  astrologyData: AstrologyData;
}

interface HarmonicEnergyCode {
  code: string;
  energyPattern: EnergyPattern;
  resonanceLevel: number;
  dominantFrequencies: Frequency[];
  validFrom: Date;
  validUntil: Date;
  nextTransition: Date;
}
```

##### Get Energy Compatibility

```typescript
// Internal method call
getEnergyCompatibility(params: EnergyCompatibilityParams): Promise<EnergyCompatibilityResult>

interface EnergyCompatibilityParams {
  code1: string;
  code2: string;
  interactionType: 'collaborative' | 'hierarchical' | 'peer';
}

interface EnergyCompatibilityResult {
  compatibilityScore: number;
  harmonicResonance: number;
  potentialConflicts: string[];
  synergies: string[];
  recommendations: string[];
}
```

##### Schedule Quarterly Update

```typescript
// Internal method call
scheduleQuarterlyUpdate(employeeId: string): Promise<QuarterlyUpdateSchedule>

interface QuarterlyUpdateSchedule {
  employeeId: string;
  currentCode: string;
  nextCode: string;
  transitionDate: Date;
  scheduledUpdateDate: Date;
  autoUpdate: boolean;
}
```

---

#### LLM Integration Service

##### Generate Report Content

```typescript
// Internal method call
generateReportContent(params: ReportGenerationParams): Promise<GeneratedContent>

interface ReportGenerationParams {
  reportType: ReportType;
  employeeData: EmployeeProfile;
  analysisData: AnalysisData;
  astrologyData: AstrologyData;
  harmonicCode: HarmonicEnergyCode;
  prompt: string;
  model: string;
  temperature: number;
}

interface GeneratedContent {
  content: string;
  sections: Section[];
  insights: string[];
  recommendations: string[];
  metadata: {
    model: string;
    tokens: number;
    confidence: number;
    processingTime: number;
  };
}
```

##### Generate Q&A Response

```typescript
// Internal method call
generateQAResponse(params: QAParams): Promise<QAResponse>

interface QAParams {
  question: string;
  employeeId: string;
  reportContext: ReportContext;
  conversationHistory: Message[];
}

interface QAResponse {
  answer: string;
  confidence: number;
  sources: Source[];
  suggestedFollowUps: string[];
  metadata: ResponseMetadata;
}
```

---

#### Report Generation Service

##### Compile Report

```typescript
// Internal method call
compileReport(params: ReportCompilationParams): Promise<CompiledReport>

interface ReportCompilationParams {
  employeeId: string;
  reportType: ReportType;
  aiAnalysis: AIAnalysisResult;
  astrologyData: AstrologyData;
  harmonicCode: HarmonicEnergyCode;
  additionalData: object;
}

interface CompiledReport {
  reportId: string;
  content: ReportContent;
  metadata: ReportMetadata;
  version: number;
  generatedAt: Date;
  validUntil: Date;
}
```

##### Store Report

```typescript
// Internal method call
storeReport(report: CompiledReport): Promise<StorageResult>

interface StorageResult {
  reportId: string;
  storageLocation: string;
  downloadUrl: string;
  thumbnailUrl: string | null;
  status: 'stored' | 'failed';
  error: string | null;
}
```

##### Get Report Template

```typescript
// Internal method call
getReportTemplate(reportType: ReportType): Promise<ReportTemplate>

interface ReportTemplate {
  templateId: string;
  reportType: ReportType;
  sections: TemplateSection[];
  styling: StyleConfig;
  requiredData: string[];
  version: string;
}
```

---

### Internal Event System

#### Report Generation Events

```typescript
// Event: report.generation.started
interface ReportGenerationStartedEvent {
  employeeId: string;
  reportType: ReportType;
  jobId: string;
  timestamp: Date;
  priority: Priority;
}

// Event: report.generation.progress
interface ReportGenerationProgressEvent {
  jobId: string;
  employeeId: string;
  reportType: ReportType;
  progress: number;
  currentStage: string;
  timestamp: Date;
}

// Event: report.generation.completed
interface ReportGenerationCompletedEvent {
  jobId: string;
  reportId: string;
  employeeId: string;
  reportType: ReportType;
  generationTime: number;
  timestamp: Date;
}

// Event: report.generation.failed
interface ReportGenerationFailedEvent {
  jobId: string;
  employeeId: string;
  reportType: ReportType;
  error: ErrorDetails;
  retryable: boolean;
  timestamp: Date;
}
```

#### Quarterly Update Events

```typescript
// Event: quarterly.update.scheduled
interface QuarterlyUpdateScheduledEvent {
  updateId: string;
  employeeIds: string[];
  scheduledDate: Date;
  scope: UpdateScope;
  timestamp: Date;
}

// Event: quarterly.update.started
interface QuarterlyUpdateStartedEvent {
  updateId: string;
  totalEmployees: number;
  timestamp: Date;
}

// Event: quarterly.update.completed
interface QuarterlyUpdateCompletedEvent {
  updateId: string;
  successCount: number;
  failureCount: number;
  totalTime: number;
  timestamp: Date;
}
```

---

### Internal Queue Jobs

#### Report Generation Job

```typescript
// Queue: report-generation
interface ReportGenerationJob {
  name: 'generate-report';
  data: {
    employeeId: string;
    reportType: ReportType;
    priority: Priority;
    regenerate: boolean;
    metadata: object;
  };
  opts: {
    attempts: 3;
    backoff: {
      type: 'exponential';
      delay: 2000;
    };
    removeOnComplete: false;
    removeOnFail: false;
  };
}
```

#### Bulk Generation Job

```typescript
// Queue: bulk-report-generation
interface BulkGenerationJob {
  name: 'bulk-generate';
  data: {
    batchId: string;
    employeeIds: string[];
    reportTypes: ReportType[];
    batchSize: number;
    priority: Priority;
  };
  opts: {
    attempts: 2;
    backoff: {
      type: 'exponential';
      delay: 5000;
    };
  };
}
```

#### Quarterly Update Job

```typescript
// Queue: quarterly-updates
interface QuarterlyUpdateJob {
  name: 'quarterly-regeneration';
  data: {
    updateId: string;
    employeeIds: string[];
    scope: UpdateScope;
    force: boolean;
  };
  opts: {
    attempts: 3;
    backoff: {
      type: 'exponential';
      delay: 10000;
    };
    priority: 1;
  };
}
```

---

## WebSocket API

### Real-time Report Updates

#### Connection

```javascript
// WebSocket connection endpoint
ws://api.planetshr.com/reports/ws

// Authentication via query parameter
ws://api.planetshr.com/reports/ws?token=<jwt_token>
```

#### Events - Client to Server

##### Subscribe to Report Updates

```json
{
  "event": "subscribe",
  "data": {
    "employeeIds": ["string"],
    "reportTypes": ["string"] | null
  }
}
```

##### Unsubscribe from Updates

```json
{
  "event": "unsubscribe",
  "data": {
    "employeeIds": ["string"]
  }
}
```

#### Events - Server to Client

##### Report Generation Progress

```json
{
  "event": "report.generation.progress",
  "data": {
    "jobId": "string",
    "employeeId": "string",
    "reportType": "string",
    "progress": {
      "percentage": number,
      "currentStage": "string",
      "estimatedTimeRemaining": number
    },
    "timestamp": "ISO8601 datetime"
  }
}
```

##### Report Completed

```json
{
  "event": "report.completed",
  "data": {
    "reportId": "string",
    "employeeId": "string",
    "reportType": "string",
    "summary": {
      "overallScore": number,
      "keyInsights": ["string"]
    },
    "downloadUrl": "string",
    "timestamp": "ISO8601 datetime"
  }
}
```

##### Report Failed

```json
{
  "event": "report.failed",
  "data": {
    "jobId": "string",
    "employeeId": "string",
    "reportType": "string",
    "error": {
      "code": "string",
      "message": "string",
      "retryable": boolean
    },
    "timestamp": "ISO8601 datetime"
  }
}
```

##### Quarterly Update Notification

```json
{
  "event": "quarterly.update.notification",
  "data": {
    "updateId": "string",
    "employeeIds": ["string"],
    "scheduledDate": "ISO8601 datetime",
    "affectedReports": number,
    "timestamp": "ISO8601 datetime"
  }
}
```

---

## Error Codes

### Report Generation Errors

| Code | HTTP Status | Message | Description |
|------|-------------|---------|-------------|
| `REPORT_001` | 400 | Invalid report type | Specified report type is not supported |
| `REPORT_002` | 404 | Employee not found | Employee ID does not exist |
| `REPORT_003` | 403 | Access denied | User lacks permission to access reports |
| `REPORT_004` | 409 | Generation in progress | Report generation already in progress |
| `REPORT_005` | 500 | AI service unavailable | LLM service is not responding |
| `REPORT_006` | 500 | Astrology calculation failed | Astrology service error |
| `REPORT_007` | 500 | Harmonic code error | Harmonic energy calculation failed |
| `REPORT_008` | 429 | Rate limit exceeded | Too many generation requests |
| `REPORT_009` | 402 | Subscription inactive | Subscription required for operation |
| `REPORT_010` | 400 | Insufficient employee data | Missing required employee information |
| `REPORT_011` | 500 | Report compilation failed | Error during report compilation |
| `REPORT_012` | 500 | Storage error | Failed to store generated report |
| `REPORT_013` | 404 | Report not found | Report ID does not exist |
| `REPORT_014` | 410 | Report expired | Report validity period has ended |
| `REPORT_015` | 400 | Invalid export format | Unsupported export format |

### Bulk Operation Errors

| Code | HTTP Status | Message | Description |
|------|-------------|---------|-------------|
| `BULK_001` | 400 | Batch size exceeded | Too many employees in single batch |
| `BULK_002` | 404 | Batch not found | Batch ID does not exist |
| `BULK_003` | 409 | Batch already processing | Batch is currently being processed |
| `BULK_004` | 500 | Batch processing failed | Unexpected error during batch processing |

### Quarterly Update Errors

| Code | HTTP Status | Message | Description |
|------|-------------|---------|-------------|
| `QUARTERLY_001` | 400 | Invalid update scope | Unsupported scope for quarterly update |
| `QUARTERLY_002` | 404 | Update not found | Update ID does not exist |
| `QUARTERLY_003` | 409 | Update already scheduled | Quarterly update already scheduled |
| `QUARTERLY_004` | 402 | Subscription required | Active subscription needed for auto-updates |

---

## Rate Limiting

### Endpoint Rate Limits

| Endpoint Pattern | Rate Limit | Window |
|------------------|------------|--------|
| `POST /api/v1/reports/generate` | 100 requests | 1 hour |
| `POST /api/v1/reports/bulk-generate` | 10 requests | 1 hour |
| `GET /api/v1/reports/*` | 1000 requests | 1 hour |
| `POST /api/v1/reports/export` | 20 requests | 1 hour |
| `POST /api/v1/reports/quarterly-update` | 5 requests | 1 day |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699564800
```

### Rate Limit Exceeded Response

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "retryAfter": 3600,
  "limit": 100,
  "remaining": 0,
  "resetAt": "2025-11-11T12:00:00Z"
}
```

---

## API Versioning

### Version Strategy

- Current Version: `v1`
- Base URL Pattern: `/api/v{version}/`
- Header-based versioning also supported: `Accept: application/vnd.planetshr.v1+json`

### Deprecation Policy

- Minimum 6 months notice before version deprecation
- Deprecation warnings in response headers: `Deprecation: true`, `Sunset: Wed, 11 May 2026 07:28:00 GMT`

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Complete