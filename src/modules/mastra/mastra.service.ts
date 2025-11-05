import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { mastra } from '../../mastra';
import { Employee } from '../employees/schemas/employee.schema';
import { Report } from '../reports/schemas/report.schema';

@Injectable()
export class MastraService implements OnModuleInit {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Report.name) private reportModel: Model<Report>,
  ) {}

  async onModuleInit() {
    // Initialize Mastra with database context
    // This allows Mastra tools to access the database models
    if (mastra) {
      // Set up context for database tool
      const context = new Map();
      context.set('employeeModel', this.employeeModel);
      context.set('reportModel', this.reportModel);
      
      // Note: In a real implementation, we would pass this context
      // through the workflow execution. For now, this demonstrates
      // how the integration would work.
    }
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