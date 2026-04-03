import { drizzle } from "drizzle-orm/mysql2";
import { createPool, Pool } from "mysql2/promise";
import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

declare global {
  // eslint-disable-next-line no-var
  var __drawingManagementPool__: Pool | undefined;
}

function getPool() {
  if (!globalThis.__drawingManagementPool__) {
    globalThis.__drawingManagementPool__ = createPool(env.DATABASE_URL);
  }

  return globalThis.__drawingManagementPool__;
}

export const pool = getPool();
export const db = drizzle(pool, { schema, mode: "default" });

