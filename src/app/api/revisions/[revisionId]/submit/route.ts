import { apiError, apiSuccess } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { submitRevision } from "@/server/services/revision.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ revisionId: string }> }
) {
  try {
    const session = await requireSession(request);
    const { revisionId } = await params;
    const role = (session.user.role ?? "CONSUMER") as Parameters<typeof submitRevision>[2];
    const data = await submitRevision(revisionId, session.user.id, role);

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}

