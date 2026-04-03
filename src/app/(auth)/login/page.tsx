"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, ready } = useDemoApp();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextPath = searchParams.get("next") ?? "/dashboard";

  useEffect(() => {
    if (ready && session) {
      router.replace(nextPath);
    }
  }, [nextPath, ready, router, session]);

  const handleLogin = async () => {
    if (!identity.trim() || !password) {
      setError("Masukkan email atau username beserta password.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = identity.includes("@")
        ? await authClient.signIn.email({
            email: identity.trim(),
            password,
            rememberMe
          })
        : await authClient.signIn.username({
            username: identity.trim(),
            password,
            rememberMe
          });

      if (result.error) {
        setError(result.error.message ?? "Login gagal. Periksa kembali kredensial Anda.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login gagal diproses.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,rgba(58,80,151,0.14),transparent_30%),linear-gradient(180deg,#f7f7f7_0%,#eeeeee_100%)] px-4 py-8">
      <div className="mx-auto grid min-h-[92vh] max-w-6xl items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden border-none bg-graphite p-8 text-white lg:min-h-[454px] lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(58,80,151,0.45),transparent_28%),linear-gradient(160deg,rgba(255,255,255,0.06),transparent_42%)]" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.38em] text-white/60">
              Drawing Filing & Approval
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight">
              Sistem pengelolaan drawing yang terstruktur dan terdokumentasi.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75">
              Akses dokumen, approval bertingkat, histori revisi, dan distribusi drawing final
              dikelola dalam satu aplikasi terpusat.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["Approval Bertingkat", "Alur review dan approval ditampilkan sesuai tahapan proses."],
                ["Riwayat Revisi", "Perubahan, keputusan, dan status drawing dapat ditelusuri dengan jelas."],
                ["Distribusi Terkendali", "Dokumen final tersedia dalam kondisi read-only sesuai hak akses."]
              ].map(([title, copy]) => (
                <div className="rounded-3xl border border-white/10 bg-white/6 p-4" key={title}>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-2 text-xs leading-6 text-white/68">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="bg-white/92 lg:min-h-[454px]">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-brand">Sign In</p>
          <h2 className="mt-3 text-3xl font-semibold text-text">Masuk ke sistem</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Masukkan email atau username beserta password untuk mengakses sistem.
          </p>

          <div className="mt-6 space-y-4">
            <Field label="Email / Username">
              <Input
                autoComplete="username"
                onChange={(event) => setIdentity(event.target.value)}
                placeholder="Masukkan email atau username"
                value={identity}
              />
            </Field>
            <div className="space-y-2">
              <Field label="Password">
                <Input
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleLogin();
                    }
                  }}
                  type="password"
                  value={password}
                />
              </Field>
              <div className="flex justify-end pr-1">
                <Link className="text-sm font-semibold text-brand hover:underline" href="/reset-password">
                  Lupa password?
                </Link>
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-border bg-panel/35 px-4 py-3">
              <input
                checked={rememberMe}
                className="h-4 w-4 rounded border-border text-brand accent-brand"
                onChange={(event) => setRememberMe(event.target.checked)}
                type="checkbox"
              />
              <div>
                <p className="text-sm font-semibold text-text">Remember me</p>
                <p className="text-xs text-muted">
                  Tetap masuk saat browser dibuka kembali pada perangkat ini.
                </p>
              </div>
            </label>
          </div>

          {error ? <p className="mt-5 text-sm font-medium text-danger">{error}</p> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="flex-1" disabled={isSubmitting} onClick={() => void handleLogin()}>
              {isSubmitting ? "Memproses..." : "Masuk"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto flex min-h-[92vh] max-w-6xl items-center justify-center">
        <Card className="max-w-md text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Loading</p>
          <h2 className="mt-3 text-2xl font-semibold text-text">Menyiapkan form login...</h2>
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
