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
    subject: "Akun Disetujui — Drawing Filing & Approval System",
    html: renderEmailLayout({
      preheader: "Akun Anda telah disetujui dan siap digunakan untuk mengakses workspace drawing.",
      title: "Akun Anda telah disetujui",
      summary: `Halo ${input.name}, permintaan akses Anda telah disetujui oleh admin.`,
      intro:
        "Anda sekarang dapat masuk ke Drawing Filing & Approval System untuk mengelola filing, review, approval, dan distribusi drawing secara lebih tertib.",
      details: [
        { label: "Email", value: input.email },
        { label: "Username", value: input.username },
        { label: "Password awal", value: input.password }
      ],
      actionLabel: "Masuk ke Workspace",
      actionUrl: loginUrl,
      note:
        "Demi keamanan, segera ganti password Anda setelah login pertama kali jika masih menggunakan password awal yang diberikan admin.",
      footer:
        "Email ini dikirim otomatis setelah approval akun oleh admin internal. Jika Anda merasa tidak pernah mengajukan akses, abaikan email ini dan hubungi admin terkait."
    })
  });
}
