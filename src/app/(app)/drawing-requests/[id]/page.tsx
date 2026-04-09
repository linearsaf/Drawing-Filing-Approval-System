"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import {
  DrafterOption,
  DrawingRequestListItem,
  DrawingRequestStatus,
  DrawingRequestTimelineEvent,
  UserRole
} from "@/lib/types";
import {
  canRespondToDrawingRequestAssignment,
  canReviewDrawingRequest,
  getRoleLabel
} from "@/lib/utils/permissions";
import { formatDateTime } from "@/lib/utils/format";

interface DrawingRequestDetailResponse {
  request: DrawingRequestListItem;
  timeline: DrawingRequestTimelineEvent[];
}

export default function DrawingRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const { currentUser } = useDemoApp();

  return (
    <AuthGuard>
      {currentUser ? <DrawingRequestDetailContent requestId={params.id} role={currentUser.role} /> : null}
    </AuthGuard>
  );
}

function DrawingRequestDetailContent({
  requestId,
  role
}: {
  requestId: string;
  role: UserRole;
}) {
  const router = useRouter();
  const [data, setData] = useState<DrawingRequestDetailResponse | null>(null);
  const [drafters, setDrafters] = useState<DrafterOption[]>([]);
  const [assignedDrafterId, setAssignedDrafterId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDetail = async () => {
    const response = await apiFetch<DrawingRequestDetailResponse>(`/api/drawing-requests/${requestId}`);
    setData(response);
    setAssignedDrafterId(response.request.assignedDrafterId ?? "");
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiFetch<DrawingRequestDetailResponse>(`/api/drawing-requests/${requestId}`);
        if (!cancelled) {
          setData(response);
          setAssignedDrafterId(response.request.assignedDrafterId ?? "");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, "Detail drawing request belum dapat dimuat."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  useEffect(() => {
    if (!canReviewDrawingRequest(role)) {
      return;
    }

    let cancelled = false;

    const loadDrafters = async () => {
      try {
        const response = await apiFetch<{ items: DrafterOption[] }>("/api/users/request-drafters");
        if (!cancelled) {
          setDrafters(response.items);
        }
      } catch {
        if (!cancelled) {
          setDrafters([]);
        }
      }
    };

    void loadDrafters();

    return () => {
      cancelled = true;
    };
  }, [role]);

  const handleDraftLeaderAction = async (action: "APPROVE_ASSIGN" | "REJECT") => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/drawing-requests/${requestId}/review`, {
        method: "POST",
        body: JSON.stringify({
          action,
          assignedDrafterId,
          note
        })
      });

      await loadDetail();
      setSuccess(
        action === "APPROVE_ASSIGN"
          ? "Request berhasil diassign ke drafter."
          : "Request berhasil ditolak."
      );
      setNote("");
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Keputusan review gagal diproses."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrafterDecision = async (action: "ACCEPT" | "REJECT") => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const result = await apiFetch<{ requestId: string; drawingId?: string }>(
        `/api/drawing-requests/${requestId}/drafter-decision`,
        {
          method: "POST",
          body: JSON.stringify({
            action,
            note
          })
        }
      );

      if (action === "ACCEPT" && result.drawingId) {
        router.push(`/drawings/${result.drawingId}/edit`);
        router.refresh();
        return;
      }

      await loadDetail();
      setSuccess("Keputusan assignment berhasil diproses.");
      setNote("");
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Keputusan assignment gagal diproses."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="h-44 animate-pulse bg-white/70" />
        <Card className="h-80 animate-pulse bg-white/70" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <EmptyState
        title="Detail drawing request belum tersedia"
        description={error}
        actionHref="/drawing-requests"
        actionLabel="Open Request List"
      />
    );
  }

  if (!data) {
    return null;
  }

  const request = data.request;

  const headerActions = (
    <>
      <Link href="/drawing-requests">
        <Button variant="secondary">Open Request List</Button>
      </Link>
      {request.drawingId ? (
        <Link href={`/drawings/${request.drawingId}`}>
          <Button>Open Draft</Button>
        </Link>
      ) : null}
    </>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={request.requestNumber}
        title={`${request.sacCode} / ${request.area}`}
        description={request.description}
        actions={headerActions}
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden border-transparent bg-graphite text-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
          <div className="space-y-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/55">Request Snapshot</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">{request.purpose}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
                  Request ini diajukan oleh {request.requestedByName ?? request.requestedByUsername ?? "-"} dan saat ini
                  berada pada status {getRequestStatusLabel(request.status).toLowerCase()}.
                </p>
              </div>
              <RequestStatusPill status={request.status} />
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <HeroStat label="Requester" value={request.requestedByName ?? request.requestedByUsername ?? "-"} />
              <HeroStat label="Assigned Drafter" value={request.assignedDrafterName ?? request.assignedDrafterUsername ?? "-"} />
              <HeroStat label="Created" value={formatDateTime(request.createdAt)} />
              <HeroStat label="Updated" value={formatDateTime(request.updatedAt)} />
            </div>
          </div>
        </Card>

        <Card className="bg-white/75">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Request Context</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Informasi inti</h2>
          <div className="mt-5 space-y-3">
            <InfoRow label="SAC / SBI Asset Code" value={request.sacCode} />
            <InfoRow label="Area" value={request.area} />
            <InfoRow label="Purpose" value={request.purpose} />
            <InfoRow
              label="Reference Image"
              value={request.referenceImagePath ? "Tersedia" : "Tidak ada lampiran"}
            />
            {request.linkedDrawingNumber ? (
              <InfoRow label="Linked Draft" value={`${request.linkedDrawingNumber} / ${request.linkedDrawingName ?? "-"}`} />
            ) : null}
          </div>
          {request.referenceImagePath ? (
            <div className="mt-5 overflow-hidden rounded-[24px] border border-border bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={`Reference ${request.requestNumber}`} className="w-full rounded-[18px] object-cover" src={request.referenceImagePath} />
            </div>
          ) : null}
        </Card>
      </div>

      {error ? (
        <Card className="border-danger/15 bg-white/70">
          <p className="text-sm font-medium text-danger">{error}</p>
        </Card>
      ) : null}

      {success ? (
        <Card className="border-brand/15 bg-white/70">
          <p className="text-sm font-medium text-brand">{success}</p>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Timeline</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Jejak request</h2>

          <div className="mt-5 space-y-4">
            {data.timeline.map((item) => (
              <div className="rounded-[24px] border border-border bg-white p-4" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text">{humanizeTimelineAction(item.action)}</p>
                    <p className="mt-1 text-sm text-muted">
                      {item.actorName ?? item.actorUsername ?? "System"}{item.actorRole ? ` / ${getRoleLabel(item.actorRole)}` : ""}
                    </p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">{formatDateTime(item.createdAt)}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{item.note || "Tidak ada catatan tambahan."}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Next Action</p>
            <h2 className="mt-2 text-2xl font-semibold text-text">Tindak lanjut</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{getNextActionMessage(role, request.status)}</p>
          </Card>

          {canReviewDrawingRequest(role) && ["PENDING_REVIEW", "DRAFTER_REJECTED"].includes(request.status) ? (
            <Card className="border-border/90">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Draft Leader Review</p>
              <h2 className="mt-2 text-2xl font-semibold text-text">Review dan delegasi</h2>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-text">Assign ke Drafter</span>
                  <Select onChange={(event) => setAssignedDrafterId(event.target.value)} value={assignedDrafterId}>
                    <option value="">Pilih drafter</option>
                    {drafters.map((drafter) => (
                      <option key={drafter.id} value={drafter.id}>
                        {drafter.name}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-text">Catatan Review / Alasan Reject</span>
                  <Textarea
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Jelaskan brief assignment atau alasan penolakan"
                    value={note}
                  />
                </label>

                <div className="flex flex-wrap gap-3">
                  <Button
                    disabled={isSubmitting || !assignedDrafterId}
                    onClick={() => void handleDraftLeaderAction("APPROVE_ASSIGN")}
                  >
                    {request.status === "DRAFTER_REJECTED" ? "Assign Ulang" : "Approve & Assign"}
                  </Button>
                  <Button
                    disabled={isSubmitting}
                    onClick={() => void handleDraftLeaderAction("REJECT")}
                    variant="danger"
                  >
                    {request.status === "DRAFTER_REJECTED" ? "Reject Final" : "Reject Request"}
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

          {canRespondToDrawingRequestAssignment(role) && request.status === "WAITING_DRAFTER_ACCEPTANCE" ? (
            <Card className="border-border/90">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Drafter Decision</p>
              <h2 className="mt-2 text-2xl font-semibold text-text">Accept atau reject assignment</h2>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-text">Catatan</span>
                  <Textarea
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Opsional untuk accept, wajib untuk reject"
                    value={note}
                  />
                </label>

                <div className="rounded-2xl border border-border/75 bg-panel/25 px-4 py-3">
                  <p className="text-sm font-semibold text-text">Saat Accept</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Sistem akan membuat draft baru berstatus DRAFT dan langsung membuka halaman edit draft Anda.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button disabled={isSubmitting} onClick={() => void handleDrafterDecision("ACCEPT")}>
                    Accept Assignment
                  </Button>
                  <Button
                    disabled={isSubmitting}
                    onClick={() => void handleDrafterDecision("REJECT")}
                    variant="danger"
                  >
                    Reject Assignment
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

          {request.draftLeaderReviewNote ? (
            <Card>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Review Note</p>
              <p className="mt-3 text-sm leading-6 text-muted">{request.draftLeaderReviewNote}</p>
            </Card>
          ) : null}

          {request.drafterDecisionNote ? (
            <Card>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Drafter Note</p>
              <p className="mt-3 text-sm leading-6 text-muted">{request.drafterDecisionNote}</p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getRequestStatusLabel(status: DrawingRequestStatus) {
  const labels: Record<DrawingRequestStatus, string> = {
    PENDING_REVIEW: "Pending Review",
    REVIEW_REJECTED: "Review Rejected",
    WAITING_DRAFTER_ACCEPTANCE: "Waiting Drafter Acceptance",
    DRAFTER_REJECTED: "Drafter Rejected",
    IN_PROGRESS: "In Progress",
    CLOSED: "Closed"
  };

  return labels[status];
}

function RequestStatusPill({ status }: { status: DrawingRequestStatus }) {
  const className =
    status === "PENDING_REVIEW"
      ? "border-brand/20 bg-brand/10 text-brand"
      : status === "WAITING_DRAFTER_ACCEPTANCE"
        ? "border-[#49605a]/20 bg-sage/12 text-[#49605a]"
        : status === "REVIEW_REJECTED" || status === "DRAFTER_REJECTED"
          ? "border-danger/20 bg-danger/8 text-danger"
          : "border-border/90 bg-panel/30 text-muted";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${className}`}>
      {getRequestStatusLabel(status)}
    </span>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/75 bg-white px-4 py-3">
      <p className="text-sm font-semibold text-text">{label}</p>
      <p className="max-w-[18rem] text-right text-sm text-muted">{value}</p>
    </div>
  );
}

function humanizeTimelineAction(action: string) {
  const labels: Record<string, string> = {
    DRAWING_REQUEST_CREATED: "Request dibuat",
    DRAWING_REQUEST_APPROVED_AND_ASSIGNED: "Request di-approve dan diassign",
    DRAWING_REQUEST_REASSIGNED_TO_DRAFTER: "Request diassign ulang",
    DRAWING_REQUEST_REJECTED_BY_DRAFT_LEADER: "Request ditolak Draft Leader",
    DRAWING_REQUEST_REJECTED_BY_DRAFTER: "Assignment ditolak Drafter",
    DRAWING_REQUEST_ACCEPTED_AND_CONVERTED: "Request diterima dan menjadi draft"
  };

  return labels[action] ?? action.replaceAll("_", " ").toLowerCase();
}

function getNextActionMessage(role: UserRole, status: DrawingRequestStatus) {
  if (canReviewDrawingRequest(role) && status === "PENDING_REVIEW") {
    return "Review konteks request ini lalu putuskan apakah akan diassign ke drafter atau ditolak dengan alasan yang jelas.";
  }

  if (canReviewDrawingRequest(role) && status === "DRAFTER_REJECTED") {
    return "Assignment sebelumnya ditolak drafter. Anda dapat assign ulang ke drafter lain atau menutup request ini.";
  }

  if (canRespondToDrawingRequestAssignment(role) && status === "WAITING_DRAFTER_ACCEPTANCE") {
    return "Anda bisa menerima assignment ini untuk mengubahnya menjadi draft atau menolaknya dengan alasan yang jelas.";
  }

  if (status === "CLOSED") {
    return "Request ini sudah selesai sebagai intake record. Bila draft sudah tercipta, lanjutkan pekerjaan dari halaman drawing terkait.";
  }

  if (status === "REVIEW_REJECTED") {
    return "Request ini sudah ditutup. Gunakan timeline untuk melihat alasan penolakan dan konteks keputusan.";
  }

  return "Pantau status dan timeline request ini untuk melihat tindak lanjut terbaru.";
}
