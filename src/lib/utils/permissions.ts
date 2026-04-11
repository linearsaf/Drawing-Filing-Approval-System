import { RevisionStatus, UserRole } from "@/lib/types";

const editableStatuses: ReadonlySet<string> = new Set([
  "DRAFT",
  "CHECK_REJECTED",
  "APPROVAL_1_REJECTED",
  "APPROVAL_2_REJECTED"
] as const);

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  DRAFTER: "Drafter",
  DRAFT_LEADER: "Draft Leader",
  APPROVER_L1: "Approver Level 1",
  HEAD: "Head",
  CONSUMER: "User / Consumer"
};

export const STATUS_LABELS: Record<RevisionStatus, string> = {
  DRAFT: "Draft",
  WAITING_CHECK: "Waiting Check",
  CHECK_REJECTED: "Check Rejected",
  WAITING_APPROVAL_1: "Waiting Approval L1",
  APPROVAL_1_REJECTED: "Approval L1 Rejected",
  WAITING_APPROVAL_2: "Waiting Final Approval",
  APPROVAL_2_REJECTED: "Final Approval Rejected",
  COMPLETED: "Completed",
  OBSOLETE: "Obsolete"
};

export function canAccessAdmin(role: UserRole) {
  return role === "ADMIN";
}

export function canCreateDrawing(role: UserRole) {
  return role === "DRAFTER" || role === "ADMIN";
}

export function canCreateDrawingRequest(role: UserRole) {
  return !["DRAFTER", "DRAFT_LEADER"].includes(role);
}

export function canReviewDrawingRequest(role: UserRole) {
  return role === "DRAFT_LEADER";
}

export function canRespondToDrawingRequestAssignment(role: UserRole) {
  return role === "DRAFTER";
}

export function canUploadOldDrawing(role: UserRole) {
  return role === "DRAFT_LEADER" || role === "ADMIN";
}

export function canDeleteDrawing(role: UserRole) {
  return role === "ADMIN";
}

export function canEditRevision(role: UserRole, status: RevisionStatus) {
  return (
    (role === "DRAFTER" || role === "ADMIN") &&
    editableStatuses.has(status)
  );
}

export function canSubmitRevision(role: UserRole, status: RevisionStatus) {
  return canEditRevision(role, status);
}

export function canCheckRevision(role: UserRole, status: RevisionStatus) {
  return (role === "DRAFT_LEADER" || role === "ADMIN") && status === "WAITING_CHECK";
}

export function canApproveRevision(role: UserRole, status: RevisionStatus, isAssigned = true) {
  const matchesLevel =
    ((role === "APPROVER_L1" || role === "ADMIN") && status === "WAITING_APPROVAL_1") ||
    ((role === "HEAD" || role === "ADMIN") && status === "WAITING_APPROVAL_2");

  return matchesLevel && isAssigned;
}

export function canCreateRevision(role: UserRole, status: RevisionStatus, isOwner = true) {
  return (role === "ADMIN" || (role === "DRAFTER" && isOwner)) && status === "COMPLETED";
}

export function canDownload(role: UserRole, status: RevisionStatus) {
  if (status !== "COMPLETED") {
    return false;
  }

  return ["ADMIN", "DRAFTER", "DRAFT_LEADER", "APPROVER_L1", "HEAD", "CONSUMER"].includes(
    role as UserRole
  );
}

export function canViewDrawing(role: UserRole, status: RevisionStatus) {
  if (role === "CONSUMER") {
    return status === "COMPLETED";
  }

  return true;
}

export function getRoleLabel(role: UserRole) {
  return ROLE_LABELS[role];
}

export function getStatusLabel(status: RevisionStatus) {
  return STATUS_LABELS[status];
}
