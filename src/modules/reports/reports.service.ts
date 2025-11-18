import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report } from './schemas/report.schema';
import { MastraService } from '../mastra/mastra.service';
import type { JwtPayload } from '../auth/services/auth.service';
import { RuntimeContext } from '@mastra/core/runtime-context';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectModel(Report.name) private reportModel: Model<Report>,
    private readonly mastraService: MastraService,
  ) {}

  async generateReports(employeeId: string, user: JwtPayload) {
    this.logger.log(
      `[generateReports] - Triggering report generation for employee ${employeeId} by user ${user.email}`,
    );

    // Pre-validate: Check if employee exists
    let employeeObjectId: Types.ObjectId;
    try {
      employeeObjectId = new Types.ObjectId(employeeId);
    } catch (error) {
      throw new NotFoundException(`Invalid employee ID format: ${employeeId}`);
    }

    const employee = await this.reportModel.db
      .collection('employees')
      .findOne({ _id: employeeObjectId });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Pre-validate: Check if base harmonics exist
    const baseHarmonics = await this.reportModel.db
      .collection('baseharmonics')
      .findOne({ employeeId });

    if (!baseHarmonics) {
      throw new NotFoundException(
        `Base harmonics not found for employee ${employeeId}. ` +
          `Please ensure the employee has completed the onboarding workflow first. ` +
          `The onboarding workflow calculates astrological data and harmonic frequencies, ` +
          `which are required for report generation.`,
      );
    }

    this.logger.log(
      `[generateReports] - ✅ Pre-validation passed for employee ${employeeId}. Base harmonics found.`,
    );

    // Get the report generation workflow
    const mastra = this.mastraService.getMastraInstance();
    const workflow = mastra.getWorkflow('reportGenerationWorkflow');

    if (!workflow) {
      throw new NotFoundException('Report generation workflow not found');
    }

    // Get runtime context with database models
    const contextMap = this.mastraService.getContext();
    const runtimeContext = new RuntimeContext(Array.from(contextMap.entries()));

    // Start workflow in background
    const run = await workflow.createRunAsync();

    // Don't await - let it run in background
    run
      .start({
        inputData: { employeeId },
        runtimeContext,
      })
      .then((result) => {
        this.logger.log(
          `[generateReports] - Report generation completed for employee ${employeeId}`,
        );
      })
      .catch((error) => {
        this.logger.error(
          `[generateReports] - Report generation failed for employee ${employeeId}`,
          error,
        );
      });

    return {
      employeeId,
      status: 'processing',
      message: 'Report generation started successfully',
      triggeredBy: user.email,
      triggeredAt: new Date().toISOString(),
    };
  }

  async getReportsByEmployee(employeeId: string, viewerRole: string) {
    this.logger.log(
      `[getReportsByEmployee] - Fetching reports for employee ${employeeId} with role ${viewerRole}`,
    );

    const reports = await this.reportModel
      .find({
        employeeId,
        viewerRole,
        isArchived: false,
      })
      .sort({ generatedAt: -1 })
      .exec();

    return {
      employeeId,
      viewerRole,
      totalReports: reports.length,
      reports: reports.map((report) => ({
        id: report._id,
        reportType: report.reportType,
        content: report.content,
        metadata: report.metadata,
        generatedAt: report.generatedAt,
        validUntil: report.validUntil,
        confidenceLevel: report.confidenceLevel,
        version: report.version,
      })),
    };
  }

  async getAllReportsForEmployee(employeeId: string) {
    this.logger.log(
      `[getAllReportsForEmployee] - Fetching all reports for employee ${employeeId}`,
    );

    const reports = await this.reportModel
      .find({
        employeeId,
        isArchived: false,
      })
      .sort({ generatedAt: -1 })
      .exec();

    // Group by report type and viewer role
    const groupedReports: Record<string, Record<string, any>> = {
      personality: {
        owner: null,
        leader: null,
        manager: null,
      },
      role: {
        owner: null,
        leader: null,
        manager: null,
      },
      department: {
        owner: null,
        leader: null,
        manager: null,
      },
      industry: {
        owner: null,
        leader: null,
        manager: null,
      },
      team: {
        owner: null,
        leader: null,
        manager: null,
      },
      training: {
        owner: null,
        leader: null,
        manager: null,
      },
    };

    reports.forEach((report) => {
      groupedReports[report.reportType][report.viewerRole] = {
        id: report._id,
        content: report.content,
        metadata: report.metadata,
        generatedAt: report.generatedAt,
        validUntil: report.validUntil,
        confidenceLevel: report.confidenceLevel,
        version: report.version,
      };
    });

    return {
      employeeId,
      totalReports: reports.length,
      reports: groupedReports,
    };
  }
}
