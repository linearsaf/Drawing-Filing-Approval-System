"use client";

import { useEffect, useState } from "react";
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
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [referenceImagePreviews, setReferenceImagePreviews] = useState<Array<{ id: string; file: File; previewUrl: string }>>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      referenceImagePreviews.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [referenceImagePreviews]);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const appendReferenceImages = (files: File[]) => {
    setReferenceImagePreviews((current) => {
      const nextItems = [...current];

      for (const file of files) {
        if (nextItems.length >= 3) {
          break;
        }

        nextItems.push({
          id: `${file.name}-${file.lastModified}-${nextItems.length}`,
          file,
          previewUrl: URL.createObjectURL(file)
        });
      }

      setReferenceImages(nextItems.map((item) => item.file));
      return nextItems;
    });
  };

  const removeReferenceImage = (id: string) => {
    setReferenceImagePreviews((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      const nextItems = current.filter((item) => item.id !== id);
      setReferenceImages(nextItems.map((item) => item.file));
      return nextItems;
    });
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

      for (const file of referenceImages) {
        payload.append("referenceImages", file);
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
          <div className="absolute -right-14 top-0 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/55">Request Brief</p>
            <h2 className="text-lg font-semibold leading-snug tracking-tight sm:text-2xl xl:text-3xl">
              Buat request yang jelas agar triage dan assignment lebih cepat.
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-white/72 line-clamp-3">
              Request ini belum langsung menjadi drawing formal. Draft Leader akan mereview terlebih dahulu
              lalu menentukan apakah request layak dikerjakan dan siapa drafter yang paling sesuai.
            </p>
          </div>
        </Card>

        <Card className="hidden bg-white/75 xl:block">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Field Guide</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Yang perlu kamu siapkan</h2>
          <div className="mt-5 space-y-3">
            <Checklist text="Gunakan SAC / SBI Asset Code yang relevan dengan objek kerja." />
            <Checklist text="Tulis Area yang cukup spesifik untuk membantu Draft Leader melakukan triage." />
            <Checklist text="Jelaskan Description dan Keperluan dengan bahasa yang operasional." />
            <Checklist text="Lampirkan hingga 3 gambar referensi bila ada untuk mempercepat pemahaman konteks." />
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
            <h2 className="mt-2 text-xl font-semibold text-text sm:text-2xl">Informasi utama</h2>
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
          <CollapsibleGuideCard className="xl:hidden" />

          <Card className="border-border/90">
            <div className="border-b border-border/70 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Reference Image</p>
              <h2 className="mt-2 text-xl font-semibold text-text sm:text-2xl">Lampiran opsional</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Gambar referensi dapat membantu Draft Leader dan Drafter memahami kebutuhan lebih cepat. Anda dapat
                memilih lebih dari satu gambar, maksimal 3 file.
              </p>
            </div>

            <div className="mt-5">
              <label
                className={`block rounded-[26px] border border-dashed p-4 transition ${
                  referenceImages.length >= 3
                    ? "cursor-not-allowed border-border/80 bg-panel/18 opacity-75"
                    : "cursor-pointer border-brand/30 bg-brand/5 hover:border-brand/45 hover:bg-brand/7"
                }`}
              >
                <input
                  accept="image/*"
                  className="sr-only"
                  disabled={referenceImages.length >= 3}
                  multiple
                  onChange={(event) => {
                    appendReferenceImages(Array.from(event.target.files ?? []).filter((file) => file.size > 0));
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text">
                      {referenceImages.length > 0
                        ? `${referenceImages.length} gambar referensi siap diunggah`
                        : "Pilih gambar referensi"}
                    </p>
                    <p className="mt-1 max-w-[28rem] text-sm leading-6 text-muted">
                      {referenceImages.length > 0
                        ? "Tambahkan gambar lagi jika masih kurang dari 3, atau hapus gambar tertentu bila tidak diperlukan."
                        : "JPG, PNG, WEBP, atau SVG. Maksimal 3 file untuk membantu konteks request."}
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center self-start rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-text sm:self-auto">
                    {referenceImages.length >= 3
                      ? "Image Limit Reached"
                      : referenceImages.length > 0
                        ? "Add Images"
                        : "Browse Images"}
                  </span>
                </div>
              </label>

              {referenceImagePreviews.length > 0 ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text">Preview gambar referensi</p>
                    <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-text">
                      {referenceImagePreviews.length}/3 gambar
                    </span>
                  </div>

                  <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
                    {referenceImagePreviews.map((item, index) => (
                      <div
                        className="relative min-w-[118px] max-w-[134px] overflow-hidden rounded-[20px] border border-border bg-white shadow-[0_8px_18px_rgba(35,40,51,0.06)] sm:min-w-0 sm:max-w-none"
                        key={item.id}
                      >
                        <button
                          aria-label={`Hapus gambar referensi ${index + 1}`}
                          className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/45 bg-[#232833]/76 text-white shadow-sm backdrop-blur-sm transition hover:border-danger/50 hover:bg-danger"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            removeReferenceImage(item.id);
                          }}
                          type="button"
                        >
                          <DeleteIcon />
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={`Preview gambar referensi ${index + 1}`}
                          className="h-28 w-full object-cover"
                          src={item.previewUrl}
                        />
                        <div className="border-t border-border/70 px-3 py-2.5">
                          <p className="line-clamp-2 text-[11px] font-semibold leading-4 text-text">
                            {item.file.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="border-border/90">
            <div className="border-b border-border/70 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Submit</p>
              <h2 className="mt-2 text-xl font-semibold text-text sm:text-2xl">Kirim request</h2>
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

function CollapsibleGuideCard({ className = "" }: { className?: string }) {
  return (
    <Card className={className}>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Field Guide</p>
            <h2 className="mt-2 text-xl font-semibold text-text">Yang perlu kamu siapkan</h2>
          </div>
          <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-panel/26 text-sm font-semibold text-text transition group-open:rotate-180">
            <CollapseChevronIcon />
          </span>
        </summary>
        <div className="mt-5 space-y-3">
          <Checklist text="Gunakan SAC / SBI Asset Code yang relevan dengan objek kerja." />
          <Checklist text="Tulis Area yang cukup spesifik untuk membantu Draft Leader melakukan triage." />
          <Checklist text="Jelaskan Description dan Keperluan dengan bahasa yang operasional." />
          <Checklist text="Lampirkan hingga 3 gambar referensi bila ada untuk mempercepat pemahaman konteks." />
        </div>
      </details>
    </Card>
  );
}

function CollapseChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
