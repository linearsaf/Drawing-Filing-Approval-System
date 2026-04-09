"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { canCreateDrawingRequest } from "@/lib/utils/permissions";

export default function NewDrawingRequestPage() {
  const { currentUser } = useDemoApp();

  return (
    <AuthGuard allowedRoles={["ADMIN", "APPROVER_L1", "HEAD", "CONSUMER"]}>
      {currentUser && canCreateDrawingRequest(currentUser.role) ? <NewDrawingRequestContent /> : null}
    </AuthGuard>
  );
}

function NewDrawingRequestContent() {
  const router = useRouter();
  const [form, setForm] = useState({
    sacCode: "",
    area: "",
    description: "",
    purpose: ""
  });
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const payload = new FormData();
      payload.set("sacCode", form.sacCode);
      payload.set("area", form.area);
      payload.set("description", form.description);
      payload.set("purpose", form.purpose);

      if (referenceImage) {
        payload.set("referenceImage", referenceImage);
      }

      const result = await apiFetch<{ requestId: string }>("/api/drawing-requests", {
        method: "POST",
        body: payload
      });

      router.push(`/drawing-requests/${result.requestId}`);
      router.refresh();
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Request drawing baru gagal dikirim."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Request New Drawing"
        title="Ajukan drawing baru"
        description="Isi konteks kebutuhan drawing agar Draft Leader dapat menilai dan mendelegasikan pekerjaan ke drafter yang tepat."
        actions={
          <Button onClick={() => router.push("/drawing-requests")} variant="secondary">
            Open Request List
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <Card className="relative overflow-hidden border-transparent bg-graphite text-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/55">Request Brief</p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Buat request yang jelas agar triage dan assignment lebih cepat.
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-white/72">
              Request ini belum langsung menjadi drawing formal. Draft Leader akan mereview terlebih dahulu
              lalu menentukan apakah request layak dikerjakan dan siapa drafter yang paling sesuai.
            </p>
          </div>
        </Card>

        <Card className="bg-white/75">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Field Guide</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Yang perlu kamu siapkan</h2>
          <div className="mt-5 space-y-3">
            <Checklist text="Gunakan SAC / SBI Asset Code yang relevan dengan objek kerja." />
            <Checklist text="Tulis Area yang cukup spesifik untuk membantu Draft Leader melakukan triage." />
            <Checklist text="Jelaskan Description dan Keperluan dengan bahasa yang operasional." />
            <Checklist text="Lampirkan gambar referensi bila ada untuk mempercepat pemahaman konteks." />
          </div>
        </Card>
      </div>

      {error ? (
        <Card className="border-danger/15 bg-white/70">
          <p className="text-sm font-medium text-danger">{error}</p>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/90">
          <div className="border-b border-border/70 pb-5">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Request Fields</p>
            <h2 className="mt-2 text-2xl font-semibold text-text">Informasi utama</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Isi field wajib berikut agar request bisa direview tanpa bolak-balik klarifikasi.
            </p>
          </div>

          <div className="mt-5 grid gap-5">
            <Field label="SAC / SBI Asset Code" required>
              <Input
                onChange={(event) => setField("sacCode", event.target.value)}
                placeholder="Contoh: 461-KL1"
                value={form.sacCode}
              />
            </Field>
            <Field label="Area" required>
              <Input
                onChange={(event) => setField("area", event.target.value)}
                placeholder="Contoh: RMK"
                value={form.area}
              />
            </Field>
            <Field label="Description" required>
              <Textarea
                onChange={(event) => setField("description", event.target.value)}
                placeholder="Jelaskan objek drawing yang diminta"
                value={form.description}
              />
            </Field>
            <Field label="Keperluan" required>
              <Textarea
                onChange={(event) => setField("purpose", event.target.value)}
                placeholder="Contoh: Fabrikasi, Modifikasi, Order material"
                value={form.purpose}
              />
            </Field>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/90">
            <div className="border-b border-border/70 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Reference Image</p>
              <h2 className="mt-2 text-2xl font-semibold text-text">Lampiran opsional</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Gambar referensi dapat membantu Draft Leader dan Drafter memahami kebutuhan lebih cepat.
              </p>
            </div>

            <div className="mt-5">
              <label className="block cursor-pointer rounded-[26px] border border-dashed border-brand/30 bg-brand/5 p-4 transition hover:border-brand/45 hover:bg-brand/7">
                <input
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => setReferenceImage(event.target.files?.[0] ?? null)}
                  type="file"
                />
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold text-text">
                    {referenceImage ? "Image siap diunggah" : "Pilih gambar referensi"}
                  </p>
                  <p className="text-sm text-muted">
                    {referenceImage ? referenceImage.name : "Tidak ada file yang dipilih"}
                  </p>
                  <span className="inline-flex w-fit items-center justify-center rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-text">
                    Browse Image
                  </span>
                </div>
              </label>
            </div>
          </Card>

          <Card className="border-border/90">
            <div className="border-b border-border/70 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Submit</p>
              <h2 className="mt-2 text-2xl font-semibold text-text">Kirim request</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Setelah dikirim, request akan masuk ke queue Draft Leader untuk direview.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-border/75 bg-panel/25 px-4 py-3">
                <p className="text-sm font-semibold text-text">Setelah submit</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Kamu akan diarahkan ke detail request untuk memantau status review, assignment, atau alasan reject.
                </p>
              </div>

              <Button className="w-full" disabled={isSubmitting} onClick={() => void handleSubmit()}>
                {isSubmitting ? "Mengirim Request..." : "Submit Request"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-text">
        {label} {required ? <span className="text-danger">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function Checklist({ text }: { text: string }) {
  return <div className="rounded-2xl border border-border/75 bg-white px-4 py-3 text-sm text-text">{text}</div>;
}
