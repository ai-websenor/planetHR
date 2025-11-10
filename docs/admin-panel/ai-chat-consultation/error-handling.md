# Error Handling - Dynamic AI Consultation

## Error Scenarios Matrix

| Scenario | Error Code | HTTP Status | User Message | Resolution |
|----------|------------|-------------|--------------|------------|
| Invalid employee ID | CHAT_001 | 404 | "Employee not found or you don't have access to this employee" | Verify employee ID and user permissions |
| Insufficient permissions | CHAT_002 | 403 | "You don't have permission to access this employee's data" | Check role-based access control and organizational scope |
| Chat session not found | CHAT_003 | 404 | "Chat session not found or has expired" | Start a new chat session or verify session ID |
| LLM service unavailable | CHAT_004 | 503 | "AI service is temporarily unavailable. Please try again later" | Retry after configured delay, check LLM service health |
| LLM rate limit exceeded | CHAT_005 | 429 | "Too many requests. Please wait before sending more messages" | Implement exponential backoff, show wait time to user |
| Invalid message format | CHAT_006 | 400 | "Message format is invalid" | Validate message structure and content type |
| Message too long | CHAT_007 | 400 | "Message exceeds maximum length of 4000 characters" | Truncate message or split into multiple messages |
| Context retrieval failed | CHAT_008 | 500 | "Failed to load employee context" | Retry context fetch, fallback to basic employee data |
| WebSocket connection failed | CHAT_009 | 500 | "Failed to establish real-time connection" | Fallback to HTTP polling, check WebSocket configuration |
| Redis session timeout | CHAT_010 | 408 | "Session timed out due to inactivity" | Reconnect and restore session from MongoDB history |
| Invalid team composition | CHAT_011 | 400 | "Invalid team member selection" | Verify all team members exist and user has access |
| Missing employee reports | CHAT_012 | 404 | "Required reports not generated for this employee" | Trigger report generation before enabling chat |
| Concurrent session limit | CHAT_013 | 429 | "Maximum concurrent chat sessions reached" | Close inactive sessions or wait for session to end |
| AI response timeout | CHAT_014 | 504 | "AI response took too long. Please try again" | Retry with shorter context or simplified query |
| Chat history pagination error | CHAT_015 | 400 | "Invalid pagination parameters" | Verify limit and offset values are within bounds |
| Unauthorized chat access | CHAT_016 | 403 | "You cannot access this chat session" | Verify session ownership and role permissions |
| Employee data incomplete | CHAT_017 | 422 | "Employee profile is incomplete for AI analysis" | Complete required fields (birth date, department, role) |
| Token limit exceeded | CHAT_018 | 400 | "Conversation history too long. Starting fresh context" | Archive old messages, start new context window |
| Invalid query type | CHAT_019 | 400 | "Query type not supported for this analysis" | Check supported query types for employee/team analysis |
| Department access denied | CHAT_020 | 403 | "You don't have access to employees in this department" | Verify departmental scope and reporting hierarchy |
| AI content filter triggered | CHAT_021 | 400 | "Message contains inappropriate content" | Revise message to comply with content policy |
| Report data staleness | CHAT_022 | 409 | "Employee reports are outdated. Regeneration in progress" | Wait for quarterly update completion |
| Database connection lost | CHAT_023 | 503 | "Database connection lost. Please try again" | Retry after connection restoration, check MongoDB health |
| Invalid context parameters | CHAT_024 | 400 | "Invalid context configuration for this query" | Verify context type and employee scope parameters |
| Subscription expired | CHAT_025 | 402 | "Subscription expired. Renew to continue using AI chat" | Redirect to subscription renewal page |
| Feature not enabled | CHAT_026 | 403 | "AI chat feature not enabled for your subscription plan" | Upgrade subscription to access AI consultation |
| Chat export failed | CHAT_027 | 500 | "Failed to export chat history" | Retry export, check file system permissions |
| Invalid date range | CHAT_028 | 400 | "Invalid date range for chat history query" | Verify start date is before end date and within limits |
| Cache invalidation error | CHAT_029 | 500 | "Failed to update chat context cache" | Clear Redis cache manually, restart chat session |
| Multiple active sessions | CHAT_030 | 409 | "User has multiple active sessions for this employee" | Close duplicate sessions or merge session contexts |

## Common Error Codes

### Authentication & Authorization Errors (CHAT_001-006)

**CHAT_001: Invalid Employee ID**
- **Cause**: Employee not found in database or outside user's organizational scope
- **Recovery**: Validate employee ID against user's accessible employee list
- **Logging**: Log employee ID and requesting user for audit trail

**CHAT_002: Insufficient Permissions**
- **Cause**: User role doesn't have access to requested employee's data
- **Recovery**: Check role hierarchy (Owner → Leader → Manager) and department scope
- **Logging**: Log unauthorized access attempt with user role and target employee

**CHAT_003: Chat Session Not Found**
- **Cause**: Session expired from Redis or invalid session ID provided
- **Recovery**: Create new session or restore from MongoDB chat history
- **Logging**: Log session ID and expiration timestamp

### LLM Service Errors (CHAT_004-007)

**CHAT_004: LLM Service Unavailable**
- **Cause**: External LLM API endpoint unreachable or returning errors
- **Recovery**: 
  - Retry with exponential backoff (1s, 2s, 4s, 8s)
  - Fallback to cached responses for similar queries
  - Show service status page to user
- **Logging**: Log API endpoint, response status, and retry attempts

**CHAT_005: LLM Rate Limit Exceeded**
- **Cause**: Too many requests to LLM API within time window
- **Recovery**:
  - Queue messages for processing when rate limit resets
  - Show estimated wait time to user
  - Implement user-level rate limiting
- **Logging**: Log rate limit headers and reset timestamp

**CHAT_006: Invalid Message Format**
- **Cause**: Message payload doesn't match expected schema
- **Recovery**: Validate against DTO schema and provide specific field errors
- **Logging**: Log validation errors and invalid payload structure

**CHAT_007: Message Too Long**
- **Cause**: Message exceeds 4000 character limit
- **Recovery**: 
  - Truncate message with warning
  - Suggest splitting into multiple queries
  - Provide character count feedback in real-time
- **Logging**: Log message length and user ID

### Context & Data Errors (CHAT_008-012)

**CHAT_008: Context Retrieval Failed**
- **Cause**: Failed to fetch employee reports, astrological data, or harmonic codes
- **Recovery**:
  - Retry context fetch with reduced dataset
  - Use cached context if available
  - Proceed with limited context and notify user
- **Logging**: Log failed context sources and fallback actions

**CHAT_009: WebSocket Connection Failed**
- **Cause**: Network issues, firewall blocking, or WebSocket server unavailable
- **Recovery**:
  - Fallback to HTTP long polling
  - Retry WebSocket connection after delay
  - Provide connection status indicator
- **Logging**: Log WebSocket error codes and client information

**CHAT_010: Redis Session Timeout**
- **Cause**: No activity for configured timeout period (default 30 minutes)
- **Recovery**:
  - Restore session from MongoDB chat history
  - Rebuild context from last 10 messages
  - Notify user of session restoration
- **Logging**: Log session timeout duration and restoration status

**CHAT_011: Invalid Team Composition**
- **Cause**: Team members from different departments/branches, insufficient permissions, or non-existent employees
- **Recovery**:
  - Validate each team member against user's scope
  - Filter out inaccessible members with notification
  - Suggest valid team compositions
- **Logging**: Log invalid team member IDs and validation failures

**CHAT_012: Missing Employee Reports**
- **Cause**: Employee reports not yet generated or generation failed
- **Recovery**:
  - Trigger report generation asynchronously
  - Estimate completion time and notify user
  - Allow chat with limited context once basic reports available
- **Logging**: Log missing report types and generation trigger

### Session & Resource Errors (CHAT_013-018)

**CHAT_013: Concurrent Session Limit**
- **Cause**: User exceeded maximum concurrent chat sessions (default 5)
- **Recovery**:
  - List active sessions with timestamps
  - Provide session termination options
  - Auto-close oldest inactive session
- **Logging**: Log active session count and session IDs

**CHAT_014: AI Response Timeout**
- **Cause**: LLM processing exceeded timeout threshold (default 30 seconds)
- **Recovery**:
  - Cancel request and retry with reduced context
  - Break complex query into simpler parts
  - Provide partial response if available
- **Logging**: Log query complexity, context size, and timeout duration

**CHAT_015: Chat History Pagination Error**
- **Cause**: Invalid limit/offset values or exceeding maximum result set
- **Recovery**:
  - Enforce pagination limits (max 100 messages per page)
  - Validate offset against total message count
  - Provide pagination metadata in response
- **Logging**: Log invalid pagination parameters

**CHAT_016: Unauthorized Chat Access**
- **Cause**: Attempting to access another user's chat session
- **Recovery**:
  - Verify session ownership via JWT claims
  - Check role-based session sharing permissions
  - Redirect to user's own sessions
- **Logging**: Log unauthorized access attempt with session and user IDs

**CHAT_017: Employee Data Incomplete**
- **Cause**: Missing required fields for AI analysis (birth date, department, role)
- **Recovery**:
  - List missing required fields
  - Provide employee profile edit link
  - Allow chat with disclaimer about limited accuracy
- **Logging**: Log missing fields and employee ID

**CHAT_018: Token Limit Exceeded**
- **Cause**: Conversation history exceeds LLM context window (e.g., 128k tokens)
- **Recovery**:
  - Summarize older messages to reduce token count
  - Archive conversation and start fresh context
  - Retain key insights in condensed form
- **Logging**: Log token count and summarization actions

### Business Logic Errors (CHAT_019-026)

**CHAT_019: Invalid Query Type**
- **Cause**: Query type not supported for current analysis context
- **Recovery**:
  - List supported query types for employee/team/training analysis
  - Suggest alternative query formulations
  - Provide query examples and templates
- **Logging**: Log unsupported query type and context

**CHAT_020: Department Access Denied**
- **Cause**: Manager/Leader attempting to access employees outside their scope
- **Recovery**:
  - Display user's assigned departments/branches
  - Filter employee lists by accessible scope
  - Request access expansion from Owner if needed
- **Logging**: Log scope violation with department IDs

**CHAT_021: AI Content Filter Triggered**
- **Cause**: Message contains profanity, personal attacks, or policy violations
- **Recovery**:
  - Highlight problematic content sections
  - Provide content policy guidelines
  - Suggest alternative phrasings
- **Logging**: Log filter triggers and message content (redacted)

**CHAT_022: Report Data Staleness**
- **Cause**: Employee reports older than 90 days or quarterly update in progress
- **Recovery**:
  - Show last report generation date
  - Trigger quarterly update if eligible
  - Allow chat with staleness warning
- **Logging**: Log report age and update status

**CHAT_023: Database Connection Lost**
- **Cause**: MongoDB connection pool exhausted or network interruption
- **Recovery**:
  - Retry with connection pool refresh
  - Queue messages for processing after reconnection
  - Fallback to read replicas if available
- **Logging**: Log connection errors and retry attempts

**CHAT_024: Invalid Context Parameters**
- **Cause**: Context type mismatch or invalid employee scope for query
- **Recovery**:
  - Validate context parameters against query type
  - Provide parameter validation schema
  - Auto-correct common parameter mistakes
- **Logging**: Log invalid parameters and query type

**CHAT_025: Subscription Expired**
- **Cause**: Organization subscription lapsed, quarterly updates disabled
- **Recovery**:
  - Display subscription expiration date
  - Redirect to renewal payment page
  - Allow read-only access to existing chat history
- **Logging**: Log subscription status and expiration date

**CHAT_026: Feature Not Enabled**
- **Cause**: AI chat not included in current subscription tier
- **Recovery**:
  - Display feature comparison table
  - Provide upgrade options and pricing
  - Offer trial access for evaluation
- **Logging**: Log subscription tier and feature access attempt

### System & Export Errors (CHAT_027-030)

**CHAT_027: Chat Export Failed**
- **Cause**: File system permission issues or export format errors
- **Recovery**:
  - Retry export with different format (JSON/PDF/CSV)
  - Stream export for large chat histories
  - Provide partial export if full export fails
- **Logging**: Log export format, size, and error details

**CHAT_028: Invalid Date Range**
- **Cause**: Start date after end date or range exceeds maximum (90 days)
- **Recovery**:
  - Validate date range before query
  - Enforce maximum range limit
  - Provide date picker with valid range constraints
- **Logging**: Log invalid date range parameters

**CHAT_029: Cache Invalidation Error**
- **Cause**: Redis cache update failed or stale data persisting
- **Recovery**:
  - Force cache clear for affected session
  - Rebuild cache from MongoDB source of truth
  - Notify user of cache refresh
- **Logging**: Log cache key and invalidation failure reason

**CHAT_030: Multiple Active Sessions**
- **Cause**: User opened multiple tabs or concurrent devices
- **Recovery**:
  - Sync sessions via WebSocket broadcast
  - Merge session contexts intelligently
  - Provide session management UI
- **Logging**: Log session IDs and client information

## Error Propagation

### Layer-by-Layer Error Flow

```
User Input (WebSocket/HTTP)
    ↓
API Gateway/Controller Layer
    ├─ Validation errors → Immediate 400 response
    ├─ Authentication errors → 401/403 response
    └─ Valid request proceeds
        ↓
Chat Service Layer
    ├─ Business logic errors → Mapped to CHAT_* codes
    ├─ Permission checks → 403 response
    └─ Service call proceeds
        ↓
Context Management Service
    ├─ Employee data retrieval → Fallback to cached data
    ├─ Report fetching → Proceed with available reports
    └─ Context assembled
        ↓
LLM Service Layer
    ├─ Rate limiting → Queue or delay
    ├─ Timeout → Retry with reduced context
    ├─ Service unavailable → Fallback response
    └─ Response received
        ↓
Response Processing
    ├─ Format response → JSON/WebSocket message
    ├─ Store in MongoDB → Log storage failures
    ├─ Cache in Redis → Log cache failures
    └─ Deliver to user
        ↓
User Receives Response
```

### Error Propagation Rules

1. **Validation Errors (Controller Layer)**
   - Caught at entry point
   - Return immediate 400 response with field-level errors
   - Do not propagate to service layers
   - Log validation failures for monitoring

2. **Authentication/Authorization Errors**
   - Caught by guards at controller layer
   - Return 401 (unauthenticated) or 403 (unauthorized)
   - Log security violations for audit
   - Do not expose internal permission structure

3. **Service Layer Errors**
   - Wrap in custom exceptions (ChatServiceException)
   - Map to CHAT_* error codes
   - Include context for debugging
   - Propagate to error handler middleware

4. **External Service Errors (LLM, Database)**
   - Catch and wrap in service-specific exceptions
   - Implement retry logic before propagating
   - Use circuit breaker pattern for repeated failures
   - Provide fallback responses when possible

5. **WebSocket Error Propagation**
   - Emit `chat.error` event to client
   - Include error code and user-friendly message
   - Maintain connection for non-fatal errors
   - Close connection only for authentication failures

### Error Handler Middleware

```typescript
@Catch()
export class ChatErrorHandler implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    // Map exceptions to error codes
    const errorResponse = this.mapExceptionToErrorCode(exception);
    
    // Log error with context
    this.logger.error(errorResponse, exception.stack);
    
    // Send formatted response
    response.status(errorResponse.statusCode).json({
      errorCode: errorResponse.code,
      message: errorResponse.userMessage,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
```

### Error Context Enrichment

Each error is enriched with:
- **Request ID**: UUID for tracing
- **User ID**: For audit and debugging
- **Organization ID**: Multi-tenant context
- **Employee ID**: Subject of analysis (if applicable)
- **Session ID**: Chat session context
- **Timestamp**: ISO 8601 format
- **Stack Trace**: Development/staging only
- **Retry Attempts**: For transient failures

### Error Recovery Strategies

1. **Automatic Retry**: Transient network/API errors (max 3 attempts)
2. **Fallback Data**: Use cached context when fresh data unavailable
3. **Degraded Mode**: Proceed with limited functionality
4. **Queue for Later**: Rate limit or temporary unavailability
5. **User Notification**: Clear guidance on resolution steps

### Monitoring & Alerting

- **Error Rate Threshold**: Alert if >5% of requests fail
- **Specific Error Tracking**: Monitor CHAT_004, CHAT_005, CHAT_014 closely
- **User Impact**: Track errors per user/organization
- **Recovery Success**: Measure automatic recovery effectiveness
- **Error Trends**: Daily/weekly error pattern analysis

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Complete