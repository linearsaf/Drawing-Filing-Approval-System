import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";

export async function listDrafterUsers() {
  return db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      username: schema.user.username
    })
    .from(schema.user)
    .where(eq(schema.user.role, "DRAFTER"))
    .orderBy(asc(schema.user.name));
}
