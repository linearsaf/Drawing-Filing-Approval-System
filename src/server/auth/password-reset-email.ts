import { env } from "@/lib/env";
import { savePasswordResetPreview } from "@/server/auth/password-reset-preview";
import { renderEmailLayout } from "@/server/auth/email-template";

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

  await transporter.sendMail({
    from: env.SMTP_FROM_EMAIL,
    to: input.email,
    subject: "Reset Password — Drawing Filing & Approval System",
    html: renderEmailLayout({
      preheader: "Gunakan tautan ini untuk membuat password baru akun Anda.",
      title: "Reset password akun",
      summary: "Kami menerima permintaan untuk mengatur ulang password akun Anda.",
      intro:
        "Jika Anda memang meminta reset password, lanjutkan proses melalui tombol di bawah ini. Tautan ini bersifat sementara dan hanya berlaku untuk satu proses penggantian password.",
      actionLabel: "Buat Password Baru",
      actionUrl: input.url,
      note:
        "Jika Anda tidak merasa melakukan permintaan reset password, Anda dapat mengabaikan email ini. Password akun Anda tidak akan berubah sebelum tautan digunakan.",
      footer:
        "Email ini dikirim otomatis oleh sistem sebagai bagian dari proses pemulihan akses akun. Simpan kredensial baru Anda secara aman setelah reset selesai."
    })
  });
}
