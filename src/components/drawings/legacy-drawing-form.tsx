"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { DrawnByOption, LegacyDrawingFormInput } from "@/lib/types";

const defaultValues: LegacyDrawingFormInput = {
  drawingNumber: "",
  drawingName: "",
  sacCode: "",
  area: "",
  discipline: "",
  description: "",
  revisionNo: "0",
  drawnByUserId: "",
  legacyReadyNote: "",
  fileName: ""
};

export function LegacyDrawingForm({
  uploaderName
}: {
  uploaderName?: string | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<LegacyDrawingFormInput>(defaultValues);
  const [drawnByOptions, setDrawnByOptions] = useState<DrawnByOption[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      try {
        const response = await apiFetch<{ items: DrawnByOption[] }>("/api/users/legacy-drawn-by");

        if (cancelled) {
          return;
        }

        setDrawnByOptions(response.items);
        setForm((current) => ({
          ...current,
          drawnByUserId: current.drawnByUserId || response.items[0]?.id || ""
        }));
      } catch {
        if (!cancelled) {
          setDrawnByOptions([]);
        }
      }
    };

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  const setField = (key: keyof LegacyDrawingFormInput, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
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
      payload.set("drawnByUserId", form.drawnByUserId);
      payload.set("legacyReadyNote", form.legacyReadyNote);
      payload.set("fileName", form.fileName);

      if (selectedFile) {
        payload.set("file", selectedFile);
      }

      const result = await apiFetch<{ drawingId: string }>("/api/drawings/legacy", {
        method: "POST",
        body: payload
      });

      router.push(`/drawings/${result.drawingId}`);
      router.refresh();
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Old drawing gagal diunggah."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDrawnBy =
    drawnByOptions.find((option) => option.id === form.drawnByUserId) ?? null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden border-transparent bg-graphite text-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
          <div className="absolute -right-16 top-0 h-44 w-44 rounded-full bg-white/5 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/55">
                Upload Old Drawing
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
                Import drawing lama yang sudah ready tanpa mengganggu alur standar.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
                Flow ini khusus untuk drawing yang approval wet sign-nya sudah selesai sebelum sistem ini digunakan. Dokumen akan langsung masuk status completed dan langsung tersedia untuk consumer.
              </p>
            </div>

            <div className="grid gap-3 md:min-w-[260px]">
              <SummaryChip label="Uploaded by" value={uploaderName ?? "-"} />
              <SummaryChip
                label="Drawn by"
                value={selectedDrawnBy ? `${selectedDrawnBy.name} / ${selectedDrawnBy.role}` : "-"}
              />
              <SummaryChip label="Revision" value={form.revisionNo || "-"} />
            </div>
          </div>
        </Card>

        <Card className="bg-white/75">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Legacy Import Notes</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Checklist sebelum upload</h2>

          <div className="mt-5 space-y-3">
            <ChecklistRow text="Masukkan metadata utama lengkap agar drawing tetap bisa dicari dan difilter." />
            <ChecklistRow text="Pilih Drawn by untuk mencatat pemilik bisnis drawing, bukan sekadar uploader." />
            <ChecklistRow text="Gunakan Legacy Ready Note untuk menjelaskan bahwa approval historis terjadi di luar sistem." />
            <ChecklistRow text="PDF yang diupload akan tetap utuh tanpa overlay approval baru." />
          </div>
        </Card>
      </div>

      {error ? (
        <Card className="border-danger/15 bg-white/70">
          <p className="text-sm font-medium text-danger">{error}</p>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Card className="border-border/90">
            <div className="border-b border-border/70 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Legacy Metadata</p>
              <h2 className="mt-2 text-2xl font-semibold text-text">Metadata utama drawing</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Field ini tetap wajib agar old drawing bisa masuk ke library final tanpa merusak kualitas pencarian, filter, dan audit trail.
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
                <Field hint="Gunakan nama yang paling mudah dikenali user downstream." label="Drawing Name" required>
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

              <Field hint="Opsional, tetapi membantu memberi konteks bisnis." label="Description">
                <Textarea
                  onChange={(event) => setField("description", event.target.value)}
                  placeholder="Contoh: general arrangement kiln area lama yang masih dipakai referensi operasi"
                  value={form.description}
                />
              </Field>
            </div>
          </Card>

          <Card className="border-border/90">
            <div className="border-b border-border/70 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Ownership Context</p>
              <h2 className="mt-2 text-2xl font-semibold text-text">Drawn by dan legacy note</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Pisahkan siapa yang menggambar dokumen dari siapa yang menginputnya ke sistem agar histori legacy tetap jujur dan mudah dipahami.
              </p>
            </div>

            <div className="mt-5 grid gap-5">
              <Field hint="Pilih drafter pemilik drawing, atau diri Anda sendiri jika memang menjadi pemilik dokumen." label="Drawn by" required>
                <Select
                  onChange={(event) => setField("drawnByUserId", event.target.value)}
                  value={form.drawnByUserId}
                >
                  <option value="">Pilih drawn by</option>
                  {drawnByOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} / {option.role}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                hint="Jelaskan bahwa approval historis sudah terjadi sebelum sistem digunakan."
                label="Legacy Ready Note"
                required
              >
                <Textarea
                  onChange={(event) => setField("legacyReadyNote", event.target.value)}
                  placeholder="Contoh: wet sign approval sudah completed sebelum migrasi ke sistem digital"
                  value={form.legacyReadyNote}
                />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/90">
            <div className="border-b border-border/70 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Ready Document</p>
              <h2 className="mt-2 text-2xl font-semibold text-text">Revision dan PDF final</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Old drawing akan langsung dianggap ready, jadi pastikan revision dan PDF yang diupload benar-benar final.
              </p>
            </div>

            <div className="mt-5 grid gap-5">
              <Field hint="Gunakan nomor revisi sesuai dokumen lama. Nilai default 0 bisa diganti jika perlu." label="Revision Number" required>
                <Input
                  onChange={(event) => setField("revisionNo", event.target.value.toUpperCase())}
                  placeholder="Contoh: 0"
                  value={form.revisionNo}
                />
              </Field>

              <Field hint="PDF wajib diunggah untuk mengimpor old drawing." label="Upload PDF" required>
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
                        {selectedFile ? "PDF legacy siap diunggah" : "Pilih file PDF"}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {selectedFile ? selectedFile.name : form.fileName || "Belum ada file yang dipilih"}
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
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Final Action</p>
              <h2 className="mt-2 text-2xl font-semibold text-text">Upload sebagai drawing siap pakai</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Tidak ada tahap Save Draft atau Submit to Check di flow ini. Begitu berhasil, drawing langsung masuk completed dan bisa diakses consumer.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <ActionPanel
                description="Upload old drawing sebagai dokumen completed dengan badge Legacy Ready. Revisi berikutnya tetap akan mengikuti workflow normal."
                title="Upload Old Drawing"
              />
              <Button
                className="w-full"
                disabled={isSubmitting}
                onClick={() => void handleSubmit()}
              >
                {isSubmitting ? "Mengunggah..." : "Upload Old Drawing"}
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
      {hint ? <p className="mt-2 text-xs leading-5 text-muted">{hint}</p> : null}
    </label>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
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
