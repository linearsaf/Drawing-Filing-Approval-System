import { apiError, apiSuccess } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { markAllNotificationsRead } from "@/server/services/notification.service";

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const data = await markAllNotificationsRead(session.user.id);

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}
