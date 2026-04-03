import { apiError, apiSuccess, parseJson } from "@/lib/server/api";
import { requireRole } from "@/lib/server/auth";
import { adminSetUserPasswordSchema } from "@/lib/validations/api";
import { setUserPasswordByAdmin } from "@/server/services/admin.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(request, ["ADMIN"]);
    const { id } = await params;
    const body = await parseJson(request, adminSetUserPasswordSchema);
    const result = await setUserPasswordByAdmin(id, body, session.user.id);

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
