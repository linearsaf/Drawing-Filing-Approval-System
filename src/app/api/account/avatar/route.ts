import { apiError, apiSuccess } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { removeAccountAvatar, updateAccountAvatar } from "@/server/services/account.service";
import {
  removeAccountAvatarFiles,
  saveAccountAvatar
} from "@/server/storage/account-avatar-files";

export async function POST(request: Request) {
  let savedUserId: string | null = null;

  try {
    const session = await requireSession(request);
    const formData = await request.formData();
    const file = formData.get("avatar");

    const storedFile = await saveAccountAvatar({
      userId: session.user.id,
      file: file instanceof File ? file : null
    });
    savedUserId = session.user.id;

    const profile = await updateAccountAvatar(session.user.id, storedFile.filePath);
    return apiSuccess(profile);
  } catch (error) {
    if (savedUserId) {
      await removeAccountAvatarFiles(savedUserId).catch(() => undefined);
    }
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession(request);
    await removeAccountAvatarFiles(session.user.id);
    const profile = await removeAccountAvatar(session.user.id);

    return apiSuccess(profile);
  } catch (error) {
    return apiError(error);
  }
}
