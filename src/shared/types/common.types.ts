export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type UserRole = 'owner' | 'leader' | 'manager';

export type SubscriptionStatus = 'active' | 'trial' | 'cancelled' | 'expired';

export type SubscriptionPlan = 'basic' | 'premium' | 'enterprise';

export interface UserContext {
  userId: string;
  email: string;
  role: UserRole;
  organizationId: string;
  permissions?: {
    branches: string[];
    departments: string[];
    employees: string[];
  };
}
