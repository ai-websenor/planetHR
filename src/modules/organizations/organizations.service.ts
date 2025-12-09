import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Organization,
  Branch,
  Department,
  SubscriptionPlan,
  SubscriptionStatus,
} from './schemas/organization.schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name) private organizationModel: Model<Organization>,
  ) {}

  /**
   * Create a new organization
   */
  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    const organization = new this.organizationModel({
      ...createOrganizationDto,
      subscriptionPlan: SubscriptionPlan.FREE,
      subscriptionStatus: SubscriptionStatus.TRIAL,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      branches: [],
    });

    return organization.save();
  }

  /**
   * Find organization by ID
   */
  async findById(organizationId: Types.ObjectId): Promise<Organization> {
    const organization = await this.organizationModel
      .findOne({ _id: organizationId, deletedAt: null })
      .exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  /**
   * Update organization
   */
  async update(
    organizationId: Types.ObjectId,
    updateData: Partial<Organization>,
  ): Promise<Organization> {
    const organization = await this.findById(organizationId);

    Object.assign(organization, updateData);
    return organization.save();
  }

  /**
   * Add a new branch to organization
   */
  async addBranch(
    organizationId: Types.ObjectId,
    createBranchDto: CreateBranchDto,
  ): Promise<Organization> {
    const organization = await this.findById(organizationId);

    const newBranch: Branch = {
      _id: new Types.ObjectId(),
      ...createBranchDto,
      departments: [],
      isActive: true,
      createdAt: new Date(),
    } as Branch;

    organization.branches.push(newBranch);
    return organization.save();
  }

  /**
   * Update branch
   */
  async updateBranch(
    organizationId: Types.ObjectId,
    branchId: Types.ObjectId,
    updateData: Partial<Branch>,
  ): Promise<Organization> {
    const organization = await this.findById(organizationId);

    const branch = organization.branches.find(b => b._id.equals(branchId));
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    Object.assign(branch, updateData);
    return organization.save();
  }

  /**
   * Delete branch (soft delete by setting isActive to false)
   */
  async deleteBranch(
    organizationId: Types.ObjectId,
    branchId: Types.ObjectId,
  ): Promise<Organization> {
    const organization = await this.findById(organizationId);

    const branch = organization.branches.find(b => b._id.equals(branchId));
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    branch.isActive = false;
    return organization.save();
  }

  /**
   * Add department to a branch
   */
  async addDepartment(
    organizationId: Types.ObjectId,
    branchId: Types.ObjectId,
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<Organization> {
    const organization = await this.findById(organizationId);

    const branch = organization.branches.find(b => b._id.equals(branchId));
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const newDepartment: Department = {
      _id: new Types.ObjectId(),
      ...createDepartmentDto,
      managerId: createDepartmentDto.managerId
        ? new Types.ObjectId(createDepartmentDto.managerId)
        : undefined,
      isActive: true,
      createdAt: new Date(),
    } as Department;

    branch.departments.push(newDepartment);
    return organization.save();
  }

  /**
   * Update department
   */
  async updateDepartment(
    organizationId: Types.ObjectId,
    branchId: Types.ObjectId,
    departmentId: Types.ObjectId,
    updateData: Partial<Department>,
  ): Promise<Organization> {
    const organization = await this.findById(organizationId);

    const branch = organization.branches.find(b => b._id.equals(branchId));
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const department = branch.departments.find(d => d._id.equals(departmentId));
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    Object.assign(department, updateData);
    return organization.save();
  }

  /**
   * Delete department (soft delete)
   */
  async deleteDepartment(
    organizationId: Types.ObjectId,
    branchId: Types.ObjectId,
    departmentId: Types.ObjectId,
  ): Promise<Organization> {
    const organization = await this.findById(organizationId);

    const branch = organization.branches.find(b => b._id.equals(branchId));
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const department = branch.departments.find(d => d._id.equals(departmentId));
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    department.isActive = false;
    return organization.save();
  }

  /**
   * Get branch by ID
   */
  async getBranchById(
    organizationId: Types.ObjectId,
    branchId: Types.ObjectId,
  ): Promise<Branch> {
    const organization = await this.findById(organizationId);

    const branch = organization.branches.find(b => b._id.equals(branchId));
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(
    organizationId: Types.ObjectId,
    branchId: Types.ObjectId,
    departmentId: Types.ObjectId,
  ): Promise<Department> {
    const branch = await this.getBranchById(organizationId, branchId);

    const department = branch.departments.find(d => d._id.equals(departmentId));
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  /**
   * Get all active branches
   */
  getActiveBranches(organization: Organization): Branch[] {
    return organization.branches.filter(b => b.isActive);
  }

  /**
   * Get all active departments in a branch
   */
  getActiveDepartments(branch: Branch): Department[] {
    return branch.departments.filter(d => d.isActive);
  }

  /**
   * Increment employee count
   */
  async incrementEmployeeCount(organizationId: Types.ObjectId): Promise<void> {
    await this.organizationModel.updateOne(
      { _id: organizationId },
      { $inc: { employeeCount: 1 } },
    );
  }

  /**
   * Decrement employee count
   */
  async decrementEmployeeCount(organizationId: Types.ObjectId): Promise<void> {
    await this.organizationModel.updateOne(
      { _id: organizationId },
      { $inc: { employeeCount: -1 } },
    );
  }

  /**
   * Increment report generation count
   */
  async incrementReportCount(organizationId: Types.ObjectId): Promise<void> {
    await this.organizationModel.updateOne(
      { _id: organizationId },
      { $inc: { reportGenerationCount: 1 } },
    );
  }

  /**
   * Increment AI chat usage count
   */
  async incrementAIChatCount(organizationId: Types.ObjectId): Promise<void> {
    await this.organizationModel.updateOne(
      { _id: organizationId },
      { $inc: { aiChatUsageCount: 1 } },
    );
  }

  /**
   * Get user accessible branches based on role
   * OWNER and LEADER can see all branches
   * MANAGER can only see their assigned branches
   */
  async getUserAccessibleBranches(
    organizationId: Types.ObjectId,
    userRole: string,
    assignedBranchIds: string[],
  ): Promise<{
    organization: { id: string; name: string };
    branches: Branch[];
    canSwitchBranches: boolean;
  }> {
    const organization = await this.findById(organizationId);
    const activeBranches = this.getActiveBranches(organization);

    // OWNER and LEADER can see all branches
    if (userRole === 'OWNER' || userRole === 'LEADER') {
      return {
        organization: {
          id: (organization._id as any).toString(),
          name: organization.name,
        },
        branches: activeBranches,
        canSwitchBranches: true,
      };
    }

    // MANAGER can only see their assigned branches
    if (assignedBranchIds && assignedBranchIds.length > 0) {
      const filteredBranches = activeBranches.filter(branch =>
        assignedBranchIds.includes((branch._id as any).toString()),
      );

      return {
        organization: {
          id: (organization._id as any).toString(),
          name: organization.name,
        },
        branches: filteredBranches,
        canSwitchBranches: filteredBranches.length > 1,
      };
    }

    // No assigned branches - return empty
    return {
      organization: {
        id: (organization._id as any).toString(),
        name: organization.name,
      },
      branches: [],
      canSwitchBranches: false,
    };
  }
}
