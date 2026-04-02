import { UserRole } from "@prisma/client";

export function canManageKnowledge(role: UserRole) {
  return role === UserRole.ADMIN || role === UserRole.STRATEGIST;
}

export function canGenerateContent(role: UserRole) {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.STRATEGIST ||
    role === UserRole.CREATOR
  );
}

export function canReviewContent(role: UserRole) {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.STRATEGIST ||
    role === UserRole.REVIEWER
  );
}

export function canPublishContent(role: UserRole) {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.STRATEGIST ||
    role === UserRole.REVIEWER
  );
}

export function canViewAnalytics(role: UserRole) {
  return role !== UserRole.CREATOR;
}
