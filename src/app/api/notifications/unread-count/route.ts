import { apiError, apiSuccess } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { getUnreadNotificationCount } from "@/server/services/notification.service";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const data = await getUnreadNotificationCount(session.user.id);

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}
