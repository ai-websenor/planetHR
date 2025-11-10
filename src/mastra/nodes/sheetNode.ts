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
