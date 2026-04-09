import { apiError, apiSuccess, parseJson } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { drawingRequestReviewSchema } from "@/lib/validations/api";
import { reviewDrawingRequest } from "@/server/services/drawing-request.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const body = await parseJson(request, drawingRequestReviewSchema);
    const { id } = await params;
    const data = await reviewDrawingRequest(
      id,
      body,
      {
        userId: session.user.id,
        role: (session.user.role ?? "CONSUMER") as Parameters<typeof reviewDrawingRequest>[2]["role"]
      }
    );

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}
