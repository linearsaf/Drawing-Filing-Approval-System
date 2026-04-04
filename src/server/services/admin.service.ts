import { and, asc, count, eq, like, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { HttpError } from "@/lib/server/api";
import { createAuditLog } from "@/server/services/audit.service";

export async function listUsers(params?: {
  search?: string;
  role?: "ALL" | "ADMIN" | "DRAFTER" | "DRAFT_LEADER" | "APPROVER_L1" | "HEAD" | "CONSUMER";
  status?: "ALL" | "ACTIVE" | "INACTIVE";
  page?: number;
  pageSize?: number;
}) {
  const where = and(
    params?.role && params.role !== "ALL" ? eq(schema.user.role, params.role) : undefined,
    params?.status === "ACTIVE"
      ? eq(schema.user.isActive, true)
      : params?.status === "INACTIVE"
        ? eq(schema.user.isActive, false)
        : undefined,
    params?.search
      ? or(
          like(schema.user.name, `%${params.search}%`),
          like(schema.user.email, `%${params.search}%`),
          like(schema.user.username, `%${params.search}%`),
          like(schema.user.role, `%${params.search}%`)
        )
      : undefined
  );

  const pageSize = Math.max(1, params?.pageSize ?? 6);
  const requestedPage = Math.max(1, params?.page ?? 1);

  const [{ filteredTotal }] = await db
    .select({ filteredTotal: count() })
    .from(schema.user)
    .where(where);

  const [{ totalUsers }] = await db.select({ totalUsers: count() }).from(schema.user);
  const [{ activeUsers }] = await db
    .select({ activeUsers: count() })
    .from(schema.user)
    .where(eq(schema.user.isActive, true));

  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const items = await db
    .select()
    .from(schema.user)
    .where(where)
    .orderBy(asc(schema.user.name))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    items,
    total: filteredTotal,
    page,
    pageSize,
    totalPages,
    stats: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers
    }
  };
}

export async function createUserAccount(input: {
  name: string;
  email: string;
  username: string;
  password: string;
  role: "ADMIN" | "DRAFTER" | "DRAFT_LEADER" | "APPROVER_L1" | "HEAD" | "CONSUMER";
  isActive: boolean;
}, actorUserId?: string) {
  const result = await auth.api.signUpEmail({
    headers: new Headers({
      origin: env.BETTER_AUTH_URL
    }),
    body: {
      name: input.name,
      email: input.email,
      password: input.password,
      username: input.username,
      displayUsername: input.username,
      role: input.role,
      isActive: input.isActive
    }
  });

  if (result?.user?.id) {
    await createAuditLog({
      entityType: "USER",
      entityId: result.user.id,
      action: "USER_CREATED",
      userId: actorUserId ?? null,
      note: "User baru dibuat."
    });
  }

  return result;
}

export async function updateUserAccount(
  id: string,
  input: {
    name?: string;
    email?: string;
    username?: string;
    role?: "ADMIN" | "DRAFTER" | "DRAFT_LEADER" | "APPROVER_L1" | "HEAD" | "CONSUMER";
    isActive?: boolean;
  },
  actorUserId: string
) {
  const existing = await db.query.user.findFirst({
    where: eq(schema.user.id, id)
  });

  if (!existing) {
    throw new HttpError(404, "User tidak ditemukan.");
  }

  await db
    .update(schema.user)
    .set({
      name: input.name ?? existing.name,
      email: input.email ?? existing.email,
      username: input.username ?? existing.username,
      displayUsername: input.username ?? existing.displayUsername,
      role: input.role ?? existing.role,
      isActive: input.isActive ?? existing.isActive,
      updatedAt: new Date()
    })
    .where(eq(schema.user.id, id));

  await createAuditLog({
    entityType: "USER",
    entityId: id,
    action: "USER_UPDATED",
    userId: actorUserId,
    note: "Data user diperbarui."
  });

  return db.query.user.findFirst({
    where: eq(schema.user.id, id)
  });
}

export async function setUserPasswordByAdmin(
  id: string,
  input: {
    newPassword: string;
    confirmPassword: string;
    revokeSessions: boolean;
  },
  actorUserId: string
) {
  const existing = await db.query.user.findFirst({
    where: eq(schema.user.id, id)
  });

  if (!existing) {
    throw new HttpError(404, "User tidak ditemukan.");
  }

  const context = await auth.$context;
  const minPasswordLength = context.password.config.minPasswordLength;
  const maxPasswordLength = context.password.config.maxPasswordLength;

  if (input.newPassword.length < minPasswordLength) {
    throw new HttpError(422, `Password minimal ${minPasswordLength} karakter.`);
  }

  if (input.newPassword.length > maxPasswordLength) {
    throw new HttpError(422, `Password maksimal ${maxPasswordLength} karakter.`);
  }

  const passwordHash = await context.password.hash(input.newPassword);
  await context.internalAdapter.updatePassword(id, passwordHash);

  if (input.revokeSessions) {
    await context.internalAdapter.deleteSessions(id);
  }

  await createAuditLog({
    entityType: "USER",
    entityId: id,
    action: "USER_PASSWORD_UPDATED",
    userId: actorUserId,
    note: input.revokeSessions
      ? "Password user diubah admin dan seluruh sesi user diakhiri."
      : "Password user diubah admin."
  });

  return { success: true };
}
