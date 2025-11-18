import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { mastra } from '../../mastra';
import { Employee } from '../employees/schemas/employee.schema';
import { Report } from '../reports/schemas/report.schema';
import { BaseHarmonics } from '../harmonics/schemas/base-harmonics.schema';
import { AgeHarmonics } from '../harmonics/schemas/age-harmonics.schema';
import { RoleInsights } from '../harmonics/schemas/role-insights.schema';
import { ApiLogsService } from '../api-logs/api-logs.service';

@Injectable()
export class MastraService implements OnModuleInit {
  private context: Map<string, any>;

  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(BaseHarmonics.name)
    private baseHarmonicsModel: Model<BaseHarmonics>,
    @InjectModel(AgeHarmonics.name)
    private ageHarmonicsModel: Model<AgeHarmonics>,
    @InjectModel(RoleInsights.name)
    private roleInsightsModel: Model<RoleInsights>,
    private apiLogsService: ApiLogsService,
  ) {}

  async onModuleInit() {
    // Initialize Mastra with database context
    // This allows Mastra tools to access the database models
    if (mastra) {
      // Set up context for database tool
      this.context = new Map();
      this.context.set('employeeModel', this.employeeModel);
      this.context.set('reportModel', this.reportModel);
      this.context.set('baseHarmonicsModel', this.baseHarmonicsModel);
      this.context.set('ageHarmonicsModel', this.ageHarmonicsModel);
      this.context.set('roleInsightsModel', this.roleInsightsModel);
      this.context.set('apiLogsService', this.apiLogsService);

      // Note: In a real implementation, we would pass this context
      // through the workflow execution. For now, this demonstrates
      // how the integration would work.
    }
  }

  getContext(): Map<string, any> {
    return this.context;
  }

  async generatePersonalityReport(employeeId: string, userRole: string) {
    const workflow = mastra.getWorkflow('employeeOnboardingWorkflow');
    if (!workflow) {
      throw new Error('Employee onboarding workflow not found');
    }
    
    const run = await workflow.createRunAsync();
    
    return await run.start({
      inputData: { employeeId },
    });
  }

  async chatWithEmployee(message: string, employeeId: string, threadId: string): Promise<any> {
    const agent = mastra.getAgent('personalityAgent');
    if (!agent) {
      throw new Error('Personality agent not found');
    }
    
    return await agent.generate(message, {
      memory: {
        thread: threadId,
        resource: employeeId,
      },
    });
  }

  getMastraInstance() {
    return mastra;
  }
}