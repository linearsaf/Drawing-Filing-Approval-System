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

const platformHighlights = ["Approval tertata", "Revisi terlacak", "Distribusi terkendali"] as const;

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
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,rgba(58,80,151,0.14),transparent_30%),linear-gradient(180deg,#f7f7f7_0%,#eeeeee_100%)] px-4 py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-6%] h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-4%] h-80 w-80 rounded-full bg-sage/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[92vh] max-w-6xl items-center gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <Card className="relative overflow-hidden border-none bg-graphite p-8 text-white lg:min-h-[560px] lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(58,80,151,0.45),transparent_28%),linear-gradient(160deg,rgba(255,255,255,0.06),transparent_42%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <div className="inline-flex rounded-full border border-white/12 bg-white/7 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.32em] text-white/72">
                Drawing Filing & Approval
              </div>
              <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight lg:text-[2.85rem]">
                Workspace drawing yang lebih tertib, mudah dilacak, dan siap diaudit.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/75">
                Satu workspace untuk filing, review, approval, dan distribusi dokumen final secara
                konsisten.
              </p>

              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {platformHighlights.map((item) => (
                  <FeaturePill key={item} label={item} />
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/6 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/58">
                Untuk Tim Internal
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <MetricTile label="Check & Approve" value="Tertata" />
                <MetricTile label="Riwayat Revisi" value="Terlacak" />
                <MetricTile label="Distribusi Final" value="Aman" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white/94 p-7 lg:min-h-[560px] lg:p-8">
          <div className="flex h-full flex-col">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-brand">Sign In</p>
              <h2 className="mt-3 text-3xl font-semibold text-text">Masuk ke workspace</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted">
                Gunakan email atau username yang sudah terdaftar.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <Field label="Email / Username">
                <Input
                  autoComplete="username"
                  onChange={(event) => setIdentity(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleLogin();
                    }
                  }}
                  placeholder="Masukkan email atau username"
                  value={identity}
                />
              </Field>
              <Field label="Password">
                <Input
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleLogin();
                    }
                  }}
                  placeholder="Masukkan password akun"
                  type="password"
                  value={password}
                />
              </Field>

              <div className="flex flex-col gap-3 rounded-[22px] border border-border/75 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-start gap-3">
                  <input
                    checked={rememberMe}
                    className="mt-1 h-4 w-4 rounded border-border text-brand accent-brand"
                    onChange={(event) => setRememberMe(event.target.checked)}
                    type="checkbox"
                  />
                  <div>
                    <p className="text-sm font-semibold text-text">Tetap masuk di perangkat ini</p>
                    <p className="text-xs leading-5 text-muted">
                      Cocok untuk perangkat kerja pribadi yang Anda gunakan setiap hari.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-danger/15 bg-danger/5 px-4 py-3">
                <p className="text-sm font-medium text-danger">{error}</p>
              </div>
            ) : null}

            <div className="mt-6 space-y-3">
              <Button
                className="w-full py-3"
                disabled={isSubmitting}
                onClick={() => void handleLogin()}
              >
                {isSubmitting ? "Memproses..." : "Masuk"}
              </Button>
              <p className="text-center text-xs leading-5 text-muted">
                Dengan masuk ke sistem, Anda menggunakan hak akses sesuai role yang telah
                diberikan admin.
              </p>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <ActionCard
                copy="Minta tautan reset bila akun Anda sudah terdaftar tetapi tidak bisa sign in."
                href="/reset-password"
                linkLabel="Reset Password"
                title="Butuh Reset Password?"
              />
              <ActionCard
                copy="Ajukan akun baru agar data Anda dievaluasi admin sebelum akses dibuat."
                href="/request-access"
                linkLabel="Request Access"
                title="Belum punya akses?"
              />
            </div>
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

function FeaturePill({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
      <p className="text-sm font-semibold text-white">{label}</p>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/12 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/54">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function ActionCard({
  title,
  copy,
  href,
  linkLabel
}: {
  title: string;
  copy: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-[22px] border border-border/75 bg-panel/18 p-4">
      <p className="text-sm font-semibold text-text">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{copy}</p>
      <Link className="mt-3 inline-flex text-sm font-semibold text-brand hover:underline" href={href}>
        {linkLabel}
      </Link>
    </div>
  );
}
