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
import { canApproveRevision } from "@/lib/utils/permissions";

interface DrawingDetailResponse {
  drawing: Drawing;
  currentRevision: DrawingRevision | null;
}

export default function ApprovePage() {
  const params = useParams<{ id: string }>();
  const { currentUser } = useDemoApp();

  return (
    <AuthGuard allowedRoles={["APPROVER_L1", "HEAD", "ADMIN"]}>
      {currentUser ? <ApproveContent drawingId={params.id} role={currentUser.role} /> : null}
    </AuthGuard>
  );
}

function ApproveContent({
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
      <div className="space-y-8">
        <PageHeader
          eyebrow="Approval"
          title="Memuat data Drawing"
          description="Menyiapkan dokumen dan metadata sebelum halaman approval ditampilkan."
        />
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="h-[620px] animate-pulse bg-white/70" />
          <div className="space-y-6">
            <Card className="h-72 animate-pulse bg-white/70" />
            <Card className="h-80 animate-pulse bg-white/70" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.drawing) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Approval"
          title="Halaman approval belum tersedia"
          description="Terjadi kendala saat mengambil data drawing."
        />
        <Card className="border-danger/15 bg-white/70">
          <p className="text-sm font-medium text-danger">
            {error || "Data drawing tidak ditemukan."}
          </p>
        </Card>
      </div>
    );
  }

  const { drawing, currentRevision: revision } = data;

  if (!revision || !canApproveRevision(role, revision.status)) {
    return (
      <EmptyState
        actionHref={`/drawings/${drawing.id}`}
        actionLabel="Kembali ke Detail Drawing"
        description="Halaman approval hanya aktif untuk revision yang menunggu level approval sesuai role."
        title="Tidak ada item yang bisa di-approve"
      />
    );
  }

  const isHeadStep = revision.status === "WAITING_APPROVAL_2";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={drawing.drawingNumber}
        title={isHeadStep ? "Final Approval" : "Approval Level 1"}
        description="Keputusan Approved akan memindahkan revision ke tahap berikutnya. Pada tahap final, status Drawing akan berubah menjadi completed."
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
                  Approval Summary
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-text">{drawing.drawingName}</h2>
              </div>
              <StatusBadge status={revision.status} />
            </div>
            <div className="mt-5 grid gap-3">
              <QuickRow label="SAC Code" value={drawing.sacCode} />
              <QuickRow label="Area" value={drawing.area} />
              <QuickRow label="Discipline" value={drawing.discipline} />
              <QuickRow label="Current Revision" value={revision.revisionNo} />
            </div>
          </Card>
          <DecisionPanel
            approveLabel={isHeadStep ? "Mark as Approved" : "Mark as Approved"}
            description={
              isHeadStep
                ? "Jika status Approved, Drawing akan menjadi completed dan masuk mode read-only untuk consumer."
                : "Jika status Approved, drawing akan lanjut ke Final Approval."
            }
            eyebrow={isHeadStep ? "Final Approval Decision" : "Approval Decision"}
            endpoint={
              isHeadStep
                ? `/api/revisions/${revision.id}/approve-level-2`
                : `/api/revisions/${revision.id}/approve-level-1`
            }
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
