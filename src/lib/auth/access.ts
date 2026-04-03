import { USER_ROLES, type UserRole } from "@/lib/auth/roles";

export function canManageKnowledge(role: UserRole) {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.STRATEGIST;
}

export function canGenerateContent(role: UserRole) {
  return (
    role === USER_ROLES.ADMIN ||
    role === USER_ROLES.STRATEGIST ||
    role === USER_ROLES.CREATOR
  );
}

export function canReviewContent(role: UserRole) {
  return (
    role === USER_ROLES.ADMIN ||
    role === USER_ROLES.STRATEGIST ||
    role === USER_ROLES.REVIEWER
  );
}

export function canPublishContent(role: UserRole) {
  return (
    role === USER_ROLES.ADMIN ||
    role === USER_ROLES.STRATEGIST ||
    role === USER_ROLES.REVIEWER
  );
}

export function canViewAnalytics(role: UserRole) {
  return role !== USER_ROLES.CREATOR;
}
