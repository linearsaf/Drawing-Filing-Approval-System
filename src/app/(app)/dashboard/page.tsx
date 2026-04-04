"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { DashboardSummary, RevisionStatus, UserRole } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import { canCreateDrawing, getRoleLabel } from "@/lib/utils/permissions";

interface ActivityItem {
  id: string;
  action: string;
  note: string | null;
  createdAt: string;
  drawingId: string;
  drawingNumber: string | null;
  drawingName: string | null;
  revisionNo: string | null;
  actorName: string | null;
  actorRole: UserRole | null;
  currentStatus: RevisionStatus | null;
}

interface DrawingListItem {
  id: string;
  drawingNumber: string;
  drawingName: string;
  area: string;
  discipline: string;
  drawnByName: string | null;
  drawnByUsername: string | null;
  currentStatus: RevisionStatus;
  updatedAt: string;
  currentRevision: {
    id: string;
    revisionNo: string;
    status: RevisionStatus;
    fileName: string;
    submittedAt: string | null;
    updatedAt: string;
  } | null;
}

interface DashboardResponse {
  summary: DashboardSummary;
  recentActivity: ActivityItem[];
}

export default function DashboardPage() {
  const { currentUser } = useDemoApp();

  return (
    <AuthGuard>
      {currentUser ? <DashboardContent role={currentUser.role} /> : null}
    </AuthGuard>
  );
}

function DashboardContent({ role }: { role: UserRole }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [queue, setQueue] = useState<DrawingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const dashboardCopy = getDashboardCopy(role);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [dashboardResponse, drawingsResponse] = await Promise.all([
          apiFetch<DashboardResponse>("/api/dashboard/summary"),
          apiFetch<{ items: DrawingListItem[] }>("/api/drawings")
        ]);

        if (cancelled) {
          return;
        }

        setSummary(dashboardResponse.summary);
        setActivity(dashboardResponse.recentActivity);
        setQueue(
          drawingsResponse.items
            .filter((item) => matchesRoleQueue(role, item.currentStatus))
            .sort((left, right) => {
              const priorityDelta =
                getQueuePriority(role, left.currentStatus) - getQueuePriority(role, right.currentStatus);

              if (priorityDelta !== 0) {
                return priorityDelta;
              }

              return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
            })
            .slice(0, 6)
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, "Dashboard tidak dapat dimuat."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [role]);

  const headerActions = (
    <>
      <Link href="/drawings">
        <Button variant="secondary">{dashboardCopy.headerLinkLabel}</Button>
      </Link>
      {canCreateDrawing(role) ? (
        <Link href="/drawings/new">
          <Button>Create Drawing</Button>
        </Link>
      ) : null}
    </>
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Dashboard"
          title={dashboardCopy.title}
          description={dashboardCopy.description}
          actions={headerActions}
        />
        <DashboardLoadingState />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Dashboard"
          title={dashboardCopy.title}
          description={dashboardCopy.description}
          actions={headerActions}
        />
        <Card className="border-danger/20 bg-white/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-danger">Error</p>
              <h2 className="mt-2 text-xl font-semibold text-text">Ringkasan belum bisa ditampilkan</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                {error || "Dashboard tidak tersedia untuk saat ini."}
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

  const actionableCount = getActionableCount(role, summary);
  const completionRate = getCompletionRate(summary);
  const statCards = getStatCards(role, summary);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title={dashboardCopy.title}
        description={dashboardCopy.description}
        actions={headerActions}
      />

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="relative overflow-hidden border-transparent bg-graphite text-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
          <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />

          <div className="relative space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/55">
                  Fokus {getRoleLabel(role)}
                </p>
                <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
                  {dashboardCopy.focusTitle}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
                  {dashboardCopy.focusDescription}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/55">
                  Prioritas Aktif
                </p>
                <p className="mt-2 text-5xl font-semibold">{actionableCount}</p>
                <p className="mt-1 text-sm text-white/65">{dashboardCopy.focusMetricLabel}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <HighlightStat
                label="Total Visible"
                value={summary.totalDrawings}
                tone="bg-white/8 text-white"
              />
              <HighlightStat
                label="Need Attention"
                value={summary.waitingCheck + summary.waitingApproval1 + summary.waitingApproval2 + summary.rejected + summary.drafts}
                tone="bg-brand/25 text-white"
              />
              <HighlightStat
                label="Completed"
                value={summary.completed}
                tone="bg-white/8 text-white"
              />
            </div>
          </div>
        </Card>

        <Card className="bg-white/75">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Workflow Health</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Kondisi workflow</h2>

          <div className="mt-6 rounded-[24px] border border-border/80 bg-panel/30 p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text">Completion Rate</p>
                <p className="mt-1 text-sm text-muted">
                  Persentase drawing visible yang sudah selesai pada role aktif.
                </p>
              </div>
              <p className="text-3xl font-semibold text-text">{completionRate}%</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {statCards.map((item) => (
              <div
                className="flex items-center justify-between rounded-2xl border border-border/75 bg-white px-4 py-3"
                key={item.label}
              >
                <div>
                  <p className="text-sm font-semibold text-text">{item.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
                    {item.description}
                  </p>
                </div>
                <p className={`text-2xl font-semibold ${item.valueTone}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={dashboardCopy.primaryCardLabel}
          value={actionableCount}
          tone="border-brand/15 bg-brand/6 text-text"
        />
        <MetricCard label="Draft" value={summary.drafts} tone="bg-surface text-text" />
        <MetricCard label="Rejected" value={summary.rejected} tone="bg-surface text-text" />
        <MetricCard label="Completed" value={summary.completed} tone="bg-surface text-text" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">
                {dashboardCopy.queueEyebrow}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-text">{dashboardCopy.queueTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                {dashboardCopy.queueDescription}
              </p>
            </div>
            <Link className="text-sm font-semibold text-brand" href="/drawings">
              {dashboardCopy.headerLinkLabel}
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {queue.length === 0 ? (
              <EmptyState
                description={dashboardCopy.queueEmptyDescription}
                title={dashboardCopy.queueEmptyTitle}
              />
            ) : (
              queue.map((drawing) => (
                <div
                  className="rounded-[26px] border border-border/80 bg-white p-4 transition hover:border-brand/25 hover:bg-brand/5"
                  key={drawing.id}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">
                        {drawing.drawingNumber}
                      </p>
                      <Link href={`/drawings/${drawing.id}`}>
                        <h3 className="mt-2 text-lg font-semibold text-text transition hover:text-brand">
                          {drawing.drawingName}
                        </h3>
                      </Link>
                      <p className="mt-2 text-sm text-muted">
                        {drawing.area} / {drawing.discipline} / Rev{" "}
                        {drawing.currentRevision?.revisionNo ?? "-"}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Drafter: {drawing.drawnByName ?? drawing.drawnByUsername ?? "-"} / Updated At:{" "}
                        {formatDateTime(drawing.updatedAt)}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <StatusBadge status={drawing.currentStatus} />
                      <Link href={getQueueHref(role, drawing.id, drawing.currentStatus)}>
                        <Button variant="secondary">{getQueueCtaLabel(role, drawing.currentStatus)}</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Activity Feed</p>
              <h2 className="mt-2 text-2xl font-semibold text-text">Aktivitas terbaru</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                Aktivitas terbaru yang masih relevan dengan drawing yang visible pada role aktif.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {activity.length === 0 ? (
              <EmptyState
                description="Belum ada perubahan status atau aksi terbaru yang tercatat pada scope dashboard ini."
                title="Aktivitas masih kosong"
              />
            ) : (
              activity.map((item) => (
                <div className="rounded-[24px] border border-border/80 bg-white p-4" key={item.id}>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text">{humanizeAuditAction(item.action)}</p>
                        <p className="mt-1 text-sm text-muted">
                          {item.drawingNumber ?? "Drawing"} / {item.drawingName ?? "Tanpa judul"}
                          {item.revisionNo ? ` / Rev ${item.revisionNo}` : ""}
                        </p>
                      </div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>

                    {item.note ? (
                      <p className="text-sm leading-6 text-muted">{item.note}</p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2">
                      {item.currentStatus ? <StatusBadge status={item.currentStatus} /> : null}
                      {item.actorName ? (
                        <span className="rounded-full border border-border bg-panel/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-text">
                          {item.actorName}
                          {item.actorRole ? ` / ${getRoleLabel(item.actorRole)}` : ""}
                        </span>
                      ) : null}
                      <Link className="text-sm font-semibold text-brand" href={`/drawings/${item.drawingId}`}>
                        Open Drawing
                      </Link>
                    </div>
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

function DashboardLoadingState() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="h-[280px] bg-graphite/95" />
        <Card className="h-[280px] bg-white/70" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card className="h-32 bg-white/70" key={index} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="h-[420px] bg-white/70" />
        <Card className="h-[420px] bg-white/70" />
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className={tone}>
      <p className="text-xs font-bold uppercase tracking-[0.26em] text-muted">{label}</p>
      <p className="mt-4 text-4xl font-semibold text-text">{value}</p>
    </Card>
  );
}

function HighlightStat({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`rounded-[22px] border border-white/10 px-4 py-4 ${tone}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function getDashboardCopy(role: UserRole) {
  if (role === "DRAFTER") {
    return {
      title: "Ringkasan Pekerjaan Drafter",
      description:
        "Fokus dashboard diarahkan ke draft aktif, revisi yang dikembalikan, dan drawing yang perlu Anda teruskan ke tahap berikutnya.",
      focusTitle: "Fokuskan energi ke draft aktif dan revisi yang kembali ke meja Anda.",
      focusDescription:
        "Pantau pekerjaan yang masih bisa Anda edit atau perlu diperbaiki supaya antrian approval tetap bergerak.",
      focusMetricLabel: "item siap Anda tindak lanjuti",
      primaryCardLabel: "Need Your Action",
      queueEyebrow: "My Queue",
      queueTitle: "Prioritas pengerjaan Anda",
      queueDescription:
        "Urutan berikut menyorot draft aktif dan revisi yang dikembalikan agar Anda bisa lanjut tanpa membuka daftar penuh.",
      queueEmptyTitle: "Tidak ada draft yang mendesak",
      queueEmptyDescription:
        "Semua draft Anda sudah selesai diproses atau sedang menunggu tahap berikutnya.",
      headerLinkLabel: "Open Drawing List"
    };
  }

  if (role === "DRAFT_LEADER") {
    return {
      title: "Ringkasan Check Drawing",
      description:
        "Dashboard ini menonjolkan drawing yang menunggu check agar proses review teknis tidak tertahan.",
      focusTitle: "Antrian check adalah fokus utama Anda hari ini.",
      focusDescription:
        "Semakin cepat drawing diverifikasi, semakin lancar perpindahannya ke approver level berikutnya.",
      focusMetricLabel: "drawing menunggu check",
      primaryCardLabel: "Waiting Check",
      queueEyebrow: "Check Queue",
      queueTitle: "Drawing yang menunggu check",
      queueDescription:
        "Tinjau drawing yang baru dikirim oleh drafter dan proses item paling baru terlebih dahulu.",
      queueEmptyTitle: "Tidak ada drawing untuk di-check",
      queueEmptyDescription:
        "Antrian check sedang kosong. Dashboard ini akan otomatis terisi saat ada revisi baru masuk.",
      headerLinkLabel: "Open Drawing List"
    };
  }

  if (role === "APPROVER_L1") {
    return {
      title: "Ringkasan Approval Level 1",
      description:
        "Semua blok di dashboard dipilih untuk membantu Anda memproses approval level 1 dengan cepat dan konsisten.",
      focusTitle: "Approval level 1 yang tertunda perlu segera diputuskan.",
      focusDescription:
        "Gunakan queue sebagai daftar kerja utama untuk membuka gambar yang sudah lolos check dan siap diapprove.",
      focusMetricLabel: "drawing menunggu approval level 1",
      primaryCardLabel: "Waiting Approval L1",
      queueEyebrow: "Approval Queue",
      queueTitle: "Drawing siap approval level 1",
      queueDescription:
        "Buka item dari queue ini untuk meninjau hasil check dan memberi keputusan tanpa berpindah-pindah halaman.",
      queueEmptyTitle: "Approval level 1 sedang kosong",
      queueEmptyDescription:
        "Belum ada drawing yang masuk ke meja approval level 1 pada saat ini.",
      headerLinkLabel: "Open Drawing List"
    };
  }

  if (role === "HEAD") {
    return {
      title: "Ringkasan Final Approval",
      description:
        "Dashboard ini dirancang untuk membantu Anda melihat item yang sudah hampir selesai dan butuh keputusan final.",
      focusTitle: "Final approval adalah bottleneck terakhir sebelum drawing selesai.",
      focusDescription:
        "Pantau item yang sudah lolos approval level 1 lalu selesaikan final approval agar drawing segera siap dipakai.",
      focusMetricLabel: "drawing menunggu final approval",
      primaryCardLabel: "Waiting Final Approval",
      queueEyebrow: "Final Queue",
      queueTitle: "Drawing siap final approval",
      queueDescription:
        "Daftar ini menampilkan drawing yang sudah melalui tahap sebelumnya dan tinggal menunggu keputusan akhir.",
      queueEmptyTitle: "Belum ada final approval",
      queueEmptyDescription:
        "Saat ini tidak ada drawing yang menunggu keputusan final di dashboard Anda.",
      headerLinkLabel: "Open Drawing List"
    };
  }

  if (role === "CONSUMER") {
    return {
      title: "Ringkasan Dokumen Final",
      description:
        "Dashboard consumer disederhanakan untuk membantu Anda menemukan drawing final yang paling relevan dan terbaru.",
      focusTitle: "Dokumen completed adalah sumber utama yang siap digunakan.",
      focusDescription:
        "Gunakan dashboard ini untuk melihat jumlah dokumen final yang tersedia dan membuka drawing terbaru dengan cepat.",
      focusMetricLabel: "drawing completed tersedia",
      primaryCardLabel: "Completed Drawing",
      queueEyebrow: "Latest Documents",
      queueTitle: "Drawing final terbaru",
      queueDescription:
        "Queue ini menampilkan dokumen completed yang paling baru diperbarui agar lebih cepat ditemukan.",
      queueEmptyTitle: "Belum ada dokumen final",
      queueEmptyDescription:
        "Belum ada drawing completed yang tersedia untuk role consumer saat ini.",
      headerLinkLabel: "Open Drawing List"
    };
  }

  return {
    title: "Ringkasan Operasional Admin",
    description:
      "Dashboard admin memberi gambaran cepat terhadap kesehatan alur drawing, item yang menumpuk, dan aktivitas terbaru lintas peran.",
    focusTitle: "Lihat hambatan proses sebelum mereka menjadi bottleneck.",
    focusDescription:
      "Sebagai admin, Anda bisa memantau antrian lintas tahap, membantu unblock proses, dan menjaga disiplin operasional seluruh workflow.",
    focusMetricLabel: "item operasional perlu perhatian",
    primaryCardLabel: "Need Admin Attention",
    queueEyebrow: "Operations Queue",
    queueTitle: "Drawing yang masih berjalan",
    queueDescription:
      "Queue ini menyorot drawing yang belum selesai agar lebih mudah memantau kemacetan lintas tahapan.",
    queueEmptyTitle: "Semua alur sedang bersih",
    queueEmptyDescription:
      "Tidak ada drawing aktif yang tertahan. Mayoritas item sudah selesai atau belum ada pekerjaan berjalan.",
    headerLinkLabel: "Open Drawing List"
  };
}

function matchesRoleQueue(role: UserRole, status: RevisionStatus) {
  if (role === "DRAFTER") {
    return ["DRAFT", "CHECK_REJECTED", "APPROVAL_1_REJECTED", "APPROVAL_2_REJECTED"].includes(
      status
    );
  }

  if (role === "DRAFT_LEADER") {
    return status === "WAITING_CHECK";
  }

  if (role === "APPROVER_L1") {
    return status === "WAITING_APPROVAL_1";
  }

  if (role === "HEAD") {
    return status === "WAITING_APPROVAL_2";
  }

  if (role === "CONSUMER") {
    return status === "COMPLETED";
  }

  return !["COMPLETED", "OBSOLETE"].includes(status);
}

function getQueuePriority(role: UserRole, status: RevisionStatus) {
  if (role === "ADMIN") {
    const priorityMap: Record<RevisionStatus, number> = {
      WAITING_APPROVAL_2: 1,
      WAITING_APPROVAL_1: 2,
      WAITING_CHECK: 3,
      CHECK_REJECTED: 4,
      APPROVAL_1_REJECTED: 5,
      APPROVAL_2_REJECTED: 6,
      DRAFT: 7,
      COMPLETED: 8,
      OBSOLETE: 9
    };

    return priorityMap[status];
  }

  return 1;
}

function getActionableCount(role: UserRole, summary: DashboardSummary) {
  if (role === "DRAFTER") {
    return summary.drafts + summary.rejected;
  }

  if (role === "DRAFT_LEADER") {
    return summary.waitingCheck;
  }

  if (role === "APPROVER_L1") {
    return summary.waitingApproval1;
  }

  if (role === "HEAD") {
    return summary.waitingApproval2;
  }

  if (role === "CONSUMER") {
    return summary.completed;
  }

  return (
    summary.waitingCheck +
    summary.waitingApproval1 +
    summary.waitingApproval2 +
    summary.rejected +
    summary.drafts
  );
}

function getCompletionRate(summary: DashboardSummary) {
  if (summary.totalDrawings === 0) {
    return 0;
  }

  return Math.round((summary.completed / summary.totalDrawings) * 100);
}

function getStatCards(role: UserRole, summary: DashboardSummary) {
  if (role === "DRAFTER") {
    return [
      {
        label: "Draft aktif",
        description: "Masih bisa diedit",
        value: summary.drafts,
        valueTone: "text-text"
      },
      {
        label: "Rejected",
        description: "Dikembalikan dari approval",
        value: summary.rejected,
        valueTone: "text-danger"
      },
      {
        label: "Waiting Check",
        description: "Sudah dikirim ke reviewer",
        value: summary.waitingCheck,
        valueTone: "text-brand"
      },
      {
        label: "Completed",
        description: "Final yang sudah beres",
        value: summary.completed,
        valueTone: "text-[#49605a]"
      }
    ];
  }

  if (role === "CONSUMER") {
    return [
      {
        label: "Completed",
        description: "Siap diakses",
        value: summary.completed,
        valueTone: "text-[#49605a]"
      },
      {
        label: "Total Visible",
        description: "Dokumen yang dapat Anda lihat",
        value: summary.totalDrawings,
        valueTone: "text-text"
      },
      {
        label: "Draft",
        description: "Tidak visible untuk consumer",
        value: summary.drafts,
        valueTone: "text-text"
      },
      {
        label: "Rejected",
        description: "Tidak visible untuk consumer",
        value: summary.rejected,
        valueTone: "text-text"
      }
    ];
  }

  return [
    {
      label: "Waiting Check",
      description: "Antrian tahap lead check",
      value: summary.waitingCheck,
      valueTone: "text-brand"
    },
    {
      label: "Waiting Approval L1",
      description: "Butuh keputusan approver L1",
      value: summary.waitingApproval1,
      valueTone: "text-brand"
    },
    {
      label: "Waiting Final Approval",
      description: "Menunggu keputusan head",
      value: summary.waitingApproval2,
      valueTone: "text-brand"
    },
    {
      label: "Rejected",
      description: "Perlu kembali ke drafter",
      value: summary.rejected,
      valueTone: "text-danger"
    }
  ];
}

function getQueueHref(role: UserRole, drawingId: string, status: RevisionStatus) {
  if (role === "DRAFT_LEADER" && status === "WAITING_CHECK") {
    return `/drawings/${drawingId}/check`;
  }

  if (role === "APPROVER_L1" && status === "WAITING_APPROVAL_1") {
    return `/drawings/${drawingId}/approve`;
  }

  if (role === "HEAD" && status === "WAITING_APPROVAL_2") {
    return `/drawings/${drawingId}/approve`;
  }

  if (role === "DRAFTER" && ["DRAFT", "CHECK_REJECTED", "APPROVAL_1_REJECTED", "APPROVAL_2_REJECTED"].includes(status)) {
    return `/drawings/${drawingId}/edit`;
  }

  return `/drawings/${drawingId}`;
}

function getQueueCtaLabel(role: UserRole, status: RevisionStatus) {
  if (role === "DRAFTER" && ["DRAFT", "CHECK_REJECTED", "APPROVAL_1_REJECTED", "APPROVAL_2_REJECTED"].includes(status)) {
    return "Lanjutkan revisi";
  }

  if (role === "DRAFT_LEADER" && status === "WAITING_CHECK") {
    return "Start Check";
  }

  if (role === "APPROVER_L1" && status === "WAITING_APPROVAL_1") {
    return "Open Approval";
  }

  if (role === "HEAD" && status === "WAITING_APPROVAL_2") {
    return "Open Final Approval";
  }

  if (role === "CONSUMER") {
    return "View Document";
  }

  return "Open Detail";
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
    CHECK_REJECTED: "Check rejected",
    APPROVAL_1_REJECTED: "Approval level 1 rejected",
    APPROVAL_2_REJECTED: "Final approval rejected",
    COMPLETED: "Drawing completed",
    DRAWING_DOWNLOADED: "Final drawing diunduh"
  };

  return labels[action] ?? action.replace(/_/g, " ").toLowerCase();
}
