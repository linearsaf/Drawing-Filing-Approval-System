import { apiError, apiSuccess, parseJson } from "@/lib/server/api";
import { requireRole } from "@/lib/server/auth";
import { adminUpdateUserSchema } from "@/lib/validations/api";
import { updateUserAccount } from "@/server/services/admin.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(request, ["ADMIN"]);
    const { id } = await params;
    const body = await parseJson(request, adminUpdateUserSchema);
    const user = await updateUserAccount(id, body, session.user.id);

    return apiSuccess(user);
  } catch (error) {
    return apiError(error);
  }
}
