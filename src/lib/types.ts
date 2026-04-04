export type UserRole =
  | "ADMIN"
  | "DRAFTER"
  | "DRAFT_LEADER"
  | "APPROVER_L1"
  | "HEAD"
  | "CONSUMER";

export type AccessRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type RevisionStatus =
  | "DRAFT"
  | "WAITING_CHECK"
  | "CHECK_REJECTED"
  | "WAITING_APPROVAL_1"
  | "APPROVAL_1_REJECTED"
  | "WAITING_APPROVAL_2"
  | "APPROVAL_2_REJECTED"
  | "COMPLETED"
  | "OBSOLETE";

export type ApprovalDecision = "APPROVED" | "REJECTED";

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  username: string;
  requestedRole: UserRole;
  status: AccessRequestStatus;
  adminReviewNote: string | null;
  approvedUserId: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
}

export interface Drawing {
  id: string;
  drawingNumber: string;
  drawingName: string;
  sacCode: string;
  area: string;
  discipline: string;
  description: string | null;
  createdBy: string;
  drawnByUserId?: string;
  drawnByName?: string | null;
  drawnByUsername?: string | null;
  currentRevisionId: string | null;
  currentStatus: RevisionStatus;
  latestCompletedRevisionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DrawingRevision {
  id: string;
  drawingId: string;
  revisionNo: string;
  status: RevisionStatus;
  fileName: string;
  fileOriginalPath: string;
  fileWatermarkedPath: string | null;
  changeNote: string;
  submittedBy: string | null;
  submittedAt: string | null;
  isLatest: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalAction {
  id: string;
  revisionId: string;
  approvalLevel: 0 | 1 | 2;
  actorId: string;
  actorRole: UserRole;
  decision: ApprovalDecision;
  decisionNote: string;
  actedAt: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: "DRAWING" | "REVISION" | "USER" | "ACCESS_REQUEST";
  entityId: string;
  action: string;
  userId: string | null;
  note: string | null;
  metadata: Record<string, string>;
  createdAt: string;
}

export interface DashboardSummary {
  totalDrawings: number;
  waitingCheck: number;
  waitingApproval1: number;
  waitingApproval2: number;
  rejected: number;
  completed: number;
  drafts: number;
}

export interface DrawingFilters {
  search: string;
  status: RevisionStatus | "ALL";
  area: string;
  drawnBy: string;
  revision: string;
  dateFrom: string;
  dateTo: string;
}

export interface DrafterOption {
  id: string;
  name: string;
  username: string;
}

export interface DemoSession {
  userId: string;
  role: UserRole;
}

export interface MockDatabase {
  users: User[];
  drawings: Drawing[];
  revisions: DrawingRevision[];
  approvalActions: ApprovalAction[];
  auditLogs: AuditLog[];
}

export interface DrawingFormInput {
  drawingNumber: string;
  drawingName: string;
  sacCode: string;
  area: string;
  discipline: string;
  description: string;
  revisionNo: string;
  fileName: string;
  changeNote: string;
}
