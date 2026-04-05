import { apiError, apiSuccess, parseQuery } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { approverListQuerySchema } from "@/lib/validations/api";
import { listApproverUsers } from "@/server/services/user.service";

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const query = parseQuery(request.url, approverListQuerySchema);
    const items = await listApproverUsers(query.level === "1" ? 1 : 2);

    return apiSuccess({ items });
  } catch (error) {
    return apiError(error);
  }
}
