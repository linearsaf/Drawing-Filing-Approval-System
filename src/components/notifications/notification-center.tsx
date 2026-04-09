"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch, buildQuery, getErrorMessage } from "@/lib/api-client";
import {
  NotificationFilter,
  NotificationItem,
  NotificationListResponse,
  NotificationLifecycleStatus,
  NotificationType,
  NotificationUnreadSummary
} from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";

const filters: NotificationFilter[] = ["ALL", "UNREAD", "ACTIONABLE"];

export function NotificationCenter() {
  const [filter, setFilter] = useState<NotificationFilter>("ALL");
  const [data, setData] = useState<NotificationListResponse | null>(null);
  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const response = await apiFetch<NotificationListResponse>(
          `/api/notifications${buildQuery({
            filter,
            page,
            pageSize: 12
          })}`
        );

        if (cancelled) {
          return;
        }

        setData(response);
        setError("");
        setActiveNotification((current) => {
          if (!current) {
            return null;
          }

          const updated = response.items.find((item) => item.id === current.id);
          return updated ?? current;
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, "Notifikasi belum dapat dimuat."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    void loadNotifications();

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 60_000);
    const handleFocus = () => {
      void loadNotifications();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [filter, page]);

  const handleOpenNotification = async (notificationId: string) => {
    setOpeningId(notificationId);

    try {
      const item = await apiFetch<NotificationItem>(`/api/notifications/${notificationId}/open`, {
        method: "POST"
      });

      setActiveNotification(item);

      const response = await apiFetch<NotificationListResponse>(
        `/api/notifications${buildQuery({
          filter,
          page,
          pageSize: 12
        })}`
      );

      setData(response);
      setError("");
      window.dispatchEvent(new Event("notifications:changed"));
    } catch (openError) {
      setError(getErrorMessage(openError, "Detail notifikasi belum dapat dibuka."));
    } finally {
      setOpeningId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);

    try {
      const unreadSummary = await apiFetch<NotificationUnreadSummary>("/api/notifications/read-all", {
        method: "POST"
      });

      const response = await apiFetch<NotificationListResponse>(
        `/api/notifications${buildQuery({
          filter,
          page,
          pageSize: 12
        })}`
      );

      setData({
        ...response,
        unreadCount: unreadSummary.unreadCount
      });
      window.dispatchEvent(new Event("notifications:changed"));
      setActiveNotification((current) =>
        current
          ? {
              ...current,
              isRead: true,
              readAt: new Date().toISOString()
            }
          : null
      );
      setError("");
    } catch (markError) {
      setError(getErrorMessage(markError, "Notifikasi belum dapat ditandai terbaca."));
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Notifications"
          title="Notification Center"
          description="Pantau assignment, update workflow, dan request akses dari satu inbox."
          actions={
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button variant="secondary">Back to Dashboard</Button>
              </Link>
              <Button
                disabled={isMarkingAll || !data || data.unreadCount === 0}
                onClick={() => void handleMarkAllRead()}
                variant="secondary"
              >
                {isMarkingAll ? "Memproses..." : "Mark All as Read"}
              </Button>
            </div>
          }
        />

        {error ? (
          <Card className="border-danger/20 bg-white/70">
            <p className="text-sm font-medium text-danger">{error}</p>
          </Card>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <Card className="relative overflow-hidden border-transparent bg-graphite text-white">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
            <div className="space-y-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/55">
                    Inbox Snapshot
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">Notifikasi yang perlu perhatian</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
                    Inbox ini melengkapi queue dashboard dengan konteks event yang lebih spesifik per user.
                  </p>
                </div>
                <div className="grid gap-3 md:min-w-[240px]">
                  <HeroStat label="Unread" value={String(data?.unreadCount ?? 0)} />
                  <HeroStat label="Visible Items" value={String(data?.total ?? 0)} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {filters.map((item) => (
                  <button
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      filter === item
                        ? "border-white/10 bg-white text-graphite"
                        : "border-white/12 bg-white/5 text-white/82 hover:bg-white/10"
                    )}
                    key={item}
                    onClick={() => {
                      setFilter(item);
                      setPage(1);
                    }}
                    type="button"
                  >
                    {getFilterLabel(item)}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="bg-white/75">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">How It Works</p>
            <h2 className="mt-2 text-2xl font-semibold text-text">Inbox behavior</h2>
            <div className="mt-5 space-y-3">
              <InfoRow label="Unread" value="Item belum pernah dibuka dari inbox ini." />
              <InfoRow label="Active" value="Masih relevan dengan status atau assignment saat ini." />
              <InfoRow label="Resolved" value="Flow terkait sudah selesai atau status sudah bergeser." />
              <InfoRow label="Superseded" value="Assignment terkait sudah berpindah ke user lain." />
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <Card>
            <div className="flex flex-col gap-3 border-b border-border/70 pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Inbox</p>
                <h2 className="mt-2 text-2xl font-semibold text-text">Daftar notifikasi</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Buka notifikasi untuk menandai item sebagai read dan melihat konteks lebih lengkap.
                </p>
              </div>
              {data ? (
                <div className="bg-panel/30 text-sm font-semibold text-text">
                  {data.total} item visible
                </div>
              ) : null}
            </div>

            <div className="mt-5 space-y-4">
              {isLoading ? (
                <LoadingList />
              ) : !data || data.items.length === 0 ? (
                <EmptyState
                  description={getEmptyDescription(filter)}
                  title={getEmptyTitle(filter)}
                />
              ) : (
                data.items.map((item) => {
                  const isActive = activeNotification?.id === item.id;

                  return (
                    <button
                      className={cn(
                        "w-full rounded-[24px] border p-4 text-left transition",
                        isActive
                          ? "border-brand/35 bg-brand/5"
                          : "border-border bg-white hover:border-brand/25 hover:bg-brand/5"
                      )}
                      key={item.id}
                      onClick={() => void handleOpenNotification(item.id)}
                      type="button"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {!item.isRead ? (
                                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
                              ) : null}
                              <p className="text-lg font-semibold text-text">{item.title}</p>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
                          </div>
                          <span className="shrink-0 text-xs uppercase tracking-[0.16em] text-muted">
                            {formatDateTime(item.createdAt)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <LifecycleBadge status={item.lifecycleStatus} />
                          <TypeBadge type={item.type} />
                          {item.isActionable ? (
                            <Badge className="border-brand/20 bg-brand/10 text-brand">Actionable</Badge>
                          ) : null}
                        </div>

                        <p className="text-sm text-muted">{getNotificationContextLine(item)}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {data && data.totalPages > 1 ? (
              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border/75 bg-panel/18 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">
                    Page {data.page} dari {data.totalPages}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Menampilkan maksimal {data.pageSize} item per halaman.
                  </p>
                </div>
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
            ) : null}
          </Card>

          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Detail</p>
            <h2 className="mt-2 text-2xl font-semibold text-text">
              {activeNotification ? "Context notifikasi" : "Pilih notifikasi terlebih dahulu"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {activeNotification
                ? "Detail ini membantu Anda memahami konteks event sebelum berpindah ke halaman kerja yang relevan."
                : "Klik salah satu item di inbox untuk membuka detail, menandai item sebagai read, dan melihat action berikutnya."}
            </p>

            {openingId ? (
              <div className="mt-5 animate-pulse rounded-[24px] border border-border bg-white/70 p-6">
                <div className="h-6 w-40 rounded-full bg-panel/70" />
                <div className="mt-4 h-4 w-full rounded-full bg-panel/70" />
                <div className="mt-2 h-4 w-3/4 rounded-full bg-panel/70" />
              </div>
            ) : activeNotification ? (
              <div className="mt-5 space-y-5">
                <div className="rounded-[24px] border border-border/80 bg-white p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <LifecycleBadge status={activeNotification.lifecycleStatus} />
                    <TypeBadge type={activeNotification.type} />
                    {activeNotification.isRead ? (
                      <Badge className="border-border/90 bg-panel/28 text-muted">Read</Badge>
                    ) : (
                      <Badge className="border-brand/20 bg-brand/10 text-brand">Unread</Badge>
                    )}
                  </div>

                  <h3 className="mt-4 text-xl font-semibold text-text">{activeNotification.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{activeNotification.body}</p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <InfoTile
                      label="Dibuat"
                      value={formatDateTime(activeNotification.createdAt)}
                    />
                    <InfoTile
                      label="Target"
                      value={getNotificationContextLine(activeNotification)}
                    />
                  </div>

                  <div className="mt-5 rounded-2xl border border-border/80 bg-panel/20 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                      Lifecycle
                    </p>
                    <p className="mt-2 text-sm text-text">
                      {getLifecycleDescription(activeNotification.lifecycleStatus)}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={activeNotification.actionUrl}>
                      <Button>{getNotificationActionLabel(activeNotification.type)}</Button>
                    </Link>
                    <Link href="/drawings">
                      <Button variant="secondary">Open Drawing List</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState
                  description="Detail akan tampil di panel ini setelah Anda membuka salah satu notifikasi dari inbox."
                  title="Belum ada item yang dipilih"
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}

function getFilterLabel(filter: NotificationFilter) {
  if (filter === "UNREAD") {
    return "Unread";
  }

  if (filter === "ACTIONABLE") {
    return "Actionable";
  }

  return "All";
}

function getEmptyTitle(filter: NotificationFilter) {
  if (filter === "UNREAD") {
    return "Tidak ada notifikasi unread";
  }

  if (filter === "ACTIONABLE") {
    return "Tidak ada notifikasi actionable";
  }

  return "Inbox masih kosong";
}

function getEmptyDescription(filter: NotificationFilter) {
  if (filter === "UNREAD") {
    return "Semua notifikasi yang visible sudah pernah dibuka atau ditandai terbaca.";
  }

  if (filter === "ACTIONABLE") {
    return "Saat ini tidak ada item inbox yang masih aktif dan membutuhkan tindak lanjut langsung.";
  }

  return "Notifikasi baru akan muncul di sini saat ada event workflow yang relevan dengan akun Anda.";
}

function getNotificationContextLine(item: NotificationItem) {
  if (item.context.drawingRequestId) {
    return `${item.context.drawingRequestNumber ?? "Drawing Request"} / ${item.context.drawingRequestPurpose ?? "-"}`;
  }

  if (item.context.accessRequestId) {
    return `${item.context.accessRequestName ?? "Request Access"} / ${item.context.accessRequestEmail ?? "-"}`;
  }

  if (item.context.drawingId) {
    return `${item.context.drawingNumber ?? "Drawing"} / ${item.context.drawingName ?? "Tanpa judul"} / Rev ${item.context.revisionNo ?? "-"}`;
  }

  return "Konteks notifikasi tidak tersedia.";
}

function getNotificationActionLabel(type: NotificationType) {
  if (type === "WAITING_CHECK") {
    return "Open Check";
  }

  if (type === "WAITING_APPROVAL_1") {
    return "Open Approval";
  }

  if (type === "WAITING_APPROVAL_2") {
    return "Open Final Approval";
  }

  if (type === "ACCESS_REQUEST_PENDING") {
    return "Open User Management";
  }

  if (
    [
      "DRAWING_REQUEST_PENDING_REVIEW",
      "DRAWING_REQUEST_REVIEW_REJECTED",
      "DRAWING_REQUEST_ASSIGNED",
      "DRAWING_REQUEST_DRAFTER_REJECTED",
      "DRAWING_REQUEST_ACCEPTED"
    ].includes(type)
  ) {
    return "Open Request Detail";
  }

  if (type === "DRAWING_COMPLETED") {
    return "Open Drawing Detail";
  }

  return "Open Revision";
}

function getLifecycleDescription(status: NotificationLifecycleStatus) {
  if (status === "ACTIVE") {
    return "Item ini masih sesuai dengan status atau assignment saat ini dan masih relevan sebagai konteks kerja.";
  }

  if (status === "SUPERSEDED") {
    return "Assignment aktif sudah berpindah ke user lain sehingga notifikasi ini tetap tersimpan sebagai histori pribadi Anda.";
  }

  return "Flow terkait sudah bergerak ke tahap lain atau telah selesai, sehingga item ini tidak lagi menjadi antrian aktif.";
}

function LifecycleBadge({ status }: { status: NotificationLifecycleStatus }) {
  const className =
    status === "ACTIVE"
      ? "border-brand/20 bg-brand/10 text-brand"
      : status === "SUPERSEDED"
        ? "border-danger/15 bg-danger/8 text-danger"
        : "border-[#49605a]/15 bg-[#49605a]/8 text-[#49605a]";

  return <Badge className={className}>{status}</Badge>;
}

function TypeBadge({ type }: { type: NotificationType }) {
  return (
    <Badge className="border-border/85 bg-panel/25 text-muted">
      {type.replaceAll("_", " ")}
    </Badge>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
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

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-panel/20 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function LoadingList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="h-36 animate-pulse rounded-[24px] border border-border bg-white/70"
          key={index}
        />
      ))}
    </div>
  );
}
