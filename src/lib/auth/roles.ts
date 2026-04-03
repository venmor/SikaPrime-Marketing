export const USER_ROLES = {
  ADMIN: "ADMIN",
  STRATEGIST: "STRATEGIST",
  CREATOR: "CREATOR",
  REVIEWER: "REVIEWER",
  ANALYST: "ANALYST",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
