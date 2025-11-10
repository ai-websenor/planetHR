# Workflow Documentation

## Project: PlanetsHR - AI-Powered Employee Analysis Platform

This directory contains comprehensive workflow documentation for all modules in the monolithic architecture.

## Documentation Structure

Each module contains:
- **README.md** - Module overview and index
- **user-flows.md** - User journey scenarios
- **technical-specs.md** - Monolithic architecture with modules
- **api-contracts.md** - Internal and external API specifications
- **database-schema.md** - Database schemas
- **module-interactions.md** - Internal module communication
- **error-handling.md** - Error scenarios
- **features/** - BDD/Gherkin test scenarios

## Modules

### Admin Panel

  - [Authentication &amp; Authorization](./admin-panel/authentication-authorization/README.md) - Role-based authentication system with hierarchical access control supporting Owner, Leader, Manager roles with scope-limited permissions.
  - [Organization Management](./admin-panel/organization-management/README.md) - Multi-tenant organization setup including company profiles, astrological data, branch and department hierarchical management with template-based or manual configuration.
  - [Employee &amp; Candidate Management](./admin-panel/employee-candidate-management/README.md) - Comprehensive employee and candidate data management including personal information, professional background, department assignment with bulk and individual entry capabilities.
  - [AI-Powered Report Generation](./admin-panel/report-generation/README.md) - Automated generation of 8 comprehensive report types including personality, behavior, compatibility, Q&amp;A, and training reports using LLM, astrology, and harmonic energy analysis.
  - [Dynamic AI Consultation](./admin-panel/ai-chat-consultation/README.md) - Real-time AI-powered chat system for employee-specific insights, team compatibility analysis, and personalized training guidance with role-scoped access.
  - [Automated Quarterly Updates](./admin-panel/quarterly-updates/README.md) - Automated quarterly regeneration of all employee reports based on harmonic energy code changes with subscription validation and trend analysis.
  - [Subscription &amp; Billing Management](./admin-panel/subscription-billing/README.md) - Subscription management system with tiered features, usage limits, payment integration, and automated quarterly update access control.
  - [Dashboard &amp; Analytics](./admin-panel/dashboard-analytics/README.md) - Role-specific customized dashboards with report access, AI chat interface integration, notifications, and comprehensive analytics for platform adoption and user engagement.
  - [Notification System](./admin-panel/notification-system/README.md) - Multi-channel notification system for report generation, quarterly updates, subscription events, and system alerts with role-based delivery.
  - [Astrology &amp; Harmonic Energy Engine](./admin-panel/astrology-harmonic-engine/README.md) - Core calculation engine for astrological analysis, birth chart generation, harmonic energy code computation, and quarterly energy pattern updates.
  - [Data Security &amp; Compliance](./admin-panel/data-security-compliance/README.md) - Comprehensive security framework with encryption, audit logging, GDPR/CCPA compliance, and employment law adherence for sensitive employee data protection.
  - [External Integrations](./admin-panel/external-integrations/README.md) - Integration framework for LLM APIs, third-party astrology services, HRMS systems, performance management, learning management, and recruitment platforms.


## Monolithic Architecture

[Overall application architecture to be documented]

## Module Organization

[How modules are organized within the monolith to be documented]

---

**Generated:** 2025-11-10
**Generator:** workflow-generator-cli
