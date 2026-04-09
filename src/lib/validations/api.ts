import { z } from "zod";
import {
  accessRequestStatusValues,
  approvalDecisionValues,
  drawingRequestStatusValues,
  revisionStatusValues,
  userRoleValues,
  workflowSourceValues
} from "@/lib/db/schema";

export const drawingInputSchema = z.object({
  drawingNumber: z.string().min(1),
  drawingName: z.string().min(1),
  sacCode: z.string().min(1),
  area: z.string().min(1),
  discipline: z.string().min(1),
  description: z.string().optional().default(""),
  revisionNo: z.string().min(1),
  fileName: z.string().min(1),
  changeNote: z.string().optional().default(""),
  submit: z.boolean().optional().default(false)
});

export const drawingUpdateSchema = drawingInputSchema.partial().extend({
  submit: z.boolean().optional()
});

export const legacyDrawingInputSchema = z.object({
  drawingNumber: z.string().min(1),
  drawingName: z.string().min(1),
  sacCode: z.string().min(1),
  area: z.string().min(1),
  discipline: z.string().min(1),
  description: z.string().optional().default(""),
  revisionNo: z.string().min(1),
  drawnByUserId: z.string().min(1),
  legacyReadyNote: z.string().min(1),
  fileName: z.string().min(1)
});

export const drawingListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ALL", ...revisionStatusValues]).optional().default("ALL"),
  area: z.string().optional(),
  drawnBy: z.string().optional(),
  revision: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(12)
});

export const revisionCreateSchema = z.object({
  revisionNo: z.string().optional(),
  fileName: z.string().optional(),
  changeNote: z.string().optional().default("")
});

export const decisionSchema = z.object({
  decision: z.enum(approvalDecisionValues),
  note: z.string().optional().default(""),
  signPdf: z.boolean().optional().default(true)
});

export const approvalPlanInputSchema = z.object({
  level1ApproverId: z.string().min(1),
  level2ApproverId: z.string().nullable().optional()
});

export const checkDecisionSchema = decisionSchema.extend({
  approvalPlan: approvalPlanInputSchema.optional()
});

export const approvalPlanUpdateSchema = z.object({
  level1ApproverId: z.string().min(1).optional(),
  level2ApproverId: z.string().nullable().optional()
});

export const approverListQuerySchema = z.object({
  level: z.enum(["1", "2"])
});

export const drawingWorkflowSourceSchema = z.object({
  workflowSource: z.enum(workflowSourceValues).optional()
});

export const adminCreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  username: z.string().min(3),
  password: z.string().min(8),
  role: z.enum(userRoleValues),
  isActive: z.boolean().optional().default(true)
});

export const accessRequestCreateSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  username: z.string().min(3),
  requestedRole: z.enum(userRoleValues)
});

export const accessRequestUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.email().optional(),
  username: z.string().min(3).optional(),
  requestedRole: z.enum(userRoleValues).optional(),
  adminReviewNote: z.string().optional()
});

export const accessRequestDecisionSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  username: z.string().min(3),
  requestedRole: z.enum(userRoleValues),
  adminReviewNote: z.string().optional().default("")
});

export const accessRequestListQuerySchema = z.object({
  status: z.enum(accessRequestStatusValues).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(6)
});

export const drawingRequestCreateSchema = z.object({
  sacCode: z.string().min(1),
  area: z.string().min(1),
  description: z.string().min(1),
  purpose: z.string().min(1),
  referenceImageName: z.string().optional()
});

export const drawingRequestListQuerySchema = z.object({
  status: z.enum(["ALL", ...drawingRequestStatusValues]).optional().default("ALL"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(8)
});

export const drawingRequestReviewSchema = z.object({
  action: z.enum(["APPROVE_ASSIGN", "REJECT"]),
  assignedDrafterId: z.string().optional(),
  note: z.string().optional().default("")
});

export const drawingRequestDrafterDecisionSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"]),
  note: z.string().optional().default("")
});

export const adminUserListQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(["ALL", ...userRoleValues]).optional().default("ALL"),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).optional().default("ALL"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(6)
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.email().optional(),
  username: z.string().min(3).optional(),
  role: z.enum(userRoleValues).optional(),
  isActive: z.boolean().optional()
});

export const accountChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
    revokeOtherSessions: z.boolean().optional().default(false)
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Konfirmasi password baru tidak cocok.",
    path: ["confirmPassword"]
  });

export const adminSetUserPasswordSchema = z
  .object({
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
    revokeSessions: z.boolean().optional().default(false)
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Konfirmasi password baru tidak cocok.",
    path: ["confirmPassword"]
  });

export const passwordResetRequestSchema = z.object({
  email: z.email()
});

export const passwordResetSubmitSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Konfirmasi password baru tidak cocok.",
    path: ["confirmPassword"]
  });

export const notificationsListQuerySchema = z.object({
  filter: z.enum(["ALL", "UNREAD", "ACTIONABLE"]).optional().default("ALL"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(12)
});
