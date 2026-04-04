import { apiError, apiSuccess, parseQuery } from "@/lib/server/api";
import { requireRole } from "@/lib/server/auth";
import { accessRequestListQuerySchema } from "@/lib/validations/api";
import { listAccessRequests } from "@/server/services/access-request.service";

export async function GET(request: Request) {
  try {
    await requireRole(request, ["ADMIN"]);
    const query = parseQuery(request.url, accessRequestListQuerySchema);
    const items = await listAccessRequests(query.status);

    return apiSuccess({ items });
  } catch (error) {
    return apiError(error);
  }
}
