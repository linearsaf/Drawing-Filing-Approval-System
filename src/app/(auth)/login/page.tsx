"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/app/brand-logo";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { appBrand } from "@/lib/config/brand";

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
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,rgba(58,80,151,0.14),transparent_30%),linear-gradient(180deg,#f7f7f7_0%,#eeeeee_100%)] px-3 py-6 sm:px-4 sm:py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-6%] h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-4%] h-80 w-80 rounded-full bg-sage/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[92vh] max-w-6xl items-start gap-5 lg:items-center lg:gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <Card className="order-2 bg-white/94 p-5 sm:p-6 lg:order-2 lg:min-h-[560px] lg:p-8">
          <div className="flex h-full flex-col">
            <div className="lg:hidden">
              <div className="inline-flex">
                <BrandLogo
                  className="h-auto w-[152px] sm:w-[168px]"
                  height={42}
                  priority
                  variant="light"
                  width={168}
                />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.32em] text-brand">Sign In</p>
              <h1 className="mt-2 text-2xl font-semibold leading-tight text-text">
                Masuk ke workspace drawing
              </h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                Kelola drawing, review, approval, dan final document dalam satu alur kerja.
              </p>
            </div>

            <div className="hidden lg:block">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-brand">Sign In</p>
              <h2 className="mt-3 text-3xl font-semibold text-text">Masuk ke workspace</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted">
                Gunakan email atau username yang sudah terdaftar.
              </p>
            </div>

            <div className="mt-5 space-y-4 lg:mt-6">
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

              <label className="flex items-start gap-3 rounded-[18px] border border-border/75 bg-white px-4 py-3 lg:rounded-[22px] lg:px-4 lg:py-4">
                <input
                  checked={rememberMe}
                  className="mt-1 h-4 w-4 rounded border-border text-brand accent-brand"
                  onChange={(event) => setRememberMe(event.target.checked)}
                  type="checkbox"
                />
                <div>
                  <p className="text-sm font-semibold text-text">Tetap masuk di perangkat ini</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted lg:mt-1">
                    Cocok untuk perangkat kerja pribadi yang Anda gunakan setiap hari.
                  </p>
                </div>
              </label>
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

            <div className="mt-5 space-y-2 lg:hidden">
              <Link className="block text-sm font-semibold text-brand hover:underline" href="/reset-password">
                Lupa password? Reset Password
              </Link>
              <Link className="block text-sm font-semibold text-brand hover:underline" href="/request-access">
                Belum punya akses? Request Access
              </Link>
            </div>

            <div className="mt-6 hidden gap-3 md:grid-cols-2 lg:grid">
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

        <Card className="order-1 relative overflow-hidden border-none bg-graphite p-5 text-white sm:p-6 lg:order-1 lg:min-h-[560px] lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(58,80,151,0.45),transparent_28%),linear-gradient(160deg,rgba(255,255,255,0.06),transparent_42%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <div className="hidden lg:inline-flex">
                <BrandLogo
                  className="h-auto w-[172px] sm:w-[198px] lg:w-[228px]"
                  height={50}
                  priority
                  variant="dark"
                  width={228}
                />
              </div>
              <p className="inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/72 lg:hidden">
                DrafTerra Workspace
              </p>
              <h2 className="mt-4 max-w-2xl text-2xl font-semibold leading-tight sm:text-[2rem] lg:mt-6 lg:text-[2.85rem]">
                Workspace drawing yang lebih tertib, mudah dilacak, dan siap diaudit.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 lg:mt-5 lg:leading-7">
                Satu workspace untuk filing, review, approval, dan distribusi dokumen final secara
                konsisten.
              </p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.28em] text-white/54 lg:mt-4">
                {appBrand.tagline}
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:mt-8 lg:gap-3">
                {platformHighlights.map((item) => (
                  <FeaturePill key={item} label={item} />
                ))}
              </div>
            </div>

            <div className="mt-5 hidden rounded-[28px] border border-white/10 bg-white/6 p-5 lg:mt-8 lg:block">
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
