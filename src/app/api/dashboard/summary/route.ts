import { apiError, apiSuccess } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { getDashboardSummaryForRole } from "@/server/services/dashboard.service";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const role = (session.user.role ?? "CONSUMER") as Parameters<
      typeof getDashboardSummaryForRole
    >[0];
    const data = await getDashboardSummaryForRole(role, session.user.id);

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}

