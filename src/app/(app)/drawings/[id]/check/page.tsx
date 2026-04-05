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
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { ApproverOption, Drawing, DrawingRevision, RevisionApprovalStep, UserRole } from "@/lib/types";
import { canCheckRevision } from "@/lib/utils/permissions";

interface DrawingDetailResponse {
  drawing: Drawing;
  currentRevision: DrawingRevision | null;
  approvalPlan: RevisionApprovalStep[];
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
  const [level1Approvers, setLevel1Approvers] = useState<ApproverOption[]>([]);
  const [level2Approvers, setLevel2Approvers] = useState<ApproverOption[]>([]);
  const [level1ApproverId, setLevel1ApproverId] = useState("");
  const [level2ApproverId, setLevel2ApproverId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [response, level1Options, level2Options] = await Promise.all([
          apiFetch<DrawingDetailResponse>(`/api/drawings/${drawingId}`),
          apiFetch<{ items: ApproverOption[] }>("/api/users/approvers?level=1"),
          apiFetch<{ items: ApproverOption[] }>("/api/users/approvers?level=2")
        ]);

        if (!cancelled) {
          setData(response);
          setLevel1Approvers(level1Options.items);
          setLevel2Approvers(level2Options.items);
          setLevel1ApproverId(
            response.approvalPlan.find((step) => step.approvalLevel === 1)?.assignedUserId ?? ""
          );
          setLevel2ApproverId(
            response.approvalPlan.find((step) => step.approvalLevel === 2)?.assignedUserId ?? ""
          );
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
          eyebrow="Check"
          title="Memuat data Drawing"
          description="Menyiapkan dokumen dan metadata sebelum halaman check ditampilkan."
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
          eyebrow="Check"
          title="Halaman check belum tersedia"
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

  if (!revision || !canCheckRevision(role, revision.status)) {
    return (
      <EmptyState
        actionHref={`/drawings/${drawing.id}`}
        actionLabel="Kembali ke Detail Drawing"
        description="Halaman check hanya aktif untuk revision dengan status WAITING_CHECK."
        title="Tidak ada item yang bisa di-check"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={drawing.drawingNumber}
        title="Check Drawing"
        description="Tinjau metadata dan dokumen sebelum menetapkan status Approved atau Rejected."
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
                  Drawing Summary
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
            approveLabel="Mark as Approved"
            approveDisabled={!level1ApproverId}
            buildPayload={({ decision }) =>
              decision === "APPROVED"
                ? {
                    approvalPlan: {
                      level1ApproverId,
                      level2ApproverId: level2ApproverId || null
                    }
                  }
                : {}
            }
            description="Jika status Approved, drawing akan lanjut ke approver level 1 yang dipilih. Level 2 opsional dan hanya dilalui bila assignee-nya disiapkan."
            eyebrow="Check Decision"
            endpoint={`/api/revisions/${revision.id}/check`}
          >
            <div className="space-y-4 rounded-[24px] border border-border bg-panel/28 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">
                  Approval Routing
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Tentukan approver level 1 untuk setiap drawing yang lolos check. Level 2 bersifat opsional.
                </p>
              </div>

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

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text">
                  Approver Level 2 (Opsional)
                </span>
                <Select
                  onChange={(event) => setLevel2ApproverId(event.target.value)}
                  value={level2ApproverId}
                >
                  <option value="">Lewati final approval</option>
                  {level2Approvers.map((approver) => (
                    <option key={approver.id} value={approver.id}>
                      {approver.name} / {approver.role === "ADMIN" ? "Admin" : "Head"}
                    </option>
                  ))}
                </Select>
              </label>

              <p className="text-xs leading-5 text-muted">
                Bila Level 2 tidak dipilih, revisi akan langsung `Completed` setelah approval level 1.
              </p>
            </div>
          </DecisionPanel>
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
