# API Contracts - Dashboard & Analytics

## Overview

This document defines all API endpoints (internal and external) for the Dashboard & Analytics module. The module provides role-specific dashboards, analytics tracking, and metrics reporting through RESTful APIs and WebSocket connections.

## Base Configuration

- **Base URL**: `/api/v1`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`
- **Rate Limiting**: 100 requests/minute per user

## External APIs

### Dashboard Endpoints

#### GET /dashboard

Get role-specific dashboard data.

**Authentication**: Required  
**Authorization**: Owner, Leader, Manager

**Request Headers**:
```http
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dateRange | string | No | Time range filter (7d, 30d, 90d, 1y) |
| departmentId | string | No | Filter by department (Leader/Manager only) |

**Response 200 - Owner**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "usr_123",
      "name": "John Doe",
      "role": "OWNER",
      "organizationId": "org_456"
    },
    "summary": {
      "totalEmployees": 250,
      "totalDepartments": 12,
      "totalLeaders": 5,
      "totalManagers": 18,
      "activeCandidates": 23,
      "reportsGenerated": 2450,
      "reportsGeneratedThisMonth": 87,
      "aiConsultationsThisMonth": 145,
      "subscriptionStatus": "active",
      "nextBillingDate": "2025-12-01T00:00:00Z"
    },
    "recentActivity": [
      {
        "id": "act_789",
        "type": "REPORT_GENERATED",
        "employeeName": "Jane Smith",
        "departmentName": "Engineering",
        "timestamp": "2025-11-10T14:30:00Z",
        "performedBy": "Alice Johnson"
      }
    ],
    "upcomingUpdates": [
      {
        "employeeId": "emp_321",
        "employeeName": "Bob Wilson",
        "department": "Sales",
        "scheduledDate": "2025-12-01T00:00:00Z",
        "updateType": "QUARTERLY_REGENERATION"
      }
    ],
    "departmentBreakdown": [
      {
        "departmentId": "dept_111",
        "departmentName": "Engineering",
        "employeeCount": 45,
        "avgCompatibilityScore": 87.5,
        "reportsGenerated": 450
      }
    ],
    "analyticsOverview": {
      "platformAdoptionRate": 94.5,
      "avgReportsPerEmployee": 9.8,
      "aiChatUsageRate": 67.3,
      "quarterlyUpdateCompletionRate": 98.2
    }
  }
}
```

**Response 200 - Leader**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "usr_456",
      "name": "Alice Johnson",
      "role": "LEADER",
      "organizationId": "org_456",
      "assignedDepartments": ["dept_111", "dept_222", "dept_333"]
    },
    "summary": {
      "totalEmployeesInScope": 78,
      "totalDepartments": 3,
      "totalManagers": 6,
      "activeCandidates": 8,
      "reportsGenerated": 780,
      "aiConsultationsThisMonth": 42
    },
    "recentActivity": [
      {
        "id": "act_790",
        "type": "EMPLOYEE_ADDED",
        "employeeName": "Mark Stevens",
        "departmentName": "Engineering",
        "timestamp": "2025-11-10T13:15:00Z",
        "performedBy": "Mike Chen"
      }
    ],
    "departmentPerformance": [
      {
        "departmentId": "dept_111",
        "departmentName": "Engineering",
        "employeeCount": 45,
        "avgCompatibilityScore": 87.5,
        "topPerformers": 12,
        "trainingRecommendations": 8
      }
    ],
    "compatibilityInsights": {
      "avgJobRoleCompatibility": 85.3,
      "avgDepartmentCompatibility": 88.1,
      "avgCompanyCompatibility": 90.2,
      "avgIndustryCompatibility": 84.7
    }
  }
}
```

**Response 200 - Manager**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "usr_789",
      "name": "Mike Chen",
      "role": "MANAGER",
      "organizationId": "org_456",
      "departmentId": "dept_111",
      "departmentName": "Engineering"
    },
    "summary": {
      "totalEmployees": 25,
      "activeCandidates": 3,
      "reportsGenerated": 250,
      "aiConsultationsThisMonth": 18,
      "upcomingUpdates": 5
    },
    "teamOverview": {
      "avgCompatibilityScore": 87.5,
      "highPerformers": 8,
      "needsTraining": 4,
      "promotionReady": 2
    },
    "recentActivity": [
      {
        "id": "act_791",
        "type": "TRAINING_RECOMMENDED",
        "employeeName": "Sarah Lee",
        "category": "Leadership Skills",
        "timestamp": "2025-11-10T11:00:00Z"
      }
    ],
    "employeeList": [
      {
        "employeeId": "emp_555",
        "name": "Sarah Lee",
        "position": "Senior Developer",
        "compatibilityScore": 89.2,
        "lastReportUpdate": "2025-09-01T00:00:00Z",
        "nextUpdate": "2025-12-01T00:00:00Z",
        "status": "active"
      }
    ]
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server processing error

---

#### GET /dashboard/widgets/{widgetId}

Get specific dashboard widget data.

**Authentication**: Required  
**Authorization**: Owner, Leader, Manager

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| widgetId | string | Widget identifier (summary, activity, analytics, departments) |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dateRange | string | No | Time range filter (7d, 30d, 90d, 1y) |

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "widgetId": "analytics",
    "widgetType": "CHART",
    "title": "Platform Analytics",
    "data": {
      "labels": ["Nov 1", "Nov 2", "Nov 3", "Nov 4", "Nov 5"],
      "datasets": [
        {
          "label": "Reports Generated",
          "values": [15, 23, 19, 28, 22]
        },
        {
          "label": "AI Consultations",
          "values": [8, 12, 10, 15, 11]
        }
      ]
    },
    "refreshInterval": 300
  }
}
```

---

### Analytics Endpoints

#### GET /analytics/adoption

Get platform adoption metrics.

**Authentication**: Required  
**Authorization**: Owner only

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Start date (ISO 8601) |
| endDate | string | No | End date (ISO 8601) |
| groupBy | string | No | Grouping (day, week, month) |

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "metrics": {
      "totalUsers": 250,
      "activeUsers": 237,
      "adoptionRate": 94.8,
      "avgLoginFrequency": 4.5,
      "featureAdoption": {
        "reportViewing": 98.5,
        "aiChat": 67.3,
        "employeeManagement": 89.2,
        "candidateManagement": 45.6
      }
    },
    "trends": [
      {
        "date": "2025-11-01",
        "activeUsers": 230,
        "newUsers": 5,
        "adoptionRate": 92.0
      },
      {
        "date": "2025-11-08",
        "activeUsers": 237,
        "newUsers": 8,
        "adoptionRate": 94.8
      }
    ],
    "userBreakdown": {
      "byRole": {
        "OWNER": 1,
        "LEADER": 5,
        "MANAGER": 18,
        "EMPLOYEE": 226
      },
      "byDepartment": [
        {
          "departmentId": "dept_111",
          "departmentName": "Engineering",
          "userCount": 45,
          "adoptionRate": 95.7
        }
      ]
    }
  }
}
```

---

#### GET /analytics/engagement

Get user engagement analytics.

**Authentication**: Required  
**Authorization**: Owner, Leader

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Start date (ISO 8601) |
| endDate | string | No | End date (ISO 8601) |
| departmentId | string | No | Filter by department |
| userRole | string | No | Filter by role (OWNER, LEADER, MANAGER) |

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "overview": {
      "totalSessions": 1450,
      "avgSessionDuration": 18.5,
      "totalReportViews": 3420,
      "totalAiConsultations": 567,
      "totalEmployeesManaged": 250
    },
    "engagement": {
      "loginFrequency": {
        "daily": 145,
        "weekly": 78,
        "monthly": 14,
        "inactive": 13
      },
      "reportViewingRate": 87.3,
      "reportDownloadRate": 45.2,
      "aiChatUsageRate": 67.3
    },
    "featureUtilization": [
      {
        "feature": "Static Reports",
        "usage": 98.5,
        "trend": "up"
      },
      {
        "feature": "AI Chat",
        "usage": 67.3,
        "trend": "up"
      },
      {
        "feature": "Employee Management",
        "usage": 89.2,
        "trend": "stable"
      },
      {
        "feature": "Candidate Management",
        "usage": 45.6,
        "trend": "down"
      }
    ],
    "topUsers": [
      {
        "userId": "usr_456",
        "userName": "Alice Johnson",
        "role": "LEADER",
        "sessionCount": 87,
        "reportViews": 234,
        "aiConsultations": 56
      }
    ]
  }
}
```

---

#### GET /analytics/reports

Get report generation statistics.

**Authentication**: Required  
**Authorization**: Owner, Leader, Manager

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Start date (ISO 8601) |
| endDate | string | No | End date (ISO 8601) |
| reportType | string | No | Filter by report type |
| departmentId | string | No | Filter by department |

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "summary": {
      "totalReports": 2450,
      "reportsThisMonth": 187,
      "avgReportsPerEmployee": 9.8,
      "quarterlyUpdatesCompleted": 245,
      "quarterlyUpdateRate": 98.2
    },
    "reportBreakdown": [
      {
        "reportType": "PERSONALITY_ROLE",
        "count": 250,
        "avgGenerationTime": 45.3,
        "successRate": 99.6
      },
      {
        "reportType": "PERSONALITY_COMPANY",
        "count": 250,
        "avgGenerationTime": 42.8,
        "successRate": 99.6
      },
      {
        "reportType": "COMPATIBILITY_JOB",
        "count": 250,
        "avgGenerationTime": 38.5,
        "successRate": 99.2
      },
      {
        "reportType": "COMPATIBILITY_DEPARTMENT",
        "count": 250,
        "avgGenerationTime": 40.1,
        "successRate": 99.2
      },
      {
        "reportType": "COMPATIBILITY_COMPANY",
        "count": 250,
        "avgGenerationTime": 39.7,
        "successRate": 99.2
      },
      {
        "reportType": "COMPATIBILITY_INDUSTRY",
        "count": 250,
        "avgGenerationTime": 41.3,
        "successRate": 99.2
      },
      {
        "reportType": "QA_INTERACTIVE",
        "count": 250,
        "avgGenerationTime": 52.6,
        "successRate": 98.8
      },
      {
        "reportType": "TRAINING_DEVELOPMENT",
        "count": 250,
        "avgGenerationTime": 48.9,
        "successRate": 99.2
      }
    ],
    "trends": [
      {
        "date": "2025-11-01",
        "reportsGenerated": 87,
        "avgGenerationTime": 44.2,
        "successRate": 99.1
      },
      {
        "date": "2025-11-08",
        "reportsGenerated": 100,
        "avgGenerationTime": 43.8,
        "successRate": 99.3
      }
    ],
    "departmentBreakdown": [
      {
        "departmentId": "dept_111",
        "departmentName": "Engineering",
        "totalReports": 450,
        "avgReportsPerEmployee": 10.0,
        "lastUpdate": "2025-11-10T00:00:00Z"
      }
    ]
  }
}
```

---

#### GET /analytics/business-impact

Get business impact metrics.

**Authentication**: Required  
**Authorization**: Owner only

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Start date (ISO 8601) |
| endDate | string | No | End date (ISO 8601) |

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "subscriptionMetrics": {
      "totalSubscriptions": 1,
      "activeSubscriptions": 1,
      "subscriptionRevenue": 9999.99,
      "renewalRate": 95.5,
      "churnRate": 4.5,
      "avgSubscriptionDuration": 18.5
    },
    "usageMetrics": {
      "totalEmployeesAnalyzed": 250,
      "totalCandidatesAnalyzed": 45,
      "totalReportsGenerated": 2450,
      "totalAiConsultations": 892,
      "avgReportsPerOrganization": 2450,
      "avgAiConsultationsPerOrganization": 892
    },
    "satisfactionMetrics": {
      "overallSatisfaction": 4.6,
      "reportAccuracy": 4.7,
      "reportActionability": 4.5,
      "platformUsability": 4.4,
      "supportQuality": 4.8
    },
    "outcomeMetrics": {
      "trainingRecommendationsIssued": 234,
      "trainingRecommendationsImplemented": 178,
      "implementationRate": 76.1,
      "promotionRecommendations": 45,
      "promotionsCompleted": 38,
      "promotionSuccessRate": 84.4,
      "hiringRecommendations": 67,
      "hiresCompleted": 52,
      "hiringSuccessRate": 77.6
    },
    "trends": [
      {
        "month": "2025-09",
        "employeesAnalyzed": 78,
        "reportsGenerated": 780,
        "aiConsultations": 234,
        "satisfactionScore": 4.5
      },
      {
        "month": "2025-10",
        "employeesAnalyzed": 85,
        "reportsGenerated": 850,
        "aiConsultations": 298,
        "satisfactionScore": 4.6
      },
      {
        "month": "2025-11",
        "employeesAnalyzed": 87,
        "reportsGenerated": 820,
        "aiConsultations": 360,
        "satisfactionScore": 4.6
      }
    ]
  }
}
```

---

### Notification Endpoints

#### GET /notifications

Get user notifications.

**Authentication**: Required  
**Authorization**: Owner, Leader, Manager

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status (unread, read, all) |
| type | string | No | Filter by type |
| limit | number | No | Results per page (default: 20) |
| offset | number | No | Pagination offset (default: 0) |

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "type": "QUARTERLY_UPDATE_COMPLETED",
        "title": "Quarterly Reports Updated",
        "message": "25 employee reports have been regenerated for Q4 2025",
        "priority": "high",
        "read": false,
        "createdAt": "2025-11-10T08:00:00Z",
        "metadata": {
          "employeeCount": 25,
          "departmentId": "dept_111",
          "quarter": "Q4_2025"
        }
      },
      {
        "id": "notif_124",
        "type": "REPORT_GENERATION_COMPLETE",
        "title": "New Employee Report Ready",
        "message": "Analysis complete for Sarah Lee",
        "priority": "medium",
        "read": false,
        "createdAt": "2025-11-10T14:30:00Z",
        "metadata": {
          "employeeId": "emp_555",
          "employeeName": "Sarah Lee",
          "reportCount": 8
        }
      },
      {
        "id": "notif_125",
        "type": "SUBSCRIPTION_RENEWAL",
        "title": "Subscription Renewal Upcoming",
        "message": "Your subscription will renew on December 1, 2025",
        "priority": "low",
        "read": true,
        "createdAt": "2025-11-01T00:00:00Z",
        "metadata": {
          "renewalDate": "2025-12-01",
          "amount": 9999.99
        }
      }
    ],
    "pagination": {
      "total": 47,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    },
    "unreadCount": 12
  }
}
```

---

#### PUT /notifications/{notificationId}/read

Mark notification as read.

**Authentication**: Required  
**Authorization**: Owner, Leader, Manager

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| notificationId | string | Notification ID |

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "notificationId": "notif_123",
    "read": true,
    "readAt": "2025-11-10T15:00:00Z"
  }
}
```

---

#### PUT /notifications/read-all

Mark all notifications as read.

**Authentication**: Required  
**Authorization**: Owner, Leader, Manager

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "markedAsRead": 12,
    "timestamp": "2025-11-10T15:00:00Z"
  }
}
```

---

### Report Access Navigation

#### GET /reports/navigation

Get role-scoped report navigation structure.

**Authentication**: Required  
**Authorization**: Owner, Leader, Manager

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "navigation": {
      "departments": [
        {
          "departmentId": "dept_111",
          "departmentName": "Engineering",
          "employeeCount": 45,
          "canManage": true,
          "employees": [
            {
              "employeeId": "emp_555",
              "name": "Sarah Lee",
              "position": "Senior Developer",
              "reportCount": 8,
              "lastUpdate": "2025-09-01T00:00:00Z",
              "nextUpdate": "2025-12-01T00:00:00Z",
              "availableReports": [
                "PERSONALITY_ROLE",
                "PERSONALITY_COMPANY",
                "COMPATIBILITY_JOB",
                "COMPATIBILITY_DEPARTMENT",
                "COMPATIBILITY_COMPANY",
                "COMPATIBILITY_INDUSTRY",
                "QA_INTERACTIVE",
                "TRAINING_DEVELOPMENT"
              ]
            }
          ]
        }
      ],
      "candidates": [
        {
          "candidateId": "cand_777",
          "name": "John Anderson",
          "appliedPosition": "Software Engineer",
          "departmentId": "dept_111",
          "reportCount": 8,
          "generatedAt": "2025-11-05T00:00:00Z",
          "status": "in_review"
        }
      ]
    },
    "reportTypes": [
      {
        "type": "PERSONALITY_ROLE",
        "name": "Role-Specific Personality",
        "category": "personality",
        "description": "Personality analysis aligned with job requirements"
      },
      {
        "type": "PERSONALITY_COMPANY",
        "name": "Company Culture Fit",
        "category": "personality",
        "description": "Behavioral compatibility with organizational culture"
      },
      {
        "type": "COMPATIBILITY_JOB",
        "name": "Job Role Compatibility",
        "category": "compatibility",
        "description": "Skill and personality alignment with position"
      },
      {
        "type": "COMPATIBILITY_DEPARTMENT",
        "name": "Department Compatibility",
        "category": "compatibility",
        "description": "Team dynamics and departmental fit"
      },
      {
        "type": "COMPATIBILITY_COMPANY",
        "name": "Company Compatibility",
        "category": "compatibility",
        "description": "Overall organizational alignment"
      },
      {
        "type": "COMPATIBILITY_INDUSTRY",
        "name": "Industry Compatibility",
        "category": "compatibility",
        "description": "Sector-specific suitability analysis"
      },
      {
        "type": "QA_INTERACTIVE",
        "name": "Interactive Q&A",
        "category": "interaction",
        "description": "Customized questionnaires and insights"
      },
      {
        "type": "TRAINING_DEVELOPMENT",
        "name": "Training & Development",
        "category": "development",
        "description": "Personalized improvement recommendations"
      }
    ]
  }
}
```

---

## Internal APIs

### Dashboard Service APIs

#### POST /internal/dashboard/cache/refresh

Refresh dashboard cache for a user.

**Authentication**: Internal service token  
**Authorization**: Service-to-service

**Request Body**:
```json
{
  "userId": "usr_123",
  "scope": "full",
  "priority": "high"
}
```

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "userId": "usr_123",
    "cacheRefreshed": true,
    "refreshedAt": "2025-11-10T15:30:00Z",
    "ttl": 300
  }
}
```

---

#### POST /internal/dashboard/widget/update

Update specific widget data.

**Authentication**: Internal service token  
**Authorization**: Service-to-service

**Request Body**:
```json
{
  "widgetId": "summary",
  "userId": "usr_123",
  "data": {
    "totalEmployees": 251,
    "reportsGeneratedThisMonth": 88
  }
}
```

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "widgetId": "summary",
    "updated": true,
    "timestamp": "2025-11-10T15:30:00Z"
  }
}
```

---

### Analytics Service APIs

#### POST /internal/analytics/track-event

Track user activity event.

**Authentication**: Internal service token  
**Authorization**: Service-to-service

**Request Body**:
```json
{
  "userId": "usr_456",
  "eventType": "REPORT_VIEWED",
  "eventData": {
    "reportId": "rpt_789",
    "reportType": "PERSONALITY_ROLE",
    "employeeId": "emp_555",
    "departmentId": "dept_111",
    "duration": 125
  },
  "timestamp": "2025-11-10T15:30:00Z",
  "sessionId": "sess_abc123"
}
```

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "eventId": "evt_999",
    "tracked": true,
    "timestamp": "2025-11-10T15:30:00Z"
  }
}
```

---

#### POST /internal/analytics/aggregate

Trigger analytics aggregation.

**Authentication**: Internal service token  
**Authorization**: Service-to-service

**Request Body**:
```json
{
  "aggregationType": "daily",
  "targetDate": "2025-11-10",
  "metrics": ["adoption", "engagement", "reports"]
}
```

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "jobId": "agg_job_555",
    "status": "processing",
    "estimatedCompletion": "2025-11-10T15:35:00Z"
  }
}
```

---

#### GET /internal/analytics/metrics

Get raw metrics data for internal processing.

**Authentication**: Internal service token  
**Authorization**: Service-to-service

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |
| metricType | string | Yes | Metric type (adoption, engagement, reports, impact) |
| startDate | string | Yes | Start date (ISO 8601) |
| endDate | string | Yes | End date (ISO 8601) |

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "organizationId": "org_456",
    "metricType": "engagement",
    "dateRange": {
      "start": "2025-11-01T00:00:00Z",
      "end": "2025-11-10T23:59:59Z"
    },
    "metrics": {
      "totalSessions": 1450,
      "uniqueUsers": 237,
      "avgSessionDuration": 18.5,
      "totalEvents": 15420,
      "eventBreakdown": {
        "REPORT_VIEWED": 3420,
        "AI_CHAT_INITIATED": 567,
        "EMPLOYEE_ADDED": 23,
        "EMPLOYEE_UPDATED": 45
      }
    },
    "raw": true
  }
}
```

---

### Metrics Tracking Service APIs

#### POST /internal/metrics/record

Record a metric data point.

**Authentication**: Internal service token  
**Authorization**: Service-to-service

**Request Body**:
```json
{
  "organizationId": "org_456",
  "metricName": "report_generation_time",
  "metricValue": 43.5,
  "metricUnit": "seconds",
  "dimensions": {
    "reportType": "PERSONALITY_ROLE",
    "departmentId": "dept_111",
    "success": true
  },
  "timestamp": "2025-11-10T15:30:00Z"
}
```

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "metricId": "metric_888",
    "recorded": true,
    "timestamp": "2025-11-10T15:30:00Z"
  }
}
```

---

#### POST /internal/metrics/batch

Record multiple metrics in batch.

**Authentication**: Internal service token  
**Authorization**: Service-to-service

**Request Body**:
```json
{
  "organizationId": "org_456",
  "metrics": [
    {
      "metricName": "report_generation_time",
      "metricValue": 43.5,
      "metricUnit": "seconds",
      "dimensions": {
        "reportType": "PERSONALITY_ROLE"
      },
      "timestamp": "2025-11-10T15:30:00Z"
    },
    {
      "metricName": "ai_chat_response_time",
      "metricValue": 2.3,
      "metricUnit": "seconds",
      "dimensions": {
        "userId": "usr_456"
      },
      "timestamp": "2025-11-10T15:30:15Z"
    }
  ]
}
```

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "recorded": 2,
    "failed": 0,
    "batchId": "batch_777"
  }
}
```

---

#### GET /internal/metrics/summary

Get metric summary for internal services.

**Authentication**: Internal service token  
**Authorization**: Service-to-service

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| organizationId | string | Yes | Organization ID |
| metricName | string | Yes | Metric name |
| aggregation | string | Yes | Aggregation type (avg, sum, min, max, count) |
| startDate | string | Yes | Start date (ISO 8601) |
| endDate | string | Yes | End date (ISO 8601) |

**Response 200**:
```json
{
  "status": "success",
  "data": {
    "organizationId": "org_456",
    "metricName": "report_generation_time",
    "aggregation": "avg",
    "dateRange": {
      "start": "2025-11-01T00:00:00Z",
      "end": "2025-11-10T23:59:59Z"
    },
    "value": 44.2,
    "unit": "seconds",
    "dataPoints": 187
  }
}
```

---

## WebSocket Events

### Connection

**Endpoint**: `ws://api.planetshr.com/ws`  
**Authentication**: JWT token via query parameter

```
ws://api.planetshr.com/ws?token={jwt_token}
```

### Event: dashboard.notification

Sent when new notification is available.

**Event Payload**:
```json
{
  "event": "dashboard.notification",
  "data": {
    "notificationId": "notif_126",
    "type": "REPORT_GENERATION_COMPLETE",
    "title": "New Employee Report Ready",
    "message": "Analysis complete for Mark Stevens",
    "priority": "medium",
    "createdAt": "2025-11-10T16:00:00Z",
    "metadata": {
      "employeeId": "emp_666",
      "employeeName": "Mark Stevens",
      "reportCount": 8
    }
  }
}
```

### Event: metrics.updated

Sent when dashboard metrics are updated.

**Event Payload**:
```json
{
  "event": "metrics.updated",
  "data": {
    "widgetId": "summary",
    "updates": {
      "totalEmployees": 251,
      "reportsGeneratedThisMonth": 88
    },
    "timestamp": "2025-11-10T16:00:00Z"
  }
}
```

### Event: quarterly.update.started

Sent when quarterly regeneration begins.

**Event Payload**:
```json
{
  "event": "quarterly.update.started",
  "data": {
    "quarter": "Q4_2025",
    "employeeCount": 250,
    "estimatedCompletion": "2025-11-10T20:00:00Z",
    "startedAt": "2025-11-10T16:00:00Z"
  }
}
```

### Event: quarterly.update.completed

Sent when quarterly regeneration completes.

**Event Payload**:
```json
{
  "event": "quarterly.update.completed",
  "data": {
    "quarter": "Q4_2025",
    "employeeCount": 250,
    "reportsGenerated": 2000,
    "duration": 14400,
    "completedAt": "2025-11-10T20:00:00Z"
  }
}
```

---

## Error Response Format

All error responses follow this standard format:

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    },
    "timestamp": "2025-11-10T16:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid authentication token |
| FORBIDDEN | 403 | Insufficient permissions for resource |
| NOT_FOUND | 404 | Requested resource not found |
| VALIDATION_ERROR | 400 | Request validation failed |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Internal server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |
| INSUFFICIENT_SCOPE | 403 | User lacks required scope for operation |
| INVALID_DATE_RANGE | 400 | Invalid date range parameters |
| METRIC_NOT_FOUND | 404 | Requested metric does not exist |
| AGGREGATION_FAILED | 500 | Analytics aggregation failed |

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-10  
**Status:** Complete