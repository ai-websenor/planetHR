# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PlanetsHR is an AI-powered HR analytics platform backend built with NestJS. It uses astrological data and harmonic analysis to generate personality and compatibility reports for employees.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server with hot reload
pnpm run start:dev

# Build for production
pnpm run build

# Run unit tests
pnpm test

# Run single test file
pnpm test -- path/to/file.spec.ts

# Run tests with coverage
pnpm run test:cov

# Run e2e tests
pnpm run test:e2e

# Lint and fix
pnpm run lint

# Format code
pnpm run format
```

## Architecture

### Core Stack
- **Framework**: NestJS 11.x with TypeScript (ES2023 target, NodeNext modules)
- **Database**: MongoDB with Mongoose ODM
- **Queue**: BullMQ with Redis for async job processing
- **AI**: Mastra.ai framework with OpenAI GPT-4 for report generation
- **Real-time**: Socket.io for WebSocket notifications

### Module Structure

The application follows NestJS module patterns in `src/modules/`:

- **auth**: JWT authentication with passport strategies, token blacklisting, session management
- **users**: User management with role-based access (owner, leader, manager)
- **organizations**: Multi-tenant organization structure with branches and departments
- **employees**: Employee CRUD + async onboarding workflow via BullMQ
- **reports**: AI-generated personality/compatibility reports storage and retrieval
- **harmonics**: 360 harmonic frequency calculations from astrological data
- **mastra**: NestJS wrapper service around Mastra.ai instance
- **notifications**: WebSocket gateway for real-time updates
- **audit**: Audit logging for compliance tracking

### Mastra.ai Integration (`src/mastra/`)

The Mastra instance (`src/mastra/index.ts`) orchestrates AI-powered analysis:

**Agents** (GPT-4 powered):
- personalityAgent, roleCompatibilityAgent, departmentCompatibilityAgent
- industryCompatibilityAgent, teamIntegrationAgent, trainingDevelopmentAgent

**Tools**:
- astrologyApiTool: External API integration for birth chart generation
- harmonicCalculationTool: 360 harmonic frequency analysis
- databaseTool: MongoDB operations for workflow persistence
- reportFormattingTool: Enterprise template formatting

**Workflows**:
- employeeOnboardingWorkflow: Multi-step process triggered on employee creation
- reportGenerationWorkflow: Generates 18 reports (6 types × 3 role perspectives)

### Global Guards

Two global guards are registered in `app.module.ts`:
1. `JwtAuthGuard`: Validates JWT tokens (use `@Public()` decorator to bypass)
2. `RolesGuard`: Enforces role-based access (use `@Roles()` decorator)

### API Configuration

- Global prefix: `/api`
- Swagger docs: `/api/docs` (enabled in development)
- Rate limiting: 100 req/15min general, 5 req/15min for `/api/auth`

## Key Patterns

- DTOs use `class-validator` decorators for request validation
- Schemas use Mongoose decorators with `@Schema()` and `@Prop()`
- Async jobs queued via `@nestjs/bull` processors in `processors/` directories
- Configuration loaded via `@nestjs/config` from `.env.local` or `.env`

## External Services Required

- MongoDB 7.x
- Redis 7.x (for BullMQ queues)
- OpenAI API key (for Mastra agents)
- AstrologyAPI.com credentials (for birth chart data)
