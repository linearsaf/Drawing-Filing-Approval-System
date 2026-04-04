import { apiError, apiSuccess, parseJson } from "@/lib/server/api";
import { requireRole } from "@/lib/server/auth";
import { accessRequestUpdateSchema } from "@/lib/validations/api";
import { updateAccessRequest } from "@/server/services/access-request.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(request, ["ADMIN"]);
    const { id } = await params;
    const body = await parseJson(request, accessRequestUpdateSchema);
    const result = await updateAccessRequest(id, body, session.user.id);

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
