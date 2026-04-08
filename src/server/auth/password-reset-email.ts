import { env } from "@/lib/env";
import { appBrand } from "@/lib/config/brand";
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
    subject: `Permintaan Reset Password Akun Anda - ${appBrand.name}`,
    html: renderEmailLayout({
      preheader: "Gunakan tautan ini untuk mengatur password baru akun Anda.",
      title: "Bantuan untuk reset password",
      summary: "Kami menerima permintaan untuk mengatur ulang password akun Anda.",
      intro:
        "Jika Anda memang mengajukan permintaan ini, silakan lanjutkan melalui tombol di bawah. Tautan ini hanya berlaku sementara dan dapat digunakan satu kali untuk membantu Anda membuat password baru dengan aman.",
      actionLabel: "Atur Password Baru",
      actionUrl: input.url,
      note:
        "Jika Anda merasa tidak melakukan permintaan ini, Anda tidak perlu khawatir. Abaikan saja email ini, dan password akun Anda tidak akan berubah sampai tautan tersebut digunakan.",
      footer:
        "Email ini dikirim otomatis untuk membantu proses pemulihan akses akun Anda. Setelah selesai, mohon simpan password baru Anda dengan baik demi keamanan akun."
    })
  });
}
