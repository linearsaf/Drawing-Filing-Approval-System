"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { DrawingFormInput } from "@/lib/types";

const defaultValues: DrawingFormInput = {
  drawingNumber: "",
  drawingName: "",
  sacCode: "",
  area: "",
  discipline: "",
  description: "",
  revisionNo: "0",
  fileName: "",
  changeNote: ""
};

export function DrawingForm({
  initialValues,
  drawingId,
  drawnByName,
  mode
}: {
  initialValues?: DrawingFormInput;
  drawingId?: string;
  drawnByName?: string | null;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [form, setForm] = useState<DrawingFormInput>(initialValues ?? defaultValues);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formCopy =
    mode === "create"
      ? {
          title: "Siapkan Drawing metadata dan dokumen awal dengan struktur yang rapi.",
          description:
            "Lengkapi identitas drawing, tetapkan revision awal, lalu upload PDF agar dokumen siap disimpan sebagai draft atau langsung dikirim ke tahap check.",
          saveLabel: "Save Draft",
          submitLabel: "Submit to Check"
        }
      : {
          title: "Perbarui draft tanpa kehilangan konteks revisi aktif.",
          description:
            "Ubah metadata, ganti file PDF bila ada revision terbaru, lalu pilih apakah ingin tetap menyimpan sebagai draft atau langsung melanjutkan ke tahap check.",
          saveLabel: "Update Draft",
          submitLabel: "Update & Submit"
        };

  const setField = (key: keyof DrawingFormInput, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async (submit: boolean) => {
    setIsSubmitting(true);
    setError("");

    try {
      const payload = new FormData();
      payload.set("drawingNumber", form.drawingNumber);
      payload.set("drawingName", form.drawingName);
      payload.set("sacCode", form.sacCode);
      payload.set("area", form.area);
      payload.set("discipline", form.discipline);
      payload.set("description", form.description);
      payload.set("revisionNo", form.revisionNo);
      payload.set("fileName", form.fileName);
      payload.set("changeNote", form.changeNote);
      payload.set("submit", String(submit));

      if (selectedFile) {
        payload.set("file", selectedFile);
      }

      const result = drawingId
        ? await apiFetch<{ drawingId: string }>(`/api/drawings/${drawingId}`, {
            method: "PATCH",
            body: payload
          })
        : await apiFetch<{ drawingId: string }>("/api/drawings", {
            method: "POST",
            body: payload
          });

      router.push(`/drawings/${result.drawingId}`);
      router.refresh();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Gagal menyimpan drawing."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden border-transparent bg-graphite text-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
          <div className="absolute -right-16 top-0 h-44 w-44 rounded-full bg-white/5 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/55">
                {mode === "create" ? "Create Drawing" : "Edit Drawing"}
              </p>
              <h2 className="mt-2 max-w-2xl text-lg font-semibold leading-snug tracking-tight sm:text-2xl xl:text-3xl">
                {formCopy.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72 line-clamp-3">
                {formCopy.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[240px] sm:grid-cols-1">
              <SummaryChip label="Drafter" value={drawnByName ?? "-"} />
              <SummaryChip label="Current Revision" value={form.revisionNo || "-"} />
              <SummaryChip
                className="col-span-2 sm:col-span-1"
                label="Current File"
                value={form.fileName || "Belum ada file"}
              />
            </div>
          </div>
        </Card>

        <Card className="hidden bg-white/75 xl:block">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Submission Notes</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Checklist sebelum simpan</h2>

          <div className="mt-5 space-y-3">
            <ChecklistRow text="Pastikan drawing number unik dan konsisten dengan standar proyek." />
            <ChecklistRow text="Gunakan current revision yang benar sebelum mengganti file PDF." />
            <ChecklistRow text="Isi Change Note bila perubahan perlu mudah dilacak reviewer." />
            <ChecklistRow text="Pilih submit hanya saat dokumen sudah siap masuk alur check." />
          </div>
        </Card>
      </div>

      {error ? (
        <Card className="border-danger/15 bg-white/70">
          <p className="text-sm font-medium text-danger">{error}</p>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="order-1 space-y-4">
          <Card className="border-border/90">
            <div className="border-b border-border/70 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Drawing Metadata</p>
              <h2 className="mt-2 text-xl font-semibold text-text sm:text-2xl">Metadata utama</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Isi identitas drawing dengan jelas agar mudah dicari, diaudit, dan dilacak pada tahap approval berikutnya.
              </p>
            </div>

            <div className="mt-5 grid gap-5">
              <div className="grid gap-5 md:grid-cols-[1fr_1.1fr]">
                <Field hint="Nomor unik untuk identifikasi dokumen." label="Drawing Number" required>
                  <Input
                    onChange={(event) => setField("drawingNumber", event.target.value)}
                    placeholder="Contoh: TQ_461-KL1_04.04.26_S.T.K_01"
                    value={form.drawingNumber}
                  />
                </Field>
                <Field hint="Gunakan nama yang mudah dikenali tim proyek." label="Drawing Name" required>
                  <Input
                    onChange={(event) => setField("drawingName", event.target.value)}
                    placeholder="Contoh: kiln general arrangement"
                    value={form.drawingName}
                  />
                </Field>
              </div>

              <Field hint="Kode aset atau kode dokumen internal yang relevan." label="SAC / SBI Asset Code" required>
                <Input
                  onChange={(event) => setField("sacCode", event.target.value)}
                  placeholder="Contoh: 461-KL1"
                  value={form.sacCode}
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field hint="Lokasi atau area kerja dokumen." label="Area" required>
                  <Input
                    onChange={(event) => setField("area", event.target.value)}
                    placeholder="Contoh: RMK"
                    value={form.area}
                  />
                </Field>
                <Field hint="Contoh: Mechanical, Piping, Structural." label="Discipline" required>
                  <Input
                    onChange={(event) => setField("discipline", event.target.value)}
                    placeholder="Contoh: Mechanical"
                    value={form.discipline}
                  />
                </Field>
              </div>
            </div>
          </Card>

          <Card className="border-border/90">
            <div className="border-b border-border/70 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Document Context</p>
              <h2 className="mt-2 text-xl font-semibold text-text sm:text-2xl">Description dan Change Note</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Tambahkan konteks secukupnya untuk membantu checker dan approver memahami isi dokumen.
              </p>
            </div>

            <div className="mt-5 grid gap-5">
              <Field hint="Opsional, tapi sangat membantu saat dokumen dicari ulang." label="Description">
                <Textarea
                  onChange={(event) => setField("description", event.target.value)}
                  placeholder="Contoh: general arrangement kiln area RMK untuk kebutuhan instalasi"
                  value={form.description}
                />
              </Field>
              <Field hint="Jelaskan perubahan penting pada revisi aktif." label="Change Note">
                <Textarea
                  onChange={(event) => setField("changeNote", event.target.value)}
                  placeholder="Contoh: update dimensi support dan penyesuaian elevasi platform"
                  value={form.changeNote}
                />
              </Field>
            </div>
          </Card>
        </div>

        <div className="order-2 space-y-4">
          <CollapsibleHelperCard
            className="xl:hidden"
            eyebrow="Submission Notes"
            title="Checklist sebelum simpan"
          >
            <div className="space-y-3">
              <ChecklistRow text="Pastikan drawing number unik dan konsisten dengan standar proyek." />
              <ChecklistRow text="Gunakan current revision yang benar sebelum mengganti file PDF." />
              <ChecklistRow text="Isi Change Note bila perubahan perlu mudah dilacak reviewer." />
              <ChecklistRow text="Pilih submit hanya saat dokumen sudah siap masuk alur check." />
            </div>
          </CollapsibleHelperCard>

          <Card className="border-border/90">
            <div className="border-b border-border/70 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Revision & File</p>
              <h2 className="mt-2 text-xl font-semibold text-text sm:text-2xl">Current Revision document</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Tentukan nomor revision dan file PDF yang akan dipakai sebagai sumber dokumen aktif.
              </p>
            </div>

            <div className="mt-5 grid gap-5">
              <Field hint="Gunakan numbering revisi yang konsisten, misalnya 0, 1, 2." label="Revision Number" required>
                <Input
                  onChange={(event) => setField("revisionNo", event.target.value)}
                  placeholder="Contoh: 0"
                  value={form.revisionNo}
                />
              </Field>

              <Field
                hint={
                  mode === "create"
                    ? "PDF wajib diunggah untuk membuat drawing baru."
                    : "Upload PDF baru hanya jika file current revision perlu diganti."
                }
                label="Upload PDF"
                required={mode === "create"}
              >
                <label className="block cursor-pointer rounded-[26px] border border-dashed border-brand/30 bg-brand/5 p-4 transition hover:border-brand/45 hover:bg-brand/7">
                  <input
                    accept="application/pdf"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }

                      setSelectedFile(file);
                      setField("fileName", file.name);
                    }}
                    type="file"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text">
                        {selectedFile ? "PDF baru siap diunggah" : "Pilih file PDF"}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {selectedFile
                          ? selectedFile.name
                          : form.fileName || "Belum ada file yang dipilih"}
                      </p>
                    </div>
                    <span className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-text">
                      Browse PDF
                    </span>
                  </div>
                </label>
              </Field>
            </div>
          </Card>

          <Card className="border-border/90">
            <div className="border-b border-border/70 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Save Actions</p>
              <h2 className="mt-2 text-xl font-semibold text-text sm:text-2xl">Pilih tahap berikutnya</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Simpan sebagai draft bila masih ada revisi internal, atau submit bila dokumen sudah siap masuk proses check.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <ActionPanel
                description="Menyimpan perubahan tanpa mengirim dokumen ke proses review."
                title={formCopy.saveLabel}
              />
              <Button
                className="w-full"
                disabled={isSubmitting}
                onClick={() => void handleSave(false)}
                variant="secondary"
              >
                {isSubmitting ? "Menyimpan..." : formCopy.saveLabel}
              </Button>

              <ActionPanel
                description="Mengirim dokumen aktif ke tahap check agar proses approval bisa dimulai."
                title={formCopy.submitLabel}
              />
              <Button
                className="w-full"
                disabled={isSubmitting}
                onClick={() => void handleSave(true)}
              >
                {isSubmitting ? "Memproses..." : formCopy.submitLabel}
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
  required,
  hint
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-text">
        {label} {required ? <span className="text-danger">*</span> : null}
      </span>
      {children}
      {hint ? <p className="mt-2 text-xs leading-5 text-muted sm:text-xs">{hint}</p> : null}
    </label>
  );
}

function SummaryChip({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 px-4 py-3 ${className}`.trim()}>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-white">{value}</p>
    </div>
  );
}

function ChecklistRow({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-border/75 bg-white px-4 py-3 text-sm text-text">
      {text}
    </div>
  );
}

function ActionPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border/75 bg-panel/25 px-4 py-3">
      <p className="text-sm font-semibold text-text">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

function CollapsibleHelperCard({
  eyebrow,
  title,
  children,
  className = ""
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">{eyebrow}</p>
            <h2 className="mt-2 text-xl font-semibold text-text">{title}</h2>
          </div>
          <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-panel/26 text-sm font-semibold text-text transition group-open:rotate-180">
            <CollapseChevronIcon />
          </span>
        </summary>
        <div className="mt-5">{children}</div>
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
