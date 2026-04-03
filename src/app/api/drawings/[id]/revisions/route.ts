import { apiError, apiSuccess } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { createRevisionFromCompleted, getDrawingDetail } from "@/server/services/drawing.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const role = (session.user.role ?? "CONSUMER") as Parameters<typeof getDrawingDetail>[1];
    const data = await getDrawingDetail(id, role, session.user.id);

    return apiSuccess({ items: data.revisions });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const role = (session.user.role ?? "CONSUMER") as Parameters<
      typeof createRevisionFromCompleted
    >[2];
    const data = await createRevisionFromCompleted(id, session.user.id, role);

    return apiSuccess(data, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

