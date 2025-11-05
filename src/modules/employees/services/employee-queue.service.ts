import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class EmployeeQueueService {
  private readonly logger = new Logger(EmployeeQueueService.name);

  constructor(
    @InjectQueue('employee-onboarding') private onboardingQueue: Queue,
  ) {}

  async queueEmployeeOnboarding(
    employeeId: string,
    triggeredBy: {
      userId: string;
      email: string;
      role: string;
      organizationId: string;
    }
  ) {
    try {
      const job = await this.onboardingQueue.add(
        'generate-reports',
        {
          employeeId,
          triggeredBy,
          timestamp: new Date().toISOString(),
        },
        {
          priority: 1, // High priority for new employee onboarding
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 10, // Keep last 10 completed jobs
          removeOnFail: 20, // Keep last 20 failed jobs
        }
      );

      this.logger.log(`Queued employee onboarding job ${job.id} for employee ${employeeId}`);
      
      return {
        jobId: job.id,
        employeeId,
        status: 'queued',
        estimatedTime: '10-15 minutes',
      };

    } catch (error) {
      this.logger.error(`Failed to queue employee onboarding for ${employeeId}:`, error);
      throw error;
    }
  }

  async getJobStatus(jobId: string) {
    try {
      const job = await this.onboardingQueue.getJob(jobId);
      
      if (!job) {
        return { status: 'not_found' };
      }

      const state = await job.getState();
      const progress = job.progress();
      
      return {
        jobId: job.id,
        status: state,
        progress,
        data: job.data,
        createdAt: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
      };

    } catch (error) {
      this.logger.error(`Failed to get job status for ${jobId}:`, error);
      throw error;
    }
  }

  async cancelJob(jobId: string) {
    try {
      const job = await this.onboardingQueue.getJob(jobId);
      
      if (job) {
        await job.remove();
        this.logger.log(`Cancelled job ${jobId}`);
        return { success: true, message: 'Job cancelled successfully' };
      }

      return { success: false, message: 'Job not found' };

    } catch (error) {
      this.logger.error(`Failed to cancel job ${jobId}:`, error);
      throw error;
    }
  }

  async getQueueStats() {
    try {
      const waiting = await this.onboardingQueue.getWaiting();
      const active = await this.onboardingQueue.getActive();
      const completed = await this.onboardingQueue.getCompleted();
      const failed = await this.onboardingQueue.getFailed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length,
      };

    } catch (error) {
      this.logger.error('Failed to get queue stats:', error);
      throw error;
    }
  }
}