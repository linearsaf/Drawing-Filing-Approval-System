import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";

loadEnvConfig(process.cwd());

const defaultPasswords: Record<string, string> = {
  "admin@drawing.local": "Admin123!",
  "drafter@drawing.local": "Drafter123!",
  "lead@drawing.local": "Lead12345!",
  "approver@drawing.local": "Approve123!",
  "head@drawing.local": "Head12345!",
  "consumer@drawing.local": "Viewer123!"
};

interface SeedDeps {
  auth: Awaited<typeof import("../src/lib/auth")>["auth"];
  pool: Awaited<typeof import("../src/lib/db")>["pool"];
  db: Awaited<typeof import("../src/lib/db")>["db"];
  schema: Awaited<typeof import("../src/lib/db/schema")>["schema"];
  createSeedDatabase: Awaited<typeof import("../src/lib/data/seed")>["createSeedDatabase"];
  env: Awaited<typeof import("../src/lib/env")>["env"];
}

async function resetDatabase({ db, schema }: SeedDeps) {
  await db.delete(schema.downloadLogs);
  await db.delete(schema.revisionApprovalSteps);
  await db.delete(schema.approvalActions);
  await db.delete(schema.auditLogs);
  await db.delete(schema.drawingRevisions);
  await db.delete(schema.drawings);
  await db.delete(schema.session);
  await db.delete(schema.account);
  await db.delete(schema.verification);
  await db.delete(schema.user);
}

async function seedUsers(
  { auth, db, env, schema, createSeedDatabase }: SeedDeps,
  seed = createSeedDatabase()
) {
  const userIdMap: Record<string, string> = {};

  for (const item of seed.users) {
    const result = await auth.api.signUpEmail({
      headers: new Headers({
        origin: env.BETTER_AUTH_URL
      }),
      body: {
        name: item.name,
        email: item.email,
        password: defaultPasswords[item.email] ?? "Password123!",
        username: item.username,
        displayUsername: item.username,
        role: item.role,
        isActive: item.isActive
      }
    });

    if (!result?.user?.id) {
      throw new Error(`Gagal membuat user seed untuk ${item.email}.`);
    }

    userIdMap[item.id] = result.user.id;

    await db
      .update(schema.user)
      .set({
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      })
      .where(eq(schema.user.id, result.user.id));
  }

  return userIdMap;
}

async function seedBusinessData(
  { db, schema, createSeedDatabase }: SeedDeps,
  userIdMap: Record<string, string>,
  seed = createSeedDatabase()
) {
  await db.insert(schema.drawings).values(
    seed.drawings.map((item) => ({
      id: item.id,
      drawingNumber: item.drawingNumber,
      drawingName: item.drawingName,
      sacCode: item.sacCode,
      area: item.area,
      discipline: item.discipline,
      description: item.description,
      createdBy: userIdMap[item.createdBy],
      drawnByUserId: userIdMap[item.drawnByUserId],
      workflowSource: item.workflowSource,
      legacyReadyNote: item.legacyReadyNote,
      currentRevisionId: item.currentRevisionId,
      currentStatus: item.currentStatus,
      latestCompletedRevisionId: item.latestCompletedRevisionId,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }))
  );

  await db.insert(schema.drawingRevisions).values(
    seed.revisions.map((item) => ({
      id: item.id,
      drawingId: item.drawingId,
      revisionNo: item.revisionNo,
      fileName: item.fileName,
      fileOriginalPath: item.fileOriginalPath,
      fileWatermarkedPath: item.fileWatermarkedPath,
      status: item.status,
      changeNote: item.changeNote,
      submittedBy: item.submittedBy ? userIdMap[item.submittedBy] : null,
      submittedAt: item.submittedAt ? new Date(item.submittedAt) : null,
      isLatest: item.isLatest,
      isCompleted: item.isCompleted,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }))
  );

  await db.insert(schema.approvalActions).values(
    seed.approvalActions.map((item) => ({
      id: item.id,
      revisionId: item.revisionId,
      approvalLevel: item.approvalLevel,
      actorId: userIdMap[item.actorId],
      actorRole: item.actorRole,
      decision: item.decision,
      decisionNote: item.decisionNote,
      actedAt: new Date(item.actedAt),
      createdAt: new Date(item.createdAt)
    }))
  );

  await db.insert(schema.revisionApprovalSteps).values(
    seed.revisionApprovalSteps.map((item) => ({
      id: item.id ?? crypto.randomUUID(),
      revisionId: item.revisionId,
      approvalLevel: item.approvalLevel,
      assignedUserId: item.assignedUserId ? userIdMap[item.assignedUserId] : null,
      assignedByUserId: item.assignedByUserId ? userIdMap[item.assignedByUserId] : null,
      assignedAt: item.assignedAt ? new Date(item.assignedAt) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date()
    }))
  );

  await db.insert(schema.auditLogs).values(
    seed.auditLogs.map((item) => ({
      id: item.id,
      entityType: item.entityType,
      entityId: item.entityId,
      action: item.action,
      userId: item.userId ? userIdMap[item.userId] : null,
      note: item.note,
      metadataJson: item.metadata,
      createdAt: new Date(item.createdAt)
    }))
  );

  await db.insert(schema.downloadLogs).values({
    id: crypto.randomUUID(),
    revisionId: "rev-004-b",
    userId: userIdMap["user-consumer"],
    downloadedAt: new Date("2026-04-02T12:00:00.000Z"),
    source: "APP"
  });
}

async function main() {
  const [{ auth }, { pool, db }, { schema }, { createSeedDatabase }, { env }] = await Promise.all([
    import("../src/lib/auth"),
    import("../src/lib/db"),
    import("../src/lib/db/schema"),
    import("../src/lib/data/seed"),
    import("../src/lib/env")
  ]);

  const deps: SeedDeps = {
    auth,
    pool,
    db,
    schema,
    createSeedDatabase,
    env
  };

  try {
    const seed = createSeedDatabase();

    await resetDatabase(deps);
    const userIdMap = await seedUsers(deps, seed);
    await seedBusinessData(deps, userIdMap, seed);

    console.log("Database seed selesai.");
    console.log("Akun awal:");

    for (const user of seed.users) {
      console.log(
        `- ${user.role}: ${user.email} / ${defaultPasswords[user.email] ?? "Password123!"}`
      );
    }
  } catch (error) {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
