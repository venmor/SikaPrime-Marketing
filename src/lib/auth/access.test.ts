import { describe, expect, it } from "vitest";

import {
  canViewAnalytics,
  canViewContentItem,
  canViewWorkflow,
  shouldScopeWorkflowToOwnedItems,
} from "@/lib/auth/access";
import { USER_ROLES } from "@/lib/auth/roles";

describe("auth access controls", () => {
  it("limits analytics to strategy, admin, and analyst roles", () => {
    expect(canViewAnalytics(USER_ROLES.ADMIN)).toBe(true);
    expect(canViewAnalytics(USER_ROLES.STRATEGIST)).toBe(true);
    expect(canViewAnalytics(USER_ROLES.ANALYST)).toBe(true);
    expect(canViewAnalytics(USER_ROLES.REVIEWER)).toBe(false);
    expect(canViewAnalytics(USER_ROLES.CREATOR)).toBe(false);
  });

  it("keeps creators scoped to their own workflow queue", () => {
    expect(shouldScopeWorkflowToOwnedItems(USER_ROLES.CREATOR)).toBe(true);
    expect(shouldScopeWorkflowToOwnedItems(USER_ROLES.ADMIN)).toBe(false);
    expect(shouldScopeWorkflowToOwnedItems(USER_ROLES.REVIEWER)).toBe(false);
  });

  it("allows content detail access based on role and ownership", () => {
    expect(
      canViewContentItem(USER_ROLES.ADMIN, {
        sessionUserId: "user-1",
        ownerId: "user-2",
      }),
    ).toBe(true);

    expect(
      canViewContentItem(USER_ROLES.CREATOR, {
        sessionUserId: "user-1",
        ownerId: "user-1",
      }),
    ).toBe(true);

    expect(
      canViewContentItem(USER_ROLES.CREATOR, {
        sessionUserId: "user-1",
        ownerId: "user-2",
      }),
    ).toBe(false);

    expect(
      canViewContentItem(USER_ROLES.ANALYST, {
        sessionUserId: "user-1",
        ownerId: "user-1",
      }),
    ).toBe(false);
  });

  it("keeps workflow visible for creator and review roles", () => {
    expect(canViewWorkflow(USER_ROLES.CREATOR)).toBe(true);
    expect(canViewWorkflow(USER_ROLES.REVIEWER)).toBe(true);
    expect(canViewWorkflow(USER_ROLES.ANALYST)).toBe(false);
  });
});
