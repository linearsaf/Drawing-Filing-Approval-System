import { apiError, apiSuccess, parseJson } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { drawingRequestDrafterDecisionSchema } from "@/lib/validations/api";
import { decideDrawingRequestByDrafter } from "@/server/services/drawing-request.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const body = await parseJson(request, drawingRequestDrafterDecisionSchema);
    const { id } = await params;
    const data = await decideDrawingRequestByDrafter(
      id,
      body,
      {
        userId: session.user.id,
        role: (session.user.role ?? "CONSUMER") as Parameters<typeof decideDrawingRequestByDrafter>[2]["role"]
      }
    );

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}
