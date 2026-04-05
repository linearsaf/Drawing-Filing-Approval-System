import { apiError, apiSuccess, parseJson } from "@/lib/server/api";
import { requireRole } from "@/lib/server/auth";
import { approvalPlanUpdateSchema } from "@/lib/validations/api";
import { reassignApprovalPlan } from "@/server/services/approval-plan.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ revisionId: string }> }
) {
  try {
    const session = await requireRole(request, ["DRAFT_LEADER", "ADMIN"]);
    const body = await parseJson(request, approvalPlanUpdateSchema);
    const { revisionId } = await params;
    const role = (session.user.role ?? "CONSUMER") as Parameters<typeof reassignApprovalPlan>[0]["role"];

    const data = await reassignApprovalPlan({
      revisionId,
      actorUserId: session.user.id,
      role,
      level1ApproverId: body.level1ApproverId,
      level2ApproverId: body.level2ApproverId
    });

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}
