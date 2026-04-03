import type { Config } from "drizzle-kit";

export default {
  dialect: "mysql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "mysql://root:password@127.0.0.1:3306/drawing_management"
  }
} satisfies Config;
