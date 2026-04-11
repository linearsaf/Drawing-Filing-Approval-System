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
        <Button className="w-full sm:w-auto" variant="secondary">Open Request List</Button>
      </Link>
      {request.drawingId ? (
        <Link href={`/drawings/${request.drawingId}`}>
          <Button className="w-full sm:w-auto">Open Draft</Button>
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
          <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/55">Request Snapshot</p>
                <h2 className="mt-2 text-lg font-semibold leading-snug tracking-tight sm:text-2xl xl:text-3xl">
                  {request.purpose}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72 line-clamp-3">
                  Request ini diajukan oleh {request.requestedByName ?? request.requestedByUsername ?? "-"} dan saat ini
                  berada pada status {getRequestStatusLabel(request.status).toLowerCase()}.
                </p>
              </div>
              <div className="shrink-0">
                <RequestStatusPill status={request.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <HeroStat label="Requester" value={request.requestedByName ?? request.requestedByUsername ?? "-"} />
              <HeroStat label="Assigned Drafter" value={request.assignedDrafterName ?? request.assignedDrafterUsername ?? "-"} />
              <HeroStat label="Created" value={formatDateTime(request.createdAt)} />
              <HeroStat label="Updated" value={formatDateTime(request.updatedAt)} />
            </div>
          </div>
        </Card>

        <Card className="bg-white/75">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Request Context</p>
          <h2 className="mt-2 text-xl font-semibold text-text sm:text-2xl">Informasi inti</h2>
          <div className="mt-5 space-y-3">
            <InfoRow label="SAC / SBI Asset Code" value={request.sacCode} />
            <InfoRow label="Area" value={request.area} />
            <InfoRow label="Purpose" value={request.purpose} />
            <InfoRow
              label="Reference Images"
              value={
                request.referenceImagePaths.length > 0
                  ? `${request.referenceImagePaths.length} gambar tersedia`
                  : "Tidak ada lampiran"
              }
            />
            {request.linkedDrawingNumber ? (
              <InfoRow label="Linked Draft" value={`${request.linkedDrawingNumber} / ${request.linkedDrawingName ?? "-"}`} />
            ) : null}
          </div>
          {request.referenceImagePaths.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {request.referenceImagePaths.map((imagePath, index) => (
                <div className="overflow-hidden rounded-[24px] border border-border bg-white p-2" key={imagePath}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={`Reference ${request.requestNumber} ${index + 1}`}
                    className="h-full w-full rounded-[18px] object-cover"
                    src={imagePath}
                  />
                </div>
              ))}
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
        <div className="space-y-4">
          <Card className="order-1">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Next Action</p>
            <h2 className="mt-2 text-xl font-semibold text-text sm:text-2xl">Tindak lanjut</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{getNextActionMessage(role, request.status)}</p>
          </Card>

          {canReviewDrawingRequest(role) && ["PENDING_REVIEW", "DRAFTER_REJECTED"].includes(request.status) ? (
            <Card className="order-2 border-border/90">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Draft Leader Review</p>
              <h2 className="mt-2 text-xl font-semibold text-text sm:text-2xl">Review dan delegasi</h2>

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

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    className="w-full sm:w-auto"
                    disabled={isSubmitting || !assignedDrafterId}
                    onClick={() => void handleDraftLeaderAction("APPROVE_ASSIGN")}
                  >
                    {request.status === "DRAFTER_REJECTED" ? "Assign Ulang" : "Approve & Assign"}
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
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
            <Card className="order-2 border-border/90">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Drafter Decision</p>
              <h2 className="mt-2 text-xl font-semibold text-text sm:text-2xl">Accept atau reject assignment</h2>

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

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button className="w-full sm:w-auto" disabled={isSubmitting} onClick={() => void handleDrafterDecision("ACCEPT")}>
                    Accept Assignment
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
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
            <Card className="order-3">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Review Note</p>
              <p className="mt-3 text-sm leading-6 text-muted">{request.draftLeaderReviewNote}</p>
            </Card>
          ) : null}

          {request.drafterDecisionNote ? (
            <Card className="order-4">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Drafter Note</p>
              <p className="mt-3 text-sm leading-6 text-muted">{request.drafterDecisionNote}</p>
            </Card>
          ) : null}
        </div>

        <CollapsibleInfoCard
          className="order-2 xl:order-none"
          contentClassName="space-y-4"
          defaultOpen
          eyebrow="Timeline"
          title="Jejak request"
        >
          {data.timeline.map((item) => (
            <div className="rounded-[24px] border border-border bg-white p-4" key={item.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div>
                  <p className="text-sm font-semibold text-text">{humanizeTimelineAction(item.action)}</p>
                  <p className="mt-1 text-sm text-muted">
                    {item.actorName ?? item.actorUsername ?? "System"}{item.actorRole ? ` / ${getRoleLabel(item.actorRole)}` : ""}
                  </p>
                </div>
                <p className="text-xs text-muted sm:text-right">{formatDateTime(item.createdAt)}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{item.note || "Tidak ada catatan tambahan."}</p>
            </div>
          ))}
        </CollapsibleInfoCard>
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
  const style =
    status === "PENDING_REVIEW"
      ? {
          borderColor: "rgba(53,85,154,0.2)",
          backgroundColor: "rgba(53,85,154,0.1)",
          color: "#35559a"
        }
      : status === "WAITING_DRAFTER_ACCEPTANCE"
        ? {
            borderColor: "rgba(73,96,90,0.2)",
            backgroundColor: "rgba(73,96,90,0.12)",
            color: "#49605a"
          }
        : status === "REVIEW_REJECTED" || status === "DRAFTER_REJECTED"
          ? {
              borderColor: "rgba(220,49,54,0.2)",
              backgroundColor: "rgba(220,49,54,0.08)",
              color: "#dc3136"
            }
          : {
              borderColor: "rgba(204,210,220,0.9)",
              backgroundColor: "rgba(242,244,248,0.3)",
              color: "#667085"
            };

  return (
    <span
      className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
      style={style}
    >
      {getRequestStatusLabel(status)}
    </span>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-white sm:text-lg sm:leading-7">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border/75 bg-white px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <p className="text-sm font-semibold text-text">{label}</p>
      <p className="text-sm text-muted sm:max-w-[18rem] sm:text-right">{value}</p>
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
