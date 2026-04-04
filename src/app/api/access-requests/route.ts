import { apiError, apiSuccess, parseJson } from "@/lib/server/api";
import { accessRequestCreateSchema } from "@/lib/validations/api";
import { createAccessRequest } from "@/server/services/access-request.service";

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, accessRequestCreateSchema);
    const result = await createAccessRequest(body);

    return apiSuccess(result, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
