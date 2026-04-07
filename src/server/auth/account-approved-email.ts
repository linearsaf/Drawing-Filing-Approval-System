import { env } from "@/lib/env";
import { saveAccountApprovedPreview } from "@/server/auth/account-approved-preview";
import { renderEmailLayout } from "@/server/auth/email-template";

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
    !env.SMTP_HOST ||
    !env.SMTP_PORT ||
    !env.SMTP_USER ||
    !env.SMTP_PASS ||
    !env.SMTP_FROM_EMAIL
  ) {
    return;
  }

  const { createTransport } = await import("nodemailer");

  const transporter = createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  const loginUrl = `${env.BETTER_AUTH_URL.replace(/\/$/, "")}/login`;

  await transporter.sendMail({
    from: env.SMTP_FROM_EMAIL,
    to: input.email,
    subject: "Akun Anda Sudah Aktif - Datum Signet",
    html: renderEmailLayout({
      preheader: "Akses Anda sudah aktif dan siap digunakan.",
      title: "Selamat datang di Datum Signet",
      summary: `Halo ${input.name}, akses untuk akun Anda sudah tersedia.`,
      intro:
        "Anda sekarang sudah dapat masuk ke Datum Signet untuk mulai mengelola proses filing, review, approval, dan distribusi drawing dengan lebih rapi, mudah dilacak, dan nyaman digunakan.",
      details: [
        { label: "Email", value: input.email },
        { label: "Username", value: input.username },
        { label: "Password Sementara", value: input.password }
      ],
      actionLabel: "Masuk ke Sistem",
      actionUrl: loginUrl,
      note:
        "Agar akun Anda tetap aman, kami sarankan untuk segera mengganti password setelah login pertama, terutama jika Anda masih menggunakan password sementara yang diberikan.",
      footer:
        "Email ini dikirim otomatis saat akses akun Anda telah tersedia. Jika Anda merasa tidak pernah mengajukan akses, silakan abaikan email ini atau hubungi pihak terkait."
    })
  });
}
