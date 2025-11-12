import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const databaseTool = createTool({
  id: 'database-operations',
  description: 'Perform database operations for employee data and reports',
  inputSchema: z.object({
    operation: z.enum([
      'fetch_employee',
      'save_astro_data',
      'save_report',
      'update_processing_status',
    ]),
    employeeId: z.string(),
    data: z.any().optional(),
    reportType: z.string().optional(),
    viewerRole: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.any().optional(),
    message: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { operation, employeeId, data, reportType, viewerRole } = context;
    console.log(
      `[DatabaseTool] - Operation: ${operation} for employee ${employeeId}`,
    );
    try {
      // These models will be injected through runtimeContext from NestJS
      const employeeModel = runtimeContext?.get?.('employeeModel');
      const reportModel = runtimeContext?.get?.('reportModel');

      if (!employeeModel || !reportModel) {
        throw new Error('Database models not available in context');
      }

      switch (operation) {
        case 'fetch_employee':
          const employee = await employeeModel.findById(employeeId).exec();
          if (!employee) {
            return { success: false, message: 'Employee not found' };
          }

          return {
            success: true,
            data: {
              id: employee._id,
              personalInfo: employee.personalInfo,
              professionalInfo: employee.professionalInfo,
              birthData: employee.birthData,
              organization: employee.organization,
              department: employee.department,
            },
            message: 'Employee data retrieved successfully',
          };

        case 'save_astro_data':
          await employeeModel.findByIdAndUpdate(
            employeeId,
            {
              $set: {
                'energyCode.astrologicalData': data.astrologicalData,
                'energyCode.harmonicData': data.harmonicData,
                'energyCode.dominantFrequencies': data.dominantFrequencies,
                'energyCode.energyPattern': data.energyPattern,
                'energyCode.lastCalculated': new Date(),
                'energyCode.nextUpdate': new Date(
                  Date.now() + 90 * 24 * 60 * 60 * 1000,
                ), // 90 days
              },
            },
            { new: true },
          );

          return {
            success: true,
            message: 'Astrological and harmonic data saved successfully',
          };

        case 'save_report':
          const reportData = {
            employeeId,
            reportType,
            viewerRole,
            content: data.content,
            metadata: data.metadata,
            generatedAt: new Date(),
            validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            confidenceLevel: data.confidenceLevel || 'HIGH',
            energyCodeBase: data.energyCodeBase,
            version: '1.0',
            organization: data.organization,
          };

          // Upsert report (update if exists, create if not)
          await reportModel.findOneAndUpdate(
            { employeeId, reportType, viewerRole },
            reportData,
            { upsert: true, new: true },
          );

          return {
            success: true,
            message: `${reportType} report for ${viewerRole} saved successfully`,
          };

        case 'update_processing_status':
          await employeeModel.findByIdAndUpdate(employeeId, {
            $set: {
              'processingStatus.status': data.status,
              'processingStatus.stage': data.stage,
              'processingStatus.progress': data.progress,
              'processingStatus.lastUpdated': new Date(),
              'processingStatus.completedReports': data.completedReports || [],
            },
          });

          return {
            success: true,
            message: 'Processing status updated successfully',
          };

        default:
          return {
            success: false,
            message: 'Unknown database operation',
          };
      }
    } catch (error) {
      console.error('Database operation error:', error.message);

      return {
        success: false,
        message: `Database operation failed: ${error.message}`,
      };
    }
  },
});

// Example usage - commented out to avoid compilation errors
// databaseTool.execute('update_processing_status', {
//   employeeId: '12345',
//   status: 'IN_PROGRESS',
//   stage: 'STAGE_2',
//   progress: 50,
//   completedReports: ['report1', 'report2'],
// });
