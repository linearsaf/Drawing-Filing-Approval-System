import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api";
import { AppRole } from "@/lib/server/auth";
import { notifyAssignedApprover } from "@/server/services/notification.service";

type StepState = "UNASSIGNED" | "PENDING" | "APPROVED" | "REJECTED";

type RevisionLike = {
  id: string;
  status: string;
};

type ApprovalStepView = {
  id: string | null;
  revisionId: string;
  approvalLevel: 1 | 2;
  assignedUserId: string | null;
  assignedByUserId: string | null;
  assignedAt: Date | null;
  updatedAt: Date | null;
  assignedUserName: string | null;
  assignedUserUsername: string | null;
  assignedUserRole: AppRole | null;
  assignedByUserName: string | null;
  assignedByUserUsername: string | null;
  state: StepState;
};

function parseDecisionImagePaths(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

type DbExecutor = Pick<typeof db, "select" | "insert" | "update" | "delete"> & {
  query: typeof db.query;
};

const waitingApprovalStatuses = [
  "WAITING_APPROVAL_1",
  "WAITING_APPROVAL_2",
  "APPROVAL_1_REJECTED",
  "APPROVAL_2_REJECTED",
  "COMPLETED",
  "OBSOLETE"
] as const;

export async function assertValidApprovalAssignee(level: 1 | 2, userId: string) {
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, userId)
  });

  if (!user || !user.isActive) {
    throw new HttpError(422, `Approver level ${level} harus user aktif.`);
  }

  if (level === 1 && !["APPROVER_L1", "ADMIN"].includes(user.role)) {
    throw new HttpError(422, "Approver level 1 harus ber-role Approver L1 atau Admin.");
  }

  if (level === 2 && !["HEAD", "ADMIN"].includes(user.role)) {
    throw new HttpError(422, "Approver level 2 harus ber-role Head atau Admin.");
  }

  return user;
}

export async function upsertApprovalPlan(
  tx: DbExecutor,
  params: {
    revisionId: string;
    actorUserId: string;
    level1ApproverId: string;
    level2ApproverId?: string | null;
  }
) {
  await assertValidApprovalAssignee(1, params.level1ApproverId);

  if (params.level2ApproverId) {
    await assertValidApprovalAssignee(2, params.level2ApproverId);
  }

  const existingSteps = await tx
    .select()
    .from(schema.revisionApprovalSteps)
    .where(eq(schema.revisionApprovalSteps.revisionId, params.revisionId));

  const level1Step = existingSteps.find((step) => step.approvalLevel === 1);
  const level2Step = existingSteps.find((step) => step.approvalLevel === 2);

  if (level1Step) {
    await tx
      .update(schema.revisionApprovalSteps)
      .set({
        assignedUserId: params.level1ApproverId,
        assignedByUserId: params.actorUserId,
        assignedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(schema.revisionApprovalSteps.id, level1Step.id));
  } else {
    await tx.insert(schema.revisionApprovalSteps).values({
      id: crypto.randomUUID(),
      revisionId: params.revisionId,
      approvalLevel: 1,
      assignedUserId: params.level1ApproverId,
      assignedByUserId: params.actorUserId,
      assignedAt: new Date()
    });
  }

  if (params.level2ApproverId) {
    if (level2Step) {
      await tx
        .update(schema.revisionApprovalSteps)
        .set({
          assignedUserId: params.level2ApproverId,
          assignedByUserId: params.actorUserId,
          assignedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(schema.revisionApprovalSteps.id, level2Step.id));
    } else {
      await tx.insert(schema.revisionApprovalSteps).values({
        id: crypto.randomUUID(),
        revisionId: params.revisionId,
        approvalLevel: 2,
        assignedUserId: params.level2ApproverId,
        assignedByUserId: params.actorUserId,
        assignedAt: new Date()
      });
    }
  } else if (level2Step) {
    await tx.delete(schema.revisionApprovalSteps).where(eq(schema.revisionApprovalSteps.id, level2Step.id));
  }
}

export async function listApprovalStepsByRevisionIds(revisionIds: string[]) {
  if (revisionIds.length === 0) {
    return [];
  }

  const steps = await db
    .select()
    .from(schema.revisionApprovalSteps)
    .where(inArray(schema.revisionApprovalSteps.revisionId, revisionIds))
    .orderBy(asc(schema.revisionApprovalSteps.approvalLevel));

  const userIds = [...new Set(
    steps.flatMap((step) => [step.assignedUserId, step.assignedByUserId].filter(Boolean) as string[])
  )];
  const users = userIds.length
    ? await db
        .select({
          id: schema.user.id,
          name: schema.user.name,
          username: schema.user.username,
          role: schema.user.role
        })
        .from(schema.user)
        .where(inArray(schema.user.id, userIds))
    : [];
  const userById = new Map(users.map((user) => [user.id, user]));

  return steps.map((step) => ({
    ...step,
    assignedUser: step.assignedUserId ? userById.get(step.assignedUserId) ?? null : null,
    assignedByUser: step.assignedByUserId ? userById.get(step.assignedByUserId) ?? null : null
  }));
}

export async function listApprovalActionsByRevisionIds(revisionIds: string[]) {
  if (revisionIds.length === 0) {
    return [];
  }

  const actions = await db
    .select()
    .from(schema.approvalActions)
    .where(inArray(schema.approvalActions.revisionId, revisionIds))
    .orderBy(desc(schema.approvalActions.actedAt));

  return actions.map((action) => ({
    ...action,
    decisionImagePaths: parseDecisionImagePaths(action.decisionImagePaths)
  }));
}

export function buildApprovalPlanMap(
  revisions: RevisionLike[],
  approvalSteps: Awaited<ReturnType<typeof listApprovalStepsByRevisionIds>>,
  approvalActions: Awaited<ReturnType<typeof listApprovalActionsByRevisionIds>>
) {
  const stepsByRevision = new Map<string, ApprovalStepView[]>();

  revisions.forEach((revision) => {
    const revisionSteps = approvalSteps.filter((step) => step.revisionId === revision.id);
    const revisionActions = approvalActions.filter((action) => action.revisionId === revision.id);
    const builtSteps = [1, 2]
      .map<ApprovalStepView | null>((level) =>
        buildApprovalStep(
          revision,
          level as 1 | 2,
          revisionSteps.find((step) => step.approvalLevel === level) ?? null,
          revisionActions
        )
      )
      .filter((step): step is ApprovalStepView => step !== null);

    stepsByRevision.set(revision.id, builtSteps);
  });

  return stepsByRevision;
}

function buildApprovalStep(
  revision: RevisionLike,
  level: 1 | 2,
  step:
    | (Awaited<ReturnType<typeof listApprovalStepsByRevisionIds>>[number] & {
        assignedUser: { id: string; name: string; username: string; role: AppRole } | null;
        assignedByUser: { id: string; name: string; username: string; role: AppRole } | null;
      })
    | null,
  approvalActions: Awaited<ReturnType<typeof listApprovalActionsByRevisionIds>>
): ApprovalStepView | null {
  const action = approvalActions.find((item) => item.approvalLevel === level);

  if (!step) {
    if (!shouldShowUnassignedStep(revision.status, level, approvalActions)) {
      return null;
    }

    return {
      id: null,
      revisionId: revision.id,
      approvalLevel: level,
      assignedUserId: null,
      assignedByUserId: null,
      assignedAt: null,
      updatedAt: null,
      assignedUserName: null,
      assignedUserUsername: null,
      assignedUserRole: null,
      assignedByUserName: null,
      assignedByUserUsername: null,
      state: "UNASSIGNED"
    };
  }

  return {
    id: step.id,
    revisionId: step.revisionId,
    approvalLevel: level,
    assignedUserId: step.assignedUserId,
    assignedByUserId: step.assignedByUserId,
    assignedAt: step.assignedAt,
    updatedAt: step.updatedAt,
    assignedUserName: step.assignedUser?.name ?? null,
    assignedUserUsername: step.assignedUser?.username ?? null,
    assignedUserRole: step.assignedUser?.role ?? null,
    assignedByUserName: step.assignedByUser?.name ?? null,
    assignedByUserUsername: step.assignedByUser?.username ?? null,
    state: getStepState(action?.decision)
  };
}

function shouldShowUnassignedStep(
  status: string,
  level: 1 | 2,
  approvalActions: Awaited<ReturnType<typeof listApprovalActionsByRevisionIds>>
) {
  if (!waitingApprovalStatuses.includes(status as (typeof waitingApprovalStatuses)[number])) {
    return false;
  }

  if (level === 1) {
    return ["WAITING_APPROVAL_1", "APPROVAL_1_REJECTED"].includes(status) || approvalActions.some((action) => action.approvalLevel >= 1);
  }

  return ["WAITING_APPROVAL_2", "APPROVAL_2_REJECTED"].includes(status) || approvalActions.some((action) => action.approvalLevel >= 2);
}

function getStepState(decision?: "APPROVED" | "REJECTED"): StepState {
  if (decision === "APPROVED") {
    return "APPROVED";
  }

  if (decision === "REJECTED") {
    return "REJECTED";
  }

  return "PENDING";
}

export function getActiveApprovalLevel(status: string): 1 | 2 | null {
  if (status === "WAITING_APPROVAL_1") {
    return 1;
  }

  if (status === "WAITING_APPROVAL_2") {
    return 2;
  }

  return null;
}

export function canUserApproveAssignedStep(params: {
  role: AppRole;
  userId: string;
  revisionStatus: string;
  approvalPlan: Array<{ approvalLevel: 1 | 2; assignedUserId: string | null }>;
}) {
  const activeLevel = getActiveApprovalLevel(params.revisionStatus);

  if (!activeLevel) {
    return false;
  }

  if (activeLevel === 1 && !["APPROVER_L1", "ADMIN"].includes(params.role)) {
    return false;
  }

  if (activeLevel === 2 && !["HEAD", "ADMIN"].includes(params.role)) {
    return false;
  }

  return (
    params.approvalPlan.find((step) => step.approvalLevel === activeLevel)?.assignedUserId ===
    params.userId
  );
}

export async function reassignApprovalPlan(params: {
  revisionId: string;
  actorUserId: string;
  role: AppRole;
  level1ApproverId?: string;
  level2ApproverId?: string | null;
}) {
  if (!["DRAFT_LEADER", "ADMIN"].includes(params.role)) {
    throw new HttpError(403, "Akses penggantian approver tidak diizinkan.");
  }

  return db.transaction(async (tx) => {
    const reassignedAt = new Date();
    const revision = await tx.query.drawingRevisions.findFirst({
      where: eq(schema.drawingRevisions.id, params.revisionId)
    });

    if (!revision) {
      throw new HttpError(404, "Revisi tidak ditemukan.");
    }

    const drawing = await tx.query.drawings.findFirst({
      where: eq(schema.drawings.id, revision.drawingId)
    });

    if (!drawing) {
      throw new HttpError(404, "Drawing tidak ditemukan.");
    }

    if (!["WAITING_APPROVAL_1", "WAITING_APPROVAL_2"].includes(revision.status)) {
      throw new HttpError(409, "Approval plan hanya bisa diubah saat revisi menunggu approval.");
    }

    const existingSteps = await tx
      .select()
      .from(schema.revisionApprovalSteps)
      .where(eq(schema.revisionApprovalSteps.revisionId, revision.id));
    const existingActions = await tx
      .select()
      .from(schema.approvalActions)
      .where(eq(schema.approvalActions.revisionId, revision.id));

    const hasLevel1Action = existingActions.some((action) => action.approvalLevel === 1);
    const hasLevel2Action = existingActions.some((action) => action.approvalLevel === 2);
    const level2Step = existingSteps.find((step) => step.approvalLevel === 2);

    if (params.level1ApproverId !== undefined) {
      if (revision.status === "WAITING_APPROVAL_2" || hasLevel1Action) {
        throw new HttpError(409, "Approver level 1 tidak dapat diubah setelah level 1 diproses.");
      }

      await assertValidApprovalAssignee(1, params.level1ApproverId);

      const currentLevel1 = existingSteps.find((step) => step.approvalLevel === 1);
      if (currentLevel1) {
        await tx
          .update(schema.revisionApprovalSteps)
          .set({
            assignedUserId: params.level1ApproverId,
            assignedByUserId: params.actorUserId,
            assignedAt: reassignedAt,
            updatedAt: reassignedAt
          })
          .where(eq(schema.revisionApprovalSteps.id, currentLevel1.id));
      } else {
        await tx.insert(schema.revisionApprovalSteps).values({
          id: crypto.randomUUID(),
          revisionId: revision.id,
          approvalLevel: 1,
          assignedUserId: params.level1ApproverId,
          assignedByUserId: params.actorUserId,
          assignedAt: reassignedAt
        });
      }
    }

    if (params.level2ApproverId !== undefined) {
      if (hasLevel2Action) {
        throw new HttpError(409, "Approver level 2 tidak dapat diubah setelah level 2 diproses.");
      }

      if (params.level2ApproverId) {
        await assertValidApprovalAssignee(2, params.level2ApproverId);

        if (level2Step) {
          await tx
            .update(schema.revisionApprovalSteps)
            .set({
              assignedUserId: params.level2ApproverId,
              assignedByUserId: params.actorUserId,
              assignedAt: reassignedAt,
              updatedAt: reassignedAt
            })
            .where(eq(schema.revisionApprovalSteps.id, level2Step.id));
        } else {
          await tx.insert(schema.revisionApprovalSteps).values({
            id: crypto.randomUUID(),
            revisionId: revision.id,
            approvalLevel: 2,
            assignedUserId: params.level2ApproverId,
            assignedByUserId: params.actorUserId,
            assignedAt: reassignedAt
          });
        }
      } else {
        if (revision.status === "WAITING_APPROVAL_2") {
          throw new HttpError(409, "Approver level 2 wajib tetap ada saat revisi menunggu final approval.");
        }

        if (level2Step) {
          await tx.delete(schema.revisionApprovalSteps).where(eq(schema.revisionApprovalSteps.id, level2Step.id));
        }
      }
    }

    if (params.level1ApproverId && revision.status === "WAITING_APPROVAL_1") {
      await notifyAssignedApprover(
        {
          drawingId: drawing.id,
          drawingNumber: drawing.drawingNumber,
          drawingName: drawing.drawingName,
          revisionId: revision.id,
          revisionNo: revision.revisionNo,
          approvalLevel: 1,
          assignedUserId: params.level1ApproverId,
          assignedAt: reassignedAt
        },
        tx
      );
    }

    if (params.level2ApproverId && revision.status === "WAITING_APPROVAL_2") {
      await notifyAssignedApprover(
        {
          drawingId: drawing.id,
          drawingNumber: drawing.drawingNumber,
          drawingName: drawing.drawingName,
          revisionId: revision.id,
          revisionNo: revision.revisionNo,
          approvalLevel: 2,
          assignedUserId: params.level2ApproverId,
          assignedAt: reassignedAt
        },
        tx
      );
    }

    return { revisionId: revision.id };
  });
}

export async function getApprovalPlanForRevision(revision: RevisionLike) {
  const [steps, actions] = await Promise.all([
    listApprovalStepsByRevisionIds([revision.id]),
    listApprovalActionsByRevisionIds([revision.id])
  ]);
  const approvalPlan = buildApprovalPlanMap([revision], steps, actions).get(revision.id) ?? [];

  return {
    approvalPlan,
    activeApprovalLevel: getActiveApprovalLevel(revision.status)
  };
}

export async function getRevisionApprovalAssignment(
  revisionId: string,
  approvalLevel: 1 | 2,
  tx: DbExecutor = db
) {
  return tx.query.revisionApprovalSteps.findFirst({
    where: and(
      eq(schema.revisionApprovalSteps.revisionId, revisionId),
      eq(schema.revisionApprovalSteps.approvalLevel, approvalLevel)
    )
  });
}
