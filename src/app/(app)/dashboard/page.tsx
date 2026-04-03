"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { DashboardSummary, RevisionStatus, UserRole } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import { getRoleLabel } from "@/lib/utils/permissions";

interface ActivityItem {
  id: string;
  action: string;
  note: string | null;
  createdAt: string;
}

interface DrawingListItem {
  id: string;
  drawingNumber: string;
  drawingName: string;
  area: string;
  discipline: string;
  currentStatus: RevisionStatus;
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
  const [pending, setPending] = useState<DrawingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [dashboardResponse, drawingsResponse] = await Promise.all([
          apiFetch<{ summary: DashboardSummary; recentActivity: ActivityItem[] }>(
            "/api/dashboard/summary"
          ),
          apiFetch<{ items: Array<DrawingListItem & { currentRevision: { status: RevisionStatus } | null }> }>(
            "/api/drawings"
          )
        ]);

        if (cancelled) {
          return;
        }

        setSummary(dashboardResponse.summary);
        setActivity(dashboardResponse.recentActivity);
        setPending(
          drawingsResponse.items
            .filter((item) => matchesRoleQueue(role, item.currentStatus))
            .slice(0, 5)
            .map(({ currentRevision: _currentRevision, ...item }) => item)
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

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Dashboard"
          title={`Ringkasan ${getRoleLabel(role)}`}
          description="Informasi pada dashboard disusun sesuai kebutuhan dan prioritas kerja pada setiap peran."
        />
        <Card>
          <p className="text-sm text-muted">Memuat ringkasan dashboard...</p>
        </Card>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Dashboard"
          title={`Ringkasan ${getRoleLabel(role)}`}
          description="Informasi pada dashboard disusun sesuai kebutuhan dan prioritas kerja pada setiap peran."
        />
        <Card className="border-danger/15">
          <p className="text-sm font-medium text-danger">{error || "Dashboard tidak tersedia."}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title={`Ringkasan ${getRoleLabel(role)}`}
        description="Informasi pada dashboard disusun sesuai kebutuhan dan prioritas kerja pada setiap peran."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Drawing" value={summary.totalDrawings} tone="bg-brand text-white" />
        <MetricCard label="Waiting Check" value={summary.waitingCheck} tone="bg-surface text-text" />
        <MetricCard label="Waiting Approval L1" value={summary.waitingApproval1} tone="bg-surface text-text" />
        <MetricCard label="Waiting Approval Head" value={summary.waitingApproval2} tone="bg-surface text-text" />
        <MetricCard label="Rejected" value={summary.rejected} tone="bg-danger text-white" />
        <MetricCard label="Completed" value={summary.completed} tone="bg-sage/90 text-white" />
        <MetricCard label="Draft" value={summary.drafts} tone="bg-[#999999] text-white" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Task Queue</p>
              <h2 className="mt-2 text-2xl font-semibold text-text">Drawing yang butuh perhatian</h2>
            </div>
            <Link className="text-sm font-semibold text-brand" href="/drawings">
              Lihat semua
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {pending.length === 0 ? (
              <p className="text-sm text-muted">Tidak ada drawing yang menunggu tindak lanjut.</p>
            ) : (
              pending.map((drawing) => (
                <Link
                  className="block rounded-3xl border border-border bg-white px-4 py-4 transition hover:border-brand/30 hover:bg-brand/5"
                  href={`/drawings/${drawing.id}`}
                  key={drawing.id}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">
                        {drawing.drawingNumber}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-text">{drawing.drawingName}</h3>
                      <p className="mt-1 text-sm text-muted">
                        {drawing.area} • {drawing.discipline}
                      </p>
                    </div>
                    <StatusBadge status={drawing.currentStatus} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Recent Activity</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Audit feed terakhir</h2>
          <div className="mt-6 space-y-4">
            {activity.length === 0 ? (
              <p className="text-sm text-muted">Belum ada aktivitas yang tercatat.</p>
            ) : (
              activity.map((item) => (
                <div className="rounded-3xl border border-border bg-white p-4" key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{item.action}</p>
                      <p className="mt-1 text-sm leading-6 text-muted">{item.note || "-"}</p>
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

  return status !== "OBSOLETE";
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className={tone}>
      <p className="text-xs font-bold uppercase tracking-[0.28em] opacity-70">{label}</p>
      <p className="mt-4 text-4xl font-semibold">{value}</p>
    </Card>
  );
}
