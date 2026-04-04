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
  canViewDrawing,
  getRoleLabel,
  getStatusLabel
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
  const [actionSuccess, setActionSuccess] = useState("");
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

  const refreshDetail = async () => {
    setError("");

    try {
      const response = await apiFetch<DrawingDetailResponse>(`/api/drawings/${drawingId}`);
      setData(response);
    } catch (loadError) {
      setActionError(getErrorMessage(loadError, "Detail drawing gagal diperbarui."));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Drawing Detail"
          title="Memuat detail drawing"
          description="Menyiapkan metadata, current revision, dan approval history."
        />
        <DetailLoadingState />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Drawing Detail"
          title="Detail drawing belum tersedia"
          description="Terjadi kendala saat mengambil data drawing."
        />
        <Card className="border-danger/15 bg-white/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-danger">Error</p>
              <h2 className="mt-2 text-xl font-semibold text-text">Halaman detail tidak bisa dibuka</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {error || "Detail drawing tidak tersedia."}
              </p>
            </div>
            <Button onClick={() => window.location.reload()} variant="danger">
              Muat Ulang
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { drawing, currentRevision, revisions, approvalHistory, auditLogs } = data;

  if (!canViewDrawing(role, drawing.currentStatus)) {
    return (
      <EmptyState
        actionHref="/drawings"
        actionLabel="Open Drawing List"
        description="Role aktif hanya boleh melihat drawing yang tersedia pada cakupannya."
        title="Drawing ini tidak tersedia untuk role aktif"
      />
    );
  }

  if (!currentRevision) {
    return (
      <EmptyState
        actionHref="/drawings"
        actionLabel="Open Drawing List"
        description="Current revision pada drawing ini tidak ditemukan."
        title="Current revision tidak tersedia"
      />
    );
  }

  const approvalForCurrentRevision = approvalHistory.filter(
    (action) => action.revisionId === currentRevision.id
  );

  const handleSubmitRevision = async () => {
    setIsActing(true);
    setActionError("");
    setActionSuccess("");

    try {
      await apiFetch<{ drawingId: string }>(`/api/revisions/${currentRevision.id}/submit`, {
        method: "POST"
      });
      await refreshDetail();
      setActionSuccess("Revisi berhasil dikirim untuk proses check.");
    } catch (submitError) {
      setActionError(getErrorMessage(submitError, "Revisi gagal disubmit."));
    } finally {
      setIsActing(false);
    }
  };

  const handleCreateRevision = async () => {
    setIsActing(true);
    setActionError("");
    setActionSuccess("");

    try {
      await apiFetch<{ drawingId: string }>(`/api/drawings/${drawing.id}/revisions`, {
        method: "POST"
      });
      routerPush(`/drawings/${drawing.id}/edit`);
    } catch (revisionError) {
      setActionError(getErrorMessage(revisionError, "Revisi baru gagal dibuat."));
      setIsActing(false);
    }
  };

  const handleDownload = async () => {
    setIsActing(true);
    setActionError("");
    setActionSuccess("");

    try {
      const result = await apiFetch<{ filePath: string }>(
        `/api/revisions/${currentRevision.id}/download`
      );
      window.open(result.filePath, "_blank", "noopener,noreferrer");
      setActionSuccess("Final drawing dibuka di tab baru.");
    } catch (downloadError) {
      setActionError(getErrorMessage(downloadError, "Final drawing tidak dapat dibuka."));
    } finally {
      setIsActing(false);
    }
  };

  const headerActions = (
    <>
      <Link href="/drawings">
        <Button variant="secondary">Open Drawing List</Button>
      </Link>
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
          Create Revision
        </Button>
      ) : null}
      {canDownload(role, currentRevision.status) ? (
        <Button disabled={isActing} onClick={() => void handleDownload()} variant="secondary">
          Open Final Drawing
        </Button>
      ) : null}
    </>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={drawing.drawingNumber}
        title={drawing.drawingName}
        description={
          drawing.description ||
          "Drawing ini belum memiliki deskripsi tambahan. Gunakan metadata dan riwayat revisi di bawah untuk membaca konteks dokumen."
        }
        actions={headerActions}
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="relative overflow-hidden border-transparent bg-graphite text-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
          <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          <div className="relative space-y-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/55">
                  Snapshot
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                  {getStatusLabel(drawing.currentStatus)}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
                  Current revision saat ini adalah rev {currentRevision.revisionNo} dengan status{" "}
                  {getStatusLabel(currentRevision.status).toLowerCase()}. Area kerja dan tindakan yang tersedia akan menyesuaikan dengan role aktif Anda.
                </p>
              </div>
              <StatusBadge status={drawing.currentStatus} />
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <HeroStat label="Area" value={drawing.area} />
              <HeroStat label="Discipline" value={drawing.discipline} />
              <HeroStat label="Drafter" value={drawing.drawnByName ?? drawing.drawnByUsername ?? "-"} />
              <HeroStat label="Current Revision" value={`Rev ${currentRevision.revisionNo}`} />
            </div>
          </div>
        </Card>

        <Card className="bg-white/75">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Current Revision</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Kondisi dokumen aktif</h2>

          <div className="mt-6 space-y-3">
            <MiniStatRow label="Status" value={getStatusLabel(currentRevision.status)} />
            <MiniStatRow label="File" value={currentRevision.fileName} />
            <MiniStatRow label="Submitted At" value={formatDateTime(currentRevision.submittedAt)} />
            <MiniStatRow label="Updated At" value={formatDateTime(currentRevision.updatedAt)} />
            <MiniStatRow label="Current Role" value={getRoleLabel(role)} />
          </div>
        </Card>
      </div>

      {actionSuccess ? (
        <Card className="border-brand/15 bg-white/70">
          <p className="text-sm font-medium text-brand">{actionSuccess}</p>
        </Card>
      ) : null}

      {actionError ? (
        <Card className="border-danger/15 bg-white/70">
          <p className="text-sm font-medium text-danger">{actionError}</p>
        </Card>
      ) : null}

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

        <div className="space-y-6">
          <Card className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Metadata</p>
                <h2 className="mt-2 text-2xl font-semibold text-text">Informasi drawing</h2>
              </div>
              <StatusBadge status={drawing.currentStatus} />
            </div>

            <div className="grid gap-3">
              <MetadataRow label="Drawing Number" value={drawing.drawingNumber} />
              <MetadataRow label="SAC Code" value={drawing.sacCode} />
              <MetadataRow label="Area" value={drawing.area} />
              <MetadataRow label="Discipline" value={drawing.discipline} />
              <MetadataRow label="Drafter" value={drawing.drawnByName ?? drawing.drawnByUsername ?? "-"} />
              <MetadataRow label="Created At" value={formatDate(drawing.createdAt)} />
            </div>
          </Card>

          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Next Step</p>
            <h2 className="mt-2 text-2xl font-semibold text-text">Langkah berikutnya</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {getNextStepMessage(role, currentRevision.status)}
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Revision History</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Riwayat revisi</h2>
          <div className="mt-5 space-y-4">
            {revisions.map((revision) => (
              <div className="rounded-[24px] border border-border bg-white p-4" key={revision.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text">Rev {revision.revisionNo}</p>
                    <p className="mt-1 text-sm text-muted">{revision.changeNote || "Tanpa catatan perubahan."}</p>
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
          <h2 className="mt-2 text-2xl font-semibold text-text">Keputusan revisi aktif</h2>
          <div className="mt-5 space-y-4">
            {approvalForCurrentRevision.length === 0 ? (
              <EmptyState
                description="Belum ada keputusan approval untuk revisi aktif ini."
                title="Approval masih kosong"
              />
            ) : (
              approvalForCurrentRevision.map((action) => (
                <div className="rounded-[24px] border border-border bg-white p-4" key={action.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">
                        Level {action.approvalLevel} / {humanizeDecision(action.decision)}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Diproses oleh role {getRoleLabel(action.actorRole)}.
                      </p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">
                      {formatDateTime(action.actedAt)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {action.decisionNote || "Tidak ada catatan keputusan."}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Audit Timeline</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Jejak aktivitas</h2>
          <div className="mt-5 space-y-4">
            {auditLogs.length === 0 ? (
              <EmptyState
                description="Belum ada aktivitas audit yang tercatat untuk drawing ini."
                title="Timeline masih kosong"
              />
            ) : (
              auditLogs.map((item) => (
                <div className="rounded-[24px] border border-border bg-white p-4" key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{humanizeAuditAction(item.action)}</p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {item.note || "Tidak ada catatan tambahan."}
                      </p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function DetailLoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="h-56 bg-graphite/95" />
        <Card className="h-56 bg-white/70" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="h-[620px] bg-white/70" />
        <div className="space-y-6">
          <Card className="h-80 bg-white/70" />
          <Card className="h-40 bg-white/70" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="h-72 bg-white/70" />
        <Card className="h-72 bg-white/70" />
        <Card className="h-72 bg-white/70" />
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

function MiniStatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3">
      <p className="text-sm font-semibold text-text">{label}</p>
      <p className="text-sm text-muted">{value}</p>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function humanizeDecision(value: ApprovalAction["decision"]) {
  return value === "APPROVED" ? "Approved" : "Rejected";
}

function humanizeAuditAction(action: string) {
  const labels: Record<string, string> = {
    DRAWING_CREATED: "Drawing dibuat",
    DRAWING_CREATED_AND_SUBMITTED: "Drawing dibuat dan dikirim",
    DRAWING_UPDATED: "Drawing diperbarui",
    DRAWING_UPDATED_AND_SUBMITTED: "Drawing diperbarui dan dikirim",
    DRAWING_DELETED: "Drawing dihapus",
    REVISION_CREATED: "Revisi baru dibuat",
    SUBMITTED_FOR_CHECK: "Revisi dikirim untuk check",
    WAITING_APPROVAL_1: "Lolos check dan menunggu approval level 1",
    WAITING_APPROVAL_2: "Lolos approval level 1",
    CHECK_REJECTED: "Check ditolak",
    APPROVAL_1_REJECTED: "Approval level 1 rejected",
    APPROVAL_2_REJECTED: "Final approval rejected",
    COMPLETED: "Drawing completed",
    DRAWING_DOWNLOADED: "Final drawing diunduh"
  };

  return labels[action] ?? action.replace(/_/g, " ").toLowerCase();
}

function getNextStepMessage(role: UserRole, status: DrawingRevision["status"]) {
  if (canEditRevision(role, status)) {
    return "Dokumen ini masih berada pada tahap yang bisa Anda edit. Lengkapi perubahan lalu kirim ke tahap check saat sudah siap.";
  }

  if (canSubmitRevision(role, status)) {
    return "Current revision dapat langsung dikirim untuk proses check setelah semua perbaikan diverifikasi.";
  }

  if (canCheckRevision(role, status)) {
    return "Periksa dokumen ini dari sisi teknis, lalu teruskan ke tahap approval berikutnya atau kembalikan dengan catatan yang jelas.";
  }

  if (canApproveRevision(role, status)) {
    return "Dokumen ini sudah siap Anda review sebagai approver. Pastikan catatan dan stempel keputusan sesuai sebelum melanjutkan.";
  }

  if (canCreateRevision(role, status)) {
    return "Drawing ini sudah selesai. Jika perlu perubahan baru, buat revisi lanjutan agar histori tetap rapi dan terlacak.";
  }

  if (canDownload(role, status)) {
    return "Final drawing sudah tersedia untuk dibuka. Gunakan versi completed sebagai referensi kerja utama.";
  }

  return "Gunakan halaman ini untuk membaca konteks drawing, memeriksa riwayat, dan mengikuti progres dokumen.";
}
