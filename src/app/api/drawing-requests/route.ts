import { apiError, apiSuccess, parseQuery } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { AppRole } from "@/lib/server/auth";
import { drawingRequestCreateSchema, drawingRequestListQuerySchema } from "@/lib/validations/api";
import {
  createDrawingRequest,
  listDrawingRequests
} from "@/server/services/drawing-request.service";
import {
  removeDrawingRequestFiles,
  saveDrawingRequestReferenceImage
} from "@/server/storage/drawing-request-files";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const query = parseQuery(request.url, drawingRequestListQuerySchema);
    const role = (session.user.role ?? "CONSUMER") as AppRole;

    const data = await listDrawingRequests({
      role,
      userId: session.user.id,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize
    });

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireSession(request);
    const formData = await request.formData();
    const referenceImage = formData.get("referenceImage");

    const parsedBody = drawingRequestCreateSchema.safeParse({
      sacCode: formData.get("sacCode"),
      area: formData.get("area"),
      description: formData.get("description"),
      purpose: formData.get("purpose"),
      referenceImageName: referenceImage instanceof File ? referenceImage.name : undefined
    });

    if (!parsedBody.success) {
      return apiError(parsedBody.error);
    }

    const storedReference = referenceImage instanceof File && referenceImage.size > 0
      ? await saveDrawingRequestReferenceImage({
          requestId,
          file: referenceImage
        })
      : null;

    const data = await createDrawingRequest(
      {
        requestId,
        ...parsedBody.data,
        referenceImagePath: storedReference?.filePath ?? null
      },
      {
        userId: session.user.id,
        role: (session.user.role ?? "CONSUMER") as Parameters<typeof createDrawingRequest>[1]["role"]
      }
    );

    return apiSuccess(data, { status: 201 });
  } catch (error) {
    await removeDrawingRequestFiles(requestId);
    return apiError(error);
  }
}
