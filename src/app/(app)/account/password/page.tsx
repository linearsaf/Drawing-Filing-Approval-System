"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/api-client";

export default function AccountPasswordPage() {
  const { refetchSession } = useDemoApp();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    revokeOtherSessions: false
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("Lengkapi password saat ini, password baru, dan konfirmasi password.");
      setSuccess("");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Konfirmasi password baru tidak cocok.");
      setSuccess("");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const result = await authClient.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        revokeOtherSessions: form.revokeOtherSessions
      });

      if (result.error) {
        setError(result.error.message ?? "Password gagal diperbarui.");
        return;
      }

      await refetchSession();
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        revokeOtherSessions: false
      });
      setSuccess("Password berhasil diperbarui.");
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Password gagal diperbarui."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Akun"
          title="Ubah Password"
          description="Perbarui password akun untuk menjaga keamanan akses sistem."
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Form Password</p>
            <div className="mt-5 space-y-4">
              <Field label="Password Saat Ini">
                <Input
                  autoComplete="current-password"
                  onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
                  type="password"
                  value={form.currentPassword}
                />
              </Field>
              <Field label="Password Baru">
                <Input
                  autoComplete="new-password"
                  onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
                  type="password"
                  value={form.newPassword}
                />
              </Field>
              <Field label="Konfirmasi Password Baru">
                <Input
                  autoComplete="new-password"
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                  type="password"
                  value={form.confirmPassword}
                />
              </Field>

              <label className="flex items-start gap-3 rounded-2xl border border-border bg-panel/35 px-4 py-3">
                <input
                  checked={form.revokeOtherSessions}
                  className="mt-1 h-4 w-4 rounded border-border text-brand accent-brand"
                  onChange={(event) =>
                    setForm({ ...form, revokeOtherSessions: event.target.checked })
                  }
                  type="checkbox"
                />
                <div>
                  <p className="text-sm font-semibold text-text">Akhiri sesi lain</p>
                  <p className="text-xs leading-5 text-muted">
                    Gunakan opsi ini untuk memaksa perangkat lain login kembali.
                  </p>
                </div>
              </label>
            </div>

            {error ? <p className="mt-5 text-sm font-medium text-danger">{error}</p> : null}
            {success ? <p className="mt-5 text-sm font-medium text-brand">{success}</p> : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button disabled={isSubmitting} onClick={() => void handleSubmit()}>
                {isSubmitting ? "Menyimpan..." : "Perbarui Password"}
              </Button>
            </div>
          </Card>

          <Card className="bg-graphite text-white">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/60">Keamanan</p>
            <h2 className="mt-3 text-2xl font-semibold">Gunakan password yang kuat</h2>
            <div className="mt-5 space-y-3 text-sm leading-6 text-white/75">
              <p>
                Gunakan minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan
                simbol.
              </p>
              <p>
                Hindari memakai password yang sama dengan akun lain atau informasi yang mudah
                ditebak.
              </p>
              <p>
                Setelah perubahan penting, akhiri sesi lain bila akun pernah dipakai di perangkat
                bersama.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-text">{label}</span>
      {children}
    </label>
  );
}
