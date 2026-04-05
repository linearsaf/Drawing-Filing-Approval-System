import {
  DashboardSummary,
  Drawing,
  DrawingFilters,
  DrawingRevision,
  MockDatabase,
  RevisionStatus,
  UserRole
} from "@/lib/types";
import { canViewDrawing } from "@/lib/utils/permissions";

export function getCurrentRevision(db: MockDatabase, drawing: Drawing) {
  return db.revisions.find((revision) => revision.id === drawing.currentRevisionId) ?? null;
}

export function getDrawingById(db: MockDatabase, drawingId: string) {
  return db.drawings.find((drawing) => drawing.id === drawingId) ?? null;
}

export function getRevisionsForDrawing(db: MockDatabase, drawingId: string) {
  return db.revisions
    .filter((revision) => revision.drawingId === drawingId)
    .sort((left, right) => (left.createdAt > right.createdAt ? -1 : 1));
}

export function getApprovalHistory(db: MockDatabase, revisionId: string) {
  return db.approvalActions
    .filter((action) => action.revisionId === revisionId)
    .sort((left, right) => (left.actedAt > right.actedAt ? -1 : 1));
}

export function getApprovalPlan(db: MockDatabase, revisionId: string) {
  return db.revisionApprovalSteps
    .filter((step) => step.revisionId === revisionId)
    .sort((left, right) => left.approvalLevel - right.approvalLevel);
}

export function getAuditTimeline(db: MockDatabase, drawingId: string, revisionIds: string[]) {
  return db.auditLogs
    .filter(
      (log) =>
        (log.entityType === "DRAWING" && log.entityId === drawingId) ||
        (log.entityType === "REVISION" && revisionIds.includes(log.entityId))
    )
    .sort((left, right) => (left.createdAt > right.createdAt ? -1 : 1));
}

export function getVisibleDrawings(db: MockDatabase, role: UserRole, userId?: string | null) {
  return db.drawings.filter((drawing) => {
    if (role === "DRAFTER") {
      return drawing.createdBy === userId;
    }

    return canViewDrawing(role, drawing.currentStatus);
  });
}

export function getPendingDrawingsByRole(
  db: MockDatabase,
  role: UserRole,
  userId?: string | null
) {
  const visible = getVisibleDrawings(db, role, userId);

  return visible.filter((drawing) => {
    if (role === "DRAFTER") {
      return drawing.currentStatus !== "COMPLETED" && drawing.currentStatus !== "OBSOLETE";
    }

    if (role === "DRAFT_LEADER") {
      return drawing.currentStatus === "WAITING_CHECK";
    }

    if (role === "APPROVER_L1") {
      return drawing.currentStatus === "WAITING_APPROVAL_1";
    }

    if (role === "HEAD") {
      return drawing.currentStatus === "WAITING_APPROVAL_2";
    }

    if (role === "CONSUMER") {
      return drawing.currentStatus === "COMPLETED";
    }

    return true;
  });
}

export function getDashboardSummary(
  db: MockDatabase,
  role: UserRole,
  userId?: string | null
): DashboardSummary {
  const visible = getVisibleDrawings(db, role, userId);
  const rejectedStatuses: RevisionStatus[] = [
    "CHECK_REJECTED",
    "APPROVAL_1_REJECTED",
    "APPROVAL_2_REJECTED"
  ];

  return {
    totalDrawings: visible.length,
    waitingCheck: visible.filter((drawing) => drawing.currentStatus === "WAITING_CHECK").length,
    waitingApproval1: visible.filter((drawing) => drawing.currentStatus === "WAITING_APPROVAL_1")
      .length,
    waitingApproval2: visible.filter((drawing) => drawing.currentStatus === "WAITING_APPROVAL_2")
      .length,
    rejected: visible.filter((drawing) => rejectedStatuses.includes(drawing.currentStatus)).length,
    completed: visible.filter((drawing) => drawing.currentStatus === "COMPLETED").length,
    drafts: visible.filter((drawing) => drawing.currentStatus === "DRAFT").length
  };
}

export function filterDrawings(
  drawings: Drawing[],
  revisions: DrawingRevision[],
  filters: DrawingFilters
) {
  const search = filters.search.trim().toLowerCase();

  return drawings.filter((drawing) => {
    const currentRevision =
      revisions.find((revision) => revision.id === drawing.currentRevisionId) ?? null;
    const searchable = [
      drawing.drawingNumber,
      drawing.drawingName,
      drawing.sacCode,
      drawing.area,
      drawing.discipline
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = search === "" || searchable.includes(search);
    const matchesStatus = filters.status === "ALL" || drawing.currentStatus === filters.status;
    const matchesArea =
      filters.area.trim() === "" ||
      drawing.area.toLowerCase().includes(filters.area.trim().toLowerCase());
    const matchesDrawnBy = filters.drawnBy.trim() === "" || drawing.drawnByUserId === filters.drawnBy;
    const matchesRevision =
      filters.revision.trim() === "" ||
      currentRevision?.revisionNo.toLowerCase().includes(filters.revision.trim().toLowerCase());
    const submittedDate = currentRevision?.submittedAt ?? currentRevision?.updatedAt ?? drawing.updatedAt;
    const comparableDate = submittedDate.slice(0, 10);
    const fromDate = filters.dateFrom.trim();
    const toDate = filters.dateTo.trim();
    const matchesFrom = fromDate === "" || comparableDate >= fromDate;
    const matchesTo = toDate === "" || comparableDate <= toDate;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesArea &&
      matchesDrawnBy &&
      matchesRevision &&
      matchesFrom &&
      matchesTo
    );
  });
}

export function getRecentActivity(db: MockDatabase, role: UserRole, userId?: string | null) {
  const visibleIds = new Set(getVisibleDrawings(db, role, userId).map((drawing) => drawing.id));
  const visibleRevisionIds = new Set(
    db.revisions
      .filter((revision) => visibleIds.has(revision.drawingId))
      .map((revision) => revision.id)
  );

  return db.auditLogs
    .filter((log) => visibleRevisionIds.has(log.entityId) || visibleIds.has(log.entityId))
    .sort((left, right) => (left.createdAt > right.createdAt ? -1 : 1))
    .slice(0, 6);
}
