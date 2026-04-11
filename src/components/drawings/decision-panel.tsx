"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getErrorMessage } from "@/lib/api-client";

interface DecisionImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export function DecisionPanel({
  endpoint,
  approveLabel,
  description,
  eyebrow = "Review Decision",
  buildPayload,
  children,
  approveDisabled = false
}: {
  endpoint: string;
  approveLabel: string;
  description: string;
  eyebrow?: string;
  buildPayload?: (params: {
    decision: "APPROVED" | "REJECTED";
    note: string;
    signPdf: boolean;
  }) => Record<string, unknown>;
  children?: ReactNode;
  approveDisabled?: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [signPdf, setSignPdf] = useState(true);
  const [selectedDecision, setSelectedDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [decisionImages, setDecisionImages] = useState<DecisionImageItem[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    return () => {
      decisionImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [decisionImages]);

  const replaceDecisionImages = (files: File[]) => {
    setDecisionImages((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.previewUrl));

      return files.slice(0, 3).map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        file,
        previewUrl: URL.createObjectURL(file)
      }));
    });
  };

  const appendDecisionImages = (files: File[]) => {
    setDecisionImages((current) => {
      const nextFiles = [...current];

      for (const file of files) {
        if (nextFiles.length >= 3) {
          break;
        }

        nextFiles.push({
          id: `${file.name}-${file.lastModified}-${nextFiles.length}`,
          file,
          previewUrl: URL.createObjectURL(file)
        });
      }

      return nextFiles;
    });
  };

  const removeDecisionImage = (id: string) => {
    setDecisionImages((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((item) => item.id !== id);
    });
  };

  const handleDecision = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const payload = new FormData();
      payload.set("decision", selectedDecision);
      payload.set("note", note);
      payload.set("signPdf", String(signPdf));

      if (selectedDecision === "REJECTED") {
        decisionImages.forEach((item) => payload.append("decisionImages", item.file));
      }

      if (buildPayload) {
        const extraPayload = buildPayload({ decision: selectedDecision, note, signPdf });

        Object.entries(extraPayload).forEach(([key, value]) => {
          if (value === undefined) {
            return;
          }

          if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            payload.set(key, String(value));
            return;
          }

          payload.set(key, JSON.stringify(value));
        });
      }

      const result = await apiFetch<{ drawingId: string }>(endpoint, {
        method: "POST",
        body: payload
      });

      router.push(`/drawings/${result.drawingId}`);
      router.refresh();
    } catch (decisionError) {
      setError(getErrorMessage(decisionError, "Gagal memproses keputusan."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">{eyebrow}</p>
      <h3 className="mt-3 text-xl font-semibold text-text">{approveLabel}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setSelectedDecision("APPROVED");
            replaceDecisionImages([]);
          }}
          variant={selectedDecision === "APPROVED" ? "primary" : "secondary"}
        >
          Approved
        </Button>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setSelectedDecision("REJECTED");
            setSignPdf(true);
          }}
          variant={selectedDecision === "REJECTED" ? "danger" : "secondary"}
        >
          Rejected
        </Button>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold text-text">Catatan Review</label>
        <Textarea
          onChange={(event) => setNote(event.target.value)}
          placeholder="Tulis catatan approved atau alasan rejected"
          value={note}
        />
        <p className="mt-2 text-xs leading-5 text-muted">
          Tambahkan catatan teks seperti biasa. Saat mode Rejected aktif, Anda juga bisa melampirkan gambar tambahan agar revisi lebih jelas.
        </p>
      </div>

      {selectedDecision === "REJECTED" ? (
        <div className="mt-5 rounded-[24px] border border-border bg-panel/28 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-text">Gambar tambahan untuk reject note</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Upload maksimal 3 gambar untuk memperjelas area revisi atau catatan penolakan.
              </p>
            </div>
            <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-text">
              {decisionImages.length}/3 gambar
            </span>
          </div>

          {decisionImages.length > 0 ? (
            <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
              {decisionImages.map((item, index) => (
                <div
                  className="relative min-w-[118px] max-w-[134px] overflow-hidden rounded-[20px] border border-border bg-white shadow-[0_8px_18px_rgba(35,40,51,0.06)] sm:min-w-0 sm:max-w-none"
                  key={item.id}
                >
                  <button
                    aria-label={`Hapus gambar ${index + 1}`}
                    className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/45 bg-[#232833]/76 text-white shadow-sm backdrop-blur-sm transition hover:border-danger/50 hover:bg-danger"
                    onClick={() => removeDecisionImage(item.id)}
                    type="button"
                  >
                    <DeleteIcon />
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={`Preview gambar reject ${index + 1}`}
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
          ) : null}

          <label
            className={`mt-4 block rounded-[22px] border border-dashed p-4 transition ${
              decisionImages.length >= 3
                ? "cursor-not-allowed border-border/80 bg-panel/18 opacity-75"
                : "cursor-pointer border-brand/30 bg-brand/5 hover:border-brand/45 hover:bg-brand/7"
            }`}
          >
            <input
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="sr-only"
              disabled={decisionImages.length >= 3}
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                appendDecisionImages(files);
                event.currentTarget.value = "";
              }}
              type="file"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text">
                  {decisionImages.length > 0 ? "Tambah gambar reject" : "Pilih gambar catatan"}
                </p>
                <p className="mt-1 max-w-[28rem] text-sm leading-6 text-muted">
                  {decisionImages.length > 0
                    ? "Tambahkan gambar lagi jika masih kurang dari 3, atau hapus gambar tertentu bila tidak diperlukan."
                    : "JPG, PNG, WEBP, atau SVG. Maksimal 3 MB per file."}
                </p>
              </div>
              <span className="inline-flex items-center justify-center self-start rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-text sm:self-auto">
                {decisionImages.length >= 3
                  ? "Image Limit Reached"
                  : decisionImages.length > 0
                    ? "Add Images"
                    : "Browse Images"}
              </span>
            </div>
          </label>
        </div>
      ) : null}

      {children ? <div className="mt-5">{children}</div> : null}

      {selectedDecision === "APPROVED" ? (
        <label className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-panel/35 px-4 py-3">
          <input
            checked={signPdf}
            className="mt-1 h-4 w-4 rounded border-border text-brand accent-brand"
            onChange={(event) => setSignPdf(event.target.checked)}
            type="checkbox"
          />
          <div>
            <p className="text-sm font-semibold text-text">Tambahkan e-sign pada PDF</p>
            <p className="text-xs leading-5 text-muted">
              Opsi ini hanya berlaku saat keputusan Approved. Sistem akan menambahkan stempel digital berisi nama approver, role, dan waktu keputusan.
            </p>
          </div>
        </label>
      ) : null}

      {error ? <p className="mt-4 text-sm font-medium text-danger">{error}</p> : null}

      <div className="mt-6 flex flex-col gap-3">
        <Button
          className="w-full"
          disabled={isSubmitting || (selectedDecision === "APPROVED" && approveDisabled)}
          onClick={() => void handleDecision()}
          variant={selectedDecision === "REJECTED" ? "danger" : "primary"}
        >
          {selectedDecision === "APPROVED" ? approveLabel : "Submit Rejected"}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted">
        Catatan wajib diisi bila keputusan akhir adalah Rejected.
      </p>
    </Card>
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
