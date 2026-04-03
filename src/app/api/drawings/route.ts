import { HttpError, apiError, apiSuccess, parseJson, parseQuery } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { drawingInputSchema, drawingListQuerySchema } from "@/lib/validations/api";
import { createDrawing, listDrawings } from "@/server/services/drawing.service";
import { removeDrawingRevisionFiles, saveDrawingPdfFile } from "@/server/storage/drawing-files";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const query = parseQuery(request.url, drawingListQuerySchema);
    const role = (session.user.role ?? "CONSUMER") as Parameters<typeof listDrawings>[0]["role"];

    const data = await listDrawings({
      role,
      userId: session.user.id,
      search: query.search,
      status: query.status,
      area: query.area,
      revision: query.revision,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo
    });

    return apiSuccess({ items: data });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const role = session.user.role;

    if (role !== "DRAFTER" && role !== "ADMIN") {
      throw new HttpError(403, "Akses membuat drawing tidak diizinkan.");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const parsedBody = drawingInputSchema.safeParse({
      drawingNumber: formData.get("drawingNumber"),
      drawingName: formData.get("drawingName"),
      sacCode: formData.get("sacCode"),
      area: formData.get("area"),
      discipline: formData.get("discipline"),
      description: formData.get("description") ?? "",
      revisionNo: formData.get("revisionNo"),
      fileName: file instanceof File ? file.name : formData.get("fileName"),
      changeNote: formData.get("changeNote") ?? "",
      submit: formData.get("submit") === "true"
    });

    if (!parsedBody.success) {
      throw new HttpError(422, "Request body tidak valid.", parsedBody.error.flatten());
    }

    const body = parsedBody.data;
    const drawingId = crypto.randomUUID();
    const revisionId = crypto.randomUUID();
    try {
      const storedFile = await saveDrawingPdfFile({
        drawingId,
        revisionNo: body.revisionNo,
        file: file instanceof File ? file : null,
        createWatermarkedCopy: body.submit
      });
      const data = await createDrawing(
        {
          ...body,
          drawingId,
          revisionId,
          fileName: storedFile.fileName,
          fileOriginalPath: storedFile.fileOriginalPath,
          fileWatermarkedPath: storedFile.fileWatermarkedPath
        },
        session.user.id
      );

      return apiSuccess(data, { status: 201 });
    } catch (error) {
      await removeDrawingRevisionFiles({
        drawingId,
        revisionNo: body.revisionNo
      });
      throw error;
    }
  } catch (error) {
    return apiError(error);
  }
}
