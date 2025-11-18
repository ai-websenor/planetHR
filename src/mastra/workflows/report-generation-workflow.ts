import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// Import tools statically
import { databaseTool } from '../tools/database-tool';

// Step 1: Fetch employee data and harmonics
const fetchEmployeeDataStep = createStep({
  id: 'fetch-employee-data',
  inputSchema: z.object({
    employeeId: z.string(),
  }),
  outputSchema: z.object({
    employeeId: z.string(),
    personalInfo: z.object({
      name: z.string(),
      id: z.string(),
      department: z.string(),
      role: z.string(),
      organization: z.string(),
    }),
    harmonicData: z.any(),
    astrologicalData: z.any(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { employeeId } = inputData;
    console.log(
      `[Workflow: fetch-employee-data] - Starting for employee ${employeeId}`,
    );

    // Update processing status
    await databaseTool.execute({
      context: {
        operation: 'update_processing_status',
        employeeId,
        data: {
          status: 'processing',
          stage: 'fetching_data',
          progress: 10,
        },
      },
      runtimeContext,
    });

    // Fetch employee
    const employeeResult = await databaseTool.execute({
      context: {
        operation: 'fetch_employee',
        employeeId,
      },
      runtimeContext,
    });

    if (!employeeResult.success) {
      throw new Error('Employee not found');
    }

    const employee = employeeResult.data;

    // Fetch base harmonics
    const baseHarmonicsResult = await databaseTool.execute({
      context: {
        operation: 'fetch_base_harmonics',
        employeeId,
      },
      runtimeContext,
    });

    if (!baseHarmonicsResult.success) {
      throw new Error('Base harmonics not found. Please run employee onboarding first.');
    }

    console.log(
      `[Workflow: fetch-employee-data] - Data fetched successfully for employee ${employeeId}`,
    );

    // Return structured data
    return {
      employeeId,
      personalInfo: {
        name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
        id: employeeId,
        department: employee.professionalInfo.department,
        role: employee.professionalInfo.role,
        organization: employee.organization,
      },
      harmonicData: baseHarmonicsResult.data,
      astrologicalData: employee.astrologicalData || {},
    };
  },
});

// Step 2: Generate all reports in parallel
const generateReportsStep = createStep({
  id: 'generate-reports',
  inputSchema: z.object({
    employeeId: z.string(),
    personalInfo: z.object({
      name: z.string(),
      id: z.string(),
      department: z.string(),
      role: z.string(),
      organization: z.string(),
    }),
    astrologicalData: z.any(),
    harmonicData: z.any(),
  }),
  outputSchema: z.object({
    employeeId: z.string(),
    reports: z.array(
      z.object({
        reportType: z.string(),
        viewerRole: z.string(),
        content: z.string(),
        metadata: z.any(),
      }),
    ),
    processingStats: z.object({
      totalReports: z.number(),
      successfulReports: z.number(),
      failedReports: z.number(),
      totalProcessingTime: z.number(),
    }),
  }),
  execute: async ({ inputData, mastra, runtimeContext }) => {
    const { employeeId, personalInfo, astrologicalData, harmonicData } =
      inputData;
    console.log(
      `[Workflow: generate-reports] - Starting for employee ${employeeId}`,
    );

    // Update processing status
    await databaseTool.execute({
      context: {
        operation: 'update_processing_status',
        employeeId,
        data: {
          status: 'processing',
          stage: 'report_generation',
          progress: 60,
        },
      },
      runtimeContext,
    });

    const reportTypes = [
      'personality',
      'role',
      'department',
      'industry',
      'team',
      'training',
    ];
    const viewerRoles = ['owner', 'leader', 'manager'];
    const reports: Array<{
      reportType: string;
      viewerRole: string;
      content: string;
      metadata: any;
    }> = [];
    const startTime = Date.now();
    let successfulReports = 0;
    let failedReports = 0;

    // Generate all reports
    for (const reportType of reportTypes) {
      for (const viewerRole of viewerRoles) {
        try {
          // Select appropriate agent for report type
          const agentNameMap: Record<string, string> = {
            personality: 'personalityAgent',
            role: 'roleCompatibilityAgent',
            department: 'departmentCompatibilityAgent',
            industry: 'industryCompatibilityAgent',
            team: 'teamIntegrationAgent',
            training: 'trainingDevelopmentAgent',
          };

          const agentName = agentNameMap[reportType];
          const agent = mastra.getAgent(agentName);

          if (!agent) {
            console.warn(`Agent ${agentName} not found, skipping report`);
            failedReports++;
            continue;
          }

          // Generate report content with AI agent
          const reportPrompt = generateReportPrompt(
            reportType,
            viewerRole,
            personalInfo,
            harmonicData,
          );

          const agentResponse = await agent.generate(reportPrompt, {
            maxSteps: 3,
          });

          let res = convertToJSON(agentResponse.text);
          console.log(JSON.stringify(res));
          reports.push({
            reportType: reportType as
              | 'personality'
              | 'role'
              | 'department'
              | 'industry'
              | 'team'
              | 'training',
            viewerRole: viewerRole as 'owner' | 'leader' | 'manager',
            content: res,
            metadata: {
              wordCount: 0,
              estimatedReadTime: 0,
            },
          });

          successfulReports++;
        } catch (error) {
          console.error(
            `Failed to generate ${reportType} report for ${viewerRole}:`,
            error.message,
          );
          failedReports++;
        }
      }
    }

    return {
      employeeId,
      reports,
      processingStats: {
        totalReports: reportTypes.length * viewerRoles.length,
        successfulReports,
        failedReports,
        totalProcessingTime: Date.now() - startTime,
      },
    };
  },
});

// Step 3: Complete report generation
const completeReportGenerationStep = createStep({
  id: 'complete-report-generation',
  inputSchema: z.object({
    employeeId: z.string(),
    reports: z.array(
      z.object({
        reportType: z.string(),
        viewerRole: z.string(),
        content: z.string(),
        metadata: z.any(),
      }),
    ),
    processingStats: z.object({
      totalReports: z.number(),
      successfulReports: z.number(),
      failedReports: z.number(),
      totalProcessingTime: z.number(),
    }),
  }),
  outputSchema: z.object({
    employeeId: z.string(),
    status: z.string(),
    summary: z.object({
      totalReports: z.number(),
      successfulReports: z.number(),
      completionTime: z.string(),
    }),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { employeeId, reports, processingStats } = inputData;
    console.log(
      `[Workflow: complete-report-generation] - Completing for employee ${employeeId}`,
    );

    // Update final processing status
    await databaseTool.execute({
      context: {
        operation: 'update_processing_status',
        employeeId,
        data: {
          status: 'reports_completed',
          stage: 'reports_generated',
          progress: 100,
          completedReports: reports.map(
            (r) => `${r.reportType}-${r.viewerRole}`,
          ),
        },
      },
      runtimeContext,
    });

    return {
      employeeId,
      status: 'completed',
      summary: {
        totalReports: processingStats.totalReports,
        successfulReports: processingStats.successfulReports,
        completionTime: new Date().toISOString(),
      },
    };
  },
});

// Main workflow definition
export const reportGenerationWorkflow = createWorkflow({
  id: 'report-generation-workflow',
  inputSchema: z.object({
    employeeId: z.string(),
  }),
  outputSchema: z.object({
    employeeId: z.string(),
    status: z.string(),
    summary: z.object({
      totalReports: z.number(),
      successfulReports: z.number(),
      completionTime: z.string(),
    }),
  }),
})
  .then(fetchEmployeeDataStep)
  .then(generateReportsStep)
  .then(completeReportGenerationStep)
  .commit();

// Helper functions
function convertToJSON(inputString) {
  try {
    // Step 1: Remove unnecessary concatenation or escaped newlines if present
    const cleaned = inputString
      .replace(/\\n/g, '\n') // Convert escaped \n back to real newlines
      .replace(/\\'/g, "'") // Convert escaped single quotes
      .replace(/\\"/g, '"'); // Convert escaped double quotes

    // Step 2: Parse into actual JSON object
    const jsonObject = JSON.parse(cleaned);

    return jsonObject;
  } catch (error) {
    console.error('Invalid JSON string:', error.message);
    return null;
  }
}

// Helper function to generate appropriate prompts for each report type
function generateReportPrompt(
  reportType: string,
  viewerRole: string,
  personalInfo: any,
  harmonicData: any,
): string {
  const baseContext = `
Employee Information:
- Name: ${personalInfo.name}
- Role: ${personalInfo.role}
- Department: ${personalInfo.department}
- Organization: ${personalInfo.organization}

Energy Pattern Analysis (translate to business psychology):
- Primary Pattern: ${harmonicData.overall_energy_pattern}
- Dominant Frequencies: ${harmonicData.dominant_frequencies.map((f) => f.harmonic).join(', ')}
- Energy Distribution: ${JSON.stringify(harmonicData.dominant_frequencies)}

Report Requirements:
- Report Type: ${reportType} analysis
- Viewer Role: ${viewerRole}
- Focus: Professional ${reportType} assessment for ${viewerRole} decision-making
`;

  const roleSpecificInstructions = {
    owner:
      'Provide strategic business impact, ROI analysis, succession planning insights, and long-term value assessment.',
    leader:
      'Focus on department optimization, team performance, cross-functional coordination, and leadership development.',
    manager:
      'Emphasize daily management, task assignment, immediate performance, and practical action items.',
  };

  const reportSpecificInstructions = {
    personality:
      'Analyze core personality traits, work style preferences, communication patterns, and behavioral indicators.',
    role: 'Evaluate job fit, performance prediction, career development potential, and role optimization recommendations.',
    department:
      'Assess department culture fit, team integration, workflow compatibility, and collaborative potential.',
    industry:
      'Analyze industry alignment, market dynamics fit, competitive advantages, and long-term industry success potential.',
    team: 'Focus on team dynamics, collaboration style, leadership contribution, and group performance optimization.',
    training:
      'Provide personalized learning recommendations, skill development priorities, and growth planning.',
  };

  return `${baseContext}

${roleSpecificInstructions[viewerRole]}

${reportSpecificInstructions[reportType]}



Remember: Never mention astrology, harmonic codes, or metaphysical concepts. Frame everything as data-driven personality analysis and behavioral pattern recognition.
Return JSON RESPONSE ONLY, its noit a chat its an backend JSON response do not use "/n" any new line symbol its pure Backend JSOn response
`;
}
