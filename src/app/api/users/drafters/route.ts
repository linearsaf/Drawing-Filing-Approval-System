import { apiError, apiSuccess } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { listDrafterUsers } from "@/server/services/user.service";

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const items = await listDrafterUsers();

    return apiSuccess({ items });
  } catch (error) {
    return apiError(error);
  }
}
