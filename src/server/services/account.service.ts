import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api";
import { createAuditLog } from "@/server/services/audit.service";

export async function getAccountProfile(userId: string) {
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, userId)
  });

  if (!user) {
    throw new HttpError(404, "Akun tidak ditemukan.");
  }

  return user;
}

export async function updateAccountProfile(
  userId: string,
  input: {
    email?: string;
  }
) {
  const user = await getAccountProfile(userId);
  const nextEmail = input.email?.trim();

  if (!nextEmail || nextEmail === user.email) {
    return user;
  }

  const existing = await db.query.user.findFirst({
    where: eq(schema.user.email, nextEmail)
  });

  if (existing && existing.id !== userId) {
    throw new HttpError(409, "Email sudah digunakan akun lain.");
  }

  await db
    .update(schema.user)
    .set({
      email: nextEmail,
      updatedAt: new Date()
    })
    .where(eq(schema.user.id, userId));

  await createAuditLog({
    entityType: "USER",
    entityId: userId,
    action: "USER_EMAIL_UPDATED",
    userId,
    note: "Email akun diperbarui sendiri oleh user."
  });

  await createAuditLog({
    entityType: "USER",
    entityId: userId,
    action: "USER_PROFILE_UPDATED",
    userId,
    note: "Profil akun diperbarui sendiri oleh user."
  });

  return getAccountProfile(userId);
}

export async function updateAccountAvatar(userId: string, imagePath: string) {
  await db
    .update(schema.user)
    .set({
      image: imagePath,
      updatedAt: new Date()
    })
    .where(eq(schema.user.id, userId));

  await createAuditLog({
    entityType: "USER",
    entityId: userId,
    action: "USER_AVATAR_UPDATED",
    userId,
    note: "Avatar akun diperbarui sendiri oleh user.",
    metadata: {
      imagePath
    }
  });

  await createAuditLog({
    entityType: "USER",
    entityId: userId,
    action: "USER_PROFILE_UPDATED",
    userId,
    note: "Profil akun diperbarui sendiri oleh user."
  });

  return getAccountProfile(userId);
}

export async function removeAccountAvatar(userId: string) {
  await db
    .update(schema.user)
    .set({
      image: null,
      updatedAt: new Date()
    })
    .where(eq(schema.user.id, userId));

  await createAuditLog({
    entityType: "USER",
    entityId: userId,
    action: "USER_AVATAR_UPDATED",
    userId,
    note: "Avatar akun dihapus sendiri oleh user."
  });

  await createAuditLog({
    entityType: "USER",
    entityId: userId,
    action: "USER_PROFILE_UPDATED",
    userId,
    note: "Profil akun diperbarui sendiri oleh user."
  });

  return getAccountProfile(userId);
}
