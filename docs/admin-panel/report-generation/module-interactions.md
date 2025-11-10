# Module Interactions - AI-Powered Report Generation

## Overview

This document describes how this module interacts with other internal modules in the monolith. The Report Generation module orchestrates multiple specialized services to generate comprehensive employee analysis reports.

## Internal Module Dependencies

### Core Dependencies

#### Authentication & Authorization Module
- **Purpose**: User verification and role-based access control
- **Used For**: 
  - Validating report generation requests
  - Enforcing role-based report access (Owner/Leader/Manager)
  - Scoping report visibility based on organizational hierarchy
- **Integration Points**:
  - `auth.service.ts` - JWT token validation
  - `roles.guard.ts` - Permission checking for report access
  - `user.decorator.ts` - Current user context injection

#### Employee Management Module
- **Purpose**: Employee and candidate data retrieval
- **Used For**:
  - Fetching employee birth details for astrological analysis
  - Retrieving job role and department assignments
  - Accessing professional background information
- **Integration Points**:
  - `employees.service.ts` - Employee data queries
  - `employee.schema.ts` - Shared employee data model
  - `candidates.service.ts` - Candidate information retrieval

#### Organization Management Module
- **Purpose**: Company, branch, and department data access
- **Used For**:
  - Company astrological data for compatibility analysis
  - Department structure for team compatibility reports
  - Industry classification for industry compatibility scoring
- **Integration Points**:
  - `organizations.service.ts` - Company profile data
  - `departments.service.ts` - Department metadata
  - `branches.service.ts` - Branch-level organizational data

#### AI Analysis Service
- **Purpose**: LLM-powered personality and behavior analysis
- **Used For**:
  - Generating personality insights from astrological data
  - Behavioral analysis based on company culture
  - Compatibility scoring using AI models
  - Training recommendation generation
- **Integration Points**:
  - `llm.service.ts` - OpenAI/LLM API integration
  - `mastra-ai.service.ts` - Mastra.ai agent orchestration
  - `prompt.templates.ts` - Shared prompt configurations

#### Astrology Service
- **Purpose**: Birth chart calculation and astrological analysis
- **Used For**:
  - Generating natal charts from birth data
  - Planetary position calculations
  - Astrological aspect analysis
  - Zodiac sign and house interpretations
- **Integration Points**:
  - `astrology-calculator.service.ts` - Chart calculations
  - `birth-chart.interface.ts` - Shared data structures
  - `astrology-api.client.ts` - External astrology API wrapper

#### Harmonic Energy Service
- **Purpose**: Harmonic energy code calculation and tracking
- **Used For**:
  - Calculating quarterly harmonic codes
  - Tracking energy pattern changes
  - Determining report regeneration triggers
- **Integration Points**:
  - `harmonic-energy.service.ts` - Energy code calculations
  - `harmonic-codes.schema.ts` - Code storage and versioning
  - `quarterly-update.service.ts` - Automated recalculation

#### Queue Management Module (BullMQ)
- **Purpose**: Asynchronous report generation processing
- **Used For**:
  - Queueing heavy AI/LLM operations
  - Background report compilation
  - Quarterly batch regeneration
- **Integration Points**:
  - `@InjectQueue('report')` - Report generation queue
  - `report.processor.ts` - Queue job processing
  - `queue.config.ts` - Shared queue configuration

#### Payment/Subscription Module
- **Purpose**: Subscription status verification
- **Used For**:
  - Validating active subscriptions for quarterly updates
  - Enforcing feature tier limitations
  - Usage tracking for billing
- **Integration Points**:
  - `subscription.service.ts` - Subscription status checks
  - `usage-tracking.service.ts` - Report generation metrics
  - `stripe.service.ts` - Payment validation

#### Email Notification Module
- **Purpose**: Report completion and update notifications
- **Used For**:
  - Sending report generation completion emails
  - Quarterly update notifications
  - Error alerts for failed report generation
- **Integration Points**:
  - `email.service.ts` - Email sending interface
  - `notification-templates.ts` - Report-specific email templates
  - `nodemailer.config.ts` - Shared email configuration

#### WebSocket/Chat Module
- **Purpose**: Real-time report generation progress updates
- **Used For**:
  - Broadcasting generation progress events
  - Notifying clients of report completion
  - Real-time error notifications
- **Integration Points**:
  - `websocket.gateway.ts` - Event broadcasting
  - `report-events.ts` - Report-specific WebSocket events
  - `chat.service.ts` - AI consultation integration

#### Cron/Scheduling Module
- **Purpose**: Automated quarterly report regeneration
- **Used For**:
  - Scheduling quarterly harmonic code updates
  - Batch report regeneration for all employees
  - Cleanup of outdated report versions
- **Integration Points**:
  - `cron.service.ts` - Scheduled job registration
  - `quarterly-regeneration.cron.ts` - Report update jobs
  - `schedule.config.ts` - Shared scheduling configuration

## Communication Patterns

### Synchronous Communication

#### Request-Response Pattern
```typescript
// Report Generation Controller → Employee Service
const employee = await this.employeesService.findById(employeeId);

// Report Generation Service → Astrology Service
const birthChart = await this.astrologyService.calculateBirthChart(employee.birthDetails);

// Report Generation Service → Organization Service
const companyProfile = await this.organizationsService.getCompanyProfile(employee.organizationId);
```

**Used For**:
- Data retrieval from other modules
- Validation and authorization checks
- Immediate response requirements

**Flow Example**:
1. Controller receives report generation request
2. Validates user permissions via Auth module
3. Fetches employee data from Employee module
4. Retrieves company data from Organization module
5. Returns validation result synchronously

#### Method Injection Pattern
```typescript
@Injectable()
export class ReportGenerationService {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly astrologyService: AstrologyService,
    private readonly harmonicEnergyService: HarmonicEnergyService,
    private readonly aiAnalysisService: AIAnalysisService,
    private readonly organizationsService: OrganizationsService,
  ) {}
}
```

**Used For**:
- Tight coupling with frequently used services
- Type-safe service access
- NestJS dependency injection benefits

### Asynchronous Communication

#### Queue-Based Processing
```typescript
// Report Generation Service → Queue
await this.reportQueue.add('generate-all-reports', {
  employeeId,
  reportTypes: ['personality', 'behavior', 'compatibility'],
});

// Queue Processor → AI Analysis Service
@Process('generate-all-reports')
async processReportGeneration(job: Job) {
  const { employeeId, reportTypes } = job.data;
  
  // Sequential AI processing
  for (const type of reportTypes) {
    await this.aiAnalysisService.analyzeEmployee(employeeId, type);
    await job.progress((reportTypes.indexOf(type) + 1) / reportTypes.length * 100);
  }
}
```

**Used For**:
- Heavy LLM/AI processing operations
- Long-running report compilation
- Batch operations (quarterly updates)
- Progress tracking for real-time updates

**Queue Types**:
- `report-generation` - Individual report creation
- `batch-regeneration` - Quarterly bulk updates
- `ai-analysis` - AI/LLM processing tasks
- `report-compilation` - Final report assembly

#### Event-Based Communication
```typescript
// Report Generation Service → WebSocket Gateway
this.eventEmitter.emit('report.generation.started', {
  employeeId,
  userId,
  timestamp: Date.now(),
});

// WebSocket Gateway listens and broadcasts
@OnEvent('report.generation.completed')
handleReportCompleted(payload: ReportCompletedEvent) {
  this.websocketGateway.emitToUser(payload.userId, 'report.completed', {
    employeeId: payload.employeeId,
    reportUrl: payload.reportUrl,
  });
}
```

**Used For**:
- Real-time UI updates during report generation
- Decoupled module communication
- Multiple subscribers to same event

**Event Types**:
- `report.generation.started`
- `report.generation.progress`
- `report.generation.completed`
- `report.generation.failed`
- `harmonic.code.updated`
- `quarterly.regeneration.triggered`

#### Scheduled Jobs Pattern
```typescript
// Cron Module → Report Generation Service
@Cron('0 0 1 */3 *') // Every quarter on the 1st at midnight
async handleQuarterlyRegeneration() {
  const activeOrganizations = await this.subscriptionService.getActiveSubscriptions();
  
  for (const org of activeOrganizations) {
    await this.reportQueue.add('quarterly-regeneration', {
      organizationId: org.id,
      quarter: this.getQuarter(),
    });
  }
}
```

**Used For**:
- Automated quarterly report updates
- Harmonic code recalculation
- Report cleanup and archival

### Hybrid Communication

#### Saga Pattern for Report Generation
```typescript
// Orchestrated multi-step process
async generateCompleteReport(employeeId: string): Promise<Report> {
  try {
    // Step 1: Synchronous - Fetch employee data
    const employee = await this.employeesService.findById(employeeId);
    
    // Step 2: Synchronous - Calculate astrology
    const birthChart = await this.astrologyService.calculateBirthChart(employee.birthDetails);
    
    // Step 3: Synchronous - Calculate harmonic codes
    const harmonicCode = await this.harmonicEnergyService.calculateCode(birthChart);
    
    // Step 4: Asynchronous - Queue AI analysis
    const aiJob = await this.reportQueue.add('ai-analysis', {
      employeeId,
      birthChart,
      harmonicCode,
    });
    
    // Step 5: Wait for AI completion
    const aiAnalysis = await aiJob.finished();
    
    // Step 6: Synchronous - Compile final report
    const report = await this.compileReport(employee, birthChart, harmonicCode, aiAnalysis);
    
    // Step 7: Event - Notify completion
    this.eventEmitter.emit('report.generation.completed', { employeeId, reportId: report.id });
    
    return report;
  } catch (error) {
    // Compensation/rollback logic
    await this.handleReportGenerationFailure(employeeId, error);
    throw error;
  }
}
```

**Used For**:
- Complex multi-step report generation
- Ensuring data consistency across modules
- Error recovery and compensation

## Shared Resources

### Databases

#### MongoDB Collections

**Shared Collections**:
```typescript
// employees collection (shared with Employee Management)
{
  collection: 'employees',
  access: 'read',
  usage: 'Source data for report generation',
  indexes: ['organizationId', 'departmentId', 'birthDate']
}

// organizations collection (shared with Organization Management)
{
  collection: 'organizations',
  access: 'read',
  usage: 'Company astrological data, culture, industry',
  indexes: ['_id', 'industry', 'foundingDate']
}

// departments collection (shared with Organization Management)
{
  collection: 'departments',
  access: 'read',
  usage: 'Department compatibility analysis',
  indexes: ['organizationId', 'branchId']
}
```

**Module-Owned Collections**:
```typescript
// reports collection (owned by Report Generation)
{
  collection: 'reports',
  access: 'read/write',
  usage: 'Storing generated reports and metadata',
  indexes: ['employeeId', 'reportType', 'generatedAt', 'version']
}

// harmonic_codes collection (shared with Harmonic Energy Service)
{
  collection: 'harmonic_codes',
  access: 'read',
  usage: 'Quarterly harmonic code tracking',
  indexes: ['employeeId', 'quarter', 'year']
}

// birth_charts collection (shared with Astrology Service)
{
  collection: 'birth_charts',
  access: 'read',
  usage: 'Cached astrological calculations',
  indexes: ['employeeId', 'calculatedAt']
}
```

#### PostgreSQL Tables

**Shared Tables**:
```sql
-- users table (shared with Auth module)
SELECT id, role, organizationId, departmentIds
FROM users
WHERE id = $userId;

-- subscriptions table (shared with Payment module)
SELECT status, plan, features
FROM subscriptions
WHERE organizationId = $orgId AND status = 'active';
```

**Module-Owned Tables**:
```sql
-- report_metadata table
CREATE TABLE report_metadata (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  report_type VARCHAR(50),
  version INTEGER,
  generated_at TIMESTAMP,
  generated_by UUID REFERENCES users(id),
  file_path VARCHAR(500),
  status VARCHAR(20)
);

-- report_versions table
CREATE TABLE report_versions (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES report_metadata(id),
  version INTEGER,
  harmonic_code_id UUID,
  changes JSONB,
  created_at TIMESTAMP
);
```

### Redis Cache

**Shared Cache Keys**:
```typescript
// User session cache (shared with Auth module)
{
  key: `user:session:${userId}`,
  ttl: 3600,
  usage: 'Validating user permissions for report access'
}

// Organization cache (shared with Organization module)
{
  key: `org:profile:${orgId}`,
  ttl: 7200,
  usage: 'Company data for compatibility analysis'
}
```

**Module-Owned Cache Keys**:
```typescript
// Report generation progress
{
  key: `report:progress:${jobId}`,
  ttl: 3600,
  usage: 'Real-time progress tracking for WebSocket updates'
}

// Recent reports cache
{
  key: `reports:recent:${employeeId}`,
  ttl: 1800,
  usage: 'Quick access to frequently viewed reports'
}

// AI analysis cache
{
  key: `ai:analysis:${employeeId}:${harmonicCodeHash}`,
  ttl: 86400,
  usage: 'Caching AI responses for identical inputs'
}
```

### BullMQ Queues

**Shared Queues**:
```typescript
// email queue (shared with Email module)
{
  queue: 'email',
  usage: 'Sending report completion notifications',
  producers: ['ReportGenerationService'],
  consumers: ['EmailService']
}

// notification queue (shared with Notification module)
{
  queue: 'notifications',
  usage: 'User notifications for report events',
  producers: ['ReportGenerationService', 'QuarterlyRegenService'],
  consumers: ['NotificationService']
}
```

**Module-Owned Queues**:
```typescript
// report queue
{
  queue: 'report',
  jobs: ['generate-all-reports', 'generate-single-report', 'quarterly-regeneration'],
  concurrency: 5,
  processors: ['ReportProcessor']
}

// ai-analysis queue
{
  queue: 'ai-analysis',
  jobs: ['personality-analysis', 'compatibility-analysis', 'training-recommendations'],
  concurrency: 3,
  processors: ['AIAnalysisProcessor']
}
```

### File Storage

**Shared Storage Locations**:
```typescript
// S3/Cloud Storage structure
{
  bucket: 'planetshr-reports',
  paths: {
    reports: '/organizations/{orgId}/reports/{employeeId}/{reportType}/{version}.pdf',
    charts: '/organizations/{orgId}/charts/{employeeId}/birth-chart.json',
    exports: '/organizations/{orgId}/exports/{timestamp}.zip'
  },
  access: 'Shared with Organization, Employee, Export modules',
  retention: '7 years (compliance requirement)'
}
```

### Dependency Graph

```
Report Generation Module
├── Auth Module (required)
│   └── JWT validation, role checking
├── Employee Management (required)
│   └── Employee data retrieval
├── Organization Management (required)
│   └── Company, department data
├── AI Analysis Service (required)
│   └── LLM-powered insights
├── Astrology Service (required)
│   └── Birth chart calculations
├── Harmonic Energy Service (required)
│   └── Energy code calculations
├── Queue Management (required)
│   └── Asynchronous processing
├── Payment/Subscription (required)
│   └── Feature access validation
├── Email Notification (optional)
│   └── Completion notifications
├── WebSocket/Chat (optional)
│   └── Real-time updates
└── Cron/Scheduling (required)
    └── Quarterly regeneration
```

### Inter-Module Data Flow

```
Report Generation Request
  ↓
[Auth Module] → Validate user & permissions
  ↓
[Employee Module] → Fetch employee data
  ↓
[Organization Module] → Fetch company/department data
  ↓
[Astrology Service] → Calculate birth chart
  ↓
[Harmonic Energy Service] → Calculate energy codes
  ↓
[Queue Module] → Queue AI processing
  ↓
[AI Analysis Service] → Generate insights (async)
  ↓
[Report Generation] → Compile final reports
  ↓
[WebSocket Module] → Notify completion (real-time)
  ↓
[Email Module] → Send notification email
  ↓
Return report to user
```

**Document Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** Complete