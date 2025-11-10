# Technical Specifications - Dynamic AI Consultation

## Architecture Overview

This module is part of a monolithic application architecture with well-defined internal modules and layers.

The Dynamic AI Consultation module operates within the PlanetsHR monolithic NestJS application, providing real-time AI-powered chat capabilities for employee insights. The architecture follows a layered approach with clear separation of concerns:

- **Presentation Layer**: WebSocket gateways and REST controllers for real-time and HTTP communication
- **Business Logic Layer**: Service modules handling chat orchestration, LLM integration, and context management
- **Data Access Layer**: MongoDB repositories and Redis clients for persistent and session storage

The module integrates tightly with the existing authentication, user management, and employee modules while maintaining loose coupling through well-defined interfaces. WebSocket connections are established per user session with role-based access controls enforced at the gateway level.

Key architectural decisions:
- WebSocket for real-time bidirectional communication
- Redis for session management and typing indicators
- MongoDB for persistent chat history and context storage
- BullMQ queues for async LLM processing to prevent blocking
- Streaming responses for improved user experience
- Context window management for token optimization

## Application Modules

### chat-service

**Responsibility:**
Orchestrates real-time chat communication, manages WebSocket connections, handles message routing, and enforces role-based access controls for AI consultation sessions.

**Layer:** Presentation + Business Logic Layer

**Dependencies:**
- `llm-service` - For AI response generation
- `context-management-service` - For conversation context retrieval
- `users` - For user authentication and role validation
- `employees` - For employee data retrieval based on user scope
- `organizations` - For organization-level data isolation
- `auth` - For JWT token validation in WebSocket handshake
- Redis client for session management
- BullMQ for async message processing

**Exposed APIs:**
- WebSocket Gateway: `/chat` (Socket.IO namespace)
  - `chat.message` - Send message to AI
  - `chat.typing` - Typing indicator
  - `chat.session.start` - Initialize chat session
  - `chat.session.end` - Close chat session
  - `chat.history.load` - Load conversation history
- REST API:
  - `GET /api/v1/chat/sessions` - List active sessions
  - `GET /api/v1/chat/history/:sessionId` - Get session history
  - `DELETE /api/v1/chat/sessions/:sessionId` - End session
  - `POST /api/v1/chat/sessions` - Create new chat session

### llm-service

**Responsibility:**
Manages integration with OpenAI GPT-5 and Mastra.ai agents, handles prompt engineering, token management, response streaming, and error handling for AI interactions.

**Layer:** Business Logic + Integration Layer

**Dependencies:**
- `context-management-service` - For retrieving relevant employee context
- `employees` - For employee report data
- `organizations` - For company-specific prompt customization
- OpenAI SDK for GPT-5 integration
- Mastra.ai SDK for agent orchestration
- BullMQ for queue-based processing
- Redis for rate limiting and caching

**Exposed APIs:**
- Internal Service Methods:
  - `generateResponse(prompt, context, streamCallback)` - Generate AI response with streaming
  - `analyzeTeamCompatibility(employeeIds, context)` - Team analysis
  - `assessPromotionReadiness(employeeId, targetRole)` - Promotion analysis
  - `recommendTeamFormation(requirements, candidatePool)` - Team formation
  - `analyzeConflict(employee1Id, employee2Id)` - Conflict analysis
  - `optimizePerformance(employeeId, goals)` - Performance optimization
  - `generateTrainingGuidance(employeeId, skillGaps)` - Training recommendations
- Queue Jobs:
  - `llm.generate` - Async AI response generation
  - `llm.analyze` - Complex analysis tasks

### context-management-service

**Responsibility:**
Manages conversation context, retrieves relevant employee data, maintains chat history, optimizes context windows for token efficiency, and ensures role-based data filtering.

**Layer:** Business Logic + Data Access Layer

**Dependencies:**
- `employees` - For employee profile and report data
- `reports` - For accessing generated reports
- `users` - For role-based context filtering
- `organizations` - For organization hierarchy
- MongoDB for chat history storage
- Redis for context caching

**Exposed APIs:**
- Internal Service Methods:
  - `buildContext(sessionId, userId, query)` - Build conversation context
  - `getEmployeeContext(employeeId, userId)` - Get employee-specific context with role filtering
  - `getTeamContext(employeeIds, userId)` - Get team context
  - `storeMessage(sessionId, message, role)` - Store chat message
  - `getSessionHistory(sessionId, limit)` - Retrieve session history
  - `optimizeContextWindow(messages, maxTokens)` - Token optimization
  - `clearSessionContext(sessionId)` - Clear session cache
- Repository Methods:
  - `saveChatMessage(data)` - Persist message to MongoDB
  - `findSessionMessages(sessionId, options)` - Query messages
  - `updateContextMetadata(sessionId, metadata)` - Update context info


## Layered Architecture

### Presentation Layer

**Components:**
- `ChatGateway` - WebSocket gateway handling Socket.IO connections
- `ChatController` - REST API endpoints for session management
- `AuthMiddleware` - JWT validation for WebSocket handshake
- `RoleGuard` - Role-based access control enforcement

**Responsibilities:**
- WebSocket connection management and authentication
- Message validation and sanitization
- Real-time event emission (typing indicators, AI responses)
- Request/response transformation
- Error response formatting
- Rate limiting and connection throttling

**Key Patterns:**
- Socket.IO rooms for session isolation
- JWT extraction from WebSocket handshake query params
- Async message acknowledgment for delivery confirmation
- Heartbeat mechanism for connection health monitoring

**Technologies:**
- NestJS WebSocket Gateway (`@nestjs/websockets`)
- Socket.IO for WebSocket implementation
- class-validator for DTO validation
- class-transformer for data serialization

### Business Logic Layer

**Components:**
- `ChatOrchestrationService` - Main chat orchestration logic
- `LLMIntegrationService` - AI model integration
- `ContextBuilderService` - Context assembly and optimization
- `SessionManagementService` - Session lifecycle management
- `PromptEngineeringService` - Prompt template management
- `ResponseStreamingService` - Streaming response handling

**Responsibilities:**
- Chat session lifecycle management (create, maintain, destroy)
- Message routing and processing orchestration
- LLM prompt construction with role-specific instructions
- AI response generation and streaming
- Context window optimization and token management
- Employee data aggregation for context building
- Role-based data filtering and access control
- Use case specific analysis (team compatibility, promotion, etc.)
- Error handling and retry logic
- Usage tracking and analytics

**Key Patterns:**
- Strategy pattern for different AI use cases (employee chat, team analysis, promotion assessment)
- Builder pattern for context and prompt construction
- Observer pattern for streaming response chunks
- Chain of responsibility for context assembly pipeline
- Queue-based processing for async operations

**Technologies:**
- NestJS services with dependency injection
- BullMQ for job queues
- OpenAI SDK (GPT-5)
- Mastra.ai SDK
- RxJS for streaming and reactive patterns

### Data Access Layer

**Components:**
- `ChatRepository` - MongoDB chat history persistence
- `SessionRepository` - Session metadata storage
- `ContextCacheService` - Redis context caching
- `MessageQueueService` - BullMQ queue management

**Responsibilities:**
- Chat message persistence to MongoDB
- Session metadata CRUD operations
- Conversation history retrieval with pagination
- Context caching in Redis for performance
- Session state management in Redis
- Queue job creation and monitoring
- Data model transformation (entity ↔ DTO)
- Database connection pooling and optimization

**Key Patterns:**
- Repository pattern for data access abstraction
- Unit of work for transactional operations
- Cache-aside pattern for context caching
- Soft delete for chat history retention

**Technologies:**
- Mongoose ODM for MongoDB
- Redis client (ioredis)
- BullMQ for queue persistence
- MongoDB aggregation pipelines for complex queries

**Data Models:**
- `ChatMessage` - Individual chat messages
- `ChatSession` - Session metadata and configuration
- `ContextSnapshot` - Point-in-time context cache
- `UsageMetrics` - Token usage and analytics

## API Endpoints

### WebSocket Events (Socket.IO Namespace: `/chat`)

**Connection:**
- **Event**: `connection`
- **Auth**: JWT token in query params `?token=xxx`
- **Response**: `chat.connected` event with session info

**Send Message:**
- **Event**: `chat.message`
- **Payload**:
  ```typescript
  {
    sessionId: string;
    message: string;
    context?: {
      employeeId?: string;
      employeeIds?: string[];
      useCase: 'employee-chat' | 'team-analysis' | 'promotion' | 'conflict' | 'performance' | 'training';
    }
  }
  ```
- **Response**: `chat.ai.response.start`, `chat.ai.response.chunk`, `chat.ai.response.end`

**Typing Indicator:**
- **Event**: `chat.typing`
- **Payload**: `{ sessionId: string; isTyping: boolean }`
- **Broadcast**: Emits to session room

**Start Session:**
- **Event**: `chat.session.start`
- **Payload**: 
  ```typescript
  {
    employeeId?: string;
    employeeIds?: string[];
    useCase: string;
    metadata?: Record<string, any>;
  }
  ```
- **Response**: `chat.session.created` with `{ sessionId, contextSummary }`

**End Session:**
- **Event**: `chat.session.end`
- **Payload**: `{ sessionId: string }`
- **Response**: `chat.session.closed`

**Load History:**
- **Event**: `chat.history.load`
- **Payload**: `{ sessionId: string; limit?: number; offset?: number }`
- **Response**: `chat.history.loaded` with message array

### REST API Endpoints

**List Chat Sessions:**
- **Method**: `GET /api/v1/chat/sessions`
- **Auth**: Bearer JWT
- **Query Params**: `?status=active|closed&limit=20&offset=0`
- **Response**: `{ sessions: ChatSession[], total: number }`

**Get Session History:**
- **Method**: `GET /api/v1/chat/history/:sessionId`
- **Auth**: Bearer JWT (role-scoped)
- **Query Params**: `?limit=50&offset=0`
- **Response**: `{ messages: ChatMessage[], sessionInfo: SessionMetadata }`

**End Session:**
- **Method**: `DELETE /api/v1/chat/sessions/:sessionId`
- **Auth**: Bearer JWT
- **Response**: `{ success: true, sessionId: string }`

**Create Session:**
- **Method**: `POST /api/v1/chat/sessions`
- **Auth**: Bearer JWT
- **Body**:
  ```json
  {
    "employeeId": "string (optional)",
    "employeeIds": ["string"] (optional),
    "useCase": "employee-chat|team-analysis|promotion|conflict|performance|training",
    "metadata": {}
  }
  ```
- **Response**: `{ sessionId: string, status: 'active', createdAt: timestamp }`

**Get Session Analytics:**
- **Method**: `GET /api/v1/chat/analytics/:sessionId`
- **Auth**: Bearer JWT (Owner/Leader only)
- **Response**: 
  ```json
  {
    "tokenUsage": { "prompt": number, "completion": number, "total": number },
    "messageCount": number,
    "duration": number,
    "useCase": string
  }
  ```

## Database Schemas

### MongoDB Collections

**ChatMessage Schema:**
```typescript
{
  _id: ObjectId,
  sessionId: string (indexed),
  userId: string (indexed),
  organizationId: string (indexed),
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata: {
    employeeId?: string,
    employeeIds?: string[],
    useCase?: string,
    tokenCount?: number,
    model?: string
  },
  timestamp: Date,
  isDeleted: boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
sessionId + timestamp (compound)
userId + createdAt (compound)
organizationId + createdAt (compound)
```

**ChatSession Schema:**
```typescript
{
  _id: ObjectId,
  sessionId: string (unique, indexed),
  userId: string (indexed),
  organizationId: string (indexed),
  status: 'active' | 'closed' | 'expired',
  useCase: string,
  context: {
    employeeId?: string,
    employeeIds?: string[],
    scope: string,
    filters: object
  },
  analytics: {
    messageCount: number,
    totalTokens: number,
    promptTokens: number,
    completionTokens: number,
    duration: number
  },
  metadata: object,
  startedAt: Date,
  endedAt?: Date,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
sessionId (unique)
userId + status (compound)
organizationId + status (compound)
expiresAt (TTL index)
```

**ContextSnapshot Schema:**
```typescript
{
  _id: ObjectId,
  sessionId: string (indexed),
  snapshot: {
    employeeData: object,
    reportsData: object[],
    conversationSummary: string,
    relevantContext: object[]
  },
  tokenEstimate: number,
  createdAt: Date,
  ttl: Date (TTL indexed)
}

// Indexes
sessionId (unique)
ttl (TTL index for auto-cleanup)
```

### Redis Data Structures

**Active Sessions:**
- **Key**: `chat:session:{sessionId}`
- **Type**: Hash
- **Fields**: `userId`, `status`, `connectedAt`, `lastActivity`
- **TTL**: 1 hour (sliding expiration on activity)

**Typing Indicators:**
- **Key**: `chat:typing:{sessionId}:{userId}`
- **Type**: String
- **Value**: `true`
- **TTL**: 5 seconds

**Context Cache:**
- **Key**: `chat:context:{sessionId}`
- **Type**: String (JSON serialized)
- **Value**: Serialized context object
- **TTL**: 30 minutes

**Rate Limiting:**
- **Key**: `chat:ratelimit:{userId}:{window}`
- **Type**: String (counter)
- **TTL**: 1 minute
- **Limit**: 30 messages per minute per user

**Message Queue (BullMQ):**
- **Queue Name**: `llm-processing`
- **Job Types**: `generate`, `analyze`, `stream`
- **Persistence**: Redis-backed queue

## Caching Strategy

**Multi-Level Caching Approach:**

1. **Session-Level Context Caching (Redis)**
   - **What**: Complete conversation context including employee data, reports, and chat history
   - **TTL**: 30 minutes (sliding on activity)
   - **Invalidation**: On session end, or when employee data updates
   - **Purpose**: Reduce database queries for context assembly

2. **Employee Data Caching (Redis)**
   - **What**: Frequently accessed employee profiles and reports
   - **TTL**: 1 hour
   - **Invalidation**: On employee data updates via event listeners
   - **Purpose**: Minimize MongoDB reads for employee context

3. **Prompt Template Caching (In-Memory)**
   - **What**: Compiled prompt templates per use case
   - **TTL**: Application lifetime (cleared on restart)
   - **Purpose**: Avoid template parsing on every request

4. **LLM Response Caching (Redis - Optional)**
   - **What**: Identical queries with same context (hash-based key)
   - **TTL**: 5 minutes
   - **Invalidation**: Time-based only
   - **Purpose**: Reduce OpenAI API calls for repeated questions
   - **Note**: Disabled by default, configurable per use case

5. **WebSocket Connection State (Redis)**
   - **What**: Active connections, user presence, typing indicators
   - **TTL**: Session-based (1 hour max)
   - **Purpose**: Enable horizontal scaling of WebSocket servers

**Cache Warming:**
- Pre-fetch employee context on session start
- Background job to refresh context before expiration
- Proactive loading of related employee data

**Cache Invalidation Events:**
- Employee data updated → Clear employee context cache
- Report regenerated → Clear report cache and session contexts
- Session ended → Clear all session-related caches
- User role changed → Clear permission-cached contexts

**Fallback Strategy:**
- Cache miss → Fetch from MongoDB → Store in cache
- Redis unavailable → Direct MongoDB queries (degraded mode)
- Cache corruption → Log error, rebuild from source

**Performance Targets:**
- Context retrieval: <50ms (cached), <200ms (uncached)
- Message processing: <100ms (excluding LLM)
- LLM response start: <2s (first token)
- Cache hit ratio: >85% for active sessions

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Draft