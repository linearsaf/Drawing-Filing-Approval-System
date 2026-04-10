import { apiError, apiSuccess, parseJson } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { accountProfileUpdateSchema } from "@/lib/validations/api";
import { getAccountProfile, updateAccountProfile } from "@/server/services/account.service";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const profile = await getAccountProfile(session.user.id);

    return apiSuccess(profile);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession(request);
    const body = await parseJson(request, accountProfileUpdateSchema);
    const profile = await updateAccountProfile(session.user.id, body);

    return apiSuccess(profile);
  } catch (error) {
    return apiError(error);
  }
}
