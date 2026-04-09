import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { AppRole } from "@/lib/server/auth";

export async function listDrafterUsers() {
  return db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      username: schema.user.username
    })
    .from(schema.user)
    .where(
      and(
        inArray(schema.user.role, ["DRAFTER", "DRAFT_LEADER", "ADMIN"]),
        eq(schema.user.isActive, true)
      )
    )
    .orderBy(asc(schema.user.name));
}

export async function listAssignableDrafterUsers() {
  return db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      username: schema.user.username
    })
    .from(schema.user)
    .where(and(eq(schema.user.role, "DRAFTER"), eq(schema.user.isActive, true)))
    .orderBy(asc(schema.user.name));
}

export async function listApproverUsers(level: 1 | 2) {
  const allowedRoles =
    level === 1
      ? (["APPROVER_L1", "ADMIN"] as const)
      : (["HEAD", "ADMIN"] as const);

  return db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      username: schema.user.username,
      role: schema.user.role
    })
    .from(schema.user)
    .where(and(inArray(schema.user.role, allowedRoles), eq(schema.user.isActive, true)))
    .orderBy(asc(schema.user.name));
}

export async function listLegacyDrawnByUsers(currentUserId: string, currentUserRole: AppRole) {
  const items = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      username: schema.user.username,
      role: schema.user.role
    })
    .from(schema.user)
    .where(eq(schema.user.isActive, true))
    .orderBy(asc(schema.user.name));

  const allowedRoles = new Set(["DRAFTER"]);
  const includeCurrentUser =
    currentUserRole === "DRAFT_LEADER" || currentUserRole === "ADMIN";

  return items.filter((item) => {
    if (allowedRoles.has(item.role)) {
      return true;
    }

    return includeCurrentUser && item.id === currentUserId;
  });
}
