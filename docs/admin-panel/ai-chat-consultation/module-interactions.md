# Module Interactions - Dynamic AI Consultation

## Overview

This document describes how this module interacts with other internal modules in the monolith.

## Internal Module Dependencies

### Core Dependencies

#### Authentication Module (`auth`)
- **Purpose**: JWT validation and role-based access control
- **Integration Points**:
  - WebSocket authentication middleware
  - User role extraction for scope-based filtering
  - Session validation for chat requests
- **Data Flow**: Auth tokens → Role verification → Chat access authorization

#### Users Module (`users`)
- **Purpose**: User profile and organizational hierarchy management
- **Integration Points**:
  - Manager-employee relationship validation
  - Organizational scope boundary enforcement
  - User profile data for context enrichment
- **Data Flow**: User ID → Profile lookup → Scope determination

#### Employees Module (`employees`)
- **Purpose**: Employee data retrieval for AI context
- **Integration Points**:
  - Employee profile fetching for chat context
  - Birth chart and astrological data access
  - Department and role information retrieval
- **Data Flow**: Employee ID → Full profile → AI context preparation

#### Reports Module (`reports`)
- **Purpose**: Static report data access for AI responses
- **Integration Points**:
  - Personality and behavior report retrieval
  - Compatibility report data access
  - Training recommendation integration
  - Quarterly report version tracking
- **Data Flow**: Report queries → Cached/fresh data → AI context augmentation

#### Organizations Module (`organizations`)
- **Purpose**: Company structure and department hierarchy
- **Integration Points**:
  - Department boundary validation
  - Branch access control verification
  - Company culture and industry context
- **Data Flow**: Org ID → Hierarchy data → Access scope validation

#### Payments Module (`payments`)
- **Purpose**: Subscription status verification
- **Integration Points**:
  - Active subscription check before AI chat access
  - Usage quota validation (messages/month)
  - Feature tier verification
- **Data Flow**: Org ID → Subscription status → Feature availability

### Optional Dependencies

#### Email Module (`email`)
- **Purpose**: Chat transcript delivery and notifications
- **Integration Points**:
  - Chat summary email generation
  - Important insight notifications
  - Scheduled digest reports
- **Data Flow**: Chat session → Summary generation → Email dispatch

#### Cron Module (`cron`)
- **Purpose**: Chat history cleanup and archival
- **Integration Points**:
  - Old chat session archival
  - Context cache cleanup
  - Usage analytics aggregation
- **Data Flow**: Scheduled jobs → Data cleanup → Archival storage

## Communication Patterns

### Synchronous Communication

#### REST API Calls (Internal)

```typescript
// Employee data retrieval
GET /internal/employees/:employeeId
Response: EmployeeProfileDTO

// Report data access
GET /internal/reports/employee/:employeeId/all
Response: EmployeeReportsDTO[]

// Subscription validation
GET /internal/payments/organization/:orgId/subscription
Response: SubscriptionStatusDTO

// User scope validation
GET /internal/users/:userId/access-scope
Response: UserAccessScopeDTO
```

#### Service Injection Pattern

```typescript
@Injectable()
export class ChatService {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly reportsService: ReportsService,
    private readonly usersService: UsersService,
    private readonly paymentsService: PaymentsService,
    private readonly organizationsService: OrganizationsService,
  ) {}
}
```

### Asynchronous Communication

#### Event-Driven Patterns

**Event Publisher**: AI Chat Module

```typescript
// Events emitted by chat module
{
  'chat.session.started': { userId, employeeId, timestamp },
  'chat.message.sent': { sessionId, messageId, userId },
  'chat.ai.response.generated': { sessionId, tokensUsed, latency },
  'chat.session.ended': { sessionId, messageCount, duration },
  'chat.insight.discovered': { sessionId, insightType, relevantEmployees }
}
```

**Event Subscribers**: Other modules listening to chat events

```typescript
// Analytics module subscribes to usage events
@OnEvent('chat.ai.response.generated')
async handleAIResponseGenerated(payload: AIResponseEvent) {
  await this.analyticsService.trackAIUsage(payload);
}

// Reports module subscribes to insight discoveries
@OnEvent('chat.insight.discovered')
async handleInsightDiscovered(payload: InsightEvent) {
  await this.reportsService.flagForReview(payload);
}
```

#### BullMQ Queue Integration

**Queue Name**: `ai-chat-processing`

**Producer**: Chat Service

```typescript
// Heavy AI processing operations
await this.chatQueue.add('generate-response', {
  sessionId: session.id,
  userMessage: message,
  context: enrichedContext,
  priority: 1
});

await this.chatQueue.add('generate-team-analysis', {
  employeeIds: [id1, id2, id3],
  analysisType: 'compatibility',
  userId: requestingUser.id
});
```

**Consumer**: LLM Service

```typescript
@Processor('ai-chat-processing')
export class AIChatProcessor {
  @Process('generate-response')
  async handleResponse(job: Job) {
    const { sessionId, userMessage, context } = job.data;
    const response = await this.llmService.generateResponse(
      userMessage, 
      context
    );
    await this.chatService.saveAIResponse(sessionId, response);
    this.socketGateway.emitResponse(sessionId, response);
  }
}
```

### WebSocket Communication

#### Gateway Event Flow

```typescript
// Client → Server
@SubscribeMessage('chat.send.message')
async handleMessage(
  @MessageBody() data: ChatMessageDTO,
  @ConnectedSocket() client: Socket,
) {
  // 1. Validate user session (Auth module)
  const user = await this.authService.validateToken(client.handshake.auth.token);
  
  // 2. Validate access scope (Users module)
  const hasAccess = await this.usersService.canAccessEmployee(
    user.id, 
    data.employeeId
  );
  
  // 3. Fetch employee context (Employees module)
  const employee = await this.employeesService.findOne(data.employeeId);
  
  // 4. Fetch reports context (Reports module)
  const reports = await this.reportsService.findByEmployee(data.employeeId);
  
  // 5. Queue AI processing
  await this.chatQueue.add('generate-response', { ... });
}

// Server → Client
this.socketGateway.server
  .to(sessionId)
  .emit('chat.ai.response', {
    messageId: response.id,
    content: response.content,
    timestamp: new Date(),
    metadata: response.metadata
  });
```

## Shared Resources

### Databases

#### MongoDB Collections

**Owned by AI Chat Module**:
- `chat_sessions` - WebSocket session management
- `chat_messages` - Message history storage
- `chat_contexts` - Conversation context snapshots

**Shared Read Access**:
- `employees` (Employees module) - Employee profile data
- `reports` (Reports module) - Static report data
- `organizations` (Organizations module) - Company structure
- `users` (Users module) - User profiles and roles

**Access Pattern**:
```typescript
// Read-only access to other module collections
const employee = await this.employeeModel
  .findById(employeeId)
  .select('personalInfo professionalInfo birthChart')
  .lean()
  .exec();
```

#### Redis Stores

**Namespace**: `chat:*`

**Key Structures**:
```
chat:session:{sessionId} - Active session data (TTL: 24h)
chat:user-sessions:{userId} - User's active sessions set
chat:context:{sessionId} - Conversation context cache (TTL: 1h)
chat:rate-limit:{userId} - Rate limiting counters (TTL: 1min)
chat:typing:{sessionId} - Typing indicators (TTL: 5s)
```

**Shared Redis Access**:
- `auth:tokens:*` (Auth module) - JWT validation cache
- `subscription:status:*` (Payments module) - Subscription cache

### Caching Strategy

#### Context Caching

```typescript
// Multi-layer cache for employee context
async getEmployeeContext(employeeId: string): Promise<EmployeeContext> {
  // L1: Redis cache (fast, short TTL)
  const cached = await this.redis.get(`chat:context:employee:${employeeId}`);
  if (cached) return JSON.parse(cached);
  
  // L2: Aggregate from multiple modules
  const [employee, reports, organization] = await Promise.all([
    this.employeesService.findOne(employeeId),
    this.reportsService.findByEmployee(employeeId),
    this.organizationsService.findByEmployee(employeeId)
  ]);
  
  const context = this.buildContext(employee, reports, organization);
  
  // Cache for 1 hour
  await this.redis.setex(
    `chat:context:employee:${employeeId}`,
    3600,
    JSON.stringify(context)
  );
  
  return context;
}
```

#### Subscription Cache

```typescript
// Cache subscription status to avoid repeated DB queries
async validateSubscription(orgId: string): Promise<boolean> {
  const cacheKey = `chat:subscription:${orgId}`;
  const cached = await this.redis.get(cacheKey);
  
  if (cached !== null) return cached === 'active';
  
  const status = await this.paymentsService.getSubscriptionStatus(orgId);
  await this.redis.setex(cacheKey, 300, status); // 5 min cache
  
  return status === 'active';
}
```

### Queue Resources

#### Shared Queue: `ai-processing`

**Purpose**: Centralized AI operations queue

**Producers**:
- Chat Service (real-time chat responses)
- Reports Service (report generation)
- Cron Service (quarterly updates)

**Priority Levels**:
```typescript
enum AIJobPriority {
  REALTIME_CHAT = 1,      // Highest priority
  TEAM_ANALYSIS = 2,
  REPORT_GENERATION = 3,
  QUARTERLY_UPDATE = 4     // Lowest priority
}
```

**Resource Management**:
```typescript
// Job concurrency limits per type
const queueConfig = {
  'generate-response': { concurrency: 10 },      // Real-time chat
  'generate-team-analysis': { concurrency: 3 },  // Heavy analysis
  'generate-report': { concurrency: 5 }          // Report generation
};
```

## Data Flow Diagrams

### Chat Message Processing Flow

```
User Message
    ↓
WebSocket Gateway
    ↓
Auth Module (validate token)
    ↓
Users Module (check scope)
    ↓
Chat Service (save message)
    ↓
[Parallel Context Gathering]
    ├→ Employees Module (profile data)
    ├→ Reports Module (report data)
    └→ Organizations Module (company context)
    ↓
Context Manager (aggregate & cache)
    ↓
BullMQ Queue (ai-chat-processing)
    ↓
LLM Service (generate response)
    ↓
Chat Service (save AI response)
    ↓
WebSocket Gateway (emit to client)
```

### Team Analysis Request Flow

```
Manager Request (analyze 3 employees)
    ↓
Chat Service (validate request)
    ↓
Users Module (verify manager access to all 3)
    ↓
Payments Module (check subscription & quota)
    ↓
[Parallel Employee Data Fetch]
    ├→ Employee 1 Context
    ├→ Employee 2 Context
    └→ Employee 3 Context
    ↓
Context Manager (build team context)
    ↓
BullMQ Queue (heavy analysis job)
    ↓
LLM Service (team compatibility analysis)
    ↓
Reports Module (cross-reference compatibility reports)
    ↓
Chat Service (format & save analysis)
    ↓
WebSocket Gateway (emit results)
    ↓
Email Module (send summary to manager)
```

## Error Propagation

### Module Error Handling

```typescript
// Graceful degradation when dependent modules fail
async enrichContext(employeeId: string): Promise<PartialContext> {
  const context: PartialContext = { employeeId };
  
  try {
    context.profile = await this.employeesService.findOne(employeeId);
  } catch (error) {
    this.logger.warn('Failed to fetch employee profile', error);
    context.profile = null;
  }
  
  try {
    context.reports = await this.reportsService.findByEmployee(employeeId);
  } catch (error) {
    this.logger.warn('Failed to fetch reports', error);
    context.reports = [];
  }
  
  // Continue with partial context
  return context;
}
```

### Circuit Breaker Pattern

```typescript
// Prevent cascade failures from slow/failing modules
@Injectable()
export class ContextService {
  private circuitBreaker = new CircuitBreaker({
    timeout: 5000,
    errorThreshold: 50,
    resetTimeout: 30000
  });
  
  async fetchReportsWithCircuitBreaker(employeeId: string) {
    return this.circuitBreaker.execute(async () => {
      return await this.reportsService.findByEmployee(employeeId);
    });
  }
}
```

## Dependency Injection Graph

```
ChatModule
  ├─ ChatService
  │   ├─ @InjectModel(ChatSession)
  │   ├─ @InjectModel(ChatMessage)
  │   ├─ @Inject(CACHE_MANAGER)
  │   ├─ @InjectQueue('ai-chat-processing')
  │   ├─ EmployeesService (from EmployeesModule)
  │   ├─ ReportsService (from ReportsModule)
  │   ├─ UsersService (from UsersModule)
  │   ├─ PaymentsService (from PaymentsModule)
  │   └─ OrganizationsService (from OrganizationsModule)
  │
  ├─ ChatGateway
  │   ├─ ChatService
  │   ├─ AuthService (from AuthModule)
  │   └─ JwtService (from AuthModule)
  │
  ├─ LLMService
  │   ├─ OpenAIClient
  │   └─ ConfigService
  │
  ├─ ContextManagementService
  │   ├─ @Inject(CACHE_MANAGER)
  │   ├─ EmployeesService
  │   ├─ ReportsService
  │   └─ OrganizationsService
  │
  └─ AIChatProcessor
      ├─ LLMService
      ├─ ChatService
      └─ ChatGateway
```

## Transaction Boundaries

### Chat Session Lifecycle

```typescript
// Transactional boundaries for chat operations
async startChatSession(userId: string, employeeId: string): Promise<Session> {
  const session = await this.connection.transaction(async (txSession) => {
    // 1. Create chat session
    const newSession = await this.chatSessionModel.create(
      [{ userId, employeeId, startTime: new Date() }],
      { session: txSession }
    );
    
    // 2. Log in user activity (Users module)
    await this.usersService.logActivity(
      userId,
      'chat_session_started',
      { employeeId },
      { session: txSession }
    );
    
    // 3. Increment usage counter (Payments module)
    await this.paymentsService.incrementUsage(
      userId,
      'ai_chat_sessions',
      { session: txSession }
    );
    
    return newSession[0];
  });
  
  return session;
}
```

## Performance Considerations

### Module Call Optimization

```typescript
// Batch employee context fetching
async getMultipleEmployeeContexts(employeeIds: string[]) {
  // Single batched call instead of N individual calls
  const [employees, reportsMap, orgsMap] = await Promise.all([
    this.employeesService.findByIds(employeeIds),
    this.reportsService.findByEmployees(employeeIds),
    this.organizationsService.findByEmployees(employeeIds)
  ]);
  
  return employeeIds.map(id => ({
    employee: employees.find(e => e.id === id),
    reports: reportsMap[id] || [],
    organization: orgsMap[id]
  }));
}
```

### Lazy Loading Strategy

```typescript
// Load heavy data only when needed
async getChatContext(sessionId: string, includeReports = false) {
  const baseContext = await this.getBaseContext(sessionId);
  
  if (includeReports) {
    // Only fetch reports if AI explicitly needs them
    baseContext.reports = await this.reportsService.findByEmployee(
      baseContext.employeeId
    );
  }
  
  return baseContext;
}
```

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Status:** Complete