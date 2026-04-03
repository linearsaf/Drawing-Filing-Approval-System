import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { AppRole } from "@/lib/server/auth";

export async function getDashboardSummaryForRole(role: AppRole, userId: string) {
  const drawings = await db
    .select({
      id: schema.drawings.id,
      currentStatus: schema.drawings.currentStatus,
      createdBy: schema.drawings.createdBy
    })
    .from(schema.drawings);

  const visible = drawings.filter((drawing) => {
    if (role === "DRAFTER") {
      return drawing.createdBy === userId;
    }

    if (role === "CONSUMER") {
      return drawing.currentStatus === "COMPLETED";
    }

    return true;
  });

  const revisionIds = await db
    .select({ id: schema.drawingRevisions.id, drawingId: schema.drawingRevisions.drawingId })
    .from(schema.drawingRevisions)
    .where(
      visible.length === 0 ? eq(schema.drawingRevisions.drawingId, "__none__") : inArray(schema.drawingRevisions.drawingId, visible.map((drawing) => drawing.id))
    );

  const recentActivity = visible.length
    ? await db
        .select()
        .from(schema.auditLogs)
        .where(
          and(
            eq(schema.auditLogs.entityType, "REVISION"),
            inArray(
              schema.auditLogs.entityId,
              revisionIds.map((revision) => revision.id)
            )
          )
        )
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(8)
    : [];

  const rejectedStatuses: ReadonlySet<string> = new Set([
    "CHECK_REJECTED",
    "APPROVAL_1_REJECTED",
    "APPROVAL_2_REJECTED"
  ] as const);

  return {
    summary: {
      totalDrawings: visible.length,
      waitingCheck: visible.filter((item) => item.currentStatus === "WAITING_CHECK").length,
      waitingApproval1: visible.filter((item) => item.currentStatus === "WAITING_APPROVAL_1").length,
      waitingApproval2: visible.filter((item) => item.currentStatus === "WAITING_APPROVAL_2").length,
      rejected: visible.filter((item) => rejectedStatuses.has(item.currentStatus)).length,
      completed: visible.filter((item) => item.currentStatus === "COMPLETED").length,
      drafts: visible.filter((item) => item.currentStatus === "DRAFT").length
    },
    recentActivity
  };
}
