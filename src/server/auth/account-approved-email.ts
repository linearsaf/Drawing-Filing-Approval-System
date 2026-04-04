import { env } from "@/lib/env";
import { saveAccountApprovedPreview } from "@/server/auth/account-approved-preview";

interface AccountApprovedEmailInput {
  email: string;
  name: string;
  username: string;
  password: string;
}

export async function sendAccountApprovedEmail(input: AccountApprovedEmailInput) {
  saveAccountApprovedPreview({
    email: input.email,
    username: input.username,
    password: input.password,
    createdAt: Date.now()
  });

  console.info(`[account-approved] ${input.email}: username=${input.username}, password=${input.password}`);

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
    subject: "Akun Drawing Management Disetujui",
    html: `
      <p>Halo ${input.name},</p>
      <p>Permintaan akun Anda telah disetujui oleh admin.</p>
      <p>Anda sekarang dapat login ke Drawing Management System dengan kredensial berikut:</p>
      <ul>
        <li>Email: ${input.email}</li>
        <li>Username: ${input.username}</li>
        <li>Password default: ${input.password}</li>
      </ul>
      <p>Segera ubah password Anda setelah login pertama kali jika password masih menggunakan nilai default.</p>
    `
  });
}
