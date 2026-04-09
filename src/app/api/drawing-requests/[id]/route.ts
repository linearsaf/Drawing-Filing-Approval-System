import { apiError, apiSuccess } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { getDrawingRequestDetail } from "@/server/services/drawing-request.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const data = await getDrawingRequestDetail(
      id,
      (session.user.role ?? "CONSUMER") as Parameters<typeof getDrawingRequestDetail>[1],
      session.user.id
    );

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}
