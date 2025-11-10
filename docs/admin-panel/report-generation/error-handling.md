# Error Handling - AI-Powered Report Generation

## Error Scenarios Matrix

| Scenario | Error Code | HTTP Status | User Message | Resolution |
|----------|------------|-------------|--------------|------------|
| Employee not found | REPORT_001 | 404 | Employee record not found for report generation | Verify employee ID exists in the system |
| Invalid birth data | REPORT_002 | 400 | Birth date/time/location required for astrological analysis | Provide complete birth information (date, time, location) |
| Astrology API unavailable | REPORT_003 | 503 | Astrological calculation service temporarily unavailable | Retry after cooldown period; queue for later processing |
| Astrology API timeout | REPORT_004 | 504 | Astrological analysis timed out | Retry with exponential backoff |
| Invalid astrological data | REPORT_005 | 422 | Received invalid data from astrology service | Validate input parameters; contact support if persists |
| Harmonic code calculation failed | REPORT_006 | 500 | Failed to calculate harmonic energy codes | Verify birth data accuracy; retry calculation |
| LLM API unavailable | REPORT_007 | 503 | AI analysis service temporarily unavailable | Queue report for retry; notify user of delay |
| LLM API timeout | REPORT_008 | 504 | AI analysis request timed out | Retry with longer timeout; fallback to cached analysis |
| LLM rate limit exceeded | REPORT_009 | 429 | AI service rate limit reached | Queue request; implement exponential backoff |
| Invalid LLM response | REPORT_010 | 502 | Received invalid response from AI service | Log response; retry with adjusted prompt |
| Token limit exceeded | REPORT_011 | 400 | Analysis input exceeds AI token limit | Split analysis into chunks; reduce context size |
| Company profile incomplete | REPORT_012 | 422 | Company profile missing required data for compatibility analysis | Complete company astrology data and harmonic codes |
| Department not configured | REPORT_013 | 422 | Department profile not configured for compatibility analysis | Setup department metadata and energy signatures |
| Job role not defined | REPORT_014 | 422 | Job role requirements not defined in system | Configure role specifications and compatibility criteria |
| Industry data missing | REPORT_015 | 422 | Industry profile not available for analysis | Select valid industry or configure custom industry profile |
| Insufficient permissions | REPORT_016 | 403 | User lacks permission to generate report for this employee | Verify hierarchical access: Owner > Leader > Manager scope |
| Report generation in progress | REPORT_017 | 409 | Report generation already in progress for this employee | Wait for current generation to complete |
| Report not found | REPORT_018 | 404 | Requested report does not exist | Trigger new report generation for employee |
| Report storage failed | REPORT_019 | 500 | Failed to persist generated report | Retry storage operation; verify database connectivity |
| Database connection error | REPORT_020 | 503 | Unable to connect to report database | Check MongoDB/PostgreSQL connection; retry after reconnection |
| Queue service unavailable | REPORT_021 | 503 | Report generation queue unavailable | Verify BullMQ/Redis connectivity; fallback to synchronous generation |
| Concurrent generation limit | REPORT_022 | 429 | Maximum concurrent report generations reached | Queue report for processing; notify user of delay |
| Subscription inactive | REPORT_023 | 402 | Active subscription required for report generation | Prompt user to renew subscription |
| Subscription limit reached | REPORT_024 | 403 | Monthly report generation limit exceeded | Upgrade subscription plan or wait for reset |
| Quarterly update failed | REPORT_025 | 500 | Automated quarterly report regeneration failed | Manual trigger required; investigate cron job failure |
| Invalid report type | REPORT_026 | 400 | Requested report type does not exist | Use valid report type: personality, behavior, compatibility, qa, training |
| Missing template | REPORT_027 | 500 | Report template not found | Restore template files; verify template path configuration |
| Template rendering error | REPORT_028 | 500 | Failed to render report template | Check template syntax; verify data structure matches template |
| Report export failed | REPORT_029 | 500 | Failed to export report to requested format | Verify export library availability; retry with different format |
| Bulk generation failed | REPORT_030 | 207 | Partial success in bulk report generation | Review individual error details in response body |
| WebSocket notification failed | REPORT_031 | 500 | Failed to send report completion notification | Report generated successfully but notification failed |
| Stale harmonic code data | REPORT_032 | 422 | Harmonic energy codes outdated; regeneration required | Recalculate harmonic codes before report generation |
| Analysis data corruption | REPORT_033 | 500 | Detected corrupted data in analysis pipeline | Regenerate from source data; investigate data integrity |
| Cross-branch access denied | REPORT_034 | 403 | Cannot access employee from different branch | Leader/Manager limited to assigned branch/department |
| Employee data incomplete | REPORT_035 | 422 | Employee profile missing required fields | Complete employee profile: name, birth data, role, department |
| Report version conflict | REPORT_036 | 409 | Report version conflict detected | Fetch latest version; resolve conflicts manually |
| Cache invalidation failed | REPORT_037 | 500 | Failed to invalidate report cache | Stale data may be served; manual cache clear required |
| Audit log failure | REPORT_038 | 500 | Failed to log report generation audit entry | Report generated but compliance logging failed |
| External API authentication | REPORT_039 | 401 | Failed to authenticate with external service | Verify API keys: OPENAI_API_KEY, MASTRA_API_KEY |
| Data transformation error | REPORT_040 | 500 | Failed to transform data for report format | Validate DTO structure; check class-transformer configuration |

## Common Error Codes

### REPORT_0XX - Input Validation Errors (400-422)
- **REPORT_001**: Employee record not found
- **REPORT_002**: Invalid or incomplete birth data
- **REPORT_005**: Invalid astrological calculation data
- **REPORT_011**: Token limit exceeded for LLM processing
- **REPORT_012-015**: Incomplete organizational profile data
- **REPORT_026**: Invalid report type requested
- **REPORT_032**: Stale harmonic code requiring refresh
- **REPORT_035**: Incomplete employee profile data

### REPORT_1XX - Authentication & Authorization Errors (401-403)
- **REPORT_016**: Insufficient hierarchical permissions
- **REPORT_023**: Inactive subscription blocking generation
- **REPORT_024**: Subscription limit exceeded
- **REPORT_034**: Cross-branch access violation
- **REPORT_039**: External API authentication failure

### REPORT_2XX - State & Conflict Errors (409, 429)
- **REPORT_017**: Concurrent generation conflict
- **REPORT_022**: System-wide concurrent generation limit
- **REPORT_009**: LLM rate limiting
- **REPORT_036**: Report version conflict

### REPORT_3XX - Service Availability Errors (503-504)
- **REPORT_003**: Astrology API unavailable
- **REPORT_004**: Astrology API timeout
- **REPORT_007**: LLM API unavailable
- **REPORT_008**: LLM API timeout
- **REPORT_020**: Database connection failure
- **REPORT_021**: Queue service unavailable

### REPORT_4XX - Internal Processing Errors (500, 502)
- **REPORT_006**: Harmonic code calculation failure
- **REPORT_010**: Invalid LLM response structure
- **REPORT_018**: Report not found in storage
- **REPORT_019**: Report persistence failure
- **REPORT_025**: Automated quarterly update failure
- **REPORT_027**: Missing report template
- **REPORT_028**: Template rendering failure
- **REPORT_029**: Report export failure
- **REPORT_031**: WebSocket notification failure
- **REPORT_033**: Data corruption detected
- **REPORT_037**: Cache invalidation failure
- **REPORT_038**: Audit logging failure
- **REPORT_040**: Data transformation failure

### REPORT_5XX - Bulk & Partial Failures (207)
- **REPORT_030**: Bulk generation with partial failures

## Error Propagation

### Layer Architecture
```
Controller Layer (HTTP Entry Point)
    ↓ [Validation Errors: REPORT_002, REPORT_026, REPORT_035]
Service Layer (Business Logic)
    ↓ [Authorization Errors: REPORT_016, REPORT_023, REPORT_024, REPORT_034]
Queue Layer (Async Processing)
    ↓ [Queue Errors: REPORT_021, REPORT_022]
AI Integration Layer
    ↓ [External API Errors: REPORT_003-011, REPORT_039]
Data Access Layer
    ↓ [Database Errors: REPORT_001, REPORT_018-020]
```

### Error Propagation Flow

#### 1. Controller Layer
**Responsibility**: Input validation, HTTP mapping, initial error handling

**Error Types**:
- DTO validation failures → `BadRequestException` (400)
- Invalid query parameters → `BadRequestException` (400)
- Malformed request body → `UnprocessableEntityException` (422)

**Propagation**:
```typescript
@Post('generate/:employeeId')
@UseGuards(JwtAuthGuard, RolesGuard)
async generateReport(@Param('employeeId') employeeId: string) {
  try {
    return await this.reportService.generateReport(employeeId);
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw new HttpException(
        { code: 'REPORT_001', message: error.message },
        HttpStatus.NOT_FOUND
      );
    }
    throw error; // Propagate to global exception filter
  }
}
```

#### 2. Service Layer
**Responsibility**: Business logic validation, authorization checks, orchestration

**Error Types**:
- Authorization failures → `ForbiddenException` (403)
- Business rule violations → `UnprocessableEntityException` (422)
- Resource conflicts → `ConflictException` (409)

**Propagation**:
```typescript
async generateReport(employeeId: string, userId: string) {
  // Authorization check
  const hasAccess = await this.checkHierarchicalAccess(userId, employeeId);
  if (!hasAccess) {
    throw new ForbiddenException({
      code: 'REPORT_016',
      message: 'Insufficient permissions to generate report'
    });
  }

  // Subscription validation
  const subscription = await this.subscriptionService.getActive(userId);
  if (!subscription) {
    throw new PaymentRequiredException({
      code: 'REPORT_023',
      message: 'Active subscription required'
    });
  }

  // Delegate to queue layer
  try {
    return await this.queueReport(employeeId);
  } catch (error) {
    this.logger.error(`Report generation failed: ${error.message}`);
    throw error; // Propagate to controller
  }
}
```

#### 3. Queue Layer
**Responsibility**: Async job management, concurrency control, retry logic

**Error Types**:
- Queue service unavailable → `ServiceUnavailableException` (503)
- Concurrency limits → `TooManyRequestsException` (429)
- Job processing failures → Logged and retried

**Propagation**:
```typescript
@Process('generate')
async handleReportGeneration(job: Job<GenerateReportDto>) {
  try {
    // Process with timeout
    const report = await Promise.race([
      this.aiService.generateReport(job.data),
      this.timeout(300000) // 5 minute timeout
    ]);
    
    await this.saveReport(report);
    await this.notifyCompletion(job.data.employeeId);
    
  } catch (error) {
    this.logger.error(`Job ${job.id} failed:`, error);
    
    // Determine if retryable
    if (this.isRetryableError(error)) {
      throw error; // BullMQ will retry based on job config
    }
    
    // Non-retryable: log and notify failure
    await this.notifyFailure(job.data.employeeId, error);
  }
}
```

#### 4. AI Integration Layer
**Responsibility**: External API communication, response validation, fallback handling

**Error Types**:
- API unavailable → `ServiceUnavailableException` (503)
- API timeout → `GatewayTimeoutException` (504)
- Rate limiting → `TooManyRequestsException` (429)
- Invalid responses → `BadGatewayException` (502)

**Propagation**:
```typescript
async generateAIAnalysis(employeeData: EmployeeData) {
  try {
    // Primary LLM call
    const response = await this.openAIClient.chat.completions.create({
      model: 'gpt-4',
      messages: this.buildPrompt(employeeData),
      timeout: 60000
    });
    
    // Validate response structure
    if (!this.isValidResponse(response)) {
      throw new BadGatewayException({
        code: 'REPORT_010',
        message: 'Invalid AI response structure'
      });
    }
    
    return this.parseAIResponse(response);
    
  } catch (error) {
    // Handle specific OpenAI errors
    if (error.status === 429) {
      throw new TooManyRequestsException({
        code: 'REPORT_009',
        message: 'AI service rate limit exceeded',
        retryAfter: error.headers['retry-after']
      });
    }
    
    if (error.code === 'ECONNREFUSED') {
      throw new ServiceUnavailableException({
        code: 'REPORT_007',
        message: 'AI service unavailable'
      });
    }
    
    // Propagate unexpected errors
    throw error;
  }
}
```

#### 5. Data Access Layer
**Responsibility**: Database operations, data integrity, transaction management

**Error Types**:
- Connection failures → `ServiceUnavailableException` (503)
- Document not found → `NotFoundException` (404)
- Validation errors → `UnprocessableEntityException` (422)
- Write conflicts → `ConflictException` (409)

**Propagation**:
```typescript
async saveReport(report: GeneratedReport) {
  try {
    // Atomic save with version check
    const result = await this.reportModel.findOneAndUpdate(
      { employeeId: report.employeeId, version: report.version },
      { $set: report, $inc: { version: 1 } },
      { upsert: true, new: true }
    );
    
    return result;
    
  } catch (error) {
    if (error.name === 'VersionError') {
      throw new ConflictException({
        code: 'REPORT_036',
        message: 'Report version conflict detected'
      });
    }
    
    if (error.name === 'MongoNetworkError') {
      throw new ServiceUnavailableException({
        code: 'REPORT_020',
        message: 'Database connection error'
      });
    }
    
    // Log and propagate storage failures
    this.logger.error('Report storage failed:', error);
    throw new InternalServerErrorException({
      code: 'REPORT_019',
      message: 'Failed to persist generated report'
    });
  }
}
```

### Global Exception Filter

**Responsibility**: Centralized error formatting, logging, client response

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      path: request.url
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      errorResponse = {
        ...(typeof exceptionResponse === 'object' ? exceptionResponse : {}),
        timestamp: new Date().toISOString(),
        path: request.url
      };
    }

    // Log error with context
    this.logger.error(
      `[${request.method}] ${request.url}`,
      exception instanceof Error ? exception.stack : exception
    );

    // Send formatted response
    response.status(status).json(errorResponse);
  }
}
```

### Retry Strategy

**Retryable Errors** (with exponential backoff):
- REPORT_003, REPORT_004: Astrology API issues
- REPORT_007, REPORT_008: LLM API issues
- REPORT_009: Rate limiting (with delay)
- REPORT_020: Database connection issues
- REPORT_021: Queue service issues

**Non-Retryable Errors** (immediate failure):
- REPORT_001, REPORT_002: Invalid input data
- REPORT_016, REPORT_034: Authorization failures
- REPORT_023, REPORT_024: Subscription issues
- REPORT_026: Invalid report type

**Configuration**:
```typescript
const RETRY_CONFIG = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000 // 5s, 10s, 20s
  },
  retryableErrors: [
    'REPORT_003', 'REPORT_004', 'REPORT_007', 
    'REPORT_008', 'REPORT_020', 'REPORT_021'
  ]
};
```

### Error Monitoring & Alerting

**Critical Errors** (immediate notification):
- REPORT_020: Database connection failures
- REPORT_025: Quarterly update failures
- REPORT_033: Data corruption detected

**Warning Errors** (aggregated alerts):
- REPORT_009: Sustained rate limiting
- REPORT_022: Persistent concurrency limits
- REPORT_030: High bulk generation failure rate

**Metrics Tracked**:
- Error rate by code and user role
- Response time percentiles (p50, p95, p99)
- External API error rates
- Queue processing failures
- Database query performance

**Document Version:** 1.0  
**Last Updated:** 2025-11-10  
**Status:** Complete