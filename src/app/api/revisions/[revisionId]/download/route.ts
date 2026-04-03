import { apiError, apiSuccess } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { authorizeRevisionDownload } from "@/server/services/revision.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ revisionId: string }> }
) {
  try {
    const session = await requireSession(request);
    const { revisionId } = await params;
    const role = (session.user.role ?? "CONSUMER") as Parameters<
      typeof authorizeRevisionDownload
    >[2];
    const data = await authorizeRevisionDownload(revisionId, session.user.id, role);

    return apiSuccess({
      ...data,
      filePath: `/api/revisions/${revisionId}/preview?download=1`
    });
  } catch (error) {
    return apiError(error);
  }
}
