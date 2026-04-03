import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userRoleValues, schema } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api";

export type AppRole = (typeof userRoleValues)[number];

export interface AppSession {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    username?: string | null;
    role?: string | null;
    isActive?: boolean | null;
  };
}

export async function getServerSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers
  });

  return session as AppSession | null;
}

export async function requireSession(request: Request) {
  const session = await getServerSession(request);

  if (!session) {
    throw new HttpError(401, "Sesi tidak ditemukan.");
  }

  if (!session.user.isActive) {
    throw new HttpError(403, "Akun tidak aktif.");
  }

  return session;
}

export async function requireRole(request: Request, roles: AppRole[]) {
  const session = await requireSession(request);
  const role = session.user.role as AppRole | undefined;

  if (!role || !roles.includes(role)) {
    throw new HttpError(403, "Anda tidak memiliki akses untuk aksi ini.");
  }

  return session;
}

export async function getUserById(userId: string) {
  const rows = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  return rows[0] ?? null;
}
