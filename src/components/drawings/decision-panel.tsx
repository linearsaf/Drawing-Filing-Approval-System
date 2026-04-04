"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getErrorMessage } from "@/lib/api-client";

export function DecisionPanel({
  endpoint,
  approveLabel,
  description,
  eyebrow = "Review Decision"
}: {
  endpoint: string;
  approveLabel: string;
  description: string;
  eyebrow?: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [signPdf, setSignPdf] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDecision = async (decision: "APPROVED" | "REJECTED") => {
    setIsSubmitting(true);
    setError("");

    try {
      const result = await apiFetch<{ drawingId: string }>(endpoint, {
        method: "POST",
        body: JSON.stringify({
          decision,
          note,
          signPdf
        })
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

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold text-text">Catatan Review</label>
        <Textarea
          onChange={(event) => setNote(event.target.value)}
          placeholder="Tulis catatan approved atau alasan rejected"
          value={note}
        />
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-panel/35 px-4 py-3">
        <input
          checked={signPdf}
          className="mt-1 h-4 w-4 rounded border-border text-brand accent-brand"
          onChange={(event) => setSignPdf(event.target.checked)}
          type="checkbox"
        />
        <div>
          <p className="text-sm font-semibold text-text">Tambahkan e-sign pada PDF jika status Approved</p>
          <p className="text-xs leading-5 text-muted">
            Sistem akan menambahkan stempel digital berisi nama approver, role, dan waktu keputusan.
          </p>
        </div>
      </label>

      {error ? <p className="mt-4 text-sm font-medium text-danger">{error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button disabled={isSubmitting} onClick={() => void handleDecision("APPROVED")}>
          {approveLabel}
        </Button>
        <Button
          disabled={isSubmitting}
          onClick={() => void handleDecision("REJECTED")}
          variant="danger"
        >
          Mark as Rejected
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted">
        Catatan wajib diisi bila keputusan akhir adalah Rejected.
      </p>
    </Card>
  );
}
