"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { PdfPreview } from "@/components/drawings/pdf-preview";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { ApprovalAction, AuditLog, Drawing, DrawingRevision, UserRole } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import {
  canApproveRevision,
  canCheckRevision,
  canCreateRevision,
  canDownload,
  canEditRevision,
  canSubmitRevision,
  canViewDrawing
} from "@/lib/utils/permissions";

interface DrawingDetailResponse {
  drawing: Drawing;
  currentRevision: DrawingRevision | null;
  revisions: DrawingRevision[];
  approvalHistory: ApprovalAction[];
  auditLogs: AuditLog[];
}

export default function DrawingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useDemoApp();

  return (
    <AuthGuard>
      {currentUser ? (
        <DetailContent drawingId={params.id} role={currentUser.role} routerPush={router.push} />
      ) : null}
    </AuthGuard>
  );
}

function DetailContent({
  drawingId,
  role,
  routerPush
}: {
  drawingId: string;
  role: UserRole;
  routerPush: (href: string) => void;
}) {
  const [data, setData] = useState<DrawingDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isActing, setIsActing] = useState(false);

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
          setError(getErrorMessage(loadError, "Detail drawing tidak dapat dimuat."));
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
        <PageHeader eyebrow="Drawing" title="Memuat detail drawing" description="Menyiapkan data drawing..." />
        <Card>
          <p className="text-sm text-muted">Memuat detail drawing...</p>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-danger/15">
        <p className="text-sm font-medium text-danger">{error || "Detail drawing tidak tersedia."}</p>
      </Card>
    );
  }

  const { drawing, currentRevision, revisions, approvalHistory, auditLogs } = data;

  if (!canViewDrawing(role, drawing.currentStatus)) {
    return (
      <EmptyState
        actionHref="/drawings"
        actionLabel="Lihat drawing yang tersedia"
        description="Role aktif hanya boleh melihat drawing completed."
        title="Drawing ini tidak tersedia untuk role aktif"
      />
    );
  }

  if (!currentRevision) {
    return (
      <EmptyState
        actionHref="/drawings"
        actionLabel="Kembali ke daftar"
        description="Revisi aktif pada drawing ini tidak ditemukan."
        title="Revisi aktif tidak tersedia"
      />
    );
  }

  const approvalForCurrentRevision = approvalHistory.filter(
    (action) => action.revisionId === currentRevision.id
  );

  const handleSubmitRevision = async () => {
    setIsActing(true);
    setActionError("");

    try {
      await apiFetch<{ drawingId: string }>(`/api/revisions/${currentRevision.id}/submit`, {
        method: "POST"
      });
      routerPush(`/drawings/${drawing.id}`);
      window.location.reload();
    } catch (submitError) {
      setActionError(getErrorMessage(submitError, "Revisi gagal disubmit."));
    } finally {
      setIsActing(false);
    }
  };

  const handleCreateRevision = async () => {
    setIsActing(true);
    setActionError("");

    try {
      await apiFetch<{ drawingId: string }>(`/api/drawings/${drawing.id}/revisions`, {
        method: "POST"
      });
      routerPush(`/drawings/${drawing.id}/edit`);
      window.location.reload();
    } catch (revisionError) {
      setActionError(getErrorMessage(revisionError, "Revisi baru gagal dibuat."));
    } finally {
      setIsActing(false);
    }
  };

  const handleDownload = async () => {
    setIsActing(true);
    setActionError("");

    try {
      const result = await apiFetch<{ filePath: string }>(
        `/api/revisions/${currentRevision.id}/download`
      );
      window.open(result.filePath, "_blank", "noopener,noreferrer");
    } catch (downloadError) {
      setActionError(getErrorMessage(downloadError, "Dokumen final tidak dapat diunduh."));
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={drawing.drawingNumber}
        title={drawing.drawingName}
        description={drawing.description ?? "-"}
        actions={
          <>
            {canEditRevision(role, currentRevision.status) ? (
              <Link href={`/drawings/${drawing.id}/edit`}>
                <Button variant="secondary">Edit Draft</Button>
              </Link>
            ) : null}
            {canSubmitRevision(role, currentRevision.status) ? (
              <Button disabled={isActing} onClick={() => void handleSubmitRevision()}>
                Submit
              </Button>
            ) : null}
            {canCheckRevision(role, currentRevision.status) ? (
              <Link href={`/drawings/${drawing.id}/check`}>
                <Button>Check</Button>
              </Link>
            ) : null}
            {canApproveRevision(role, currentRevision.status) ? (
              <Link href={`/drawings/${drawing.id}/approve`}>
                <Button>Approve</Button>
              </Link>
            ) : null}
            {canCreateRevision(role, currentRevision.status) ? (
              <Button disabled={isActing} onClick={() => void handleCreateRevision()} variant="secondary">
                Buat Revisi Baru
              </Button>
            ) : null}
            {canDownload(role, currentRevision.status) ? (
              <Button disabled={isActing} onClick={() => void handleDownload()} variant="secondary">
                Download Final
              </Button>
            ) : null}
          </>
        }
      />

      {actionError ? <p className="text-sm font-medium text-danger">{actionError}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PdfPreview
          drawingNumber={drawing.drawingNumber}
          fileName={currentRevision.fileName}
          previewUrl={`/api/revisions/${currentRevision.id}/preview`}
          printUrl={`/api/revisions/${currentRevision.id}/print`}
          revisionNo={currentRevision.revisionNo}
          status={currentRevision.status}
          title={drawing.drawingName}
        />

        <Card className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Metadata</p>
              <h2 className="mt-2 text-2xl font-semibold text-text">Informasi drawing</h2>
            </div>
            <StatusBadge status={drawing.currentStatus} />
          </div>

          <MetadataRow label="Drawing Number" value={drawing.drawingNumber} />
          <MetadataRow label="SAC Code" value={drawing.sacCode} />
          <MetadataRow label="Area" value={drawing.area} />
          <MetadataRow label="Discipline" value={drawing.discipline} />
          <MetadataRow label="Revision Aktif" value={currentRevision.revisionNo} />
          <MetadataRow label="Submitted At" value={formatDateTime(currentRevision.submittedAt)} />
          <MetadataRow label="Created At" value={formatDate(drawing.createdAt)} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Revision History</p>
          <div className="mt-5 space-y-4">
            {revisions.map((revision) => (
              <div className="rounded-3xl border border-border bg-white p-4" key={revision.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text">Revision {revision.revisionNo}</p>
                    <p className="mt-1 text-sm text-muted">{revision.changeNote || "-"}</p>
                  </div>
                  <StatusBadge status={revision.status} />
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">
                  {formatDateTime(revision.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Approval History</p>
          <div className="mt-5 space-y-4">
            {approvalForCurrentRevision.length === 0 ? (
              <p className="text-sm text-muted">Belum ada keputusan approval untuk revisi aktif.</p>
            ) : (
              approvalForCurrentRevision.map((action) => (
                <div className="rounded-3xl border border-border bg-white p-4" key={action.id}>
                  <p className="text-sm font-semibold text-text">
                    Level {action.approvalLevel} • {action.decision}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">{action.decisionNote || "-"}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">
                    {formatDateTime(action.actedAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Audit Timeline</p>
          <div className="mt-5 space-y-4">
            {auditLogs.map((item) => (
              <div className="rounded-3xl border border-border bg-white p-4" key={item.id}>
                <p className="text-sm font-semibold text-text">{item.action}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{item.note}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">
                  {formatDateTime(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
