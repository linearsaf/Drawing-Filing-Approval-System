"use client";

import type { ReactNode } from "react";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch, getErrorMessage } from "@/lib/api-client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const invalidToken = searchParams.get("error") === "INVALID_TOKEN";
  const [requestEmail, setRequestEmail] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [requestError, setRequestError] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [resetForm, setResetForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const mode = useMemo(() => {
    if (token) {
      return "reset";
    }

    return "request";
  }, [token]);

  const handleRequestReset = async () => {
    if (!requestEmail.trim()) {
      setRequestError("Masukkan email akun Anda.");
      setRequestMessage("");
      setPreviewUrl(null);
      return;
    }

    setIsRequesting(true);
    setRequestError("");
    setRequestMessage("");
    setPreviewUrl(null);

    try {
      const response = await apiFetch<{ message: string; previewUrl: string | null }>(
        "/api/password/request-reset",
        {
          method: "POST",
          body: JSON.stringify({
            email: requestEmail.trim()
          })
        }
      );

      setRequestMessage(response.message);
      setPreviewUrl(response.previewUrl);
    } catch (error) {
      setRequestError(getErrorMessage(error, "Permintaan reset password gagal diproses."));
    } finally {
      setIsRequesting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token) {
      setResetError("Token reset password tidak ditemukan.");
      setResetMessage("");
      return;
    }

    setIsResetting(true);
    setResetError("");
    setResetMessage("");

    try {
      await apiFetch("/api/password/reset", {
        method: "POST",
        body: JSON.stringify({
          token,
          newPassword: resetForm.newPassword,
          confirmPassword: resetForm.confirmPassword
        })
      });

      setResetForm({
        newPassword: "",
        confirmPassword: ""
      });
      setResetMessage("Password berhasil diperbarui. Silakan kembali ke halaman login.");
    } catch (error) {
      setResetError(getErrorMessage(error, "Reset password gagal diproses."));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,rgba(58,80,151,0.14),transparent_30%),linear-gradient(180deg,#f7f7f7_0%,#eeeeee_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-[92vh] max-w-6xl items-center justify-center">
        <Card className="w-full max-w-xl bg-white/94">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-brand">
            {mode === "reset" ? "Reset Password" : "Lupa Password"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-text">
            {mode === "reset" ? "Buat password baru" : "Minta tautan reset password"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {mode === "reset"
              ? "Masukkan password baru untuk mengaktifkan kembali akses ke akun Anda."
              : "Masukkan email akun. Sistem akan menyiapkan tautan reset password."}
          </p>

          {invalidToken ? (
            <div className="mt-6 rounded-2xl border border-danger/15 bg-danger/5 px-4 py-3 text-sm text-danger">
              Tautan reset password tidak valid atau sudah kedaluwarsa.
            </div>
          ) : null}

          {mode === "request" ? (
            <div className="mt-6 space-y-4">
              <Field label="Email">
                <Input
                  autoComplete="email"
                  onChange={(event) => setRequestEmail(event.target.value)}
                  placeholder="Masukkan email akun"
                  value={requestEmail}
                />
              </Field>

              {requestError ? <p className="text-sm font-medium text-danger">{requestError}</p> : null}
              {requestMessage ? <p className="text-sm font-medium text-brand">{requestMessage}</p> : null}

              {previewUrl ? (
                <div className="rounded-2xl border border-brand/15 bg-brand/5 px-4 py-3">
                  <p className="text-sm font-medium text-text">
                    Tautan reset siap digunakan pada lingkungan lokal ini.
                  </p>
                  <Link
                    className="mt-2 inline-block text-sm font-semibold text-brand hover:underline"
                    href={previewUrl}
                  >
                    Buka tautan reset password
                  </Link>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button disabled={isRequesting} onClick={() => void handleRequestReset()}>
                  {isRequesting ? "Memproses..." : "Kirim Tautan Reset"}
                </Button>
                <Link href="/login">
                  <Button variant="secondary">Kembali ke Login</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <Field label="Password Baru">
                <Input
                  autoComplete="new-password"
                  onChange={(event) =>
                    setResetForm({ ...resetForm, newPassword: event.target.value })
                  }
                  type="password"
                  value={resetForm.newPassword}
                />
              </Field>
              <Field label="Konfirmasi Password Baru">
                <Input
                  autoComplete="new-password"
                  onChange={(event) =>
                    setResetForm({ ...resetForm, confirmPassword: event.target.value })
                  }
                  type="password"
                  value={resetForm.confirmPassword}
                />
              </Field>

              {resetError ? <p className="text-sm font-medium text-danger">{resetError}</p> : null}
              {resetMessage ? <p className="text-sm font-medium text-brand">{resetMessage}</p> : null}

              <div className="flex flex-wrap gap-3">
                <Button disabled={isResetting} onClick={() => void handleResetPassword()}>
                  {isResetting ? "Menyimpan..." : "Simpan Password Baru"}
                </Button>
                <Link href="/login">
                  <Button variant="secondary">Kembali ke Login</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto flex min-h-[92vh] max-w-6xl items-center justify-center">
        <Card className="max-w-md text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Loading</p>
          <h2 className="mt-3 text-2xl font-semibold text-text">Menyiapkan reset password...</h2>
        </Card>
      </div>
    </div>
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
