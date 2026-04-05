import { describe, expect, it } from "vitest";

import {
  canAccessNavigationChild,
  canAccessNavigationSection,
  canAccessWorkflow,
  canGenerateContent,
  canManageAccess,
  canManageIntegrations,
  canManageKnowledge,
  canPublishContent,
  canReviewContent,
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

  it("allows knowledge management for admin and strategist", () => {
    expect(canManageKnowledge(USER_ROLES.ADMIN)).toBe(true);
    expect(canManageKnowledge(USER_ROLES.STRATEGIST)).toBe(true);
    expect(canManageKnowledge(USER_ROLES.CREATOR)).toBe(false);
    expect(canManageKnowledge(USER_ROLES.REVIEWER)).toBe(false);
    expect(canManageKnowledge(USER_ROLES.ANALYST)).toBe(false);
  });

  it("allows integrations management for admin and strategist", () => {
    expect(canManageIntegrations(USER_ROLES.ADMIN)).toBe(true);
    expect(canManageIntegrations(USER_ROLES.STRATEGIST)).toBe(true);
    expect(canManageIntegrations(USER_ROLES.CREATOR)).toBe(false);
    expect(canManageIntegrations(USER_ROLES.REVIEWER)).toBe(false);
    expect(canManageIntegrations(USER_ROLES.ANALYST)).toBe(false);
  });

  it("restricts access management to admin only", () => {
    expect(canManageAccess(USER_ROLES.ADMIN)).toBe(true);
    expect(canManageAccess(USER_ROLES.STRATEGIST)).toBe(false);
    expect(canManageAccess(USER_ROLES.CREATOR)).toBe(false);
    expect(canManageAccess(USER_ROLES.REVIEWER)).toBe(false);
    expect(canManageAccess(USER_ROLES.ANALYST)).toBe(false);
  });

  it("allows content generation for admin, strategist, and creator", () => {
    expect(canGenerateContent(USER_ROLES.ADMIN)).toBe(true);
    expect(canGenerateContent(USER_ROLES.STRATEGIST)).toBe(true);
    expect(canGenerateContent(USER_ROLES.CREATOR)).toBe(true);
    expect(canGenerateContent(USER_ROLES.REVIEWER)).toBe(false);
    expect(canGenerateContent(USER_ROLES.ANALYST)).toBe(false);
  });

  it("allows content review for admin, strategist, and reviewer", () => {
    expect(canReviewContent(USER_ROLES.ADMIN)).toBe(true);
    expect(canReviewContent(USER_ROLES.STRATEGIST)).toBe(true);
    expect(canReviewContent(USER_ROLES.REVIEWER)).toBe(true);
    expect(canReviewContent(USER_ROLES.CREATOR)).toBe(false);
    expect(canReviewContent(USER_ROLES.ANALYST)).toBe(false);
  });

  it("allows workflow access equivalent to viewing workflow", () => {
    expect(canAccessWorkflow(USER_ROLES.ADMIN)).toBe(true);
    expect(canAccessWorkflow(USER_ROLES.STRATEGIST)).toBe(true);
    expect(canAccessWorkflow(USER_ROLES.CREATOR)).toBe(true);
    expect(canAccessWorkflow(USER_ROLES.REVIEWER)).toBe(true);
    expect(canAccessWorkflow(USER_ROLES.ANALYST)).toBe(false);
  });

  it("allows publishing content for admin, strategist, and reviewer", () => {
    expect(canPublishContent(USER_ROLES.ADMIN)).toBe(true);
    expect(canPublishContent(USER_ROLES.STRATEGIST)).toBe(true);
    expect(canPublishContent(USER_ROLES.REVIEWER)).toBe(true);
    expect(canPublishContent(USER_ROLES.CREATOR)).toBe(false);
    expect(canPublishContent(USER_ROLES.ANALYST)).toBe(false);
  });

  it("validates navigation section access based on section logic", () => {
    // create section uses canGenerateContent
    expect(canAccessNavigationSection(USER_ROLES.CREATOR, "create")).toBe(true);
    expect(canAccessNavigationSection(USER_ROLES.ANALYST, "create")).toBe(false);

    // review section uses canViewWorkflow
    expect(canAccessNavigationSection(USER_ROLES.CREATOR, "review")).toBe(true);
    expect(canAccessNavigationSection(USER_ROLES.ANALYST, "review")).toBe(false);

    // publish section uses canPublishContent
    expect(canAccessNavigationSection(USER_ROLES.REVIEWER, "publish")).toBe(true);
    expect(canAccessNavigationSection(USER_ROLES.CREATOR, "publish")).toBe(false);

    // measure section uses canViewAnalytics
    expect(canAccessNavigationSection(USER_ROLES.ANALYST, "measure")).toBe(true);
    expect(canAccessNavigationSection(USER_ROLES.CREATOR, "measure")).toBe(false);

    // brand section uses canManageKnowledge || canManageAccess || canManageIntegrations
    expect(canAccessNavigationSection(USER_ROLES.ADMIN, "brand")).toBe(true);
    expect(canAccessNavigationSection(USER_ROLES.STRATEGIST, "brand")).toBe(true);
    expect(canAccessNavigationSection(USER_ROLES.CREATOR, "brand")).toBe(false);

    // other default sections
    expect(canAccessNavigationSection(USER_ROLES.ANALYST, "dashboard")).toBe(true);
    expect(canAccessNavigationSection(USER_ROLES.CREATOR, "unknown")).toBe(true);
  });

  it("validates child navigation access based on path logic", () => {
    // /knowledge uses canManageKnowledge
    expect(canAccessNavigationChild(USER_ROLES.STRATEGIST, "/knowledge")).toBe(true);
    expect(canAccessNavigationChild(USER_ROLES.CREATOR, "/knowledge")).toBe(false);

    // /access uses canManageAccess
    expect(canAccessNavigationChild(USER_ROLES.ADMIN, "/access")).toBe(true);
    expect(canAccessNavigationChild(USER_ROLES.STRATEGIST, "/access")).toBe(false);

    // /integrations uses canManageIntegrations
    expect(canAccessNavigationChild(USER_ROLES.STRATEGIST, "/integrations")).toBe(true);
    expect(canAccessNavigationChild(USER_ROLES.CREATOR, "/integrations")).toBe(false);

    // /analytics or /library uses canViewAnalytics
    expect(canAccessNavigationChild(USER_ROLES.ANALYST, "/analytics")).toBe(true);
    expect(canAccessNavigationChild(USER_ROLES.CREATOR, "/analytics")).toBe(false);
    expect(canAccessNavigationChild(USER_ROLES.ANALYST, "/library")).toBe(true);
    expect(canAccessNavigationChild(USER_ROLES.CREATOR, "/library")).toBe(false);

    // other default paths
    expect(canAccessNavigationChild(USER_ROLES.CREATOR, "/settings")).toBe(true);
  });
});
