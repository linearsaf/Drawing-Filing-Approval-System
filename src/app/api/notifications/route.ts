import { apiError, apiSuccess, parseQuery } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { notificationsListQuerySchema } from "@/lib/validations/api";
import { listNotifications } from "@/server/services/notification.service";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const query = parseQuery(request.url, notificationsListQuerySchema);
    const data = await listNotifications({
      userId: session.user.id,
      filter: query.filter,
      page: query.page,
      pageSize: query.pageSize
    });

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}
