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
  revisionNo: "A",
  fileName: "",
  changeNote: ""
};

export function DrawingForm({
  initialValues,
  drawingId,
  mode
}: {
  initialValues?: DrawingFormInput;
  drawingId?: string;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [form, setForm] = useState<DrawingFormInput>(initialValues ?? defaultValues);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <Card className="border-border/90">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <Field label="Drawing Number" required>
            <Input
              onChange={(event) => setField("drawingNumber", event.target.value)}
              placeholder="Contoh: DRW-009"
              value={form.drawingNumber}
            />
          </Field>
          <Field label="Drawing Name" required>
            <Input
              onChange={(event) => setField("drawingName", event.target.value)}
              placeholder="Nama drawing"
              value={form.drawingName}
            />
          </Field>
          <Field label="SAC / SBI Asset Code" required>
            <Input
              onChange={(event) => setField("sacCode", event.target.value)}
              placeholder="Contoh: SAC-2009"
              value={form.sacCode}
            />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Area" required>
              <Input
                onChange={(event) => setField("area", event.target.value)}
                placeholder="Area kerja"
                value={form.area}
              />
            </Field>
            <Field label="Discipline" required>
              <Input
                onChange={(event) => setField("discipline", event.target.value)}
                placeholder="Mechanical / Piping / Structural"
                value={form.discipline}
              />
            </Field>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Revision Number" required>
              <Input
                onChange={(event) => setField("revisionNo", event.target.value)}
                placeholder="A"
                value={form.revisionNo}
              />
            </Field>
            <Field label="Upload PDF" required>
              <div className="rounded-3xl border border-dashed border-brand/35 bg-brand/5 p-3">
                <Input
                  accept="application/pdf"
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
                <p className="mt-2 text-xs text-muted">
                  File aktif: <span className="font-semibold text-text">{form.fileName || "-"}</span>
                </p>
              </div>
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              onChange={(event) => setField("description", event.target.value)}
              placeholder="Deskripsi singkat drawing"
              value={form.description}
            />
          </Field>
          <Field label="Change Note">
            <Textarea
              onChange={(event) => setField("changeNote", event.target.value)}
              placeholder="Catatan perubahan revisi"
              value={form.changeNote}
            />
          </Field>
        </div>
      </div>

      {error ? <p className="mt-5 text-sm font-medium text-danger">{error}</p> : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button disabled={isSubmitting} onClick={() => void handleSave(false)} variant="secondary">
          {mode === "create" ? "Simpan Draft" : "Update Draft"}
        </Button>
        <Button disabled={isSubmitting} onClick={() => void handleSave(true)}>
          {mode === "create" ? "Submit untuk Check" : "Update dan Submit"}
        </Button>
      </div>
    </Card>
  );
}

function Field({
  label,
  children,
  required
}: {
  label: string;
  children: ReactNode;
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
