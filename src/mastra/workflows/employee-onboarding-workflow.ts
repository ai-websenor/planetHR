import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// Import tools statically
import { databaseTool } from '../tools/database-tool';
import { astrologyApiTool } from '../tools/astrology-api-tool';
import { harmonicCalculationTool } from '../tools/harmonic-calculation-tool';
import { reportFormattingTool } from '../tools/report-formatting-tool';

// Step 1: Validate and collect birth data
const validateBirthDataStep = createStep({
  id: 'validate-birth-data',
  inputSchema: z.object({
    employeeId: z.string(),
  }),
  outputSchema: z.object({
    employeeId: z.string(),
    birthData: z.object({
      birthDate: z.string(),
      birthTime: z.string().optional(),
      birthLocation: z.object({
        city: z.string(),
        country: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        timezone: z.number(),
      }),
    }),
    personalInfo: z.object({
      name: z.string(),
      id: z.string(),
      department: z.string(),
      role: z.string(),
      organization: z.string(),
    }),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { employeeId } = inputData;
    console.log(
      `[Workflow: validate-birth-data] - Starting for employee ${employeeId}`,
    );

    // Update processing status
    await databaseTool.execute({
      context: {
        operation: 'update_processing_status',
        employeeId,
        data: {
          status: 'processing',
          stage: 'birth_data_validation',
          progress: 10,
        },
      },
      runtimeContext,
    });

    // Fetch employee data
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

    // Validate birth data completeness
    if (!employee.birthData || !employee.birthData.birthDate) {
      throw new Error('Birth date is required for personality analysis');
    }

    if (!employee.birthData.birthLocation) {
      throw new Error('Birth location is required for accurate analysis');
    }

    return {
      employeeId,
      birthData: employee.birthData,
      personalInfo: {
        name: employee.personalInfo.name,
        id: employee.id,
        department: employee.department,
        role: employee.professionalInfo.role,
        organization: employee.organization,
      },
    };
  },
});

// Step 2: Generate astrological chart data
const generateAstrologyStep = createStep({
  id: 'generate-astrology',
  inputSchema: z.object({
    employeeId: z.string(),
    birthData: z.object({
      birthDate: z.string(),
      birthTime: z.string().optional(),
      birthLocation: z.object({
        city: z.string(),
        country: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        timezone: z.number(),
      }),
    }),
    personalInfo: z.object({
      name: z.string(),
      id: z.string(),
      department: z.string(),
      role: z.string(),
      organization: z.string(),
    }),
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
    astrologicalData: z.object({
      planets: z.record(z.any()),
      houses: z.array(z.any()),
      aspects: z.array(z.any()),
      processing_time: z.number(),
    }),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { employeeId, birthData, personalInfo } = inputData;
    console.log(
      `[Workflow: generate-astrology] - Starting for employee ${employeeId}`,
    );

    // Update processing status
    await databaseTool.execute({
      context: {
        operation: 'update_processing_status',
        employeeId,
        data: {
          status: 'processing',
          stage: 'astrology_generation',
          progress: 25,
        },
      },
      runtimeContext,
    });

    console.log(
      '[generate-astrology] - Calling astrologyApiTool.execute with context:',
      {
        birthDate: birthData.birthDate,
        birthTime: birthData.birthTime,
        birthLocation: birthData.birthLocation,
      },
    );
    // Call astrology API
    const astroResult = await astrologyApiTool.execute({
      context: {
        birthDate: (birthData.birthDate as any).toISOString(),
        birthTime: birthData.birthTime,
        birthLocation: birthData.birthLocation,
      },
      runtimeContext,
    });

    if (!astroResult.success) {
      throw new Error(
        `Astrology API failed: ${JSON.stringify((astroResult as any).error) || 'Unknown error'}`,
      );
    }

    return {
      employeeId,
      personalInfo,
      astrologicalData: {
        ...astroResult.data,
        processing_time: astroResult.processing_time,
      },
    };
  },
});

// Step 3: Calculate harmonic frequencies
const calculateHarmonicsStep = createStep({
  id: 'calculate-harmonics',
  inputSchema: z.object({
    employeeId: z.string(),
    personalInfo: z.object({
      name: z.string(),
      id: z.string(),
      department: z.string(),
      role: z.string(),
      organization: z.string(),
    }),
    astrologicalData: z.object({
      planets: z.record(z.any()),
      houses: z.array(z.any()),
      aspects: z.array(z.any()),
      processing_time: z.number(),
    }),
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
    astrologicalData: z.any(),
    harmonicData: z.object({
      harmonics: z.record(z.any()),
      dominant_frequencies: z.array(z.any()),
      overall_energy_pattern: z.string(),
      processing_time: z.number(),
    }),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { employeeId, personalInfo, astrologicalData } = inputData;
    console.log(
      `[Workflow: calculate-harmonics] - Starting for employee ${employeeId} ${astrologicalData}`,
    );

    // Update processing status
    await databaseTool.execute({
      context: {
        operation: 'update_processing_status',
        employeeId,
        data: {
          status: 'processing',
          stage: 'harmonic_calculation',
          progress: 40,
        },
      },
      runtimeContext,
    });

    // Calculate harmonics
    const harmonicResult = await harmonicCalculationTool.execute({
      context: {
        planetPositions: astrologicalData.planets,
        calculateAllHarmonics: false, // Use key harmonics for performance
      },
      runtimeContext,
    });

    if (!harmonicResult.success) {
      throw new Error(
        `Harmonic calculation failed: ${(harmonicResult as any).error || 'Unknown error'}`,
      );
    }

    // Save astrological and harmonic data to database
    await databaseTool.execute({
      context: {
        operation: 'save_astro_data',
        employeeId,
        data: {
          astrologicalData,
          harmonicData: harmonicResult,
          dominantFrequencies: harmonicResult.dominant_frequencies,
          energyPattern: harmonicResult.overall_energy_pattern,
        },
      },
      runtimeContext,
    });

    return {
      employeeId,
      personalInfo,
      astrologicalData,
      harmonicData: harmonicResult,
    };
  },
});

// Step 4: Generate all reports in parallel
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
    harmonicData: z.object({
      harmonics: z.record(z.any()),
      dominant_frequencies: z.array(z.any()),
      overall_energy_pattern: z.string(),
      processing_time: z.number(),
    }),
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
            // structuredOutput: {
            //   schema: z.object({
            //     executiveSummary: z.string().optional(),
            //     detailedAnalysis: z.string().optional(),
            //     strengths: z.array(z.string()).optional(),
            //     developmentAreas: z.array(z.string()).optional(),
            //     compatibilityScores: z.record(z.number()).optional(),
            //     recommendations: z.array(z.string()).optional(),
            //     insights: z.string().optional(),
            //     actionItems: z.array(z.string()).optional(),
            //   }),
            // },
            maxSteps: 3,
          });

          console.log('agentResponse', convertToJSON(agentResponse.text));
          // Format the report using the formatting tool
          // const formattedReport = await reportFormattingTool.execute({
          //   context: {
          //     reportType: reportType as
          //       | 'personality'
          //       | 'role'
          //       | 'department'
          //       | 'industry'
          //       | 'team'
          //       | 'training',
          //     viewerRole: viewerRole as 'owner' | 'leader' | 'manager',
          //     employeeData: personalInfo,
          //     aiGeneratedContent: agentResponse.object,
          //     metadata: {
          //       confidenceLevel: 'HIGH',
          //       energyCodeBase: harmonicData.overall_energy_pattern,
          //       generationTime: Date.now() - startTime,
          //     },
          //   },
          //   runtimeContext,
          // });

          // if (formattedReport.success) {
          //   // Save report to database
          //   await databaseTool.execute({
          //     context: {
          //       operation: 'save_report',
          //       employeeId,
          //       reportType: reportType as
          //         | 'personality'
          //         | 'role'
          //         | 'department'
          //         | 'industry'
          //         | 'team'
          //         | 'training',
          //       viewerRole: viewerRole as 'owner' | 'leader' | 'manager',
          //       data: {
          //         content: formattedReport.formattedReport,
          //         metadata: {
          //           wordCount: formattedReport.wordCount,
          //           estimatedReadTime: formattedReport.estimatedReadTime,
          //           confidenceLevel: 'HIGH',
          //           energyCodeBase: harmonicData.overall_energy_pattern,
          //         },
          //         confidenceLevel: 'HIGH',
          //         energyCodeBase: harmonicData.overall_energy_pattern,
          //         organization: personalInfo.organization,
          //       },
          //     },
          //     runtimeContext,
          //   });

          //   reports.push({
          //     reportType: reportType as
          //       | 'personality'
          //       | 'role'
          //       | 'department'
          //       | 'industry'
          //       | 'team'
          //       | 'training',
          //     viewerRole: viewerRole as 'owner' | 'leader' | 'manager',
          //     content: formattedReport.formattedReport,
          //     metadata: {
          //       wordCount: formattedReport.wordCount,
          //       estimatedReadTime: formattedReport.estimatedReadTime,
          //     },
          //   });

          //   successfulReports++;
          // } else {
          failedReports++;
          // }
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

// Step 5: Complete processing and notify
const completeProcessingStep = createStep({
  id: 'complete-processing',
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
      `[Workflow: complete-processing] - Starting for employee ${employeeId}`,
    );

    // Update final processing status
    await databaseTool.execute({
      context: {
        operation: 'update_processing_status',
        employeeId,
        data: {
          status: 'completed',
          stage: 'completed',
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
export const employeeOnboardingWorkflow = createWorkflow({
  id: 'employee-onboarding-workflow',
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
  .then(validateBirthDataStep)
  .then(generateAstrologyStep)
  .then(calculateHarmonicsStep)
  .then(generateReportsStep)
  .then(completeProcessingStep)
  .commit();

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

Generate a comprehensive analysis with:
1. Executive summary (100-150 words)
2. Detailed analysis with specific examples
3. 3-5 key strengths with business applications
4. 2-3 development areas with improvement strategies
5. Compatibility scores (0-100) for relevant categories
6. Specific recommendations for the ${viewerRole}
7. Actionable insights and next steps

schema: z.object({
    executiveSummary: z.string(),
   detailedAnalysis: z.string(),
   strengths: z.array(z.string()),
   developmentAreas: z.array(z.string()),
   compatibilityScores: z.record(z.number()),
   recommendations: z.array(z.string()),
   insights: z.string(),
   actionItems: z.array(z.string()),
 }),

 make sure response is valid json no other text then JSON do not add => \n' + it should be stringifyed JSON

Remember: Never mention astrology, harmonic codes, or metaphysical concepts. Frame everything as data-driven personality analysis and behavioral pattern recognition.`;
}
