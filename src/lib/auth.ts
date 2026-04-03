import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { sendPasswordResetEmail } from "@/server/auth/password-reset-email";

export const auth = betterAuth({
  appName: "Drawing Management System",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema
  }),
  trustedOrigins: [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_BETTER_AUTH_URL].filter(
    (origin): origin is string => Boolean(origin)
  ),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url, token }) => {
      await sendPasswordResetEmail({
        email: user.email,
        url,
        token
      });
    }
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "CONSUMER",
        returned: true
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        returned: true
      }
    }
  },
  plugins: [
    nextCookies(),
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30
    })
  ],
  databaseHooks: {
    session: {
      create: {
        before: async (sessionRecord) => {
          const rows = await db
            .select({ isActive: schema.user.isActive })
            .from(schema.user)
            .where(eq(schema.user.id, sessionRecord.userId))
            .limit(1);

          if (rows[0] && !rows[0].isActive) {
            return false;
          }

          return undefined;
        }
      }
    }
  }
});
