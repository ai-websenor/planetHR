import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee } from './schemas/employee.schema';
import { Report } from '../reports/schemas/report.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Report.name) private reportModel: Model<Report>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto, user: any): Promise<Employee> {
    this.logger.log(`[create] - Creating employee for organization ${user.organizationId} by user ${user.email}`);
    const employee = new this.employeeModel({
      ...createEmployeeDto,
      organization: user.organizationId,
      addedBy: {
        userId: user.sub,
        role: user.role,
        timestamp: new Date(),
      },
      processingStatus: {
        status: 'pending',
        stage: 'created',
        progress: 0,
        lastUpdated: new Date(),
        completedReports: [],
      },
    });

    return employee.save();
  }

  async findById(id: string): Promise<Employee> {
    const employee = await this.employeeModel.findById(id).exec();
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  async findByOrganization(organizationId: string): Promise<Employee[]> {
    return this.employeeModel
      .find({ organization: organizationId, isActive: true })
      .exec();
  }

  async updateProcessingStatus(
    employeeId: string,
    status: any
  ): Promise<Employee | null> {
    return this.employeeModel
      .findByIdAndUpdate(
        employeeId,
        {
          $set: {
            'processingStatus.status': status.status,
            'processingStatus.stage': status.stage,
            'processingStatus.progress': status.progress,
            'processingStatus.lastUpdated': new Date(),
            'processingStatus.jobId': status.jobId,
          },
        },
        { new: true }
      )
      .exec();
  }

  async updateEnergyCode(employeeId: string, energyCode: any): Promise<Employee | null> {
    return this.employeeModel
      .findByIdAndUpdate(
        employeeId,
        { $set: { energyCode } },
        { new: true }
      )
      .exec();
  }

  async getReportsByRole(employeeId: string, viewerRole: string): Promise<Report[]> {
    return this.reportModel
      .find({
        employeeId,
        viewerRole,
        isArchived: false,
      })
      .sort({ generatedAt: -1 })
      .exec();
  }

  async findQuarterlyUpdatesDue(date: Date): Promise<Employee[]> {
    return this.employeeModel
      .find({
        'energyCode.nextUpdate': { $lte: date },
        isActive: true,
      })
      .exec();
  }

  async updateNextQuarterlyDate(employeeId: string, nextUpdate: Date): Promise<Employee | null> {
    return this.employeeModel
      .findByIdAndUpdate(
        employeeId,
        { $set: { 'energyCode.nextUpdate': nextUpdate } },
        { new: true }
      )
      .exec();
  }
}