import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobRole } from './schemas/job-role.schema';
import { CreateJobRoleDto, UpdateJobRoleDto } from './dto/create-job-role.dto';

@Injectable()
export class JobRolesService {
  constructor(
    @InjectModel(JobRole.name) private jobRoleModel: Model<JobRole>,
  ) {}

  /**
   * Create a new job role
   */
  async create(
    createJobRoleDto: CreateJobRoleDto,
    organizationId: Types.ObjectId,
  ): Promise<JobRole> {
    const jobRole = new this.jobRoleModel({
      ...createJobRoleDto,
      organizationId,
      branchId: new Types.ObjectId(createJobRoleDto.branchId),
      departmentId: new Types.ObjectId(createJobRoleDto.departmentId),
    });

    return jobRole.save();
  }

  /**
   * Find all job roles for an organization
   */
  async findAll(
    organizationId: Types.ObjectId,
    branchId?: string,
    departmentId?: string,
  ): Promise<JobRole[]> {
    const query: any = { organizationId, deletedAt: null, isActive: true };

    if (branchId) {
      query.branchId = new Types.ObjectId(branchId);
    }

    if (departmentId) {
      query.departmentId = new Types.ObjectId(departmentId);
    }

    return this.jobRoleModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find job role by ID
   */
  async findById(
    jobRoleId: Types.ObjectId,
    organizationId: Types.ObjectId,
  ): Promise<JobRole> {
    const jobRole = await this.jobRoleModel
      .findOne({ _id: jobRoleId, organizationId, deletedAt: null })
      .exec();

    if (!jobRole) {
      throw new NotFoundException('Job role not found');
    }

    return jobRole;
  }

  /**
   * Update job role
   */
  async update(
    jobRoleId: Types.ObjectId,
    updateJobRoleDto: UpdateJobRoleDto,
    organizationId: Types.ObjectId,
  ): Promise<JobRole> {
    const jobRole = await this.findById(jobRoleId, organizationId);

    Object.assign(jobRole, updateJobRoleDto);

    return jobRole.save();
  }

  /**
   * Soft delete job role
   */
  async remove(
    jobRoleId: Types.ObjectId,
    organizationId: Types.ObjectId,
  ): Promise<void> {
    const jobRole = await this.findById(jobRoleId, organizationId);

    jobRole.deletedAt = new Date();
    jobRole.isActive = false;
    await jobRole.save();
  }

  /**
   * Find job roles by department
   */
  async findByDepartment(
    organizationId: Types.ObjectId,
    branchId: Types.ObjectId,
    departmentId: Types.ObjectId,
  ): Promise<JobRole[]> {
    return this.jobRoleModel
      .find({
        organizationId,
        branchId,
        departmentId,
        deletedAt: null,
        isActive: true,
      })
      .sort({ jobRole: 1 })
      .exec();
  }

  /**
   * Count job roles for organization
   */
  async count(organizationId: Types.ObjectId): Promise<number> {
    return this.jobRoleModel.countDocuments({
      organizationId,
      deletedAt: null,
      isActive: true,
    });
  }
}
