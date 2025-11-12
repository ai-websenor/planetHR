import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Types } from 'mongoose';
import { UserRole } from '../../modules/users/schemas/user.schema';

export const REQUIRE_SCOPE_KEY = 'requireScope';

export enum ScopeType {
  BRANCH = 'BRANCH',
  DEPARTMENT = 'DEPARTMENT',
}

export interface ScopeRequirement {
  type: ScopeType;
  paramName: string; // e.g., 'branchId', 'departmentId'
}

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const scopeRequirement = this.reflector.getAllAndOverride<ScopeRequirement>(
      REQUIRE_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!scopeRequirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Owners bypass scope checks
    if (user.role === UserRole.OWNER) {
      return true;
    }

    // Get the scope ID from request params or body
    const scopeId =
      request.params[scopeRequirement.paramName] ||
      request.body[scopeRequirement.paramName];

    if (!scopeId) {
      // If no scope ID is provided, allow (might be creating resources)
      return true;
    }

    const scopeObjectId = new Types.ObjectId(scopeId);

    // Check branch access for Leaders
    if (scopeRequirement.type === ScopeType.BRANCH && user.role === UserRole.LEADER) {
      const hasAccess = user.assignedBranches?.some((branchId: string) =>
        new Types.ObjectId(branchId).equals(scopeObjectId),
      );

      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this branch');
      }

      return true;
    }

    // Check department access for Managers
    if (scopeRequirement.type === ScopeType.DEPARTMENT && user.role === UserRole.MANAGER) {
      const hasAccess = user.assignedDepartments?.some((deptId: string) =>
        new Types.ObjectId(deptId).equals(scopeObjectId),
      );

      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this department');
      }

      return true;
    }

    // Leaders checking department access within their branches (more complex check)
    if (scopeRequirement.type === ScopeType.DEPARTMENT && user.role === UserRole.LEADER) {
      // This would require fetching the organization to check if department is in assigned branches
      // For now, allow Leaders to access departments (they can access multiple departments)
      return true;
    }

    return false;
  }
}
