# API Contracts - Astrology & Harmonic Energy Engine

## Overview

This document defines all API endpoints (internal and external) for the Astrology & Harmonic Energy Engine module. This module operates as an internal service within the NestJS monolith, exposing REST APIs for birth chart calculation, harmonic energy code generation, compatibility scoring, and quarterly updates.

## External APIs

### Third-Party Astrology API Integration

#### AstroAPI Integration

**Endpoint**: `POST https://api.astroapi.com/v1/birth-chart`

**Purpose**: External service for detailed astrological calculations

**Request Headers**:
```json
{
  "Content-Type": "application/json",
  "X-API-Key": "${ASTRO_API_KEY}",
  "X-User-ID": "planetshr-production"
}
```

**Request Payload**:
```json
{
  "birthDate": "1990-05-15",
  "birthTime": "14:30:00",
  "birthPlace": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "timezone": "America/New_York"
  },
  "calculationType": "tropical",
  "houseSystem": "placidus",
  "includeAspects": true,
  "includePlanets": true,
  "includeHouses": true
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "chartId": "bc_67890abcdef",
    "sunSign": "Taurus",
    "moonSign": "Pisces",
    "risingSign": "Leo",
    "planets": [
      {
        "name": "Sun",
        "sign": "Taurus",
        "degree": 24.56,
        "house": 10,
        "retrograde": false
      }
    ],
    "houses": [
      {
        "number": 1,
        "sign": "Leo",
        "degree": 15.23
      }
    ],
    "aspects": [
      {
        "planet1": "Sun",
        "planet2": "Moon",
        "aspect": "trine",
        "angle": 120,
        "orb": 2.3
      }
    ]
  }
}
```

**Error Response**:
```json
{
  "status": "error",
  "code": "INVALID_BIRTH_DATA",
  "message": "Birth time or location data is invalid"
}
```

## Internal APIs

### 1. Birth Chart Calculation API

#### Calculate Employee Birth Chart

**Endpoint**: `POST /api/v1/astrology/birth-chart/calculate`

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader, Manager

**Request Body**:
```json
{
  "employeeId": "emp_12345",
  "birthData": {
    "date": "1990-05-15",
    "time": "14:30:00",
    "location": {
      "city": "New York",
      "country": "USA",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timezone": "America/New_York"
    }
  },
  "options": {
    "includeHarmonicCodes": true,
    "calculateCompatibility": true,
    "detailedAnalysis": true
  }
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "chartId": "chart_abc123xyz",
    "employeeId": "emp_12345",
    "calculatedAt": "2025-11-11T10:30:00Z",
    "birthChart": {
      "sunSign": "Taurus",
      "moonSign": "Pisces",
      "risingSign": "Leo",
      "dominantElement": "Earth",
      "dominantModality": "Fixed",
      "planets": [
        {
          "planet": "Sun",
          "sign": "Taurus",
          "house": 10,
          "degree": 24.56,
          "retrograde": false
        },
        {
          "planet": "Moon",
          "sign": "Pisces",
          "house": 8,
          "degree": 12.34,
          "retrograde": false
        }
      ],
      "houses": [
        {
          "number": 1,
          "sign": "Leo",
          "ruler": "Sun",
          "degree": 15.23
        }
      ],
      "aspects": [
        {
          "planet1": "Sun",
          "planet2": "Moon",
          "aspectType": "trine",
          "angle": 120,
          "orb": 2.3,
          "strength": "strong"
        }
      ]
    },
    "harmonicCode": {
      "codeId": "hc_xyz789",
      "currentQuarter": "Q4_2025",
      "energyPattern": "7-3-9-2",
      "calculatedAt": "2025-11-11T10:30:00Z"
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid birth data
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Employee not found
- `500 Internal Server Error`: Calculation service failure

#### Get Birth Chart by Employee ID

**Endpoint**: `GET /api/v1/astrology/birth-chart/:employeeId`

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader, Manager (scope-limited)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "chartId": "chart_abc123xyz",
    "employeeId": "emp_12345",
    "calculatedAt": "2025-11-11T10:30:00Z",
    "lastUpdated": "2025-11-11T10:30:00Z",
    "birthChart": {
      "sunSign": "Taurus",
      "moonSign": "Pisces",
      "risingSign": "Leo"
    }
  }
}
```

### 2. Harmonic Energy Code API

#### Generate Harmonic Energy Code

**Endpoint**: `POST /api/v1/astrology/harmonic-code/generate`

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader, Manager

**Request Body**:
```json
{
  "entityType": "employee",
  "entityId": "emp_12345",
  "chartData": {
    "sunSign": "Taurus",
    "moonSign": "Pisces",
    "risingSign": "Leo",
    "planets": []
  },
  "calculationDate": "2025-11-11T00:00:00Z"
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "harmonicCodeId": "hc_xyz789",
    "entityType": "employee",
    "entityId": "emp_12345",
    "quarter": "Q4_2025",
    "energyPattern": "7-3-9-2",
    "energyBreakdown": {
      "physical": 7,
      "emotional": 3,
      "mental": 9,
      "spiritual": 2
    },
    "dominantEnergy": "mental",
    "secondaryEnergy": "physical",
    "energyBalance": "imbalanced",
    "calculatedAt": "2025-11-11T10:30:00Z",
    "nextUpdateDue": "2026-02-01T00:00:00Z"
  }
}
```

#### Get Current Harmonic Code

**Endpoint**: `GET /api/v1/astrology/harmonic-code/:entityType/:entityId`

**Authentication**: JWT Bearer Token

**Query Parameters**:
- `quarter` (optional): Specific quarter (e.g., "Q4_2025")
- `includeHistory` (optional): boolean, default false

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "current": {
      "harmonicCodeId": "hc_xyz789",
      "quarter": "Q4_2025",
      "energyPattern": "7-3-9-2",
      "calculatedAt": "2025-11-11T10:30:00Z"
    },
    "history": [
      {
        "quarter": "Q3_2025",
        "energyPattern": "6-4-8-3",
        "calculatedAt": "2025-08-01T00:00:00Z"
      }
    ]
  }
}
```

#### Update Quarterly Harmonic Codes (Batch)

**Endpoint**: `POST /api/v1/astrology/harmonic-code/quarterly-update`

**Authentication**: JWT Bearer Token (System/Cron Service)

**Authorization**: System Internal

**Request Body**:
```json
{
  "quarter": "Q1_2026",
  "entityFilter": {
    "entityType": "employee",
    "organizationId": "org_12345",
    "activeSubscriptionOnly": true
  }
}
```

**Response**: `202 Accepted`
```json
{
  "success": true,
  "data": {
    "jobId": "qupdate_abc123",
    "quarter": "Q1_2026",
    "totalEntities": 450,
    "estimatedCompletionTime": "2026-01-01T02:30:00Z",
    "status": "processing"
  }
}
```

### 3. Compatibility Scoring API

#### Calculate Compatibility Score

**Endpoint**: `POST /api/v1/astrology/compatibility/calculate`

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader, Manager

**Request Body**:
```json
{
  "compatibilityType": "employee-role",
  "entity1": {
    "type": "employee",
    "id": "emp_12345",
    "harmonicCode": "hc_xyz789"
  },
  "entity2": {
    "type": "jobRole",
    "id": "role_67890",
    "harmonicCode": "hc_abc456"
  },
  "analysisDepth": "detailed",
  "includeRecommendations": true
}
```

**Compatibility Types**:
- `employee-role`: Job role compatibility
- `employee-department`: Department compatibility
- `employee-company`: Company compatibility
- `employee-industry`: Industry compatibility
- `employee-employee`: One-on-one compatibility

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "compatibilityId": "comp_xyz123",
    "type": "employee-role",
    "overallScore": 78.5,
    "scoreBreakdown": {
      "energyAlignment": 82,
      "personalityFit": 75,
      "skillCompatibility": 80,
      "culturalFit": 77
    },
    "harmonicResonance": {
      "physical": 0.85,
      "emotional": 0.65,
      "mental": 0.90,
      "spiritual": 0.70
    },
    "strengths": [
      "Strong mental energy alignment with analytical role requirements",
      "Leadership qualities match senior position expectations",
      "Problem-solving approach aligns with company methodology"
    ],
    "challenges": [
      "Emotional energy may require support during high-stress periods",
      "Spiritual energy disconnect with company's mission-driven culture"
    ],
    "recommendations": [
      "Provide mentorship in areas of emotional intelligence",
      "Align personal goals with company mission through quarterly reviews"
    ],
    "calculatedAt": "2025-11-11T10:30:00Z"
  }
}
```

#### Batch Compatibility Analysis

**Endpoint**: `POST /api/v1/astrology/compatibility/batch`

**Authentication**: JWT Bearer Token

**Request Body**:
```json
{
  "employeeIds": ["emp_12345", "emp_67890", "emp_54321"],
  "compatibilityType": "employee-department",
  "targetEntity": {
    "type": "department",
    "id": "dept_abc123"
  }
}
```

**Response**: `202 Accepted`
```json
{
  "success": true,
  "data": {
    "batchJobId": "batch_comp_xyz789",
    "totalEmployees": 3,
    "estimatedCompletionTime": "2025-11-11T10:35:00Z",
    "status": "processing"
  }
}
```

### 4. Company Astrological Mapping API

#### Create Company Astrological Profile

**Endpoint**: `POST /api/v1/astrology/company-profile`

**Authentication**: JWT Bearer Token

**Authorization**: Owner only

**Request Body**:
```json
{
  "organizationId": "org_12345",
  "foundingData": {
    "date": "2015-03-22",
    "time": "09:00:00",
    "location": {
      "city": "San Francisco",
      "country": "USA",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "timezone": "America/Los_Angeles"
    }
  },
  "industryType": "technology",
  "companyValues": [
    "innovation",
    "collaboration",
    "customer-focus",
    "integrity"
  ],
  "culturalAttributes": {
    "workStyle": "flexible",
    "communicationStyle": "transparent",
    "leadershipStyle": "democratic"
  }
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "companyProfileId": "cprof_abc123",
    "organizationId": "org_12345",
    "birthChart": {
      "sunSign": "Aries",
      "moonSign": "Gemini",
      "risingSign": "Sagittarius",
      "dominantElement": "Fire",
      "energySignature": "dynamic-innovative"
    },
    "harmonicCode": {
      "codeId": "hc_company_xyz789",
      "energyPattern": "8-6-9-5",
      "dominantEnergy": "mental"
    },
    "culturalEnergyMap": {
      "innovationIndex": 92,
      "stabilityIndex": 65,
      "collaborationIndex": 88,
      "hierarchyIndex": 45
    },
    "idealEmployeeProfile": {
      "energyPattern": "7-5-8-4",
      "preferredSigns": ["Aries", "Gemini", "Sagittarius", "Aquarius"],
      "compatibilityThreshold": 70
    },
    "createdAt": "2025-11-11T10:30:00Z"
  }
}
```

#### Get Company Astrological Profile

**Endpoint**: `GET /api/v1/astrology/company-profile/:organizationId`

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader, Manager (within organization)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "companyProfileId": "cprof_abc123",
    "organizationId": "org_12345",
    "birthChart": {},
    "harmonicCode": {},
    "lastUpdated": "2025-11-11T10:30:00Z"
  }
}
```

### 5. Industry-Specific Energy Analysis API

#### Analyze Industry Energy Patterns

**Endpoint**: `POST /api/v1/astrology/industry-analysis`

**Authentication**: JWT Bearer Token

**Request Body**:
```json
{
  "industryType": "technology",
  "subSector": "artificial-intelligence",
  "analysisType": "comprehensive",
  "includeMarketTrends": true
}
```

**Industry Types**:
- `technology`, `finance`, `healthcare`, `education`, `retail`, `manufacturing`, `consulting`, `creative`, `hospitality`, `real-estate`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "industryAnalysisId": "indanal_xyz123",
    "industryType": "technology",
    "subSector": "artificial-intelligence",
    "energyProfile": {
      "dominantEnergy": "mental",
      "secondaryEnergy": "physical",
      "energyPattern": "9-7-6-3",
      "volatilityIndex": 85,
      "innovationIndex": 95
    },
    "idealPersonalityTraits": [
      "analytical-thinking",
      "problem-solving",
      "adaptability",
      "continuous-learning"
    ],
    "requiredCompetencies": {
      "technical": 90,
      "leadership": 70,
      "communication": 75,
      "creativity": 85
    },
    "commonChallenges": [
      "Rapid technology changes require constant adaptation",
      "High-stress environment may impact emotional wellbeing",
      "Work-life balance challenges due to demanding nature"
    ],
    "successFactors": [
      "Strong mental energy and analytical capabilities",
      "High adaptability and learning agility",
      "Collaborative mindset for cross-functional teams"
    ],
    "marketTrends": {
      "growthProjection": "high",
      "stabilityRating": "medium",
      "competitionLevel": "very-high"
    },
    "calculatedAt": "2025-11-11T10:30:00Z"
  }
}
```

### 6. Energy Pattern Analysis API

#### Analyze Employee Energy Patterns

**Endpoint**: `GET /api/v1/astrology/energy-pattern/:employeeId`

**Authentication**: JWT Bearer Token

**Query Parameters**:
- `startQuarter` (optional): Starting quarter for trend analysis
- `endQuarter` (optional): Ending quarter for trend analysis
- `includePredictions` (optional): boolean, default false

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "employeeId": "emp_12345",
    "currentPattern": {
      "quarter": "Q4_2025",
      "energyPattern": "7-3-9-2",
      "dominantEnergy": "mental",
      "balanceStatus": "imbalanced"
    },
    "trendAnalysis": {
      "quarters": [
        {
          "quarter": "Q3_2025",
          "pattern": "6-4-8-3",
          "changes": "Increased emotional energy, decreased mental energy"
        },
        {
          "quarter": "Q4_2025",
          "pattern": "7-3-9-2",
          "changes": "Mental energy spike, emotional energy drop"
        }
      ],
      "overallTrend": "increasing-mental-energy",
      "volatilityIndex": 45
    },
    "predictions": {
      "nextQuarter": {
        "quarter": "Q1_2026",
        "predictedPattern": "7-4-8-3",
        "confidence": 78,
        "expectedChanges": "Emotional energy stabilization expected"
      }
    },
    "recommendations": [
      "Focus on emotional intelligence development",
      "Implement stress management techniques",
      "Balance analytical work with creative projects"
    ]
  }
}
```

### 7. Astrological Analysis Algorithms API

#### Execute Custom Astrological Analysis

**Endpoint**: `POST /api/v1/astrology/analysis/custom`

**Authentication**: JWT Bearer Token

**Request Body**:
```json
{
  "analysisType": "career-progression",
  "employeeId": "emp_12345",
  "parameters": {
    "targetRole": "senior-manager",
    "timeframe": "12-months",
    "focusAreas": ["leadership", "decision-making", "team-management"]
  },
  "includeTransits": true,
  "includeProgressions": true
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "analysisId": "anal_xyz123",
    "analysisType": "career-progression",
    "employeeId": "emp_12345",
    "results": {
      "readinessScore": 82,
      "strengths": [
        "Natural leadership qualities with Sun in 10th house",
        "Strong communication skills indicated by Mercury aspects"
      ],
      "developmentAreas": [
        "Emotional resilience during high-pressure situations",
        "Strategic long-term planning capabilities"
      ],
      "optimalTiming": {
        "favorablePeriods": [
          {
            "start": "2026-03-15",
            "end": "2026-06-30",
            "reason": "Jupiter transit supports career advancement"
          }
        ],
        "challengingPeriods": [
          {
            "start": "2026-01-01",
            "end": "2026-02-15",
            "reason": "Saturn retrograde may create delays"
          }
        ]
      },
      "actionPlan": [
        "Develop emotional intelligence through coaching",
        "Take on leadership projects in Q1 2026",
        "Initiate promotion discussion in March 2026"
      ]
    },
    "generatedAt": "2025-11-11T10:30:00Z"
  }
}
```

### 8. Bulk Operations API

#### Bulk Birth Chart Calculation

**Endpoint**: `POST /api/v1/astrology/bulk/birth-charts`

**Authentication**: JWT Bearer Token

**Authorization**: Owner, Leader

**Request Body**:
```json
{
  "employees": [
    {
      "employeeId": "emp_12345",
      "birthData": {
        "date": "1990-05-15",
        "time": "14:30:00",
        "location": {}
      }
    }
  ],
  "options": {
    "generateHarmonicCodes": true,
    "calculateCompatibility": false
  }
}
```

**Response**: `202 Accepted`
```json
{
  "success": true,
  "data": {
    "bulkJobId": "bulk_job_xyz789",
    "totalEmployees": 50,
    "estimatedCompletionTime": "2025-11-11T11:00:00Z",
    "statusEndpoint": "/api/v1/astrology/bulk/status/bulk_job_xyz789"
  }
}
```

#### Get Bulk Job Status

**Endpoint**: `GET /api/v1/astrology/bulk/status/:jobId`

**Authentication**: JWT Bearer Token

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "jobId": "bulk_job_xyz789",
    "status": "processing",
    "progress": {
      "total": 50,
      "completed": 35,
      "failed": 2,
      "pending": 13
    },
    "results": {
      "successful": ["emp_12345", "emp_67890"],
      "failed": [
        {
          "employeeId": "emp_99999",
          "error": "Invalid birth time format"
        }
      ]
    },
    "startedAt": "2025-11-11T10:30:00Z",
    "estimatedCompletion": "2025-11-11T11:00:00Z"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ASTRO_001` | 400 | Invalid birth data format |
| `ASTRO_002` | 400 | Invalid date or time |
| `ASTRO_003` | 400 | Invalid location coordinates |
| `ASTRO_004` | 404 | Birth chart not found |
| `ASTRO_005` | 404 | Harmonic code not found |
| `ASTRO_006` | 409 | Birth chart already exists |
| `ASTRO_007` | 500 | External astrology API failure |
| `ASTRO_008` | 500 | Harmonic calculation error |
| `ASTRO_009` | 429 | Rate limit exceeded |
| `ASTRO_010` | 403 | Insufficient permissions for scope |
| `ASTRO_011` | 400 | Invalid compatibility type |
| `ASTRO_012` | 400 | Missing required harmonic codes |
| `ASTRO_013` | 500 | Compatibility calculation failure |
| `ASTRO_014` | 404 | Company profile not found |
| `ASTRO_015` | 400 | Invalid industry type |

## Rate Limiting

| Endpoint Pattern | Rate Limit | Window |
|-----------------|------------|--------|
| `/api/v1/astrology/birth-chart/*` | 100 requests | 1 hour |
| `/api/v1/astrology/harmonic-code/*` | 200 requests | 1 hour |
| `/api/v1/astrology/compatibility/*` | 50 requests | 1 hour |
| `/api/v1/astrology/bulk/*` | 10 requests | 1 hour |
| `/api/v1/astrology/company-profile/*` | 50 requests | 1 hour |

## Authentication & Authorization

All endpoints require JWT Bearer token authentication:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token payload includes:
- `userId`: User identifier
- `role`: User role (owner, leader, manager)
- `organizationId`: Organization identifier
- `scope`: Accessible departments/branches

## Webhooks

### Harmonic Code Update Notification

**Triggered**: When quarterly harmonic code update completes

**Payload**:
```json
{
  "event": "harmonic_code.updated",
  "timestamp": "2025-11-11T10:30:00Z",
  "data": {
    "quarter": "Q1_2026",
    "entityType": "employee",
    "entityId": "emp_12345",
    "previousPattern": "7-3-9-2",
    "newPattern": "7-4-8-3",
    "significantChange": true
  }
}
```

### Compatibility Score Alert

**Triggered**: When compatibility score drops below threshold

**Payload**:
```json
{
  "event": "compatibility.alert",
  "timestamp": "2025-11-11T10:30:00Z",
  "data": {
    "compatibilityType": "employee-role",
    "employeeId": "emp_12345",
    "targetId": "role_67890",
    "previousScore": 78.5,
    "currentScore": 62.0,
    "threshold": 65.0,
    "alertLevel": "warning"
  }
}
```

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Status:** Complete