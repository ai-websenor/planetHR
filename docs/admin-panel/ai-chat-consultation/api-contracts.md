# API Contracts - Dynamic AI Consultation

## Overview

This document defines all API endpoints (internal and external) for the Dynamic AI Consultation module. The module operates within a NestJS monolithic architecture with internal module communication and external REST/WebSocket interfaces.

## External APIs

### REST Endpoints

#### 1. Chat Management

##### POST /api/v1/chat/sessions
**Description**: Create a new AI consultation chat session

**Authentication**: Required (JWT)

**Authorization**: Owner, Leader, Manager

**Request Body**:
```typescript
{
  "sessionType": "employee_analysis" | "team_compatibility" | "promotion_readiness" | "training_guidance",
  "context": {
    "employeeId"?: string,           // Required for employee_analysis
    "employeeIds"?: string[],        // Required for team_compatibility
    "departmentId"?: string,         // Optional context
    "specificQuery"?: string         // Optional initial query
  }
}
```

**Response**: `201 Created`
```typescript
{
  "success": true,
  "data": {
    "sessionId": string,
    "sessionType": string,
    "createdAt": string,
    "expiresAt": string,
    "websocketUrl": string,
    "context": {
      "employeeNames": string[],
      "departmentName": string,
      "availableReports": string[]
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid session type or missing required context
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: User lacks access to specified employees
- `404 Not Found`: Employee or department not found

---

##### GET /api/v1/chat/sessions
**Description**: List all chat sessions for the authenticated user

**Authentication**: Required (JWT)

**Authorization**: Owner, Leader, Manager

**Query Parameters**:
```typescript
{
  "page"?: number,              // Default: 1
  "limit"?: number,             // Default: 20, Max: 100
  "sessionType"?: string,       // Filter by session type
  "employeeId"?: string,        // Filter by employee
  "dateFrom"?: string,          // ISO date
  "dateTo"?: string,            // ISO date
  "sortBy"?: "createdAt" | "lastMessageAt",  // Default: lastMessageAt
  "sortOrder"?: "asc" | "desc"  // Default: desc
}
```

**Response**: `200 OK`
```typescript
{
  "success": true,
  "data": {
    "sessions": [
      {
        "sessionId": string,
        "sessionType": string,
        "context": {
          "employeeNames": string[],
          "departmentName": string
        },
        "messageCount": number,
        "createdAt": string,
        "lastMessageAt": string,
        "preview": string           // Last message preview
      }
    ],
    "pagination": {
      "currentPage": number,
      "totalPages": number,
      "totalItems": number,
      "itemsPerPage": number
    }
  }
}
```

---

##### GET /api/v1/chat/sessions/:sessionId
**Description**: Retrieve a specific chat session with full history

**Authentication**: Required (JWT)

**Authorization**: Owner, Leader, Manager (scope-restricted)

**Path Parameters**:
- `sessionId`: string (UUID)

**Query Parameters**:
```typescript
{
  "messageLimit"?: number,      // Default: 50, Max: 200
  "messageOffset"?: number      // Default: 0
}
```

**Response**: `200 OK`
```typescript
{
  "success": true,
  "data": {
    "sessionId": string,
    "sessionType": string,
    "context": {
      "employeeId": string,
      "employeeIds": string[],
      "employeeDetails": [
        {
          "employeeId": string,
          "name": string,
          "role": string,
          "department": string
        }
      ],
      "availableReports": string[]
    },
    "messages": [
      {
        "messageId": string,
        "role": "user" | "assistant" | "system",
        "content": string,
        "timestamp": string,
        "metadata": {
          "referencedReports": string[],
          "confidenceScore": number,
          "tokensUsed": number
        }
      }
    ],
    "createdAt": string,
    "lastMessageAt": string,
    "isActive": boolean
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: User lacks access to this session
- `404 Not Found`: Session not found

---

##### DELETE /api/v1/chat/sessions/:sessionId
**Description**: Delete a chat session and its history

**Authentication**: Required (JWT)

**Authorization**: Owner, Leader, Manager (own sessions only)

**Path Parameters**:
- `sessionId`: string (UUID)

**Response**: `200 OK`
```typescript
{
  "success": true,
  "message": "Chat session deleted successfully"
}
```

---

#### 2. Quick Insights

##### POST /api/v1/chat/quick-insights
**Description**: Get instant AI insights without creating a session (single request/response)

**Authentication**: Required (JWT)

**Authorization**: Owner, Leader, Manager

**Request Body**:
```typescript
{
  "query": string,
  "context": {
    "employeeId"?: string,
    "employeeIds"?: string[],
    "insightType": "compatibility" | "promotion" | "training" | "performance" | "conflict"
  }
}
```

**Response**: `200 OK`
```typescript
{
  "success": true,
  "data": {
    "insight": string,
    "confidence": number,
    "referencedReports": string[],
    "recommendations": string[],
    "metadata": {
      "processingTime": number,
      "tokensUsed": number,
      "dataPoints": number
    }
  }
}
```

**Rate Limiting**: 10 requests per minute per user

---

#### 3. Team Analysis

##### POST /api/v1/chat/team-analysis
**Description**: Analyze team composition and compatibility

**Authentication**: Required (JWT)

**Authorization**: Owner, Leader, Manager

**Request Body**:
```typescript
{
  "employeeIds": string[],          // Min: 2, Max: 20
  "analysisType": "compatibility" | "dynamics" | "strengths_weaknesses" | "formation",
  "departmentId"?: string,
  "projectContext"?: string
}
```

**Response**: `200 OK`
```typescript
{
  "success": true,
  "data": {
    "teamId": string,
    "analysisType": string,
    "overallCompatibility": number,
    "teamDynamics": {
      "strengths": string[],
      "weaknesses": string[],
      "conflictRisks": [
        {
          "employees": string[],
          "riskLevel": "low" | "medium" | "high",
          "description": string,
          "mitigation": string
        }
      ]
    },
    "pairwiseCompatibility": [
      {
        "employee1": string,
        "employee2": string,
        "compatibilityScore": number,
        "insights": string
      }
    ],
    "recommendations": string[],
    "optimalRoles": [
      {
        "employeeId": string,
        "suggestedRole": string,
        "reasoning": string
      }
    ],
    "generatedAt": string
  }
}
```

---

#### 4. Promotion Assessment

##### POST /api/v1/chat/promotion-assessment
**Description**: Assess employee readiness for promotion or role change

**Authentication**: Required (JWT)

**Authorization**: Owner, Leader, Manager

**Request Body**:
```typescript
{
  "employeeId": string,
  "targetRole": string,
  "targetDepartment"?: string,
  "assessmentCriteria"?: string[]
}
```

**Response**: `200 OK`
```typescript
{
  "success": true,
  "data": {
    "employeeId": string,
    "currentRole": string,
    "targetRole": string,
    "readinessScore": number,        // 0-100
    "readinessLevel": "not_ready" | "developing" | "ready" | "highly_ready",
    "strengths": string[],
    "gaps": [
      {
        "area": string,
        "currentLevel": string,
        "requiredLevel": string,
        "developmentPath": string
      }
    ],
    "trainingRecommendations": [
      {
        "skillArea": string,
        "priority": "high" | "medium" | "low",
        "estimatedDuration": string,
        "resources": string[]
      }
    ],
    "timelineEstimate": string,
    "risks": string[],
    "opportunities": string[],
    "overallRecommendation": string,
    "generatedAt": string
  }
}
```

---

### WebSocket API

#### Connection

**Endpoint**: `ws://api.planetshr.com/chat` or `wss://api.planetshr.com/chat`

**Authentication**: Query parameter `token=<JWT>`

**Connection Request**:
```typescript
{
  "event": "chat.connect",
  "data": {
    "sessionId": string
  }
}
```

**Connection Response**:
```typescript
{
  "event": "chat.connected",
  "data": {
    "sessionId": string,
    "connectionId": string,
    "timestamp": string
  }
}
```

---

#### Events

##### Client → Server Events

**1. chat.message**
```typescript
{
  "event": "chat.message",
  "data": {
    "sessionId": string,
    "message": string,
    "metadata"?: {
      "replyToMessageId"?: string,
      "attachments"?: string[]
    }
  }
}
```

**2. chat.typing**
```typescript
{
  "event": "chat.typing",
  "data": {
    "sessionId": string,
    "isTyping": boolean
  }
}
```

**3. chat.regenerate**
```typescript
{
  "event": "chat.regenerate",
  "data": {
    "sessionId": string,
    "messageId": string
  }
}
```

**4. chat.context.update**
```typescript
{
  "event": "chat.context.update",
  "data": {
    "sessionId": string,
    "addEmployees"?: string[],
    "removeEmployees"?: string[],
    "updateQuery"?: string
  }
}
```

---

##### Server → Client Events

**1. chat.ai.response**
```typescript
{
  "event": "chat.ai.response",
  "data": {
    "messageId": string,
    "sessionId": string,
    "content": string,
    "isComplete": boolean,
    "metadata": {
      "referencedReports": string[],
      "confidenceScore": number,
      "suggestions": string[]
    },
    "timestamp": string
  }
}
```

**2. chat.ai.typing**
```typescript
{
  "event": "chat.ai.typing",
  "data": {
    "sessionId": string,
    "isTyping": boolean
  }
}
```

**3. chat.ai.error**
```typescript
{
  "event": "chat.ai.error",
  "data": {
    "sessionId": string,
    "error": {
      "code": string,
      "message": string,
      "retryable": boolean
    },
    "timestamp": string
  }
}
```

**4. chat.context.updated**
```typescript
{
  "event": "chat.context.updated",
  "data": {
    "sessionId": string,
    "updatedContext": {
      "employeeIds": string[],
      "employeeNames": string[],
      "availableReports": string[]
    },
    "timestamp": string
  }
}
```

**5. chat.session.expired**
```typescript
{
  "event": "chat.session.expired",
  "data": {
    "sessionId": string,
    "reason": "timeout" | "token_expired" | "manual_closure",
    "timestamp": string
  }
}
```

---

## Internal APIs (Module Communication)

### 1. LLM Service Interface

#### generateResponse()
```typescript
interface ILLMService {
  generateResponse(params: {
    prompt: string;
    context: ChatContext;
    systemPrompt: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }): Promise<LLMResponse> | AsyncGenerator<LLMStreamChunk>;
}

interface LLMResponse {
  content: string;
  tokensUsed: number;
  finishReason: 'stop' | 'length' | 'content_filter';
  model: string;
}

interface LLMStreamChunk {
  content: string;
  isComplete: boolean;
  tokensUsed?: number;
}
```

#### generateInsight()
```typescript
interface ILLMService {
  generateInsight(params: {
    query: string;
    reportData: ReportData[];
    insightType: InsightType;
    employeeContext: EmployeeContext;
  }): Promise<InsightResponse>;
}

interface InsightResponse {
  insight: string;
  confidence: number;
  referencedReports: string[];
  recommendations: string[];
}
```

---

### 2. Context Management Service Interface

#### buildChatContext()
```typescript
interface IContextManagementService {
  buildChatContext(params: {
    sessionId: string;
    userId: string;
    employeeIds: string[];
    messageHistory: Message[];
    maxContextTokens?: number;
  }): Promise<ChatContext>;
}

interface ChatContext {
  systemPrompt: string;
  userInfo: {
    userId: string;
    role: UserRole;
    scope: string[];
  };
  employeeData: EmployeeContextData[];
  reportSummaries: ReportSummary[];
  conversationHistory: Message[];
  metadata: {
    totalTokens: number;
    truncated: boolean;
  };
}
```

#### updateSessionContext()
```typescript
interface IContextManagementService {
  updateSessionContext(params: {
    sessionId: string;
    addEmployees?: string[];
    removeEmployees?: string[];
    refreshReports?: boolean;
  }): Promise<ChatContext>;
}
```

#### getRelevantReports()
```typescript
interface IContextManagementService {
  getRelevantReports(params: {
    employeeIds: string[];
    reportTypes?: ReportType[];
    userId: string;
  }): Promise<ReportData[]>;
}
```

---

### 3. Reports Service Interface

#### getEmployeeReports()
```typescript
interface IReportsService {
  getEmployeeReports(params: {
    employeeId: string;
    reportTypes?: ReportType[];
    includeHistorical?: boolean;
  }): Promise<Report[]>;
}
```

#### getCompatibilityData()
```typescript
interface IReportsService {
  getCompatibilityData(params: {
    employeeIds: string[];
    compatibilityType: 'role' | 'department' | 'company' | 'industry';
  }): Promise<CompatibilityData>;
}

interface CompatibilityData {
  overallScore: number;
  individual: Array<{
    employeeId: string;
    score: number;
    strengths: string[];
    challenges: string[];
  }>;
  pairwise: Array<{
    employee1: string;
    employee2: string;
    score: number;
  }>;
}
```

---

### 4. Users Service Interface

#### validateUserAccess()
```typescript
interface IUsersService {
  validateUserAccess(params: {
    userId: string;
    employeeIds: string[];
    accessType: 'read' | 'chat' | 'analyze';
  }): Promise<AccessValidation>;
}

interface AccessValidation {
  hasAccess: boolean;
  allowedEmployees: string[];
  deniedEmployees: string[];
  reason?: string;
}
```

#### getUserScope()
```typescript
interface IUsersService {
  getUserScope(userId: string): Promise<UserScope>;
}

interface UserScope {
  role: 'owner' | 'leader' | 'manager';
  organizationId: string;
  branchIds: string[];
  departmentIds: string[];
  accessibleEmployeeIds: string[];
}
```

---

### 5. Employees Service Interface

#### getEmployeeDetails()
```typescript
interface IEmployeesService {
  getEmployeeDetails(params: {
    employeeIds: string[];
    includeAstrology?: boolean;
    includeHarmonicCodes?: boolean;
  }): Promise<EmployeeDetail[]>;
}

interface EmployeeDetail {
  employeeId: string;
  name: string;
  role: string;
  department: string;
  astrologyData?: AstrologyData;
  harmonicCodes?: HarmonicCode[];
  metadata: Record<string, any>;
}
```

---

## Error Codes

### HTTP Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `CHAT_001` | Invalid session type | Use valid session type from enum |
| `CHAT_002` | Session not found | Verify sessionId exists |
| `CHAT_003` | Session expired | Create new session |
| `CHAT_004` | Access denied to employee | Verify user has scope access |
| `CHAT_005` | Employee not found | Verify employeeId is correct |
| `CHAT_006` | Invalid context parameters | Check required fields for session type |
| `CHAT_007` | Message too long | Reduce message length (max 4000 chars) |
| `CHAT_008` | Rate limit exceeded | Wait before sending next request |
| `CHAT_009` | LLM service unavailable | Retry after delay |
| `CHAT_010` | Insufficient report data | Ensure employee has generated reports |
| `CHAT_011` | Team size limit exceeded | Reduce team size (max 20 employees) |
| `CHAT_012` | WebSocket connection failed | Check authentication token |

### WebSocket Error Events

```typescript
{
  "event": "error",
  "data": {
    "code": string,
    "message": string,
    "retryable": boolean,
    "details"?: any
  }
}
```

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /chat/sessions | 20 requests | 1 minute |
| GET /chat/sessions | 100 requests | 1 minute |
| POST /quick-insights | 10 requests | 1 minute |
| POST /team-analysis | 5 requests | 1 minute |
| POST /promotion-assessment | 10 requests | 1 minute |
| WebSocket messages | 30 messages | 1 minute |

---

## Versioning

- **Current Version**: v1
- **Base URL**: `/api/v1/chat`
- **Deprecation Policy**: 6 months notice for breaking changes
- **Version Header**: `X-API-Version: 1.0`

---

## Authentication

All endpoints require JWT authentication via:
- **Header**: `Authorization: Bearer <token>`
- **WebSocket**: Query parameter `?token=<token>`

Token must include:
```typescript
{
  "sub": string,        // userId
  "role": UserRole,
  "orgId": string,
  "scope": string[],    // accessible departmentIds
  "exp": number
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Complete