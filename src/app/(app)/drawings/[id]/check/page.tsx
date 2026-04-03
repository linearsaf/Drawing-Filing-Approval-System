"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { DecisionPanel } from "@/components/drawings/decision-panel";
import { PdfPreview } from "@/components/drawings/pdf-preview";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { Drawing, DrawingRevision, UserRole } from "@/lib/types";
import { canCheckRevision } from "@/lib/utils/permissions";

interface DrawingDetailResponse {
  drawing: Drawing;
  currentRevision: DrawingRevision | null;
}

export default function CheckPage() {
  const params = useParams<{ id: string }>();
  const { currentUser } = useDemoApp();

  return (
    <AuthGuard allowedRoles={["DRAFT_LEADER", "ADMIN"]}>
      {currentUser ? <CheckContent drawingId={params.id} role={currentUser.role} /> : null}
    </AuthGuard>
  );
}

function CheckContent({
  drawingId,
  role
}: {
  drawingId: string;
  role: UserRole;
}) {
  const [data, setData] = useState<DrawingDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiFetch<DrawingDetailResponse>(`/api/drawings/${drawingId}`);

        if (!cancelled) {
          setData(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, "Data drawing tidak dapat dimuat."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [drawingId]);

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-muted">Memuat data drawing...</p>
      </Card>
    );
  }

  if (error || !data?.drawing) {
    return (
      <Card className="border-danger/15">
        <p className="text-sm font-medium text-danger">{error || "Data drawing tidak ditemukan."}</p>
      </Card>
    );
  }

  const { drawing, currentRevision: revision } = data;

  if (!revision || !canCheckRevision(role, revision.status)) {
    return (
      <EmptyState
        actionHref={`/drawings/${drawing.id}`}
        actionLabel="Kembali ke detail"
        description="Halaman check hanya aktif untuk revision dengan status WAITING_CHECK."
        title="Tidak ada item yang bisa di-check"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={drawing.drawingNumber}
        title="Draft Leader Check"
        description="Tinjau metadata dan dokumen sebelum memutuskan approve atau reject."
      />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <PdfPreview
          drawingNumber={drawing.drawingNumber}
          fileName={revision.fileName}
          previewUrl={`/api/revisions/${revision.id}/preview`}
          printUrl={`/api/revisions/${revision.id}/print`}
          revisionNo={revision.revisionNo}
          status={revision.status}
          title={drawing.drawingName}
        />
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">
                  Metadata Summary
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-text">{drawing.drawingName}</h2>
              </div>
              <StatusBadge status={revision.status} />
            </div>
            <div className="mt-5 grid gap-3">
              <QuickRow label="SAC Code" value={drawing.sacCode} />
              <QuickRow label="Area" value={drawing.area} />
              <QuickRow label="Discipline" value={drawing.discipline} />
              <QuickRow label="Revision" value={revision.revisionNo} />
            </div>
          </Card>
          <DecisionPanel
            approveLabel="Approve Check"
            description="Jika approve, drawing akan lanjut ke approval level 1. Jika reject, catatan wajib dan status kembali ke drafter."
            endpoint={`/api/revisions/${revision.id}/check`}
          />
        </div>
      </div>
    </div>
  );
}

function QuickRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
