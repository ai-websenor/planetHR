import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { OrganizationsService } from '../organizations/organizations.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/schemas/user.schema';
import { Branch, Department } from '../organizations/schemas/organization.schema';

export interface AccessConfig {
  canSwitchBranch: boolean;
  visibleBranchIds: string[];
  visibleDepartmentIds: string[];
  visibleEmployeeIds: string[];
  dashboardFeatures: string[];
}

export interface DashboardStatistics {
  totalBranches: number;
  totalDepartments: number;
  totalEmployees: number;
  employeesByRole: {
    owner: number;
    leader: number;
    manager: number;
  };
}

export interface MasterDataResponse {
  user: Partial<User>;
  organization: {
    id: string;
    name: string;
    industry: string;
    onboardingCompleted: boolean;
  };
  branches: any[];
  departments: any[];
  employees: any[];
  statistics: DashboardStatistics;
  accessConfig: AccessConfig;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Get master data for dashboard - single API call
   * Returns all data, frontend will filter based on accessConfig
   */
  async getMasterData(user: User): Promise<MasterDataResponse> {
    const organizationId = user.organizationId;

    // Fetch organization with branches and departments
    const organization = await this.organizationsService.findById(organizationId);

    // Fetch all users/employees in the organization
    const employeesResult = await this.usersService.findAll(
      { page: 1, limit: 1000 }, // Get all employees
      organizationId,
      UserRole.OWNER, // Use OWNER to get all users
      [],
      [],
    );
    const employees = employeesResult.data;

    // Get active branches
    const activeBranches = this.organizationsService.getActiveBranches(organization);

    // Flatten departments from all branches
    const allDepartments: any[] = [];
    activeBranches.forEach(branch => {
      const activeDepts = this.organizationsService.getActiveDepartments(branch);
      activeDepts.forEach(dept => {
        allDepartments.push({
          _id: dept._id.toString(),
          name: dept.name,
          branchId: branch._id.toString(),
          branchName: branch.name,
          culture: dept.culture,
          goals: dept.goals,
          managerId: dept.managerId?.toString(),
          isActive: dept.isActive,
        });
      });
    });

    // Format branches
    const formattedBranches = activeBranches.map(branch => ({
      _id: branch._id.toString(),
      name: branch.name,
      officeType: branch.officeType,
      country: branch.country,
      state: branch.state,
      city: branch.city,
      address: branch.address,
      isActive: branch.isActive,
      departmentCount: branch.departments.filter(d => d.isActive).length,
    }));

    // Format employees
    const formattedEmployees = employees.map((emp: any) => ({
      _id: emp._id.toString(),
      email: emp.email,
      firstName: emp.firstName,
      lastName: emp.lastName,
      fullName: `${emp.firstName} ${emp.lastName}`,
      role: emp.role,
      status: emp.status,
      assignedBranches: emp.assignedBranches?.map((b: any) => b.toString()) || [],
      assignedDepartments: emp.assignedDepartments?.map((d: any) => d.toString()) || [],
      lastLoginAt: emp.lastLoginAt,
      createdAt: emp.createdAt,
    }));

    // Calculate access config based on user role
    const accessConfig = this.calculateAccessConfig(
      user,
      formattedBranches,
      allDepartments,
      formattedEmployees,
    );

    // Calculate statistics
    const statistics = this.calculateStatistics(
      formattedBranches,
      allDepartments,
      formattedEmployees,
      accessConfig,
    );

    return {
      user: this.sanitizeUser(user),
      organization: {
        id: (organization._id as any).toString(),
        name: organization.name,
        industry: organization.industry || '',
        onboardingCompleted: organization.onboardingCompleted || false,
      },
      branches: formattedBranches,
      departments: allDepartments,
      employees: formattedEmployees,
      statistics,
      accessConfig,
    };
  }

  /**
   * Calculate access configuration based on user role
   */
  private calculateAccessConfig(
    user: User,
    branches: any[],
    departments: any[],
    employees: any[],
  ): AccessConfig {
    const userRole = user.role;
    const assignedBranchIds = user.assignedBranches?.map(b => b.toString()) || [];
    const assignedDepartmentIds = user.assignedDepartments?.map(d => d.toString()) || [];

    switch (userRole) {
      case UserRole.OWNER:
        // Owner can see everything
        return {
          canSwitchBranch: true,
          visibleBranchIds: branches.map(b => b._id),
          visibleDepartmentIds: departments.map(d => d._id),
          visibleEmployeeIds: employees.map(e => e._id),
          dashboardFeatures: ['all', 'analytics', 'reports', 'settings', 'users', 'branches', 'departments'],
        };

      case UserRole.LEADER:
        // Leader can see all branches but with limited features
        return {
          canSwitchBranch: true,
          visibleBranchIds: branches.map(b => b._id),
          visibleDepartmentIds: departments.map(d => d._id),
          visibleEmployeeIds: employees.map(e => e._id),
          dashboardFeatures: ['all', 'analytics', 'reports', 'users', 'branches', 'departments'],
        };

      case UserRole.MANAGER:
        // Manager can only see assigned branches and their departments
        const managerBranchIds = assignedBranchIds.length > 0
          ? assignedBranchIds
          : branches.map(b => b._id);

        const managerDeptIds = departments
          .filter(d => managerBranchIds.includes(d.branchId))
          .map(d => d._id);

        // Employees in manager's branches/departments
        const managerEmployeeIds = employees
          .filter(emp => {
            // Check if employee is in manager's branches
            const inBranch = emp.assignedBranches.some((b: string) => managerBranchIds.includes(b));
            // Check if employee is in manager's departments
            const inDept = emp.assignedDepartments.some((d: string) => managerDeptIds.includes(d));
            return inBranch || inDept;
          })
          .map(e => e._id);

        return {
          canSwitchBranch: managerBranchIds.length > 1,
          visibleBranchIds: managerBranchIds,
          visibleDepartmentIds: managerDeptIds,
          visibleEmployeeIds: managerEmployeeIds,
          dashboardFeatures: ['team', 'reports', 'departments'],
        };

      default:
        // Default - no access
        return {
          canSwitchBranch: false,
          visibleBranchIds: [],
          visibleDepartmentIds: [],
          visibleEmployeeIds: [],
          dashboardFeatures: ['personal'],
        };
    }
  }

  /**
   * Calculate statistics based on visible data
   */
  private calculateStatistics(
    branches: any[],
    departments: any[],
    employees: any[],
    accessConfig: AccessConfig,
  ): DashboardStatistics {
    // Filter data based on access config
    const visibleBranches = branches.filter(b => accessConfig.visibleBranchIds.includes(b._id));
    const visibleDepartments = departments.filter(d => accessConfig.visibleDepartmentIds.includes(d._id));
    const visibleEmployees = employees.filter(e => accessConfig.visibleEmployeeIds.includes(e._id));

    return {
      totalBranches: visibleBranches.length,
      totalDepartments: visibleDepartments.length,
      totalEmployees: visibleEmployees.length,
      employeesByRole: {
        owner: visibleEmployees.filter(e => e.role === 'OWNER').length,
        leader: visibleEmployees.filter(e => e.role === 'LEADER').length,
        manager: visibleEmployees.filter(e => e.role === 'MANAGER').length,
      },
    };
  }

  /**
   * Sanitize user data before sending to frontend
   */
  private sanitizeUser(user: User): Partial<User> {
    return {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
      assignedBranches: user.assignedBranches,
      assignedDepartments: user.assignedDepartments,
    };
  }
}
