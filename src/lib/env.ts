import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .default("mysql://root:password@127.0.0.1:3306/drawing_management"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(1)
    .default("k8Qp2mZ4xR7vT1nY5cL9sD3fH6jK0wB8uE2aG5pM7rX1tN4qV9yC6lS3dF8hJ2"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url().optional(),
  PASSWORD_RESET_FROM_EMAIL: z.string().optional(),
  PASSWORD_RESET_SMTP_HOST: z.string().optional(),
  PASSWORD_RESET_SMTP_PORT: z.coerce.number().optional(),
  PASSWORD_RESET_SMTP_USER: z.string().optional(),
  PASSWORD_RESET_SMTP_PASS: z.string().optional()
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  PASSWORD_RESET_FROM_EMAIL: process.env.PASSWORD_RESET_FROM_EMAIL,
  PASSWORD_RESET_SMTP_HOST: process.env.PASSWORD_RESET_SMTP_HOST,
  PASSWORD_RESET_SMTP_PORT: process.env.PASSWORD_RESET_SMTP_PORT,
  PASSWORD_RESET_SMTP_USER: process.env.PASSWORD_RESET_SMTP_USER,
  PASSWORD_RESET_SMTP_PASS: process.env.PASSWORD_RESET_SMTP_PASS
});
