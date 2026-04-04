import { apiError, apiSuccess, parseJson } from "@/lib/server/api";
import { requireRole } from "@/lib/server/auth";
import { accessRequestDecisionSchema } from "@/lib/validations/api";
import { approveAccessRequest } from "@/server/services/access-request.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(request, ["ADMIN"]);
    const { id } = await params;
    const body = await parseJson(request, accessRequestDecisionSchema);
    const result = await approveAccessRequest(id, body, session.user.id);

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
