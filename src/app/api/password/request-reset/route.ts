import { apiError, apiSuccess, parseJson } from "@/lib/server/api";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { passwordResetRequestSchema } from "@/lib/validations/api";
import { getPasswordResetPreview } from "@/server/auth/password-reset-preview";

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, passwordResetRequestSchema);

    const result = await auth.api.requestPasswordReset({
      headers: new Headers({
        origin: env.BETTER_AUTH_URL
      }),
      body: {
        email: body.email,
        redirectTo: `${env.BETTER_AUTH_URL}/reset-password`
      }
    });

    const preview = getPasswordResetPreview(body.email);

    return apiSuccess({
      ...result,
      previewUrl: preview?.url ?? null
    });
  } catch (error) {
    return apiError(error);
  }
}
