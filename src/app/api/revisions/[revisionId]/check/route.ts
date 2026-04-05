import { apiError, apiSuccess, parseJson } from "@/lib/server/api";
import { requireRole } from "@/lib/server/auth";
import { checkDecisionSchema } from "@/lib/validations/api";
import { decideApproval } from "@/server/services/approval.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ revisionId: string }> }
) {
  try {
    const session = await requireRole(request, ["DRAFT_LEADER", "ADMIN"]);
    const { revisionId } = await params;
    const body = await parseJson(request, checkDecisionSchema);
    const role = (session.user.role ?? "CONSUMER") as Parameters<typeof decideApproval>[0]["role"];

    const data = await decideApproval({
      revisionId,
      userId: session.user.id,
      role,
      actorName: session.user.name,
      decision: body.decision,
      note: body.note,
      signPdf: body.signPdf,
      approvalPlan: body.approvalPlan,
      expectedStatus: "WAITING_CHECK"
    });

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}
