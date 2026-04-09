import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";

interface AuditInput {
  entityType: "DRAWING" | "REVISION" | "USER" | "ACCESS_REQUEST" | "DRAWING_REQUEST";
  entityId: string;
  action: string;
  userId?: string | null;
  note?: string;
  metadata?: Record<string, unknown>;
}

type AuditExecutor = Pick<typeof db, "insert">;

export async function createAuditLog(input: AuditInput, tx: AuditExecutor = db) {
  await tx.insert(schema.auditLogs).values({
    id: crypto.randomUUID(),
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    userId: input.userId ?? null,
    note: input.note ?? null,
    metadataJson: input.metadata ?? null
  });
}
