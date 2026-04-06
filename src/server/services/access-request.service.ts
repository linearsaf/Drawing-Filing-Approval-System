import { and, count, desc, eq, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api";
import { createAuditLog } from "@/server/services/audit.service";
import { createUserAccount } from "@/server/services/admin.service";
import { sendAccountApprovedEmail } from "@/server/auth/account-approved-email";
import {
  markAccessRequestNotificationsReadForUser,
  notifyAdminsAccessRequestPending
} from "@/server/services/notification.service";

function makeDefaultPassword(name: string) {
  return `${name.trim().replace(/\s+/g, "")}123!`;
}

async function ensureAccessRequestAvailable(params: {
  email: string;
  username: string;
  excludeRequestId?: string;
}) {
  const normalizedEmail = params.email.trim().toLowerCase();
  const normalizedUsername = params.username.trim().toLowerCase();

  const existingUser = await db.query.user.findFirst({
    where: or(
      eq(schema.user.email, normalizedEmail),
      eq(schema.user.username, normalizedUsername)
    )
  });

  if (existingUser) {
    throw new HttpError(409, "Email atau username sudah digunakan oleh user yang terdaftar.");
  }

  const existingRequest = await db.query.userAccessRequests.findFirst({
    where: and(
      eq(schema.userAccessRequests.status, "PENDING"),
      or(
        eq(schema.userAccessRequests.email, normalizedEmail),
        eq(schema.userAccessRequests.username, normalizedUsername)
      ),
      params.excludeRequestId ? ne(schema.userAccessRequests.id, params.excludeRequestId) : undefined
    )
  });

  if (existingRequest) {
    throw new HttpError(409, "Pengajuan dengan email atau username yang sama masih menunggu evaluasi admin.");
  }
}

export async function createAccessRequest(input: {
  name: string;
  email: string;
  username: string;
  requestedRole: "ADMIN" | "DRAFTER" | "DRAFT_LEADER" | "APPROVER_L1" | "HEAD" | "CONSUMER";
}) {
  await ensureAccessRequestAvailable({
    email: input.email,
    username: input.username
  });

  const requestId = crypto.randomUUID();
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedUsername = input.username.trim().toLowerCase();
  const createdAt = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(schema.userAccessRequests).values({
      id: requestId,
      name: input.name.trim(),
      email: normalizedEmail,
      username: normalizedUsername,
      requestedRole: input.requestedRole,
      status: "PENDING",
      createdAt,
      updatedAt: createdAt
    });

    await createAuditLog(
      {
        entityType: "ACCESS_REQUEST",
        entityId: requestId,
        action: "REQUEST_CREATED",
        note: "Permintaan akses baru dikirim oleh calon user."
      },
      tx
    );

    await notifyAdminsAccessRequestPending(
      {
        requestId,
        name: input.name.trim(),
        email: normalizedEmail,
        createdAt
      },
      tx
    );
  });

  return { requestId };
}

export async function listAccessRequests(params?: {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  page?: number;
  pageSize?: number;
}) {
  const where = params?.status ? eq(schema.userAccessRequests.status, params.status) : undefined;
  const pageSize = Math.max(1, params?.pageSize ?? 6);
  const requestedPage = Math.max(1, params?.page ?? 1);

  const [{ filteredTotal }] = await db
    .select({ filteredTotal: count() })
    .from(schema.userAccessRequests)
    .where(where);

  const [{ pendingCount }] = await db
    .select({ pendingCount: count() })
    .from(schema.userAccessRequests)
    .where(eq(schema.userAccessRequests.status, "PENDING"));

  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const items = await db
    .select()
    .from(schema.userAccessRequests)
    .where(where)
    .orderBy(desc(schema.userAccessRequests.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    items,
    total: filteredTotal,
    page,
    pageSize,
    totalPages,
    stats: {
      pendingCount
    }
  };
}

export async function updateAccessRequest(
  requestId: string,
  input: {
    name?: string;
    email?: string;
    username?: string;
    requestedRole?: "ADMIN" | "DRAFTER" | "DRAFT_LEADER" | "APPROVER_L1" | "HEAD" | "CONSUMER";
    adminReviewNote?: string;
  },
  actorUserId: string
) {
  const existing = await db.query.userAccessRequests.findFirst({
    where: eq(schema.userAccessRequests.id, requestId)
  });

  if (!existing) {
    throw new HttpError(404, "Permintaan akses tidak ditemukan.");
  }

  if (existing.status !== "PENDING") {
    throw new HttpError(409, "Hanya permintaan dengan status pending yang dapat diubah.");
  }

  const nextEmail = (input.email ?? existing.email).trim().toLowerCase();
  const nextUsername = (input.username ?? existing.username).trim().toLowerCase();

  await ensureAccessRequestAvailable({
    email: nextEmail,
    username: nextUsername,
    excludeRequestId: requestId
  });

  await db
    .update(schema.userAccessRequests)
    .set({
      name: input.name?.trim() ?? existing.name,
      email: nextEmail,
      username: nextUsername,
      requestedRole: input.requestedRole ?? existing.requestedRole,
      adminReviewNote: input.adminReviewNote ?? existing.adminReviewNote,
      updatedAt: new Date()
    })
    .where(eq(schema.userAccessRequests.id, requestId));

  await createAuditLog({
    entityType: "ACCESS_REQUEST",
    entityId: requestId,
    action: "REQUEST_UPDATED",
    userId: actorUserId,
    note: "Data permintaan akses diperbarui oleh admin."
  });

  return db.query.userAccessRequests.findFirst({
    where: eq(schema.userAccessRequests.id, requestId)
  });
}

export async function approveAccessRequest(
  requestId: string,
  input: {
    name: string;
    email: string;
    username: string;
    requestedRole: "ADMIN" | "DRAFTER" | "DRAFT_LEADER" | "APPROVER_L1" | "HEAD" | "CONSUMER";
    adminReviewNote?: string;
  },
  actorUserId: string
) {
  const existing = await db.query.userAccessRequests.findFirst({
    where: eq(schema.userAccessRequests.id, requestId)
  });

  if (!existing) {
    throw new HttpError(404, "Permintaan akses tidak ditemukan.");
  }

  if (existing.status !== "PENDING") {
    throw new HttpError(409, "Permintaan akses ini sudah diproses.");
  }

  const nextEmail = input.email.trim().toLowerCase();
  const nextUsername = input.username.trim().toLowerCase();
  const nextName = input.name.trim();

  await ensureAccessRequestAvailable({
    email: nextEmail,
    username: nextUsername,
    excludeRequestId: requestId
  });

  const password = makeDefaultPassword(nextName);

  const result = await createUserAccount(
    {
      name: nextName,
      email: nextEmail,
      username: nextUsername,
      password,
      role: input.requestedRole,
      isActive: true
    },
    actorUserId
  );

  const approvedUserId = result?.user?.id;

  if (!approvedUserId) {
    throw new HttpError(500, "Akun user gagal dibuat saat approve permintaan.");
  }

  await db
    .update(schema.userAccessRequests)
    .set({
      name: nextName,
      email: nextEmail,
      username: nextUsername,
      requestedRole: input.requestedRole,
      adminReviewNote: input.adminReviewNote ?? existing.adminReviewNote,
      status: "APPROVED",
      approvedUserId,
      reviewedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(schema.userAccessRequests.id, requestId));

  await createAuditLog({
    entityType: "ACCESS_REQUEST",
    entityId: requestId,
    action: "REQUEST_APPROVED",
    userId: actorUserId,
    note: "Permintaan akses disetujui dan akun user dibuat."
  });

  await markAccessRequestNotificationsReadForUser({
    recipientUserId: actorUserId,
    requestId
  });

  await sendAccountApprovedEmail({
    email: nextEmail,
    name: nextName,
    username: nextUsername,
    password
  });

  return {
    requestId,
    approvedUserId,
    password
  };
}

export async function rejectAccessRequest(
  requestId: string,
  input: {
    name: string;
    email: string;
    username: string;
    requestedRole: "ADMIN" | "DRAFTER" | "DRAFT_LEADER" | "APPROVER_L1" | "HEAD" | "CONSUMER";
    adminReviewNote?: string;
  },
  actorUserId: string
) {
  const existing = await db.query.userAccessRequests.findFirst({
    where: eq(schema.userAccessRequests.id, requestId)
  });

  if (!existing) {
    throw new HttpError(404, "Permintaan akses tidak ditemukan.");
  }

  if (existing.status !== "PENDING") {
    throw new HttpError(409, "Permintaan akses ini sudah diproses.");
  }

  const nextEmail = input.email.trim().toLowerCase();
  const nextUsername = input.username.trim().toLowerCase();

  await db
    .update(schema.userAccessRequests)
    .set({
      name: input.name.trim(),
      email: nextEmail,
      username: nextUsername,
      requestedRole: input.requestedRole,
      adminReviewNote: input.adminReviewNote ?? existing.adminReviewNote,
      status: "REJECTED",
      reviewedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(schema.userAccessRequests.id, requestId));

  await createAuditLog({
    entityType: "ACCESS_REQUEST",
    entityId: requestId,
    action: "REQUEST_REJECTED",
    userId: actorUserId,
    note: "Permintaan akses ditolak oleh admin."
  });

  await markAccessRequestNotificationsReadForUser({
    recipientUserId: actorUserId,
    requestId
  });

  return db.query.userAccessRequests.findFirst({
    where: eq(schema.userAccessRequests.id, requestId)
  });
}
