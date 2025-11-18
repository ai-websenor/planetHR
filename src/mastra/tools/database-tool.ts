import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const databaseTool = createTool({
  id: 'database-operations',
  description: 'Perform database operations for employee data and reports',
  inputSchema: z.object({
    operation: z.enum([
      'fetch_employee',
      'fetch_base_harmonics',
      'save_astro_data',
      'save_report',
      'update_processing_status',
      'save_base_harmonics',
      'save_age_harmonics',
      'save_role_insights',
      'update_employee_harmonic_reference',
    ]),
    employeeId: z.string(),
    data: z.any().optional(),
    reportType: z.string().optional(),
    viewerRole: z.string().optional(),
    role: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.any().optional(),
    message: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { operation, employeeId, data, reportType, viewerRole, role } =
      context;
    console.log(
      `[DatabaseTool] - Operation: ${operation} for employee ${employeeId}`,
    );
    try {
      // These models will be injected through runtimeContext from NestJS
      const employeeModel = runtimeContext?.get?.('employeeModel');
      const reportModel = runtimeContext?.get?.('reportModel');
      const baseHarmonicsModel = runtimeContext?.get?.('baseHarmonicsModel');
      const ageHarmonicsModel = runtimeContext?.get?.('ageHarmonicsModel');
      const roleInsightsModel = runtimeContext?.get?.('roleInsightsModel');

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
              astrologicalData: employee.energyCode?.astrologicalData,
            },
            message: 'Employee data retrieved successfully',
          };

        case 'fetch_base_harmonics':
          if (!baseHarmonicsModel) {
            throw new Error('BaseHarmonics model not available in context');
          }

          console.log(
            `[DatabaseTool] - Fetching base harmonics for employee ${employeeId}`,
          );

          // Check total count in collection for debugging
          const totalBaseHarmonics = await baseHarmonicsModel.countDocuments();
          console.log(
            `[DatabaseTool] - Total base harmonics documents in collection: ${totalBaseHarmonics}`,
          );

          const baseHarmonics = await baseHarmonicsModel
            .findOne({ employeeId })
            .exec();

          if (!baseHarmonics) {
            console.log(
              `[DatabaseTool] - ❌ Base harmonics NOT FOUND for employee ${employeeId}. Employee must complete onboarding workflow first.`,
            );
            return {
              success: false,
              message:
                'Base harmonics not found. Please ensure the employee has completed the onboarding workflow, which calculates and stores harmonic data.',
            };
          }

          console.log(
            `[DatabaseTool] - ✅ Base harmonics found for employee ${employeeId}`,
            `Document ID: ${baseHarmonics._id}`,
            `Calculated at: ${baseHarmonics.calculatedAt}`,
          );

          return {
            success: true,
            data: baseHarmonics,
            message: 'Base harmonics fetched successfully',
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

        case 'save_base_harmonics':
          if (!baseHarmonicsModel) {
            throw new Error('BaseHarmonics model not available in context');
          }

          console.log(
            `[DatabaseTool] - Saving base harmonics for employee ${employeeId}`,
            `Data keys: ${Object.keys(data).join(', ')}`,
            `Raw scores count: ${data.rawScores?.length || 0}`,
          );

          const savedBaseHarmonics = await baseHarmonicsModel.findOneAndUpdate(
            { employeeId },
            {
              ...data,
              employeeId,
              organization: data.organization,
              calculatedAt: new Date(),
            },
            { upsert: true, new: true },
          );

          console.log(
            `[DatabaseTool] - Base harmonics saved for employee ${employeeId}`,
            `Document ID: ${savedBaseHarmonics._id}`,
          );
          return {
            success: true,
            message: 'Base harmonics saved successfully',
            documentId: savedBaseHarmonics._id.toString(),
          };

        case 'save_age_harmonics':
          if (!ageHarmonicsModel) {
            throw new Error('AgeHarmonics model not available in context');
          }

          console.log(
            `[DatabaseTool] - Saving age harmonics for employee ${employeeId}`,
            `Decimal age: ${data.decimalAge}, Calculated for: ${data.calculatedForDate}`,
          );

          const ageHarmonic = await ageHarmonicsModel.create({
            ...data,
            employeeId,
            organization: data.organization,
            calculatedAt: new Date(),
          });

          // Cleanup old age harmonics (keep last 10 per employee)
          const allAgeHarmonics = await ageHarmonicsModel
            .find({ employeeId })
            .sort({ calculatedForDate: -1 });

          if (allAgeHarmonics.length > 10) {
            const toDelete = allAgeHarmonics
              .slice(10)
              .map((doc) => doc._id);
            await ageHarmonicsModel.deleteMany({ _id: { $in: toDelete } });
            console.log(
              `[DatabaseTool] - Cleaned up ${allAgeHarmonics.length - 10} old age harmonics`,
            );
          }

          console.log(
            `[DatabaseTool] - Age harmonics saved for employee ${employeeId}`,
            `Document ID: ${ageHarmonic._id}`,
          );
          return {
            success: true,
            message: 'Age harmonics saved successfully',
            documentId: ageHarmonic._id.toString(),
          };

        case 'save_role_insights':
          if (!roleInsightsModel) {
            throw new Error('RoleInsights model not available in context');
          }

          console.log(
            `[DatabaseTool] - Saving role insights for employee ${employeeId}, role ${data.role}`,
            `Base insights count: ${data.baseInsights?.length || 0}`,
            `Age insights count: ${data.ageInsights?.length || 0}`,
          );

          const savedRoleInsights = await roleInsightsModel.findOneAndUpdate(
            { employeeId, role: data.role },
            {
              ...data,
              employeeId,
              organization: data.organization,
              role: data.role,
              calculatedAt: new Date(),
            },
            { upsert: true, new: true },
          );

          console.log(
            `[DatabaseTool] - Role insights saved for employee ${employeeId}, role ${data.role}`,
            `Document ID: ${savedRoleInsights._id}`,
          );
          return {
            success: true,
            message: `Role insights for ${data.role} saved successfully`,
            documentId: savedRoleInsights._id.toString(),
          };

        case 'update_employee_harmonic_reference':
          await employeeModel.findByIdAndUpdate(employeeId, {
            $set: {
              'energyCode.harmonicReferences': {
                hasBaseHarmonics: true,
                hasAgeHarmonics: data.hasAgeHarmonics || false,
                lastCalculated: new Date(),
                nextUpdate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              },
              'energyCode.quickInsights': data.quickInsights,
            },
          });

          console.log(
            `[DatabaseTool] - Employee harmonic reference updated for ${employeeId}`,
          );
          return {
            success: true,
            message: 'Employee harmonic reference updated successfully',
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
