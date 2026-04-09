"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { apiFetch, buildQuery, getErrorMessage } from "@/lib/api-client";
import { DrawingRequestListItem, DrawingRequestStatus, UserRole } from "@/lib/types";
import {
  canCreateDrawingRequest,
  canRespondToDrawingRequestAssignment,
  canReviewDrawingRequest,
  getRoleLabel
} from "@/lib/utils/permissions";
import { formatDateTime } from "@/lib/utils/format";

interface DrawingRequestListResponse {
  items: DrawingRequestListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    pendingReviewCount: number;
    waitingAcceptanceCount: number;
    rejectedCount: number;
    closedCount: number;
  };
}

async function fetchRequests(status: DrawingRequestStatus | "ALL", page: number, pageSize: number) {
  return apiFetch<DrawingRequestListResponse>(
    `/api/drawing-requests${buildQuery({
      status,
      page,
      pageSize
    })}`
  );
}

export default function DrawingRequestsPage() {
  const { currentUser } = useDemoApp();

  return (
    <AuthGuard>
      {currentUser ? <DrawingRequestsContent role={currentUser.role} /> : null}
    </AuthGuard>
  );
}

function DrawingRequestsContent({ role }: { role: UserRole }) {
  const [status, setStatus] = useState<DrawingRequestStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [data, setData] = useState<DrawingRequestListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const pageCopy = getPageCopy(role);

  useEffect(() => {
    let cancelled = false;

    const loadRequests = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetchRequests(status, page, pageSize);

        if (!cancelled) {
          setData(response);
          if (response.page !== page) {
            setPage(response.page);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, "Drawing request belum dapat dimuat."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadRequests();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, status]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Drawing Requests"
        title={pageCopy.title}
        description={pageCopy.description}
        actions={
          <div className="flex flex-wrap gap-3">
            {canCreateDrawingRequest(role) ? (
              <Link href="/drawing-requests/new">
                <Button>Request New Drawing</Button>
              </Link>
            ) : null}
            <Link href="/dashboard">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden border-transparent bg-graphite text-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
          <div className="space-y-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/55">
                  {getRoleLabel(role)}
                </p>
                <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
                  {pageCopy.heroTitle}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
                  {pageCopy.heroDescription}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
                  Visible Requests
                </p>
                <p className="mt-2 text-5xl font-semibold">{data?.total ?? 0}</p>
                <p className="mt-1 text-sm text-white/65">item pada scope aktif</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <HeroStat label="Pending Review" value={String(data?.stats.pendingReviewCount ?? 0)} />
              <HeroStat label="Waiting Acceptance" value={String(data?.stats.waitingAcceptanceCount ?? 0)} />
              <HeroStat label="Rejected" value={String(data?.stats.rejectedCount ?? 0)} />
              <HeroStat label="Closed" value={String(data?.stats.closedCount ?? 0)} />
            </div>
          </div>
        </Card>

        <Card className="bg-white/75">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Filter</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Status request</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Gunakan filter untuk fokus ke request yang masih perlu ditindaklanjuti.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-text">Status</span>
              <Select
                onChange={(event) => {
                  setStatus(event.target.value as DrawingRequestStatus | "ALL");
                  setPage(1);
                }}
                value={status}
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="WAITING_DRAFTER_ACCEPTANCE">Waiting Drafter Acceptance</option>
                <option value="DRAFTER_REJECTED">Drafter Rejected</option>
                <option value="REVIEW_REJECTED">Review Rejected</option>
                <option value="CLOSED">Closed</option>
              </Select>
            </label>

            <div className="rounded-2xl border border-border/75 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-text">Queue focus</p>
              <p className="mt-1 text-sm leading-6 text-muted">{pageCopy.queueHint}</p>
            </div>
          </div>
        </Card>
      </div>

      {error ? (
        <Card className="border-danger/15 bg-white/70">
          <p className="text-sm font-medium text-danger">{error}</p>
        </Card>
      ) : null}

      <Card>
        <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Request List</p>
            <h2 className="mt-2 text-2xl font-semibold text-text">Daftar request drawing</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Buka detail request untuk melihat timeline, alasan reject, atau mengambil keputusan berikutnya.
            </p>
          </div>
          <div className="rounded-full border border-border bg-panel/35 px-4 py-2 text-sm font-semibold text-text">
            {data?.total ?? 0} request visible
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {isLoading ? (
            <LoadingRows />
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              title="Belum ada drawing request"
              description={pageCopy.emptyDescription}
              actionHref={canCreateDrawingRequest(role) ? "/drawing-requests/new" : undefined}
              actionLabel={canCreateDrawingRequest(role) ? "Request New Drawing" : undefined}
            />
          ) : (
            data.items.map((item) => (
              <div className="rounded-[24px] border border-border bg-white p-4" key={item.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">
                        {item.requestNumber}
                      </p>
                      <RequestStatusPill status={item.status} />
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-text">
                      {item.sacCode} / {item.area}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                      <InfoTile label="Purpose" value={item.purpose} />
                      <InfoTile
                        label="Requester"
                        value={item.requestedByName ?? item.requestedByUsername ?? "-"}
                      />
                      <InfoTile
                        label="Assigned Drafter"
                        value={item.assignedDrafterName ?? item.assignedDrafterUsername ?? "-"}
                      />
                      <InfoTile
                        label="Updated"
                        value={formatDateTime(item.updatedAt)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/drawing-requests/${item.id}`}>
                      <Button>Open Detail</Button>
                    </Link>
                    {item.drawingId ? (
                      <Link href={`/drawings/${item.drawingId}`}>
                        <Button variant="secondary">Open Draft</Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {data && data.totalPages > 1 ? (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border/75 bg-panel/18 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-text">
                Page {data.page} dari {data.totalPages}
              </p>
              <p className="mt-1 text-sm text-muted">
                Menampilkan maksimal {data.pageSize} item per halaman.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select
                className="min-w-[108px]"
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                value={String(pageSize)}
              >
                <option value="8">8 item</option>
                <option value="12">12 item</option>
                <option value="24">24 item</option>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  disabled={data.page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  variant="secondary"
                >
                  Previous
                </Button>
                <Button
                  disabled={data.page >= data.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  variant="secondary"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function getPageCopy(role: UserRole) {
  if (canReviewDrawingRequest(role)) {
    return {
      title: "Drawing Request Review Queue",
      description: "Review request baru, tentukan drafter tujuan, dan tutup request yang tidak layak dilanjutkan.",
      heroTitle: "Queue review Draft Leader ada di sini.",
      heroDescription: "Gunakan halaman ini untuk menyaring request baru dan menangani assignment yang dikembalikan oleh drafter.",
      queueHint: "Fokus utama Anda adalah status Pending Review dan Drafter Rejected.",
      emptyDescription: "Queue review kosong. Request baru akan muncul di sini saat ada user yang mengajukan drawing baru."
    };
  }

  if (canRespondToDrawingRequestAssignment(role)) {
    return {
      title: "Drawing Request Assignments",
      description: "Pantau assignment baru yang perlu Anda accept atau reject sebelum berubah menjadi draft.",
      heroTitle: "Assignment request yang menunggu keputusan Anda.",
      heroDescription: "Setelah accept, sistem akan membuat draft baru dan item itu langsung masuk ke My Queue dashboard Anda.",
      queueHint: "Fokus utama Anda adalah status Waiting Drafter Acceptance.",
      emptyDescription: "Belum ada assignment request yang menunggu keputusan Anda."
    };
  }

  return {
    title: "My Drawing Requests",
    description: "Lihat status request drawing yang Anda ajukan, termasuk alasan reject dan link ke draft bila sudah dikerjakan.",
    heroTitle: "Semua request baru Anda terlacak dalam satu halaman.",
    heroDescription: "Gunakan halaman ini untuk memantau perjalanan request dari review Draft Leader sampai dikonversi menjadi draft drawing.",
    queueHint: "Requester dapat fokus pada status Review Rejected, Waiting Acceptance, dan Closed.",
    emptyDescription: "Belum ada request drawing yang Anda ajukan."
  };
}

function RequestStatusPill({ status }: { status: DrawingRequestStatus }) {
  const labelMap: Record<DrawingRequestStatus, string> = {
    PENDING_REVIEW: "Pending Review",
    REVIEW_REJECTED: "Review Rejected",
    WAITING_DRAFTER_ACCEPTANCE: "Waiting Acceptance",
    DRAFTER_REJECTED: "Drafter Rejected",
    IN_PROGRESS: "In Progress",
    CLOSED: "Closed"
  };

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
      {labelMap[status]}
    </span>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel/22 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text truncate">{value}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card className="h-44 animate-pulse bg-white/70" key={index} />
      ))}
    </div>
  );
}
