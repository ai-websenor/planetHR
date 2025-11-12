import { SetMetadata } from '@nestjs/common';
import { ScopeRequirement, REQUIRE_SCOPE_KEY } from '../guards/scope.guard';

export const RequireScope = (scopeRequirement: ScopeRequirement) =>
  SetMetadata(REQUIRE_SCOPE_KEY, scopeRequirement);
