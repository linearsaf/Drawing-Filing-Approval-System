import { apiError, apiSuccess, parseJson } from "@/lib/server/api";
import { requireRole } from "@/lib/server/auth";
import { adminCreateUserSchema } from "@/lib/validations/api";
import { createUserAccount, listUsers } from "@/server/services/admin.service";

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);
    const users = await listUsers();

    return apiSuccess({ items: users });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(request, ["ADMIN"]);
    const body = await parseJson(request, adminCreateUserSchema);
    const result = await createUserAccount(body, session.user.id);

    return apiSuccess(result, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

