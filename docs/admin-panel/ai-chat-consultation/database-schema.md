# Database Schema - Dynamic AI Consultation

## Overview

This document defines the MongoDB collections and Redis data structures used by the Dynamic AI Consultation module for managing real-time chat sessions, conversation history, and AI context.

### MongoDB (chat history, context)

MongoDB serves as the persistent storage layer for chat conversations, AI context, session metadata, and analytics data. All collections support multi-tenant isolation through organization/branch/department scoping.

### Redis (real-time chat sessions)

Redis provides in-memory storage for active WebSocket sessions, typing indicators, presence information, and real-time message queues with automatic TTL-based cleanup.

---

## MongoDB Collections

### 1. ChatConversations Collection

Stores complete conversation threads between users and AI system.

```typescript
{
  _id: ObjectId,
  conversationId: String,              // Unique conversation identifier
  organizationId: ObjectId,            // Reference to organizations collection
  branchId: ObjectId,                  // Reference to branches collection
  departmentId: ObjectId,              // Reference to departments collection
  userId: ObjectId,                    // Reference to users collection (Owner/Leader/Manager)
  userRole: String,                    // 'owner' | 'leader' | 'manager'
  
  // Conversation Metadata
  type: String,                        // 'employee_specific' | 'team_compatibility' | 'one_to_one' | 'promotion_readiness' | 'team_formation' | 'conflict_resolution' | 'performance_optimization' | 'training_guidance'
  title: String,                       // Auto-generated or user-defined conversation title
  
  // Subject References
  subjectEmployeeIds: [ObjectId],      // Employee(s) being discussed
  subjectType: String,                 // 'single_employee' | 'team' | 'department' | 'comparison'
  
  // Conversation State
  status: String,                      // 'active' | 'archived' | 'deleted'
  isPinned: Boolean,                   // User-pinned conversation
  lastMessageAt: Date,                 // Timestamp of last message
  messageCount: Number,                // Total messages in conversation
  
  // AI Context
  contextSummary: String,              // AI-generated summary of conversation
  keyInsights: [String],               // Important insights from conversation
  relatedReportIds: [ObjectId],        // Related static reports referenced
  
  // Access Control
  accessScope: {
    allowedRoles: [String],            // Roles permitted to access
    allowedUserIds: [ObjectId],        // Specific users with access
    isPrivate: Boolean                 // Private to creator only
  },
  
  // Analytics
  totalTokensUsed: Number,             // Total LLM tokens consumed
  averageResponseTime: Number,         // Average AI response time (ms)
  userSatisfactionRating: Number,      // Optional 1-5 rating
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  archivedAt: Date,
  deletedAt: Date                      // Soft delete
}
```

**Indexes:**
```javascript
{ conversationId: 1 } // Unique
{ userId: 1, createdAt: -1 }
{ organizationId: 1, status: 1, lastMessageAt: -1 }
{ subjectEmployeeIds: 1, status: 1 }
{ type: 1, organizationId: 1, createdAt: -1 }
{ "accessScope.allowedUserIds": 1 }
```

---

### 2. ChatMessages Collection

Individual messages within conversations with AI responses and metadata.

```typescript
{
  _id: ObjectId,
  messageId: String,                   // Unique message identifier
  conversationId: String,              // Reference to ChatConversations
  
  // Message Content
  role: String,                        // 'user' | 'assistant' | 'system'
  content: String,                     // Message text content
  contentType: String,                 // 'text' | 'structured_data' | 'report_reference'
  
  // User Message Data
  userId: ObjectId,                    // Message sender (for user messages)
  userRole: String,                    // Sender role
  
  // AI Response Data
  aiModel: String,                     // LLM model used (e.g., 'gpt-4-turbo')
  aiResponseMetadata: {
    tokensUsed: Number,                // Tokens consumed
    responseTime: Number,              // Generation time (ms)
    temperature: Number,               // Model temperature used
    confidenceScore: Number,           // AI confidence (0-1)
    sources: [String]                  // Data sources referenced
  },
  
  // Context References
  referencedEmployees: [{
    employeeId: ObjectId,
    employeeName: String,
    relevance: String                  // Why employee was referenced
  }],
  referencedReports: [{
    reportId: ObjectId,
    reportType: String,
    accessedAt: Date
  }],
  
  // Structured Data (for analysis results)
  structuredData: {
    analysisType: String,              // Type of analysis performed
    scores: Map,                       // Compatibility/performance scores
    recommendations: [String],         // Specific recommendations
    insights: [String],                // Key insights
    dataPoints: Map                    // Additional structured data
  },
  
  // Message State
  status: String,                      // 'sending' | 'sent' | 'error' | 'retrying'
  errorDetails: {
    errorCode: String,
    errorMessage: String,
    retryCount: Number
  },
  
  // User Interaction
  feedback: {
    isHelpful: Boolean,                // Thumbs up/down
    rating: Number,                    // 1-5 stars
    comment: String,                   // User feedback text
    submittedAt: Date
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date                      // Soft delete
}
```

**Indexes:**
```javascript
{ messageId: 1 } // Unique
{ conversationId: 1, createdAt: 1 }
{ userId: 1, createdAt: -1 }
{ "referencedEmployees.employeeId": 1 }
{ status: 1, createdAt: -1 }
```

---

### 3. ChatContexts Collection

Persistent AI context storage for maintaining conversation memory and employee-specific knowledge.

```typescript
{
  _id: ObjectId,
  contextId: String,                   // Unique context identifier
  conversationId: String,              // Reference to ChatConversations
  
  // Context Scope
  scopeType: String,                   // 'conversation' | 'employee' | 'team' | 'department'
  scopeReference: ObjectId,            // ID of referenced entity
  
  // Employee Context Data
  employeeContext: {
    employeeId: ObjectId,
    employeeName: String,
    
    // Cached Employee Data
    personalityTraits: [String],
    behavioralPatterns: [String],
    compatibilityScores: {
      jobRole: Number,
      department: Number,
      company: Number,
      industry: Number
    },
    
    // Astrological Data
    astrologyData: {
      sunSign: String,
      moonSign: String,
      risingSign: String,
      harmonicCode: String,
      lastHarmonicUpdate: Date
    },
    
    // Recent Insights
    recentInsights: [String],
    discussionTopics: [String],        // Topics discussed about this employee
    
    // Performance Data
    performanceIndicators: Map,
    trainingNeeds: [String],
    strengths: [String],
    developmentAreas: [String]
  },
  
  // Team Context Data
  teamContext: {
    teamMemberIds: [ObjectId],
    teamDynamics: String,              // AI-generated team dynamics summary
    compatibilityMatrix: Map,          // Member compatibility scores
    conflictAreas: [String],
    synergies: [String]
  },
  
  // Conversation Memory
  conversationMemory: {
    keyPoints: [String],               // Important points from conversation
    decisions: [String],               // Decisions or conclusions reached
    followUpItems: [String],           // Items requiring follow-up
    previousQueries: [String],         // Recent user queries
    contextWindow: String              // Summarized conversation context
  },
  
  // Referenced Reports
  reportReferences: [{
    reportId: ObjectId,
    reportType: String,
    lastAccessed: Date,
    keyFindings: [String]              // Relevant findings from report
  }],
  
  // Context Metadata
  tokenCount: Number,                  // Approximate token count of context
  lastUpdated: Date,
  expiresAt: Date,                     // Context expiration (TTL)
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
{ contextId: 1 } // Unique
{ conversationId: 1 }
{ "employeeContext.employeeId": 1 }
{ expiresAt: 1 } // TTL index
{ scopeType: 1, scopeReference: 1 }
```

---

### 4. ChatAnalytics Collection

Analytics and metrics for chat usage, AI performance, and user engagement.

```typescript
{
  _id: ObjectId,
  analyticsId: String,                 // Unique analytics record identifier
  
  // Scope
  organizationId: ObjectId,
  branchId: ObjectId,
  departmentId: ObjectId,
  userId: ObjectId,
  
  // Time Period
  periodType: String,                  // 'daily' | 'weekly' | 'monthly'
  periodStart: Date,
  periodEnd: Date,
  
  // Usage Metrics
  usageMetrics: {
    totalConversations: Number,
    totalMessages: Number,
    uniqueUsers: Number,
    averageMessagesPerConversation: Number,
    averageConversationDuration: Number, // Minutes
    peakUsageHours: [Number]           // Hour of day (0-23)
  },
  
  // AI Performance Metrics
  aiMetrics: {
    totalTokensUsed: Number,
    averageResponseTime: Number,       // Milliseconds
    averageConfidenceScore: Number,
    errorRate: Number,                 // Percentage
    retryCount: Number
  },
  
  // Feature Usage
  featureUsage: {
    employeeSpecific: Number,          // Count of conversations by type
    teamCompatibility: Number,
    oneToOne: Number,
    promotionReadiness: Number,
    teamFormation: Number,
    conflictResolution: Number,
    performanceOptimization: Number,
    trainingGuidance: Number
  },
  
  // User Satisfaction
  satisfactionMetrics: {
    totalRatings: Number,
    averageRating: Number,             // 1-5
    helpfulCount: Number,              // Thumbs up count
    unhelpfulCount: Number,            // Thumbs down count
    feedbackComments: Number           // Count of feedback comments
  },
  
  // Content Metrics
  contentMetrics: {
    mostDiscussedEmployees: [{
      employeeId: ObjectId,
      mentionCount: Number
    }],
    commonTopics: [{
      topic: String,
      frequency: Number
    }],
    reportAccessCount: Map             // reportType -> count
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
{ analyticsId: 1 } // Unique
{ organizationId: 1, periodType: 1, periodStart: -1 }
{ userId: 1, periodStart: -1 }
{ periodType: 1, periodStart: 1, periodEnd: 1 }
```

---

### 5. ChatSessions Collection

Metadata for active and historical chat sessions with connection tracking.

```typescript
{
  _id: ObjectId,
  sessionId: String,                   // Unique session identifier
  
  // User Information
  userId: ObjectId,
  organizationId: ObjectId,
  branchId: ObjectId,
  departmentId: ObjectId,
  userRole: String,
  
  // Connection Details
  connectionId: String,                // WebSocket connection ID
  socketId: String,                    // Socket.io socket ID
  ipAddress: String,
  userAgent: String,
  
  // Session State
  status: String,                      // 'active' | 'idle' | 'disconnected' | 'expired'
  lastActivity: Date,
  
  // Active Conversations
  activeConversations: [{
    conversationId: String,
    joinedAt: Date,
    lastMessageAt: Date
  }],
  
  // Session Metadata
  deviceType: String,                  // 'desktop' | 'mobile' | 'tablet'
  browser: String,
  platform: String,
  
  // Presence Information
  presenceStatus: String,              // 'online' | 'away' | 'busy'
  lastSeenAt: Date,
  
  // Session Duration
  connectedAt: Date,
  disconnectedAt: Date,
  totalDuration: Number,               // Seconds
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  expiresAt: Date                      // TTL for cleanup
}
```

**Indexes:**
```javascript
{ sessionId: 1 } // Unique
{ userId: 1, status: 1 }
{ connectionId: 1 }
{ status: 1, lastActivity: -1 }
{ expiresAt: 1 } // TTL index
```

---

## Redis Data Structures

### 1. Active WebSocket Sessions

**Key Pattern:** `chat:session:{sessionId}`

**Data Type:** Hash

**Structure:**
```typescript
{
  userId: string,
  organizationId: string,
  userRole: string,
  socketId: string,
  connectionId: string,
  connectedAt: string,              // ISO timestamp
  lastActivity: string,             // ISO timestamp
  presenceStatus: string,           // 'online' | 'away' | 'busy'
  activeConversations: string       // JSON array of conversationIds
}
```

**TTL:** 24 hours (auto-refresh on activity)

---

### 2. User Presence Tracking

**Key Pattern:** `chat:presence:{userId}`

**Data Type:** String

**Value:** `{sessionId}|{presenceStatus}|{lastSeenTimestamp}`

**TTL:** 5 minutes (continuously updated)

---

### 3. Typing Indicators

**Key Pattern:** `chat:typing:{conversationId}:{userId}`

**Data Type:** String

**Value:** `typing`

**TTL:** 5 seconds (auto-expire when typing stops)

---

### 4. Real-time Message Queue

**Key Pattern:** `chat:queue:{conversationId}`

**Data Type:** List

**Structure:** FIFO queue of message objects (JSON strings)

```typescript
{
  messageId: string,
  role: string,
  content: string,
  timestamp: string,
  userId: string,
  status: string
}
```

**TTL:** 1 hour

---

### 5. AI Response Cache

**Key Pattern:** `chat:ai-cache:{queryHash}`

**Data Type:** String (JSON)

**Structure:**
```typescript
{
  query: string,
  response: string,
  aiModel: string,
  tokensUsed: number,
  confidenceScore: number,
  generatedAt: string,
  cacheHits: number
}
```

**TTL:** 1 hour (for frequently asked questions)

---

### 6. Rate Limiting

**Key Pattern:** `chat:ratelimit:{userId}:{window}`

**Data Type:** String (counter)

**Value:** Number of requests in time window

**TTL:** 
- `chat:ratelimit:{userId}:minute` - 60 seconds
- `chat:ratelimit:{userId}:hour` - 3600 seconds
- `chat:ratelimit:{userId}:day` - 86400 seconds

**Limits:**
- Owner: 100 messages/minute
- Leader: 75 messages/minute
- Manager: 50 messages/minute

---

### 7. Active Conversation Participants

**Key Pattern:** `chat:participants:{conversationId}`

**Data Type:** Set

**Members:** User IDs currently viewing the conversation

**TTL:** Auto-cleanup on empty set

---

### 8. WebSocket Room Mapping

**Key Pattern:** `chat:room:{conversationId}`

**Data Type:** Set

**Members:** Socket IDs connected to conversation room

**TTL:** Auto-cleanup on empty set

---

### 9. AI Processing Queue Status

**Key Pattern:** `chat:ai-queue:{conversationId}:{messageId}`

**Data Type:** Hash

**Structure:**
```typescript
{
  status: string,                   // 'queued' | 'processing' | 'completed' | 'failed'
  queuedAt: string,
  processingStartedAt: string,
  completedAt: string,
  retryCount: string,
  error: string
}
```

**TTL:** 15 minutes

---

### 10. Context Cache

**Key Pattern:** `chat:context:{conversationId}`

**Data Type:** String (JSON)

**Structure:**
```typescript
{
  employeeData: object,
  recentMessages: array,
  reportReferences: array,
  lastUpdated: string,
  tokenCount: number
}
```

**TTL:** 30 minutes (refreshed on conversation activity)

---

## Data Retention Policy

### MongoDB Collections

| Collection | Retention Period | Archive Strategy |
|------------|------------------|------------------|
| ChatConversations | 2 years | Archive to cold storage after 1 year of inactivity |
| ChatMessages | 2 years | Archive messages older than 1 year |
| ChatContexts | 90 days | Auto-delete based on expiresAt TTL index |
| ChatAnalytics | 5 years | Aggregate older data into summary records |
| ChatSessions | 90 days | Auto-delete based on expiresAt TTL index |

### Redis Data

All Redis keys have automatic TTL-based expiration. No manual cleanup required.

---

## Migration Strategy

### Phase 1: Initial Schema Deployment (Week 1)

1. **MongoDB Setup**
   - Create collections with validation schemas
   - Deploy indexes for performance optimization
   - Configure TTL indexes for auto-cleanup
   - Set up multi-tenant isolation rules

2. **Redis Setup**
   - Configure Redis with appropriate memory limits
   - Set up key eviction policies (volatile-ttl)
   - Configure persistence (AOF + RDB snapshots)
   - Deploy sentinel for high availability

### Phase 2: Data Migration (Week 2)

1. **Historical Data Import** (if migrating from existing system)
   - Extract conversation history from legacy system
   - Transform data to new schema format
   - Bulk import using MongoDB bulk operations
   - Validate data integrity post-migration

2. **Index Optimization**
   - Monitor index usage and performance
   - Create additional indexes based on query patterns
   - Optimize compound indexes for common queries

### Phase 3: Testing & Validation (Week 3)

1. **Load Testing**
   - Test concurrent WebSocket connections (1000+ users)
   - Validate Redis performance under load
   - Test MongoDB query performance with large datasets
   - Stress test AI response queue processing

2. **Data Validation**
   - Verify referential integrity
   - Test TTL-based cleanup operations
   - Validate multi-tenant data isolation
   - Test backup and restore procedures

### Phase 4: Production Deployment (Week 4)

1. **Phased Rollout**
   - Deploy to staging environment
   - Run parallel systems for 1 week
   - Gradual user migration by organization
   - Monitor error rates and performance metrics

2. **Monitoring Setup**
   - Configure MongoDB Atlas monitoring
   - Set up Redis monitoring and alerts
   - Deploy application performance monitoring (APM)
   - Create dashboards for real-time metrics

### Migration Rollback Plan

**Rollback Triggers:**
- Data corruption detected
- Performance degradation > 50%
- Critical functionality failures
- Security vulnerabilities discovered

**Rollback Procedure:**
1. Switch application to read-only mode
2. Restore MongoDB from latest snapshot
3. Revert Redis configuration to previous version
4. Redirect traffic to legacy system
5. Investigate and fix issues before retry

### Database Versioning

**Schema Version Tracking:**
```typescript
// migrations collection
{
  _id: ObjectId,
  version: String,                  // e.g., "1.0.0"
  name: String,                     // Migration name
  appliedAt: Date,
  status: String,                   // 'completed' | 'failed' | 'rolled_back'
  executionTime: Number,            // Milliseconds
  changes: [String]                 // List of changes applied
}
```

**Migration Scripts Location:** `/migrations/chat-module/`

**Migration Execution:** Automated via NestJS TypeORM/Mongoose migration runner

---

## Performance Optimization

### MongoDB Optimization

1. **Index Strategy**
   - Compound indexes for frequently filtered queries
   - Sparse indexes for optional fields
   - Text indexes for message content search
   - Geospatial indexes if location-based features added

2. **Query Optimization**
   - Use projection to limit returned fields
   - Implement pagination for large result sets
   - Use aggregation pipeline for complex analytics
   - Cache frequently accessed data in Redis

3. **Sharding Strategy** (for large deployments)
   - Shard key: `organizationId` for tenant isolation
   - Config servers: 3 nodes
   - Shard clusters: 2+ replica sets
   - Balancer: Enabled during off-peak hours

### Redis Optimization

1. **Memory Management**
   - Set maxmemory policy: `volatile-ttl`
   - Monitor memory usage and adjust TTLs
   - Use Redis Cluster for horizontal scaling
   - Implement connection pooling

2. **Data Structure Selection**
   - Use Hashes for objects (more memory efficient)
   - Use Sets for unique collections
   - Use Sorted Sets for time-ordered data
   - Use Strings for simple key-value pairs

3. **Performance Tuning**
   - Enable pipelining for bulk operations
   - Use Redis transactions for atomic operations
   - Implement connection pooling (min: 10, max: 100)
   - Configure appropriate timeout values

---

## Backup & Disaster Recovery

### MongoDB Backup Strategy

- **Frequency:** Continuous (MongoDB Atlas Point-in-Time Recovery)
- **Retention:** 
  - Daily snapshots: 30 days
  - Weekly snapshots: 12 weeks
  - Monthly snapshots: 12 months
- **Backup Method:** Automated Atlas snapshots + manual exports
- **Storage:** AWS S3 with cross-region replication

### Redis Backup Strategy

- **Persistence:** AOF (Append-Only File) + RDB snapshots
- **Snapshot Frequency:** Every 15 minutes if changes detected
- **AOF Sync:** Every second (fsync always)
- **Backup Storage:** S3 with 7-day retention
- **Disaster Recovery:** Redis Sentinel with automatic failover

### Recovery Time Objectives (RTO)

- **MongoDB:** < 1 hour for complete restore
- **Redis:** < 5 minutes (automatic failover)
- **Application:** < 15 minutes (rolling deployment)

### Recovery Point Objectives (RPO)

- **MongoDB:** < 5 minutes (PITR)
- **Redis:** < 1 minute (AOF)
- **Chat Sessions:** < 1 second (real-time replication)

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** Production Ready