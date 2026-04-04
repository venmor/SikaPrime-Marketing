import { USER_ROLES, type UserRole } from "@/lib/auth/roles";

export function canManageKnowledge(role: UserRole) {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.STRATEGIST;
}

export function canManageIntegrations(role: UserRole) {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.STRATEGIST;
}

export function canManageAccess(role: UserRole) {
  return role === USER_ROLES.ADMIN;
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

export function canViewWorkflow(role: UserRole) {
  return (
    role === USER_ROLES.ADMIN ||
    role === USER_ROLES.STRATEGIST ||
    role === USER_ROLES.CREATOR ||
    role === USER_ROLES.REVIEWER
  );
}

export function canAccessWorkflow(role: UserRole) {
  return canViewWorkflow(role);
}

export function canPublishContent(role: UserRole) {
  return (
    role === USER_ROLES.ADMIN ||
    role === USER_ROLES.STRATEGIST ||
    role === USER_ROLES.REVIEWER
  );
}

export function canViewAnalytics(role: UserRole) {
  return (
    role === USER_ROLES.ADMIN ||
    role === USER_ROLES.STRATEGIST ||
    role === USER_ROLES.ANALYST
  );
}

export function shouldScopeWorkflowToOwnedItems(role: UserRole) {
  return role === USER_ROLES.CREATOR;
}

export function canViewContentItem(
  role: UserRole,
  input: {
    sessionUserId: string;
    ownerId: string;
  },
) {
  if (
    role === USER_ROLES.ADMIN ||
    role === USER_ROLES.STRATEGIST ||
    role === USER_ROLES.REVIEWER
  ) {
    return true;
  }

  if (role === USER_ROLES.CREATOR) {
    return input.ownerId === input.sessionUserId;
  }

  return false;
}

export function canAccessNavigationSection(role: UserRole, sectionId: string) {
  if (sectionId === "create") {
    return canGenerateContent(role);
  }

  if (sectionId === "review") {
    return canViewWorkflow(role);
  }

  if (sectionId === "publish") {
    return canPublishContent(role);
  }

  if (sectionId === "measure") {
    return canViewAnalytics(role);
  }

  if (sectionId === "brand") {
    return (
      canManageKnowledge(role) ||
      canManageAccess(role) ||
      canManageIntegrations(role)
    );
  }

  return true;
}

export function canAccessNavigationChild(role: UserRole, href: string) {
  if (href === "/knowledge") {
    return canManageKnowledge(role);
  }

  if (href === "/access") {
    return canManageAccess(role);
  }

  if (href === "/integrations") {
    return canManageIntegrations(role);
  }

  if (href === "/analytics" || href === "/library") {
    return canViewAnalytics(role);
  }

  return true;
}
