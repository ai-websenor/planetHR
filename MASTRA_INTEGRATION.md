# Mastra.ai Integration - PlanetsHR Backend

## Overview

This document outlines the complete Mastra.ai integration implemented in the PlanetsHR backend for AI-powered employee personality analysis and report generation.

## 🏗️ Architecture

### Mastra Components Implemented

```
src/mastra/
├── index.ts                    # Main Mastra instance configuration
├── agents/                     # AI agents for different report types
│   ├── personality-agent.ts    # Core personality analysis
│   ├── role-compatibility-agent.ts
│   ├── department-compatibility-agent.ts
│   ├── industry-compatibility-agent.ts
│   ├── team-integration-agent.ts
│   └── training-development-agent.ts
├── tools/                      # Mastra tools for external integrations
│   ├── astrology-api-tool.ts   # AstrologyAPI.com integration
│   ├── harmonic-calculation-tool.ts  # 360 harmonic frequency analysis
│   ├── database-tool.ts        # MongoDB operations
│   └── report-formatting-tool.ts    # Enterprise report formatting
└── workflows/                  # Multi-step workflows
    └── employee-onboarding-workflow.ts  # Complete onboarding flow
```

### Integration Flow

```
Employee Added → NestJS Controller → Queue Service → 
Mastra Workflow → [Tools + Agents] → Reports Generated → 
Database Storage → Real-time Notifications
```

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment variables from `.env.example`:

```bash
# AI Services
OPENAI_API_KEY=sk-your-openai-api-key

# Astrology API
ASTROLOGY_API_BASE_URL=https://api.astrologyapi.com/v1
ASTROLOGY_API_USER_ID=your-astrology-user-id
ASTROLOGY_API_KEY=your-astrology-api-key

# Mastra Storage
MASTRA_STORAGE_URL=file:./data/mastra.db
```

### 2. Start the Application

```bash
# Install dependencies (if not already done)
pnpm install

# Start development server
pnpm run start:dev
```

### 3. Test the Integration

```bash
# Create a new employee (triggers Mastra workflow)
curl -X POST http://localhost:3000/employees \
  -H "Content-Type: application/json" \
  -d '{
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "professionalInfo": {
      "role": "Software Engineer",
      "department": "Engineering",
      "startDate": "2024-01-15",
      "employeeType": "full-time",
      "level": "Senior"
    },
    "birthData": {
      "birthDate": "1990-05-15",
      "birthTime": "14:30",
      "birthLocation": {
        "city": "New York",
        "country": "USA",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "timezone": -5
      }
    }
  }'

# Check processing status
curl http://localhost:3000/employees/{employee-id}/status

# Get generated reports
curl http://localhost:3000/employees/{employee-id}/reports
```

## 📊 Mastra Tools

### 1. Astrology API Tool
- **Purpose**: Generate Western astrological chart from birth data
- **External API**: AstrologyAPI.com
- **Output**: Planet positions, houses, aspects
- **Processing Time**: 30-90 seconds

### 2. Harmonic Calculation Tool
- **Purpose**: Calculate 360 harmonic frequencies and energy patterns
- **Input**: Planet positions from astrology tool
- **Output**: Harmonic data, dominant frequencies, energy signatures
- **Processing Time**: 60-120 seconds

### 3. Database Tool
- **Purpose**: Perform MongoDB operations for employee and report data
- **Operations**: fetch_employee, save_astro_data, save_report, update_processing_status
- **Integration**: Direct Mongoose model access

### 4. Report Formatting Tool
- **Purpose**: Format AI-generated content into enterprise templates
- **Input**: AI content + employee data + metadata
- **Output**: Formatted markdown reports
- **Templates**: Role-specific (Owner/Leader/Manager)

## 🤖 Mastra Agents

### 1. Personality Analysis Agent
- **Model**: OpenAI GPT-4
- **Focus**: Core personality traits, work style, team dynamics
- **Output**: Personality breakdown, strengths, development areas

### 2. Role Compatibility Agent
- **Model**: OpenAI GPT-4
- **Focus**: Job-role fit, performance prediction, career development
- **Output**: Compatibility scores, advancement potential

### 3. Department Compatibility Agent
- **Model**: OpenAI GPT-4
- **Focus**: Team integration, departmental culture fit
- **Output**: Team positioning, collaboration strategies

### 4. Industry Compatibility Agent
- **Model**: OpenAI GPT-4
- **Focus**: Industry alignment, market dynamics, competitive advantage
- **Output**: Industry success potential, adaptation strategies

### 5. Team Integration Agent
- **Model**: OpenAI GPT-4
- **Focus**: Team dynamics, leadership potential, collaboration style
- **Output**: Team role assessment, optimization recommendations

### 6. Training Development Agent
- **Model**: OpenAI GPT-4
- **Focus**: Learning preferences, skill development, career planning
- **Output**: Personalized training recommendations, development roadmap

## 🔄 Employee Onboarding Workflow

### Workflow Steps

1. **validate-birth-data**: Validate and collect employee birth information
2. **generate-astrology**: Call astrology API for chart generation
3. **calculate-harmonics**: Process harmonic frequencies and energy patterns
4. **generate-reports**: Generate all 18 reports (6 types × 3 roles) using AI agents
5. **complete-processing**: Finalize processing and trigger notifications

### Processing Timeline
- **Total Time**: 8-15 minutes per employee
- **Reports Generated**: 18 (6 report types × 3 viewer roles)
- **Real-time Updates**: Progress tracking via WebSocket

### Error Handling
- Retry mechanisms for external API failures
- Graceful degradation for partial processing
- Comprehensive error logging and notifications

## 📡 Queue Integration

### BullMQ Queue System
```typescript
// Queue employee onboarding
const result = await employeeQueueService.queueEmployeeOnboarding(
  employeeId,
  {
    userId: user.sub,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  }
);
```

### Real-time Progress Updates
- WebSocket notifications for processing stages
- Email notifications for completion/errors
- Queue status monitoring and management

## 📄 Report Generation

### Report Types Generated
1. **Personality Analysis**: Core traits and behavioral patterns
2. **Role Compatibility**: Job fit and performance prediction
3. **Department Compatibility**: Team integration and culture fit
4. **Industry Compatibility**: Industry alignment and success potential
5. **Team Integration**: Team dynamics and leadership assessment
6. **Training Development**: Learning recommendations and career planning

### Role-based Perspectives
- **Owner**: Strategic business impact, ROI, succession planning
- **Leader**: Department optimization, team performance, leadership development
- **Manager**: Daily management, task assignment, practical action items

### Report Formats
- **Markdown**: Structured enterprise templates
- **Word Count**: 2000-4000 words per report
- **Confidence Levels**: HIGH/MEDIUM/LOW based on data quality
- **Validity**: 90 days (quarterly regeneration)

## 🔧 Development Guidelines

### Adding New Agents
```typescript
// 1. Create agent file
export const newAgent = new Agent({
  name: "New Agent",
  instructions: ["Agent instructions..."],
  model: openai("gpt-4"),
  tools: ["relevantTool"],
});

// 2. Register in mastra/index.ts
export const mastra = new Mastra({
  agents: {
    // ... existing agents
    newAgent,
  },
});
```

### Adding New Tools
```typescript
// 1. Create tool file
export const newTool = createTool({
  id: "new-tool",
  description: "Tool description",
  inputSchema: z.object({...}),
  outputSchema: z.object({...}),
  execute: async (input) => {
    // Tool implementation
  },
});

// 2. Register in workflow steps
```

### Testing Strategy
```typescript
// Unit tests for tools
describe('AstrologyApiTool', () => {
  it('should generate valid astrological data', async () => {
    // Test implementation
  });
});

// Integration tests for workflows
describe('EmployeeOnboardingWorkflow', () => {
  it('should complete full onboarding process', async () => {
    // Test implementation
  });
});
```

## 📊 Monitoring & Observability

### Metrics Tracked
- Workflow execution times
- Tool success/failure rates
- Agent token usage
- Queue processing statistics
- Report generation metrics

### Logging
- Structured logging for all Mastra operations
- Error tracking and alerting
- Performance monitoring
- Cost tracking for AI operations

### Health Checks
- External API connectivity (Astrology API)
- Database connectivity
- Queue system health
- AI service availability

## 🚀 Deployment Considerations

### Production Configuration
```bash
# Use production-grade AI models
OPENAI_API_KEY=sk-prod-your-production-key

# Configure proper storage
MASTRA_STORAGE_URL=postgresql://user:pass@host:port/db

# Set up monitoring
LOG_LEVEL=info
```

### Scaling Considerations
- Queue-based processing for horizontal scaling
- Database connection pooling
- Redis clustering for queue distribution
- CDN integration for report delivery

### Security
- API key rotation policies
- Input validation and sanitization
- Rate limiting for external APIs
- Audit logging for compliance

## 📚 API Documentation

### Swagger Documentation
Available at: `http://localhost:3000/api/docs`

### Key Endpoints
- `POST /employees` - Create employee and trigger analysis
- `GET /employees/:id/status` - Check processing status
- `GET /employees/:id/reports` - Get generated reports
- `GET /employees/queue/stats` - Queue statistics

## 🆘 Troubleshooting

### Common Issues

1. **Astrology API Failures**
   - Check API credentials and quotas
   - Verify birth data format and completeness
   - Monitor API response times

2. **Harmonic Calculation Errors**
   - Validate planet position data
   - Check for edge cases in calculations
   - Monitor memory usage for large calculations

3. **Report Generation Failures**
   - Check OpenAI API quotas and rate limits
   - Validate agent configurations
   - Monitor token usage and costs

4. **Queue Processing Issues**
   - Check Redis connectivity
   - Monitor queue depths and processing times
   - Verify worker process health

### Debug Commands
```bash
# Check queue status
curl http://localhost:3000/employees/queue/stats

# Monitor Redis queue
redis-cli monitor

# Check application logs
tail -f server.log
```

## 🔄 Future Enhancements

### Planned Features
1. **Batch Processing**: Multiple employee analysis
2. **Advanced Analytics**: Trend analysis and insights
3. **Custom Report Templates**: Organization-specific formatting
4. **API Rate Optimization**: Intelligent caching and batching
5. **Machine Learning**: Improved personality prediction models

### Integration Opportunities
- HRMS system integrations
- Performance management platforms
- Learning management systems
- Recruitment platform connectors

---

This Mastra.ai integration provides a comprehensive, scalable foundation for AI-powered HR analytics in the PlanetsHR platform. The modular architecture allows for easy extension and customization while maintaining enterprise-grade reliability and performance.