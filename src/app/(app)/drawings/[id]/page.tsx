"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { PdfPreview } from "@/components/drawings/pdf-preview";
import { WorkflowSourceBadge } from "@/components/drawings/workflow-source-badge";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import {
  ApprovalAction,
  ApproverOption,
  AuditLog,
  Drawing,
  DrawingRevision,
  RevisionApprovalStep,
  UserRole
} from "@/lib/types";
import { formatDate, formatDateTime, formatDateTimeParts } from "@/lib/utils/format";
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
  approvalPlan: RevisionApprovalStep[];
  activeApprovalLevel: 1 | 2 | null;
  canCurrentUserApprove: boolean;
  auditLogs: AuditLog[];
}

export default function DrawingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useDemoApp();

  return (
    <AuthGuard>
      {currentUser ? (
        <DetailContent
          drawingId={params.id}
          role={currentUser.role}
          routerPush={router.push}
          userId={currentUser.id}
        />
      ) : null}
    </AuthGuard>
  );
}

function DetailContent({
  drawingId,
  role,
  routerPush,
  userId
}: {
  drawingId: string;
  role: UserRole;
  routerPush: (href: string) => void;
  userId: string;
}) {
  const [data, setData] = useState<DrawingDetailResponse | null>(null);
  const [level1Approvers, setLevel1Approvers] = useState<ApproverOption[]>([]);
  const [level2Approvers, setLevel2Approvers] = useState<ApproverOption[]>([]);
  const [level1ApproverId, setLevel1ApproverId] = useState("");
  const [level2ApproverId, setLevel2ApproverId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [isActing, setIsActing] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

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

  useEffect(() => {
    setLevel1ApproverId(data?.approvalPlan.find((step) => step.approvalLevel === 1)?.assignedUserId ?? "");
    setLevel2ApproverId(data?.approvalPlan.find((step) => step.approvalLevel === 2)?.assignedUserId ?? "");
  }, [data]);

  useEffect(() => {
    if (!["DRAFT_LEADER", "ADMIN"].includes(role)) {
      return;
    }

    let cancelled = false;

    const loadApprovers = async () => {
      try {
        const [level1Response, level2Response] = await Promise.all([
          apiFetch<{ items: ApproverOption[] }>("/api/users/approvers?level=1"),
          apiFetch<{ items: ApproverOption[] }>("/api/users/approvers?level=2")
        ]);

        if (!cancelled) {
          setLevel1Approvers(level1Response.items);
          setLevel2Approvers(level2Response.items);
        }
      } catch {
        if (!cancelled) {
          setLevel1Approvers([]);
          setLevel2Approvers([]);
        }
      }
    };

    void loadApprovers();

    return () => {
      cancelled = true;
    };
  }, [role]);

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

  const {
    drawing,
    currentRevision,
    revisions,
    approvalHistory,
    approvalPlan,
    activeApprovalLevel,
    canCurrentUserApprove,
    auditLogs
  } = data;

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
  const level1Step = approvalPlan.find((step) => step.approvalLevel === 1) ?? null;
  const level2Step = approvalPlan.find((step) => step.approvalLevel === 2) ?? null;
  const canManageApprovalPlan =
    ["DRAFT_LEADER", "ADMIN"].includes(role) &&
    ["WAITING_APPROVAL_1", "WAITING_APPROVAL_2"].includes(currentRevision.status);
  const isOwnedByCurrentUser = drawing.createdBy === userId;
  const canCreateFollowUpRevision = canCreateRevision(
    role,
    currentRevision.status,
    isOwnedByCurrentUser
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

  const handleSaveApprovalPlan = async () => {
    setIsSavingPlan(true);
    setActionError("");
    setActionSuccess("");

    try {
      await apiFetch<{ revisionId: string }>(`/api/revisions/${currentRevision.id}/approval-plan`, {
        method: "PATCH",
        body: JSON.stringify(
          currentRevision.status === "WAITING_APPROVAL_2"
            ? {
                level2ApproverId: level2ApproverId || null
              }
            : {
                level1ApproverId,
                level2ApproverId: level2ApproverId || null
              }
        )
      });
      await refreshDetail();
      setActionSuccess("Approval plan berhasil diperbarui.");
    } catch (planError) {
      setActionError(getErrorMessage(planError, "Approval plan gagal diperbarui."));
    } finally {
      setIsSavingPlan(false);
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
      {canApproveRevision(role, currentRevision.status, canCurrentUserApprove) ? (
        <Link href={`/drawings/${drawing.id}/approve`}>
          <Button>Approve</Button>
        </Link>
      ) : null}
      {canCreateFollowUpRevision ? (
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
                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {getStatusLabel(drawing.currentStatus)}
                </h2>
                <div className="mt-3">
                  <WorkflowSourceBadge source={drawing.workflowSource} />
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72 sm:text-sm">
                  Current revision saat ini adalah rev {currentRevision.revisionNo} dengan status{" "}
                  {getStatusLabel(currentRevision.status).toLowerCase()}. Area kerja dan tindakan yang tersedia akan menyesuaikan dengan role aktif Anda.
                </p>
              </div>
              <StatusBadge status={drawing.currentStatus} />
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
            <MiniStatRow
              label="Workflow Source"
              value={drawing.workflowSource === "LEGACY_READY" ? "Legacy Ready" : "Standard"}
            />
            <MiniStatRow label="Status" value={getStatusLabel(currentRevision.status)} />
            <MiniStatRow label="File" value={currentRevision.fileName} />
            <MiniStatRow label="Submitted At" value={formatDateTime(currentRevision.submittedAt)} />
            <MiniStatRow label="Updated At" value={formatDateTime(currentRevision.updatedAt)} />
            <MiniStatRow label="Current Role" value={getRoleLabel(role)} />
            <MiniStatRow
              label="Active Approval"
              value={
                activeApprovalLevel
                  ? `Level ${activeApprovalLevel}`
                  : currentRevision.status === "COMPLETED"
                    ? "Selesai"
                    : "Belum aktif"
              }
            />
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
          downloadUrl={`/api/revisions/${currentRevision.id}/preview?download=1`}
          drawingNumber={drawing.drawingNumber}
          fileName={currentRevision.fileName}
          previewUrl={`/api/revisions/${currentRevision.id}/preview`}
          printUrl={`/api/revisions/${currentRevision.id}/print`}
          revisionNo={currentRevision.revisionNo}
          status={currentRevision.status}
          title={drawing.drawingName}
        />

        <div className="flex flex-col gap-4">
          <Card className="order-2 space-y-5 xl:order-1">
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
              <MetadataRow label="Uploaded by" value={drawing.uploadedByName ?? drawing.uploadedByUsername ?? "-"} />
              {drawing.workflowSource === "LEGACY_READY" ? (
                <MetadataRow label="Legacy Ready Note" value={drawing.legacyReadyNote ?? "-"} />
              ) : null}
              <MetadataRow label="Created At" value={formatDate(drawing.createdAt)} />
            </div>
          </Card>

          <Card className="order-1 xl:order-2">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Next Step</p>
            <h2 className="mt-2 text-2xl font-semibold text-text">Langkah berikutnya</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {getNextStepMessage(
                role,
                currentRevision.status,
                canCurrentUserApprove,
                isOwnedByCurrentUser
              )}
            </p>
          </Card>

          <CollapsibleInfoCard
            className="order-3 xl:order-3"
            contentClassName="space-y-0"
            defaultOpen
            eyebrow="Approval Plan"
            title="Routing approver revisi aktif"
          >
            <div className="mt-5 space-y-3">
              <ApprovalStepRow
                isActive={activeApprovalLevel === 1}
                note={level1Step?.state === "UNASSIGNED" ? "Belum ditentukan. Approval tidak bisa diproses." : null}
                step={level1Step}
                title="Level 1"
              />
              <ApprovalStepRow
                isActive={activeApprovalLevel === 2}
                note={!level2Step ? "Tidak digunakan. Revisi akan selesai setelah approval level 1." : null}
                step={level2Step}
                title="Level 2"
              />
            </div>

            {canManageApprovalPlan ? (
              <div className="mt-5 space-y-4 rounded-[24px] border border-border bg-panel/28 p-4">
                <div>
                  <p className="text-sm font-semibold text-text">Reassign approver</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Draft Leader dan Admin dapat mengganti approver yang belum bertindak untuk menjaga workflow tetap bergerak.
                  </p>
                </div>

                {currentRevision.status === "WAITING_APPROVAL_1" ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-text">Approver Level 1</span>
                    <Select
                      onChange={(event) => setLevel1ApproverId(event.target.value)}
                      value={level1ApproverId}
                    >
                      <option value="">Pilih approver level 1</option>
                      {level1Approvers.map((approver) => (
                        <option key={approver.id} value={approver.id}>
                          {approver.name} / {approver.role === "ADMIN" ? "Admin" : "Approver L1"}
                        </option>
                      ))}
                    </Select>
                  </label>
                ) : null}

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-text">
                    Approver Level 2{currentRevision.status === "WAITING_APPROVAL_1" ? " (Opsional)" : ""}
                  </span>
                  <Select
                    onChange={(event) => setLevel2ApproverId(event.target.value)}
                    value={level2ApproverId}
                  >
                    {currentRevision.status === "WAITING_APPROVAL_1" ? (
                      <option value="">Lewati final approval</option>
                    ) : null}
                    {level2Approvers.map((approver) => (
                      <option key={approver.id} value={approver.id}>
                        {approver.name} / {approver.role === "ADMIN" ? "Admin" : "Head"}
                      </option>
                    ))}
                  </Select>
                </label>

                <Button
                  disabled={
                    isSavingPlan ||
                    (currentRevision.status === "WAITING_APPROVAL_1" && !level1ApproverId) ||
                    (currentRevision.status === "WAITING_APPROVAL_2" && !level2ApproverId)
                  }
                  onClick={() => void handleSaveApprovalPlan()}
                  variant="secondary"
                >
                  {isSavingPlan ? "Menyimpan..." : "Update Approval Plan"}
                </Button>
              </div>
            ) : null}
          </CollapsibleInfoCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <CollapsibleInfoCard
          contentClassName="space-y-4"
          defaultOpen
          eyebrow="Revision History"
          title="Riwayat revisi"
        >
          {revisions.map((revision) => (
            <div className="rounded-[24px] border border-border bg-white p-4" key={revision.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text">Rev {revision.revisionNo}</p>
                  <p className="mt-1 text-sm text-muted">{revision.changeNote || "Tanpa catatan perubahan."}</p>
                </div>
                <StatusBadge status={revision.status} />
              </div>
              <TimelineTimestamp value={revision.updatedAt} className="mt-3" />
            </div>
          ))}
        </CollapsibleInfoCard>

        <CollapsibleInfoCard
          contentClassName="space-y-4"
          defaultOpen
          eyebrow="Approval History"
          title="Keputusan revisi aktif"
        >
          {approvalForCurrentRevision.length === 0 ? (
            <EmptyState
              description={
                drawing.workflowSource === "LEGACY_READY"
                  ? "Approval historis terjadi sebelum sistem ini digunakan, sehingga revisi legacy ini tidak memiliki keputusan digital di dalam aplikasi."
                  : "Belum ada keputusan approval untuk revisi aktif ini."
              }
              title={
                drawing.workflowSource === "LEGACY_READY"
                  ? "Approval historis berada di luar sistem"
                  : "Approval masih kosong"
              }
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
                  <TimelineTimestamp value={action.actedAt} />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {action.decisionNote || "Tidak ada catatan keputusan."}
                </p>
                {(action.decisionImagePaths?.length ?? 0) > 0 ? (
                  <ApprovalDecisionImages imagePaths={action.decisionImagePaths ?? []} />
                ) : null}
              </div>
            ))
          )}
        </CollapsibleInfoCard>

        <CollapsibleInfoCard
          contentClassName="space-y-4"
          defaultOpen
          eyebrow="Audit Timeline"
          title="Jejak aktivitas"
        >
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
                  <TimelineTimestamp value={item.createdAt} />
                </div>
              </div>
            ))
          )}
        </CollapsibleInfoCard>
      </div>
    </div>
  );
}

function DetailLoadingState() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="h-56 bg-graphite/95" />
        <Card className="h-56 bg-white/70" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="h-[620px] bg-white/70" />
        <div className="space-y-4">
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

function ApprovalStepRow({
  title,
  step,
  isActive,
  note
}: {
  title: string;
  step: RevisionApprovalStep | null;
  isActive?: boolean;
  note?: string | null;
}) {
  const assignee = step?.assignedUserName ?? step?.assignedUserUsername ?? "Belum ditentukan";

  return (
    <div
      className={`rounded-[24px] border px-4 py-3 ${
        isActive ? "border-brand/30 bg-brand/6" : "border-border bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">{title}</p>
          <p className="mt-1 text-sm text-muted">{assignee}</p>
        </div>
        <span className="rounded-full border border-border bg-panel/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text">
          {step ? humanizeApprovalStepState(step.state) : "Not Used"}
        </span>
      </div>
      {note ? <p className="mt-3 text-sm leading-6 text-muted">{note}</p> : null}
    </div>
  );
}

function CollapsibleInfoCard({
  eyebrow,
  title,
  children,
  defaultOpen = false,
  className = "",
  contentClassName = ""
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={className}>
      <details className="group" open={defaultOpen}>
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">{eyebrow}</p>
            <h2 className="mt-2 text-xl font-semibold text-text sm:text-2xl">{title}</h2>
          </div>
          <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-panel/26 text-sm font-semibold text-text transition group-open:rotate-180">
            <CollapseChevronIcon />
          </span>
        </summary>
        <div className={`mt-5 ${contentClassName}`.trim()}>{children}</div>
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

function TimelineTimestamp({
  value,
  className = ""
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const parts = formatDateTimeParts(value);

  return (
    <div
      className={`shrink-0 text-right text-[11px] font-medium leading-4 text-muted sm:min-w-[66px] ${className}`.trim()}
    >
      <p>{parts.date}</p>
      <p>{parts.time}</p>
    </div>
  );
}

function ApprovalDecisionImages({ imagePaths }: { imagePaths: string[] }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Lampiran catatan</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {imagePaths.map((imagePath, index) => (
          <a
            className="overflow-hidden rounded-[18px] border border-border bg-panel/18 transition hover:border-brand/30 hover:bg-brand/5"
            href={imagePath}
            key={`${imagePath}-${index}`}
            rel="noreferrer"
            target="_blank"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={`Lampiran catatan approval ${index + 1}`}
              className="h-28 w-full object-cover"
              src={imagePath}
            />
          </a>
        ))}
      </div>
    </div>
  );
}

function humanizeDecision(value: ApprovalAction["decision"]) {
  return value === "APPROVED" ? "Approved" : "Rejected";
}

function humanizeApprovalStepState(value: RevisionApprovalStep["state"]) {
  const labels: Record<RevisionApprovalStep["state"], string> = {
    UNASSIGNED: "Unassigned",
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected"
  };

  return labels[value];
}

function humanizeAuditAction(action: string) {
  const labels: Record<string, string> = {
    DRAWING_CREATED: "Drawing dibuat",
    DRAWING_CREATED_AND_SUBMITTED: "Drawing dibuat dan dikirim",
    DRAWING_UPDATED: "Drawing diperbarui",
    DRAWING_UPDATED_AND_SUBMITTED: "Drawing diperbarui dan dikirim",
    DRAWING_DELETED: "Drawing dihapus",
    LEGACY_DRAWING_IMPORTED: "Old drawing diunggah sebagai completed",
    REVISION_CREATED: "Revisi baru dibuat",
    SUBMITTED_FOR_CHECK: "Revisi dikirim untuk check",
    WAITING_APPROVAL_1: "Lolos check dan menunggu approver level 1 yang ditugaskan",
    WAITING_APPROVAL_2: "Lolos approval level 1 dan menunggu final approval yang ditugaskan",
    CHECK_REJECTED: "Check ditolak",
    APPROVAL_1_REJECTED: "Approval level 1 rejected",
    APPROVAL_2_REJECTED: "Final approval rejected",
    COMPLETED: "Drawing completed",
    DRAWING_DOWNLOADED: "Final drawing diunduh"
  };

  return labels[action] ?? action.replace(/_/g, " ").toLowerCase();
}

function getNextStepMessage(
  role: UserRole,
  status: DrawingRevision["status"],
  canCurrentUserApprove = true,
  isOwnedByCurrentUser = true
) {
  if (canEditRevision(role, status)) {
    return "Dokumen ini masih berada pada tahap yang bisa Anda edit. Lengkapi perubahan lalu kirim ke tahap check saat sudah siap.";
  }

  if (canSubmitRevision(role, status)) {
    return "Current revision dapat langsung dikirim untuk proses check setelah semua perbaikan diverifikasi.";
  }

  if (canCheckRevision(role, status)) {
    return "Periksa dokumen ini dari sisi teknis, lalu teruskan ke tahap approval berikutnya atau kembalikan dengan catatan yang jelas.";
  }

  if (canApproveRevision(role, status, canCurrentUserApprove)) {
    return "Dokumen ini sudah siap Anda review sebagai approver. Pastikan catatan dan stempel keputusan sesuai sebelum melanjutkan.";
  }

  if (
    (role === "APPROVER_L1" && status === "WAITING_APPROVAL_1") ||
    (role === "HEAD" && status === "WAITING_APPROVAL_2") ||
    (role === "ADMIN" && ["WAITING_APPROVAL_1", "WAITING_APPROVAL_2"].includes(status))
  ) {
    return "Tahap approval aktif sedang menunggu assignee yang benar. Jika Anda bukan approver yang ditugaskan, gunakan detail ini untuk melihat routing atau minta reassignment.";
  }

  if (canCreateRevision(role, status, isOwnedByCurrentUser)) {
    return "Drawing ini sudah selesai. Jika perlu perubahan baru, buat revisi lanjutan agar histori tetap rapi dan terlacak.";
  }

  if (role === "DRAFTER" && status === "COMPLETED" && !isOwnedByCurrentUser) {
    return "Drawing final ini dapat Anda lihat sebagai referensi, namun revisi lanjutan hanya dapat dibuat oleh drafter pemilik dokumen atau admin.";
  }

  if (canDownload(role, status)) {
    return "Final drawing sudah tersedia untuk dibuka. Gunakan versi completed sebagai referensi kerja utama.";
  }

  return "Gunakan halaman ini untuk membaca konteks drawing, memeriksa riwayat, dan mengikuti progres dokumen.";
}
