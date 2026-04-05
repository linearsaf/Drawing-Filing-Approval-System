import { apiError, apiSuccess } from "@/lib/server/api";
import { requireRole } from "@/lib/server/auth";
import { listLegacyDrawnByUsers } from "@/server/services/user.service";

export async function GET(request: Request) {
  try {
    const session = await requireRole(request, ["DRAFT_LEADER", "ADMIN"]);
    const role = (session.user.role ?? "CONSUMER") as Parameters<typeof listLegacyDrawnByUsers>[1];
    const items = await listLegacyDrawnByUsers(session.user.id, role);

    return apiSuccess({ items });
  } catch (error) {
    return apiError(error);
  }
}
