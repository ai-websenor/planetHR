# Error Handling - Astrology & Harmonic Energy Engine

## Error Scenarios Matrix

| Scenario | Error Code | HTTP Status | User Message | Resolution |
|----------|------------|-------------|--------------|------------|
| Invalid birth date provided | AST-1001 | 400 | "Birth date must be a valid date between 1900-01-01 and current date" | Validate birth date format and range before submission |
| Missing birth time | AST-1002 | 400 | "Birth time is required for accurate astrological calculations" | Provide complete birth time (HH:mm format) |
| Invalid birth location | AST-1003 | 400 | "Birth location coordinates are invalid or missing" | Verify latitude/longitude or provide valid city/country |
| Birth chart calculation timeout | AST-1004 | 504 | "Astrological calculation is taking longer than expected. Please try again." | Retry request; if persists, contact system administrator |
| Ephemeris data unavailable | AST-1005 | 503 | "Planetary position data temporarily unavailable" | Wait for ephemeris service restoration; auto-retry in 5 minutes |
| Harmonic code generation failed | AST-1006 | 500 | "Unable to generate harmonic energy code. Please contact support." | Review calculation parameters; check harmonic algorithm integrity |
| Invalid astrological house system | AST-1007 | 400 | "Specified house system is not supported" | Use supported systems: Placidus, Koch, Equal, Whole Sign |
| Quarterly update processing error | AST-1008 | 500 | "Quarterly harmonic update failed for this employee" | Manual retry required; check employee data integrity |
| Company founding date missing | AST-1009 | 400 | "Company founding date is required for organizational analysis" | Provide complete company founding date and time |
| Incompatible zodiac system | AST-1010 | 400 | "Selected zodiac system is not compatible with analysis type" | Use Tropical zodiac for Western analysis, Sidereal for Vedic |
| Energy pattern calculation overflow | AST-1011 | 500 | "Energy pattern values exceeded calculation limits" | Verify input parameters; recalibrate harmonic scale |
| Compatibility score computation failed | AST-1012 | 500 | "Unable to calculate compatibility score" | Check both entities have valid birth charts; retry calculation |
| Duplicate harmonic code entry | AST-1013 | 409 | "Harmonic code already exists for this time period" | Use existing harmonic code or delete previous entry before regenerating |
| Insufficient astrological data | AST-1014 | 422 | "Insufficient birth data for requested analysis depth" | Provide complete birth details including time and location |
| Planetary aspect calculation error | AST-1015 | 500 | "Unable to calculate planetary aspects" | Verify ephemeris data availability; check aspect calculation algorithms |
| Industry energy mapping not found | AST-1016 | 404 | "Industry-specific energy patterns not available for selected sector" | Select from available industries or request custom industry mapping |
| Batch calculation limit exceeded | AST-1017 | 429 | "Too many calculation requests. Maximum 100 per batch." | Split requests into smaller batches; implement pagination |
| Invalid aspect orb value | AST-1018 | 400 | "Aspect orb must be between 0 and 10 degrees" | Adjust orb values to acceptable range |
| Astrological database connection failed | AST-1019 | 503 | "Cannot connect to astrological data store" | Check MongoDB connectivity; verify database credentials |
| Harmonic frequency out of range | AST-1020 | 400 | "Harmonic frequency must be between 1 and 360" | Verify harmonic calculation parameters |
| Quarterly job queue failure | AST-1021 | 500 | "Unable to schedule quarterly update job" | Check BullMQ/Redis connectivity; verify queue configuration |
| Timezone conversion error | AST-1022 | 400 | "Unable to convert birth time to UTC" | Verify timezone identifier; provide valid IANA timezone string |
| Synastry calculation incompatible | AST-1023 | 422 | "Cannot calculate compatibility: birth charts incompatible" | Ensure both charts use same house system and zodiac type |
| Energy code encryption failed | AST-1024 | 500 | "Unable to encrypt harmonic energy code" | Verify encryption service availability; check encryption keys |
| Astronomical calculation precision error | AST-1025 | 500 | "Planetary position calculation precision insufficient" | Recalculate using higher precision ephemeris data |
| Report generation dependency missing | AST-1026 | 424 | "Astrological analysis incomplete; cannot generate reports" | Ensure birth chart and harmonic codes are successfully calculated |
| Invalid planetary dignity | AST-1027 | 400 | "Planetary dignity calculation requires valid planetary positions" | Recalculate birth chart; verify planetary data integrity |
| Company-employee energy mismatch | AST-1028 | 422 | "Cannot calculate compatibility: missing company astrological data" | Complete company profile with founding date and location |
| Concurrent calculation conflict | AST-1029 | 409 | "Another calculation is in progress for this employee" | Wait for current calculation to complete; retry in 30 seconds |
| Harmonic progression error | AST-1030 | 500 | "Unable to progress harmonic codes to next quarter" | Verify progression algorithms; check date calculations |

## Common Error Codes

### AST-1xxx: Input Validation Errors (400 Bad Request)
- **AST-1001 to AST-1010**: Birth data and company data validation failures
- **AST-1018**: Aspect orb validation
- **AST-1020**: Harmonic frequency validation
- **AST-1022**: Timezone validation
- **AST-1027**: Planetary dignity validation

**Common Resolution**: Validate input data before API calls using frontend validation rules matching backend constraints.

### AST-10xx: Resource Not Found (404 Not Found)
- **AST-1016**: Industry energy mapping not found

**Common Resolution**: Verify resource existence before referencing; use resource listing endpoints.

### AST-11xx: Conflict Errors (409 Conflict)
- **AST-1013**: Duplicate harmonic code entry
- **AST-1029**: Concurrent calculation conflict

**Common Resolution**: Check for existing resources; implement optimistic locking for concurrent operations.

### AST-12xx: Processing Errors (422 Unprocessable Entity)
- **AST-1014**: Insufficient data for processing
- **AST-1023**: Incompatible calculation inputs
- **AST-1028**: Missing dependency data

**Common Resolution**: Ensure all prerequisites are met before initiating calculations.

### AST-14xx: Dependency Failures (424 Failed Dependency)
- **AST-1026**: Required upstream calculation incomplete

**Common Resolution**: Monitor calculation pipeline status; implement retry logic with dependency checks.

### AST-15xx: Rate Limiting (429 Too Many Requests)
- **AST-1017**: Batch calculation limit exceeded

**Common Resolution**: Implement request throttling; use batch processing with appropriate limits.

### AST-20xx: Internal Server Errors (500 Internal Server Error)
- **AST-1006**: Harmonic code generation failure
- **AST-1008**: Quarterly update failure
- **AST-1011**: Energy pattern overflow
- **AST-1012**: Compatibility score failure
- **AST-1015**: Planetary aspect calculation error
- **AST-1021**: Job queue failure
- **AST-1024**: Encryption failure
- **AST-1025**: Astronomical precision error
- **AST-1030**: Harmonic progression error

**Common Resolution**: Log detailed error context; alert DevOps team; implement automatic retry with exponential backoff.

### AST-30xx: Service Unavailability (503 Service Unavailable)
- **AST-1005**: Ephemeris data service down
- **AST-1019**: Database connection failure

**Common Resolution**: Implement health checks; automatic failover to backup services; queue requests for retry.

### AST-40xx: Timeout Errors (504 Gateway Timeout)
- **AST-1004**: Calculation timeout

**Common Resolution**: Increase timeout thresholds for complex calculations; implement async processing for long-running operations.

## Error Propagation

### Layer Architecture

```
API Gateway Layer
       ↓
Controller Layer (NestJS Controllers)
       ↓
Service Layer (Business Logic)
       ↓
Calculation Engine Layer
       ↓
Data Access Layer (MongoDB/PostgreSQL)
       ↓
External Services (Ephemeris API)
```

### Error Propagation Flow

#### 1. **Data Access Layer Errors**
- **Origin**: MongoDB/PostgreSQL query failures, connection issues
- **Handling**: 
  - Wrap database errors in custom `AstrologyDatabaseException`
  - Include query context and failed operation type
  - Log stack trace with correlation ID
- **Propagation**: Throw to Service Layer
- **Example**:
  ```typescript
  throw new AstrologyDatabaseException(
    'Failed to retrieve birth chart',
    { employeeId, errorCode: 'AST-1019' }
  );
  ```

#### 2. **External Service Errors**
- **Origin**: Ephemeris API failures, third-party astrology services
- **Handling**:
  - Catch HTTP errors and network timeouts
  - Transform to `ExternalServiceException`
  - Implement circuit breaker pattern (3 failures → open circuit for 60s)
  - Log external service response codes
- **Propagation**: Throw to Calculation Engine Layer
- **Example**:
  ```typescript
  throw new ExternalServiceException(
    'Ephemeris data unavailable',
    { errorCode: 'AST-1005', upstreamStatus: 503 }
  );
  ```

#### 3. **Calculation Engine Layer Errors**
- **Origin**: Astrological algorithm failures, mathematical errors
- **Handling**:
  - Validate all calculation inputs before processing
  - Catch arithmetic errors (division by zero, overflow)
  - Transform to `CalculationException` with algorithm context
  - Store failed calculation parameters for debugging
- **Propagation**: Throw to Service Layer
- **Example**:
  ```typescript
  throw new CalculationException(
    'Planetary aspect calculation failed',
    { 
      errorCode: 'AST-1015',
      algorithm: 'aspect-calculator',
      inputs: { planet1, planet2, orb }
    }
  );
  ```

#### 4. **Service Layer Errors**
- **Origin**: Business logic validation, workflow orchestration
- **Handling**:
  - Catch all lower-layer exceptions
  - Apply business logic error handling
  - Transform technical errors to user-friendly messages
  - Implement compensation logic for failed transactions
  - Coordinate rollback for multi-step operations
- **Propagation**: Throw to Controller Layer as `BusinessLogicException`
- **Example**:
  ```typescript
  try {
    await this.calculateBirthChart(employeeData);
    await this.generateHarmonicCode(employeeData);
  } catch (error) {
    await this.rollbackBirthChart(employeeId);
    throw new BusinessLogicException(
      'Birth chart calculation failed',
      { errorCode: 'AST-1004', originalError: error }
    );
  }
  ```

#### 5. **Controller Layer Errors**
- **Origin**: Request validation, authorization failures
- **Handling**:
  - Validate DTOs using `class-validator`
  - Check role-based access permissions
  - Catch all service layer exceptions
  - Map exceptions to appropriate HTTP status codes
  - Format error responses per API contract
- **Propagation**: Return HTTP error response
- **Example**:
  ```typescript
  @Post('birth-chart')
  async calculateBirthChart(@Body() dto: BirthChartDto) {
    try {
      return await this.astrologyService.calculate(dto);
    } catch (error) {
      if (error instanceof CalculationException) {
        throw new HttpException(
          {
            errorCode: error.errorCode,
            message: error.message,
            timestamp: new Date().toISOString()
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      throw error;
    }
  }
  ```

#### 6. **Global Exception Filter**
- **Purpose**: Catch-all for unhandled exceptions
- **Handling**:
  - Log all unhandled errors with full stack trace
  - Generate correlation IDs for error tracking
  - Return generic error response for security
  - Alert monitoring systems for critical errors
  - Send notifications to DevOps on-call
- **Response Format**:
  ```json
  {
    "errorCode": "AST-9999",
    "message": "An unexpected error occurred",
    "timestamp": "2025-11-11T10:30:00Z",
    "correlationId": "550e8400-e29b-41d4-a716-446655440000",
    "path": "/api/astrology/birth-chart"
  }
  ```

### Error Context Enrichment

Each layer enriches error context:

1. **Data Layer**: Adds database operation details
2. **External Service Layer**: Adds upstream service information
3. **Calculation Layer**: Adds algorithm and mathematical context
4. **Service Layer**: Adds business workflow context
5. **Controller Layer**: Adds HTTP request context
6. **Global Filter**: Adds correlation ID and system metadata

### Retry Logic

#### Transient Error Retry Strategy
- **Eligible Errors**: AST-1004, AST-1005, AST-1019, AST-1029
- **Retry Count**: 3 attempts
- **Backoff Strategy**: Exponential (1s, 2s, 4s)
- **Implementation**:
  ```typescript
  async calculateWithRetry(data: BirthData) {
    return await retry(
      () => this.calculate(data),
      {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        retryIf: (error) => error.isTransient
      }
    );
  }
  ```

#### Non-Retryable Errors
- **Validation Errors** (AST-1xxx): Require user input correction
- **Conflict Errors** (AST-11xx): Require user resolution
- **Unprocessable Errors** (AST-12xx): Require data completion

### Logging Strategy

#### Error Log Levels

- **ERROR**: Production failures requiring immediate attention (5xx errors)
- **WARN**: Degraded functionality, recoverable errors (4xx errors, retries)
- **INFO**: Normal operation events (successful retries, circuit breaker state changes)
- **DEBUG**: Detailed calculation steps (development only)

#### Log Format
```json
{
  "level": "ERROR",
  "timestamp": "2025-11-11T10:30:00Z",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "errorCode": "AST-1015",
  "message": "Planetary aspect calculation failed",
  "layer": "CalculationEngine",
  "userId": "user_123",
  "organizationId": "org_456",
  "context": {
    "algorithm": "aspect-calculator",
    "inputs": { "planet1": "Sun", "planet2": "Moon" }
  },
  "stackTrace": "..."
}
```

### Monitoring & Alerting

#### Critical Alerts (Immediate Response)
- Database connection failures (AST-1019)
- External service outages (AST-1005)
- Calculation engine failures (AST-1015)
- Quarterly job failures (AST-1021)

#### Warning Alerts (24-hour Response)
- High error rate (>5% requests)
- Increased timeout frequency (AST-1004)
- Circuit breaker activations
- Batch processing limit hits (AST-1017)

#### Monitoring Dashboards
- Error rate by error code
- Average calculation duration
- Retry success rate
- Queue processing metrics
- External service health status

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Status:** Complete