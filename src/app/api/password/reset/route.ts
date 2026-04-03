import { apiError, apiSuccess, parseJson } from "@/lib/server/api";
import { auth } from "@/lib/auth";
import { passwordResetSubmitSchema } from "@/lib/validations/api";

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, passwordResetSubmitSchema);

    const result = await auth.api.resetPassword({
      body: {
        token: body.token,
        newPassword: body.newPassword
      }
    });

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
