import { Mastra } from "@mastra/core/mastra";

// Import agents
import { personalityAgent } from "./agents/personality-agent";
import { roleCompatibilityAgent } from "./agents/role-compatibility-agent";
import { departmentCompatibilityAgent } from "./agents/department-compatibility-agent";
import { industryCompatibilityAgent } from "./agents/industry-compatibility-agent";
import { teamIntegrationAgent } from "./agents/team-integration-agent";
import { trainingDevelopmentAgent } from "./agents/training-development-agent";

// Import workflows
import { employeeOnboardingWorkflow } from "./workflows/employee-onboarding-workflow";

// Import tools
import { astrologyApiTool } from "./tools/astrology-api-tool";
import { harmonicCalculationTool } from "./tools/harmonic-calculation-tool";
import { databaseTool } from "./tools/database-tool";
import { reportFormattingTool } from "./tools/report-formatting-tool";

export const mastra = new Mastra({
  agents: {
    personalityAgent,
    roleCompatibilityAgent,
    departmentCompatibilityAgent,
    industryCompatibilityAgent,
    teamIntegrationAgent,
    trainingDevelopmentAgent,
  },
  workflows: {
    employeeOnboardingWorkflow,
  },
});