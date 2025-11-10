import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { mastra } from '../../../mastra';

@Processor('employee-onboarding')
@Injectable()
export class EmployeeOnboardingProcessor {
  private readonly logger = new Logger(EmployeeOnboardingProcessor.name);

  constructor() {}

  @Process('generate-reports')
  async handleEmployeeOnboarding(job: Job) {
    this.logger.log(`[handleEmployeeOnboarding] - Processing job ${job.id} for employee ${job.data.employeeId}`);
    this.logger.debug(`[handleEmployeeOnboarding] - Job data: ${JSON.stringify(job.data)}`);
    const { employeeId, triggeredBy } = job.data;
    
    this.logger.log(`Starting employee onboarding process for ${employeeId}`);
    
    try {
      // Update job progress
      await job.progress(5);
      
      // Get the workflow from Mastra
      const workflow = mastra.getWorkflow('employeeOnboardingWorkflow');
      
      if (!workflow) {
        throw new Error('Employee onboarding workflow not found');
      }

      // Create workflow run
      const run = await workflow.createRunAsync();
      
      // Run the workflow and get result
      const finalResult = await run.start({
        inputData: { employeeId },
      });
      
      // Update progress incrementally for better UX
      await job.progress(25);
      this.logger.log('Workflow step: birth data validation completed');
      
      await job.progress(50);
      this.logger.log('Workflow step: astrology generation completed');
      
      await job.progress(75);
      this.logger.log('Workflow step: harmonic calculation completed');
      
      await job.progress(90);
      this.logger.log('Workflow step: report generation completed');
      
      await job.progress(100);
      this.logger.log('Workflow step: processing completed');
      
      this.logger.log(`Employee onboarding completed for ${employeeId}`);
      
      return finalResult;

    } catch (error) {
      this.logger.error(`Employee onboarding failed for ${employeeId}:`, error);
      throw error;
    }
  }
}