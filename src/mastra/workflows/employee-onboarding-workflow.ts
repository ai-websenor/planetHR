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
        employeeId,
        organization: personalInfo.organization,
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

// Step 3: Calculate harmonic frequencies and save to separate collections
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
    harmonicData: z.any(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { employeeId, personalInfo, astrologicalData } = inputData;
    console.log(
      `[Workflow: calculate-harmonics] - Starting for employee ${employeeId}`,
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

    // Fetch employee to get birth date
    const employeeResult = await databaseTool.execute({
      context: {
        operation: 'fetch_employee',
        employeeId,
      },
      runtimeContext,
    });

    if (!employeeResult.success) {
      throw new Error('Employee not found for harmonic calculation');
    }

    const employee = employeeResult.data;

    // Extract planet positions from astrologicalData
    // Format: [{planetName: "Sun", longitude: 285.5}, ...]
    const natalPositions: Array<{ planetName: string; longitude: number }> = [];

    // Extract planets from the planets object
    if (astrologicalData.planets && typeof astrologicalData.planets === 'object') {
      const excludedPlanets = ['Chiron', 'Part of Fortune', 'Lilith'];

      for (const [planetName, planetData] of Object.entries(astrologicalData.planets)) {
        if (!excludedPlanets.includes(planetName) && planetData && typeof planetData === 'object') {
          natalPositions.push({
            planetName,
            longitude: (planetData as any).longitude,
          });
        }
      }
    }

    // Extract ASC (Ascendant) and MC (Midheaven) from house cusps
    if (astrologicalData.houses && Array.isArray(astrologicalData.houses)) {
      const house1 = astrologicalData.houses.find((h: any) => h.number === 1);
      const house10 = astrologicalData.houses.find((h: any) => h.number === 10);

      if (house1 && house1.cusp) {
        natalPositions.push({
          planetName: 'ASC',
          longitude: house1.cusp,
        });
      }

      if (house10 && house10.cusp) {
        natalPositions.push({
          planetName: 'MC',
          longitude: house10.cusp,
        });
      }
    }

    console.log(
      `[Workflow: calculate-harmonics] - Extracted ${natalPositions.length} planet positions`,
    );

    // Validate we have enough data before proceeding
    if (natalPositions.length === 0) {
      throw new Error(
        'No planet positions extracted from astrology data. The astrology API may have returned empty data.',
      );
    }

    console.log(
      `[Workflow: calculate-harmonics] - Calling harmonicCalculationTool with:`,
      `- Natal positions: ${natalPositions.length} planets`,
      `- Birth date: ${employee.birthData.birthDate}`,
      `- Current role: ${personalInfo.role.toLowerCase()}`,
      `- Max harmonic: 360`,
    );

    // Calculate harmonics with Z-score normalization
    const harmonicResult = await harmonicCalculationTool.execute({
      context: {
        natalPositions,
        birthDate: typeof employee.birthData.birthDate === 'string'
          ? employee.birthData.birthDate
          : employee.birthData.birthDate.toISOString(),
        targetDate: new Date().toISOString(),
        maxHarmonic: 360,
        calculateAgeHarmonics: true,
        currentRole: (personalInfo.role.toLowerCase() as 'owner' | 'leader' | 'manager' | 'operational') || 'operational',
      },
      runtimeContext,
    });

    if (!harmonicResult.success) {
      throw new Error(
        `Harmonic calculation failed: ${harmonicResult.error || 'Unknown error'}`,
      );
    }

    console.log(
      `[Workflow: calculate-harmonics] - Harmonics calculated successfully in ${harmonicResult.processingTime}ms`,
    );

    console.log(
      `[Workflow: calculate-harmonics] - Starting database saves...`,
      `Has baseHarmonics: ${!!harmonicResult.baseHarmonics}`,
      `Has ageHarmonics: ${!!harmonicResult.ageHarmonics}`,
      `Has roleBasedInsights: ${!!harmonicResult.roleBasedInsights}`,
    );

    // Save base harmonics to BaseHarmonics collection
    const baseHarmonicsSaveResult = await databaseTool.execute({
      context: {
        operation: 'save_base_harmonics',
        employeeId,
        data: {
          ...harmonicResult.baseHarmonics,
          organization: personalInfo.organization,
        },
      },
      runtimeContext,
    });
    console.log(
      `[Workflow: calculate-harmonics] - Base harmonics saved to collection`,
      `Success: ${baseHarmonicsSaveResult.success}`,
      `Document ID: ${(baseHarmonicsSaveResult as any).documentId}`,
    );

    // Save age harmonics to AgeHarmonics collection
    if (harmonicResult.ageHarmonics) {
      await databaseTool.execute({
        context: {
          operation: 'save_age_harmonics',
          employeeId,
          data: {
            ...harmonicResult.ageHarmonics,
            organization: personalInfo.organization,
          },
        },
        runtimeContext,
      });
      console.log(
        `[Workflow: calculate-harmonics] - Age harmonics saved to collection`,
      );
    }

    // Save role insights for each role to RoleInsights collection
    const roles = ['owner', 'leader', 'manager', 'operational'];
    for (const role of roles) {
      const baseInsights = harmonicResult.roleBasedInsights?.base[role] || [];
      const ageInsights =
        harmonicResult.roleBasedInsights?.age?.[role] || [];

      await databaseTool.execute({
        context: {
          operation: 'save_role_insights',
          employeeId,
          data: {
            role,
            baseInsights,
            ageInsights,
            promotionReadiness: harmonicResult.promotionReadiness,
            organization: personalInfo.organization,
          },
        },
        runtimeContext,
      });
    }
    console.log(
      `[Workflow: calculate-harmonics] - Role insights saved for all roles`,
    );

    // Update employee with lightweight harmonic reference
    const topEnergyCodes =
      harmonicResult.baseHarmonics?.topHarmonicsByCluster.coreTrait
        .slice(0, 3)
        .map((h) => h.energyCode) || [];

    await databaseTool.execute({
      context: {
        operation: 'update_employee_harmonic_reference',
        employeeId,
        data: {
          hasAgeHarmonics: !!harmonicResult.ageHarmonics,
          quickInsights: {
            topEnergyCodes,
            dominantCluster: 'coreTrait',
            currentRole: personalInfo.role,
          },
        },
      },
      runtimeContext,
    });
    console.log(
      `[Workflow: calculate-harmonics] - Employee harmonic reference updated`,
    );

    // Also save astrologicalData to employee for backward compatibility
    await databaseTool.execute({
      context: {
        operation: 'save_astro_data',
        employeeId,
        data: {
          astrologicalData,
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

// Step 4: Complete processing and notify
const completeProcessingStep = createStep({
  id: 'complete-processing',
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
    status: z.string(),
    completionTime: z.string(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { employeeId } = inputData;
    console.log(
      `[Workflow: complete-processing] - Completing onboarding for employee ${employeeId}`,
    );

    // Update final processing status
    await databaseTool.execute({
      context: {
        operation: 'update_processing_status',
        employeeId,
        data: {
          status: 'completed',
          stage: 'harmonics_calculated',
          progress: 100,
        },
      },
      runtimeContext,
    });

    return {
      employeeId,
      status: 'completed',
      completionTime: new Date().toISOString(),
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
    completionTime: z.string(),
  }),
})
  .then(validateBirthDataStep)
  .then(generateAstrologyStep)
  .then(calculateHarmonicsStep)
  .then(completeProcessingStep)
  .commit();
