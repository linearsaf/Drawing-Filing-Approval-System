import { apiError, apiSuccess } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { listAssignableDrafterUsers } from "@/server/services/user.service";

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const items = await listAssignableDrafterUsers();
    return apiSuccess({ items });
  } catch (error) {
    return apiError(error);
  }
}
