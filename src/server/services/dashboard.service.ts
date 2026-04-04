import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { AppRole } from "@/lib/server/auth";

export async function getDashboardSummaryForRole(role: AppRole, userId: string) {
  const drawings = await db
    .select({
      id: schema.drawings.id,
      drawingNumber: schema.drawings.drawingNumber,
      drawingName: schema.drawings.drawingName,
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

  const visibleDrawingIds = visible.map((drawing) => drawing.id);

  const revisionIds = await db
    .select({
      id: schema.drawingRevisions.id,
      drawingId: schema.drawingRevisions.drawingId,
      revisionNo: schema.drawingRevisions.revisionNo
    })
    .from(schema.drawingRevisions)
    .where(
      visible.length === 0
        ? eq(schema.drawingRevisions.drawingId, "__none__")
        : inArray(schema.drawingRevisions.drawingId, visibleDrawingIds)
    );

  const recentActivity = visible.length
    ? await db
        .select({
          id: schema.auditLogs.id,
          entityType: schema.auditLogs.entityType,
          entityId: schema.auditLogs.entityId,
          action: schema.auditLogs.action,
          userId: schema.auditLogs.userId,
          note: schema.auditLogs.note,
          createdAt: schema.auditLogs.createdAt
        })
        .from(schema.auditLogs)
        .where(
          or(
            and(
              eq(schema.auditLogs.entityType, "DRAWING"),
              inArray(schema.auditLogs.entityId, visibleDrawingIds)
            ),
            revisionIds.length
              ? and(
                  eq(schema.auditLogs.entityType, "REVISION"),
                  inArray(
                    schema.auditLogs.entityId,
                    revisionIds.map((revision) => revision.id)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(8)
    : [];

  const actorIds = [...new Set(recentActivity.map((item) => item.userId).filter(Boolean) as string[])];
  const actors = actorIds.length
    ? await db
        .select({
          id: schema.user.id,
          name: schema.user.name,
          role: schema.user.role
        })
        .from(schema.user)
        .where(inArray(schema.user.id, actorIds))
    : [];

  const drawingLookup = new Map(
    visible.map((drawing) => [
      drawing.id,
      {
        drawingId: drawing.id,
        drawingNumber: drawing.drawingNumber,
        drawingName: drawing.drawingName,
        currentStatus: drawing.currentStatus
      }
    ])
  );

  const revisionLookup = new Map(
    revisionIds.map((revision) => [
      revision.id,
      {
        drawingId: revision.drawingId,
        revisionNo: revision.revisionNo
      }
    ])
  );

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
    recentActivity: recentActivity.map((item) => {
      const revision = item.entityType === "REVISION" ? revisionLookup.get(item.entityId) : null;
      const drawing = drawingLookup.get(revision?.drawingId ?? item.entityId);
      const actor = actors.find((user) => user.id === item.userId) ?? null;

      return {
        ...item,
        drawingId: revision?.drawingId ?? item.entityId,
        drawingNumber: drawing?.drawingNumber ?? null,
        drawingName: drawing?.drawingName ?? null,
        revisionNo: revision?.revisionNo ?? null,
        actorName: actor?.name ?? null,
        actorRole: actor?.role ?? null,
        currentStatus: drawing?.currentStatus ?? null
      };
    })
  };
}
