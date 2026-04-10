import { apiError, apiSuccess } from "@/lib/server/api";
import { requireRole, requireSession } from "@/lib/server/auth";
import { drawingUpdateSchema } from "@/lib/validations/api";
import { deleteDrawing, getDrawingDetail, updateDrawing } from "@/server/services/drawing.service";
import { saveDrawingPdfFile } from "@/server/storage/drawing-files";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const role = (session.user.role ?? "CONSUMER") as Parameters<typeof getDrawingDetail>[1];
    const data = await getDrawingDetail(id, role, session.user.id);

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file");
    const body = drawingUpdateSchema.parse({
      drawingNumber: formData.get("drawingNumber") || undefined,
      drawingName: formData.get("drawingName") || undefined,
      sacCode: formData.get("sacCode") || undefined,
      area: formData.get("area") || undefined,
      discipline: formData.get("discipline") || undefined,
      description: formData.get("description") || undefined,
      revisionNo: formData.get("revisionNo") || undefined,
      fileName:
        file instanceof File
          ? file.name
          : (formData.get("fileName") as string | null) || undefined,
      changeNote: formData.get("changeNote") || undefined,
      submit: formData.get("submit") === "true"
    });
    const storedFile =
      file instanceof File
        ? await saveDrawingPdfFile({
            drawingId: id,
            revisionNo: body.revisionNo ?? "0",
            file,
            createWatermarkedCopy: body.submit
          })
        : null;
    const role = (session.user.role ?? "CONSUMER") as Parameters<typeof updateDrawing>[3];
    const data = await updateDrawing(
      id,
      {
        ...body,
        fileName: storedFile?.fileName ?? body.fileName,
        fileOriginalPath: storedFile?.fileOriginalPath,
        fileWatermarkedPath: storedFile?.fileWatermarkedPath
      },
      session.user.id,
      role
    );

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(request, ["ADMIN"]);
    const { id } = await params;
    const role = (session.user.role ?? "CONSUMER") as Parameters<typeof deleteDrawing>[2];
    const data = await deleteDrawing(id, session.user.id, role);

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}
