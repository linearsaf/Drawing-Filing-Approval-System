import { HttpError, apiError, apiSuccess } from "@/lib/server/api";
import { requireRole } from "@/lib/server/auth";
import { legacyDrawingInputSchema } from "@/lib/validations/api";
import { createLegacyDrawing } from "@/server/services/drawing.service";
import { removeDrawingRevisionFiles, saveDrawingPdfFile } from "@/server/storage/drawing-files";

export async function POST(request: Request) {
  try {
    const session = await requireRole(request, ["DRAFT_LEADER", "ADMIN"]);
    const role = (session.user.role ?? "CONSUMER") as Parameters<typeof createLegacyDrawing>[2];
    const formData = await request.formData();
    const file = formData.get("file");
    const parsedBody = legacyDrawingInputSchema.safeParse({
      drawingNumber: formData.get("drawingNumber"),
      drawingName: formData.get("drawingName"),
      sacCode: formData.get("sacCode"),
      area: formData.get("area"),
      discipline: formData.get("discipline"),
      description: formData.get("description") ?? "",
      revisionNo: formData.get("revisionNo"),
      drawnByUserId: formData.get("drawnByUserId"),
      legacyReadyNote: formData.get("legacyReadyNote"),
      fileName: file instanceof File ? file.name : formData.get("fileName")
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
        createWatermarkedCopy: false
      });

      const data = await createLegacyDrawing(
        {
          ...body,
          drawingId,
          revisionId,
          fileName: storedFile.fileName,
          fileOriginalPath: storedFile.fileOriginalPath
        },
        session.user.id,
        role
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
