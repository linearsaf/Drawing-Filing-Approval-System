"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { UserRole } from "@/lib/types";
import { getRoleLabel } from "@/lib/utils/permissions";

const roles: UserRole[] = ["ADMIN", "DRAFTER", "DRAFT_LEADER", "APPROVER_L1", "HEAD", "CONSUMER"];
const requestHighlights = ["Review admin", "Role dapat disesuaikan", "Akun dikirim via email"] as const;

const defaultForm = {
  name: "",
  email: "",
  username: "",
  requestedRole: "CONSUMER" as UserRole
};

export default function RequestAccessPage() {
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      await apiFetch("/api/access-requests", {
        method: "POST",
        body: JSON.stringify(form)
      });

      setSuccess(true);
      setForm(defaultForm);
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Pengajuan akses gagal diproses."));
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

      <div className="relative mx-auto grid min-h-[92vh] max-w-6xl items-center gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="relative overflow-hidden border-none bg-graphite p-8 text-white lg:min-h-[540px] lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(58,80,151,0.45),transparent_28%),linear-gradient(160deg,rgba(255,255,255,0.06),transparent_42%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <div className="inline-flex rounded-full border border-[rgba(190,205,235,0.34)] bg-white/7 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.32em] text-white/72">
                Request Access
              </div>
              <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight">
                Ajukan akses kerja sebelum akun dibuat oleh admin.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/75">
                Cocok untuk calon user baru yang belum memiliki akun. Data Anda akan ditinjau
                admin sebelum akses dibuat.
              </p>

              <div className="mt-8 grid gap-3">
                {requestHighlights.map((item) => (
                  <HighlightPill key={item} label={item} />
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/6 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/58">
                Alur Singkat
              </p>
              <div className="mt-4 space-y-3">
                <GuideRow
                  index="1"
                  text="Isi nama, email, username, dan role yang diajukan."
                />
                <GuideRow
                  index="2"
                  text="Admin meninjau dan dapat merapikan data sebelum keputusan final."
                />
                <GuideRow
                  index="3"
                  text="Jika disetujui, akun aktif dan kredensial awal dikirim lewat email."
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white/94 p-7 lg:min-h-[540px] lg:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-brand">Request Access</p>
          <h2 className="mt-3 text-3xl font-semibold text-text">Ajukan akses ke sistem</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            Lengkapi data dasar berikut. Password akan dibuat setelah admin menyetujui pengajuan.
          </p>

          {success ? (
            <div className="mt-8 rounded-[24px] border border-brand/15 bg-brand/5 p-5">
              <p className="text-sm font-semibold text-brand">Pengajuan berhasil dikirim.</p>
              <p className="mt-2 text-sm leading-6 text-text">
                Data Anda sudah masuk ke admin untuk dievaluasi. Setelah disetujui, akun dan
                informasi login akan dikirim melalui email yang Anda daftarkan.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => setSuccess(false)}>Ajukan akses lain</Button>
                <Link href="/login">
                  <Button variant="secondary">Kembali ke Sign In</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nama">
                  <Input
                    autoComplete="name"
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Contoh: Septi Nanda"
                    value={form.name}
                  />
                </Field>
                <Field label="Username">
                  <Input
                    autoComplete="username"
                    onChange={(event) => setForm({ ...form, username: event.target.value })}
                    placeholder="Contoh: septinanda"
                    value={form.username}
                  />
                </Field>
              </div>

              <Field label="Email">
                <Input
                  autoComplete="email"
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="Contoh: septi@company.com"
                  value={form.email}
                />
              </Field>

              <Field label="Role yang diajukan">
                <Select
                  onChange={(event) =>
                    setForm({ ...form, requestedRole: event.target.value as UserRole })
                  }
                  value={form.requestedRole}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="rounded-2xl border border-border/70 bg-panel/25 px-4 py-3">
                <p className="text-sm font-semibold text-text">Catatan singkat</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Admin dapat mengubah data Anda sebelum approve. Kredensial awal dikirim lewat
                  email saat pengajuan disetujui.
                </p>
              </div>

              {error ? (
                <div className="rounded-2xl border border-danger/15 bg-danger/5 px-4 py-3">
                  <p className="text-sm font-medium text-danger">{error}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button disabled={isSubmitting} onClick={() => void handleSubmit()}>
                  {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
                </Button>
                <Link href="/login">
                  <Button variant="secondary">Kembali ke Sign In</Button>
                </Link>
              </div>
            </div>
          )}
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

function HighlightPill({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
      <p className="text-sm font-semibold text-white">{label}</p>
    </div>
  );
}

function GuideRow({ index, text }: { index: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/8 bg-black/10 px-4 py-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8 text-xs font-semibold text-white">
        {index}
      </div>
      <p className="text-sm leading-6 text-white/74">{text}</p>
    </div>
  );
}
