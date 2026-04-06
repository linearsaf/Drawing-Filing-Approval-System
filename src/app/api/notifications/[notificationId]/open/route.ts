import { apiError, apiSuccess } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { openNotification } from "@/server/services/notification.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const session = await requireSession(request);
    const { notificationId } = await params;
    const data = await openNotification(notificationId, session.user.id);

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}
