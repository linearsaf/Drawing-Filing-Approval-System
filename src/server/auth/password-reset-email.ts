import { env } from "@/lib/env";
import { savePasswordResetPreview } from "@/server/auth/password-reset-preview";

interface PasswordResetInput {
  email: string;
  url: string;
  token: string;
}

export async function sendPasswordResetEmail(input: PasswordResetInput) {
  savePasswordResetPreview({
    email: input.email,
    url: input.url,
    token: input.token,
    createdAt: Date.now()
  });

  console.info(`[password-reset] ${input.email}: ${input.url}`);

  if (
    !env.PASSWORD_RESET_SMTP_HOST ||
    !env.PASSWORD_RESET_SMTP_PORT ||
    !env.PASSWORD_RESET_SMTP_USER ||
    !env.PASSWORD_RESET_SMTP_PASS ||
    !env.PASSWORD_RESET_FROM_EMAIL
  ) {
    return;
  }

  const { createTransport } = await import("nodemailer");

  const transporter = createTransport({
    host: env.PASSWORD_RESET_SMTP_HOST,
    port: env.PASSWORD_RESET_SMTP_PORT,
    secure: env.PASSWORD_RESET_SMTP_PORT === 465,
    auth: {
      user: env.PASSWORD_RESET_SMTP_USER,
      pass: env.PASSWORD_RESET_SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: env.PASSWORD_RESET_FROM_EMAIL,
    to: input.email,
    subject: "Reset Password Drawing Management System",
    html: `
      <p>Permintaan reset password telah diterima.</p>
      <p>Klik tautan berikut untuk membuat password baru:</p>
      <p><a href="${input.url}">${input.url}</a></p>
      <p>Tautan ini hanya berlaku sementara.</p>
    `
  });
}
