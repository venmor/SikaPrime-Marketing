import "server-only";

import { prisma } from "@/lib/db";

export async function logActivity(input: {
  actorId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  details?: string | null;
}) {
  return prisma.activityLog.create({
    data: {
      actorId: input.actorId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      summary: input.summary,
      details: input.details ?? null,
    },
  });
}

export async function getEntityActivity(entityType: string, entityId: string) {
  return prisma.activityLog.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      actor: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
  });
}

export async function getRecentActivity() {
  return prisma.activityLog.findMany({
    include: {
      actor: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 8,
  });
}
