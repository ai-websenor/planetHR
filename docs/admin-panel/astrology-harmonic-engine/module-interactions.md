# Module Interactions - Astrology & Harmonic Energy Engine

## Overview

This document describes how this module interacts with other internal modules in the monolith.

## Internal Module Dependencies

### Core Dependencies

```typescript
// Module dependency graph
astrology-harmonic-engine
├── auth (authentication & authorization)
├── users (user role validation)
├── organizations (company/branch/department data)
├── employees (employee birth data & profiles)
├── reports (report generation triggers)
├── payments (subscription status validation)
├── cron (scheduled quarterly updates)
└── shared (utilities & common services)
```

### Dependency Details

| Module | Relationship | Purpose | Methods Used |
|--------|-------------|---------|--------------|
| **auth** | Consumer | JWT validation for API requests | `validateToken()`, `getUserRole()` |
| **users** | Consumer | Role-based access control | `checkPermissions()`, `getUserScope()` |
| **organizations** | Bidirectional | Company astrological data & structure | `getCompanyDetails()`, `getBranchInfo()`, `getDepartmentConfig()` |
| **employees** | Bidirectional | Employee birth data & report triggers | `getEmployeeBirthData()`, `getEmployeeProfile()`, `notifyReportReady()` |
| **reports** | Producer | Generate and update reports | `triggerReportGeneration()`, `updateReportData()` |
| **payments** | Consumer | Subscription validation for quarterly updates | `checkActiveSubscription()`, `validateFeatureAccess()` |
| **cron** | Consumer | Scheduled quarterly harmonic updates | `registerQuarterlyJob()`, `executeBatchUpdate()` |
| **shared** | Consumer | Logging, error handling, utilities | `logger`, `errorHandler`, `dateUtils`, `validators` |

## Communication Patterns

### 1. Synchronous Service Calls

#### Employee Birth Chart Generation
```typescript
// Triggered by employees module when new employee added
@Injectable()
export class AstrologyCalculationService {
  async generateBirthChart(employeeId: string): Promise<BirthChartResult> {
    // 1. Get employee birth data from employees module
    const employee = await this.employeesService.getEmployeeBirthData(employeeId);
    
    // 2. Calculate birth chart
    const chart = await this.calculateChart(employee);
    
    // 3. Generate harmonic energy code
    const harmonicCode = await this.harmonicEnergyService.generateCode(chart);
    
    // 4. Notify reports module to generate reports
    await this.reportsService.triggerReportGeneration(employeeId, chart, harmonicCode);
    
    return { chart, harmonicCode };
  }
}
```

#### Company Astrological Profile
```typescript
// Called by organizations module during company setup
@Injectable()
export class CompanyAstrologyService {
  async createCompanyProfile(organizationId: string): Promise<CompanyAstroProfile> {
    // 1. Get company founding data
    const orgData = await this.organizationsService.getCompanyDetails(organizationId);
    
    // 2. Calculate company birth chart
    const companyChart = await this.calculateCompanyChart(orgData);
    
    // 3. Map industry-specific energy patterns
    const industryEnergy = await this.mapIndustryEnergy(orgData.industry);
    
    // 4. Store and return profile
    return await this.saveCompanyProfile(organizationId, companyChart, industryEnergy);
  }
}
```

### 2. Event-Driven Communication

#### Event Publishers

```typescript
// Events emitted by astrology-harmonic-engine
export enum AstrologyEvents {
  BIRTH_CHART_CALCULATED = 'astrology.birth_chart.calculated',
  HARMONIC_CODE_GENERATED = 'astrology.harmonic_code.generated',
  HARMONIC_CODE_UPDATED = 'astrology.harmonic_code.updated',
  COMPATIBILITY_SCORED = 'astrology.compatibility.scored',
  QUARTERLY_UPDATE_COMPLETED = 'astrology.quarterly.completed',
  COMPANY_PROFILE_CREATED = 'astrology.company.created',
}

@Injectable()
export class AstrologyEventEmitter {
  constructor(private eventEmitter: EventEmitter2) {}
  
  emitBirthChartCalculated(data: BirthChartEvent) {
    this.eventEmitter.emit(AstrologyEvents.BIRTH_CHART_CALCULATED, data);
  }
  
  emitHarmonicCodeUpdated(data: HarmonicUpdateEvent) {
    this.eventEmitter.emit(AstrologyEvents.HARMONIC_CODE_UPDATED, data);
  }
}
```

#### Event Subscribers

```typescript
// Events consumed from other modules
@Injectable()
export class AstrologyEventListener {
  @OnEvent('employee.created')
  async handleEmployeeCreated(payload: EmployeeCreatedEvent) {
    await this.astrologyCalculationService.generateBirthChart(payload.employeeId);
  }
  
  @OnEvent('organization.created')
  async handleOrganizationCreated(payload: OrgCreatedEvent) {
    await this.companyAstrologyService.createCompanyProfile(payload.organizationId);
  }
  
  @OnEvent('subscription.renewed')
  async handleSubscriptionRenewed(payload: SubscriptionEvent) {
    await this.quarterlyUpdateService.scheduleNextUpdate(payload.organizationId);
  }
  
  @OnEvent('employee.department_changed')
  async handleDepartmentChange(payload: DepartmentChangeEvent) {
    await this.compatibilityService.recalculateDepartmentCompatibility(payload.employeeId);
  }
}
```

### 3. Queue-Based Processing

```typescript
// BullMQ queue integration for heavy calculations
@Processor('astrology-calculations')
export class AstrologyCalculationProcessor {
  @Process('birth-chart')
  async processBirthChart(job: Job<BirthChartJobData>) {
    const { employeeId } = job.data;
    
    // Heavy calculation offloaded to queue
    const chart = await this.calculateBirthChart(employeeId);
    
    // Emit completion event
    this.eventEmitter.emit(AstrologyEvents.BIRTH_CHART_CALCULATED, {
      employeeId,
      chart,
    });
  }
  
  @Process('quarterly-update')
  async processQuarterlyUpdate(job: Job<QuarterlyUpdateJobData>) {
    const { organizationId, quarter } = job.data;
    
    // Batch update all employees in organization
    const employees = await this.employeesService.getActiveEmployees(organizationId);
    
    for (const employee of employees) {
      await this.harmonicEnergyService.updateHarmonicCode(employee.id, quarter);
      await this.reportsService.regenerateReports(employee.id);
    }
  }
}
```

## Shared Resources

### 1. Database Collections

#### MongoDB Collections (Shared Access)

| Collection | Owner Module | Access Type | Purpose |
|------------|-------------|-------------|---------|
| `organizations` | organizations | Read | Company founding data, industry classification |
| `employees` | employees | Read | Birth data, personal information |
| `astrological_profiles` | astrology-harmonic-engine | Read/Write | Birth charts, harmonic codes |
| `compatibility_scores` | astrology-harmonic-engine | Read/Write | Calculated compatibility matrices |
| `company_astro_profiles` | astrology-harmonic-engine | Read/Write | Company astrological data |
| `harmonic_update_logs` | astrology-harmonic-engine | Read/Write | Quarterly update history |

#### Collection Access Patterns

```typescript
// Shared MongoDB connection via Mongoose
@Schema({ collection: 'astrological_profiles' })
export class AstrologicalProfile {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true, index: true })
  employeeId: Types.ObjectId;
  
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;
  
  @Prop({ type: Object, required: true })
  birthChart: BirthChart;
  
  @Prop({ type: Object, required: true })
  harmonicEnergyCode: HarmonicCode;
  
  @Prop({ type: Date, required: true })
  lastCalculated: Date;
  
  @Prop({ type: Date })
  nextQuarterlyUpdate: Date;
}
```

### 2. Redis Cache (Shared)

```typescript
// Shared Redis cache for performance optimization
@Injectable()
export class AstrologyCacheService {
  constructor(@InjectRedis() private readonly redis: Redis) {}
  
  // Cache birth chart calculations (24h TTL)
  async cacheBirthChart(employeeId: string, chart: BirthChart): Promise<void> {
    const key = `birth_chart:${employeeId}`;
    await this.redis.setex(key, 86400, JSON.stringify(chart));
  }
  
  // Cache compatibility scores (1 week TTL)
  async cacheCompatibilityScore(
    employeeId: string, 
    targetId: string, 
    score: CompatibilityScore
  ): Promise<void> {
    const key = `compatibility:${employeeId}:${targetId}`;
    await this.redis.setex(key, 604800, JSON.stringify(score));
  }
  
  // Invalidate cache on harmonic code update
  async invalidateEmployeeCache(employeeId: string): Promise<void> {
    const pattern = `*:${employeeId}*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### 3. BullMQ Queues (Shared)

```typescript
// Queue configuration and registration
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'astrology-calculations' },
      { name: 'quarterly-updates' },
      { name: 'compatibility-calculations' },
    ),
  ],
})
export class AstrologyHarmonicModule {
  // Queues shared with reports module for coordination
  constructor(
    @InjectQueue('astrology-calculations') private astrologyQueue: Queue,
    @InjectQueue('report-generation') private reportQueue: Queue,
  ) {}
  
  async queueBirthChartCalculation(employeeId: string): Promise<void> {
    await this.astrologyQueue.add('birth-chart', { employeeId }, {
      priority: 1,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }
}
```

## Data Flow Diagrams

### Employee Onboarding Flow

```
Employee Module                Astrology Module              Reports Module
     |                               |                            |
     |-- createEmployee() ---------->|                            |
     |                               |                            |
     |<-- employeeId ----------------|                            |
     |                               |                            |
     |-- emit(employee.created) ---->|                            |
     |                               |                            |
     |                          [Calculate Birth Chart]           |
     |                               |                            |
     |                          [Generate Harmonic Code]          |
     |                               |                            |
     |                               |-- emit(chart.calculated) ->|
     |                               |                            |
     |                               |                       [Generate 8 Reports]
     |                               |                            |
     |<-- notifyReportReady() -------------------------------|     |
```

### Quarterly Update Flow

```
Cron Module               Astrology Module           Payments Module        Reports Module
     |                          |                          |                      |
     |-- quarterly.trigger ---->|                          |                      |
     |                          |                          |                      |
     |                          |-- checkSubscription() -->|                      |
     |                          |                          |                      |
     |                          |<-- activeOrgs -----------|                      |
     |                          |                          |                      |
     |                     [Queue Batch Update]            |                      |
     |                          |                          |                      |
     |                     [Update Harmonic Codes]         |                      |
     |                          |                          |                      |
     |                          |-- triggerRegeneration() ------------------->    |
     |                          |                          |                      |
     |                          |                          |                 [Regenerate All Reports]
     |                          |                          |                      |
     |                          |<-- emit(quarterly.completed) ---------------    |
```

### Compatibility Calculation Flow

```
Reports Module          Astrology Module           Organizations Module
     |                        |                            |
     |-- calculateCompat() -->|                            |
     |                        |                            |
     |                   [Get Employee Chart]              |
     |                        |                            |
     |                        |-- getJobRoleData() ------->|
     |                        |                            |
     |                        |<-- roleRequirements -------|
     |                        |                            |
     |                        |-- getDepartmentData() ---->|
     |                        |                            |
     |                        |<-- deptEnergyProfile ------|
     |                        |                            |
     |                        |-- getCompanyProfile() ---->|
     |                        |                            |
     |                        |<-- companyAstroData -------|
     |                        |                            |
     |                   [Calculate 4 Compatibility Scores]|
     |                        |                            |
     |<-- compatibilityScores |                            |
```

## Error Propagation

### Error Handling Strategy

```typescript
// Custom exceptions for module interactions
export class AstrologyCalculationException extends HttpException {
  constructor(message: string, originalError?: Error) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Astrology calculation failed: ${message}`,
        error: 'AstrologyCalculationError',
        timestamp: new Date().toISOString(),
        originalError: originalError?.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

// Error propagation to dependent modules
@Injectable()
export class AstrologyErrorHandler {
  async handleCalculationError(employeeId: string, error: Error): Promise<void> {
    // Log error
    this.logger.error(`Birth chart calculation failed for employee ${employeeId}`, error.stack);
    
    // Notify employees module of failure
    await this.employeesService.markCalculationFailed(employeeId, error.message);
    
    // Notify reports module to skip report generation
    await this.reportsService.cancelReportGeneration(employeeId);
    
    // Emit failure event
    this.eventEmitter.emit('astrology.calculation.failed', {
      employeeId,
      error: error.message,
      timestamp: new Date(),
    });
  }
}
```

### Retry Logic for External Dependencies

```typescript
// Retry configuration for external astrology API calls
@Injectable()
export class ExternalAstrologyService {
  async fetchAstrologicalData(params: AstroParams): Promise<AstroData> {
    const retryOptions = {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 5000,
      onRetry: (error, attempt) => {
        this.logger.warn(`External astrology API retry attempt ${attempt}`, error.message);
      },
    };
    
    return await retry(
      async () => {
        return await this.astrologyApiClient.calculate(params);
      },
      retryOptions
    );
  }
}
```

## Transaction Coordination

### Cross-Module Transactions

```typescript
// Transactional coordination for employee creation with astrology profile
@Injectable()
export class EmployeeAstrologyOrchestrator {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly astrologyService: AstrologyCalculationService,
    private readonly connection: Connection, // Mongoose connection
  ) {}
  
  async createEmployeeWithAstrology(data: CreateEmployeeDto): Promise<Employee> {
    const session = await this.connection.startSession();
    session.startTransaction();
    
    try {
      // 1. Create employee record
      const employee = await this.employeesService.create(data, { session });
      
      // 2. Generate astrological profile
      const astroProfile = await this.astrologyService.createProfile(
        employee.id,
        data.birthData,
        { session }
      );
      
      // 3. Calculate initial compatibility scores
      await this.astrologyService.calculateInitialCompatibility(
        employee.id,
        { session }
      );
      
      // Commit transaction
      await session.commitTransaction();
      
      // Emit success event (after commit)
      this.eventEmitter.emit('employee.astrology.initialized', {
        employeeId: employee.id,
        astroProfileId: astroProfile.id,
      });
      
      return employee;
    } catch (error) {
      // Rollback on error
      await session.abortTransaction();
      throw new EmployeeCreationException('Failed to create employee with astrology profile', error);
    } finally {
      session.endSession();
    }
  }
}
```

## Performance Considerations

### Caching Strategy

- **Birth charts**: Cached for 24 hours (rarely changes)
- **Harmonic codes**: Cached until quarterly update
- **Compatibility scores**: Cached for 1 week (recalculated on demand)
- **Company profiles**: Cached indefinitely (invalidated on company data change)

### Batch Processing

```typescript
// Batch compatibility calculations for performance
@Injectable()
export class BatchCompatibilityService {
  async calculateDepartmentCompatibility(departmentId: string): Promise<void> {
    const employees = await this.employeesService.getByDepartment(departmentId);
    
    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(employee => 
          this.compatibilityService.calculateAllScores(employee.id)
        )
      );
      
      // Small delay between batches to avoid overwhelming system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
```

## Security & Access Control

### Role-Based Data Access

```typescript
// Enforce role-based access through module interactions
@Injectable()
export class AstrologyAccessControl {
  async validateAccess(userId: string, employeeId: string): Promise<boolean> {
    // Get user role and scope from users module
    const user = await this.usersService.getUserWithScope(userId);
    const employee = await this.employeesService.getEmployee(employeeId);
    
    // Validate access based on role
    switch (user.role) {
      case UserRole.OWNER:
        return employee.organizationId === user.organizationId;
      
      case UserRole.LEADER:
        return user.managedBranches.includes(employee.branchId);
      
      case UserRole.MANAGER:
        return user.managedDepartments.includes(employee.departmentId);
      
      default:
        return false;
    }
  }
}
```

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Draft