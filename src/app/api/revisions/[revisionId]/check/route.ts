import { apiError, apiSuccess, parseJson } from "@/lib/server/api";
import { requireRole } from "@/lib/server/auth";
import { checkDecisionFormSchema, checkDecisionSchema } from "@/lib/validations/api";
import { decideApproval } from "@/server/services/approval.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ revisionId: string }> }
) {
  try {
    const session = await requireRole(request, ["DRAFT_LEADER", "ADMIN"]);
    const { revisionId } = await params;
    const contentType = request.headers.get("content-type") ?? "";
    let body: {
      decision: "APPROVED" | "REJECTED";
      note: string;
      signPdf: boolean;
      approvalPlan?: {
        level1ApproverId: string;
        level2ApproverId?: string | null;
      };
      decisionImages?: File[];
    };

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const parsed = checkDecisionFormSchema.safeParse({
        decision: formData.get("decision"),
        note: formData.get("note") ?? "",
        signPdf: formData.get("signPdf") ?? "true",
        approvalPlan: formData.get("approvalPlan")
      });

      if (!parsed.success) {
        throw parsed.error;
      }

      body = {
        ...parsed.data,
        decisionImages: formData
          .getAll("decisionImages")
          .filter((item): item is File => item instanceof File && item.size > 0)
      };
    } else {
      const parsed = await parseJson(request, checkDecisionSchema);
      body = parsed;
    }

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
      decisionImages: "decisionImages" in body ? body.decisionImages : undefined,
      expectedStatus: "WAITING_CHECK"
    });

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}
