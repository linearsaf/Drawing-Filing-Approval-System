import { apiError, apiSuccess } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { getRevisionDetail } from "@/server/services/revision.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ revisionId: string }> }
) {
  try {
    const session = await requireSession(request);
    const { revisionId } = await params;
    const role = (session.user.role ?? "CONSUMER") as Parameters<typeof getRevisionDetail>[1];
    const data = await getRevisionDetail(revisionId, role, session.user.id);

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}

