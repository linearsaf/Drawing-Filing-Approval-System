import { apiError, apiSuccess, parseJson, parseQuery } from "@/lib/server/api";
import { requireRole } from "@/lib/server/auth";
import { adminCreateUserSchema, adminUserListQuerySchema } from "@/lib/validations/api";
import { createUserAccount, listUsers } from "@/server/services/admin.service";

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);
    const query = parseQuery(request.url, adminUserListQuerySchema);
    const users = await listUsers({
      search: query.search,
      role: query.role,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize
    });

    return apiSuccess(users);
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
