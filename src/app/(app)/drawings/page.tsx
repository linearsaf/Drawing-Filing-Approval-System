"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiFetch, buildQuery, getErrorMessage } from "@/lib/api-client";
import { DrafterOption, DrawingFilters, RevisionStatus, UserRole } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import {
  canApproveRevision,
  canCheckRevision,
  canCreateDrawing,
  canDeleteDrawing,
  canEditRevision,
  getRoleLabel
} from "@/lib/utils/permissions";

const defaultFilters: DrawingFilters = {
  search: "",
  status: "ALL",
  area: "",
  drawnBy: "",
  revision: "",
  dateFrom: "",
  dateTo: ""
};

type ViewMode = "card" | "list";

interface DrawingListItem {
  id: string;
  drawingNumber: string;
  drawingName: string;
  sacCode: string;
  area: string;
  discipline: string;
  description: string | null;
  drawnByUserId: string;
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

export default function DrawingsPage() {
  const { currentUser } = useDemoApp();
  const [filters, setFilters] = useState<DrawingFilters>(defaultFilters);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  return (
    <AuthGuard>
      {currentUser ? (
        <DrawingsContent
          filters={filters}
          onFiltersChange={setFilters}
          onViewModeChange={setViewMode}
          role={currentUser.role}
          viewMode={viewMode}
        />
      ) : null}
    </AuthGuard>
  );
}

function DrawingsContent({
  role,
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange
}: {
  role: UserRole;
  filters: DrawingFilters;
  onFiltersChange: (filters: DrawingFilters) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}) {
  const [items, setItems] = useState<DrawingListItem[]>([]);
  const [drafters, setDrafters] = useState<DrafterOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const pageCopy = getDrawingsCopy(role);
  const activeFilterCount = getActiveFilterCount(filters);
  const summary = getDrawingSummary(items);

  const getDrawings = async (activeFilters: DrawingFilters) => {
    const query = buildQuery({
      search: activeFilters.search,
      status: activeFilters.status,
      area: activeFilters.area,
      drawnBy: activeFilters.drawnBy,
      revision: activeFilters.revision,
      dateFrom: activeFilters.dateFrom,
      dateTo: activeFilters.dateTo
    });

    const response = await apiFetch<{ items: DrawingListItem[] }>(`/api/drawings${query}`);
    return response.items;
  };

  useEffect(() => {
    let cancelled = false;

    const loadDrafters = async () => {
      try {
        const response = await apiFetch<{ items: DrafterOption[] }>("/api/users/drafters");

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
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDrawings = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextItems = await getDrawings(filters);

        if (!cancelled) {
          setItems(nextItems);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, "Daftar drawing tidak dapat dimuat."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDrawings();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const resetFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const handleDelete = async (drawing: DrawingListItem) => {
    const confirmed = window.confirm(
      `Hapus drawing ${drawing.drawingNumber} / ${drawing.drawingName}? Aksi ini tidak bisa dibatalkan.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(drawing.id);
    setError("");
    setSuccess("");

    try {
      await apiFetch<{ drawingId: string }>(`/api/drawings/${drawing.id}`, {
        method: "DELETE"
      });

      const nextItems = await getDrawings(filters);
      setItems(nextItems);
      setSuccess(`Drawing ${drawing.drawingNumber} berhasil dihapus.`);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Drawing gagal dihapus."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Drawing List"
        title={pageCopy.title}
        description={pageCopy.description}
        actions={
          <>
            <Button onClick={resetFilters} variant="secondary">
              Reset Filter
            </Button>
            {canCreateDrawing(role) ? (
              <Link href="/drawings/new">
                <Button>Create Drawing</Button>
              </Link>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="relative overflow-hidden border-transparent bg-graphite text-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
          <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
          <div className="relative space-y-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/55">
                  Workspace {getRoleLabel(role)}
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
                  Active Filter
                </p>
                <p className="mt-2 text-5xl font-semibold">{activeFilterCount}</p>
                <p className="mt-1 text-sm text-white/65">
                  {activeFilterCount === 0 ? "Tidak ada filter tambahan" : "filter sedang digunakan"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <OverviewStat label="Visible" value={summary.total} />
              <OverviewStat label="Draft" value={summary.drafts} />
              <OverviewStat label="Need Review" value={summary.waiting} />
              <OverviewStat label="Completed" value={summary.completed} />
            </div>
          </div>
        </Card>

        <Card className="bg-white/75">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">View & Summary</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Browse lebih cepat</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Gunakan card view untuk membaca konteks lebih lengkap, atau compact list untuk menyapu banyak item sekaligus.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              onClick={() => onViewModeChange("card")}
              variant={viewMode === "card" ? "primary" : "secondary"}
            >
              Card View
            </Button>
            <Button
              onClick={() => onViewModeChange("list")}
              variant={viewMode === "list" ? "primary" : "secondary"}
            >
              Compact List
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            <MiniSummaryRow
              label="Status filter"
              value={filters.status === "ALL" ? "Semua status" : filters.status}
            />
            <MiniSummaryRow
              label="Area"
              value={filters.area || "Semua area"}
            />
            <MiniSummaryRow
              label="Drafter"
              value={
                filters.drawnBy
                  ? drafters.find((item) => item.id === filters.drawnBy)?.name ?? "Drafter terpilih"
                  : "Semua drafter"
              }
            />
          </div>
        </Card>
      </div>

      {success ? (
        <Card className="border-brand/15 bg-white/70">
          <p className="text-sm font-medium text-brand">{success}</p>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-danger/15 bg-white/70">
          <p className="text-sm font-medium text-danger">{error}</p>
        </Card>
      ) : null}

      <Card>
        <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Filter Panel</p>
            <h2 className="mt-2 text-2xl font-semibold text-text">Cari dan persempit hasil</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Fokuskan daftar dengan kata kunci, status, area, drafter, revisi, dan rentang tanggal.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-border bg-panel/35 px-4 py-2 text-sm font-semibold text-text">
              {summary.total} drawing visible
            </div>
            <Button onClick={resetFilters} variant="secondary">
              Reset Filter
            </Button>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
            <div className="md:col-span-2 xl:col-span-6">
              <FilterField label="Kata kunci">
                <Input
                  onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
                  placeholder="Nomor drawing, nama, SAC, atau area"
                  value={filters.search}
                />
              </FilterField>
            </div>
            <div className="xl:col-span-3">
              <FilterField label="Status">
                <Select
                  onChange={(event) =>
                    onFiltersChange({ ...filters, status: event.target.value as RevisionStatus | "ALL" })
                  }
                  value={filters.status}
                >
                  <option value="ALL">Semua Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="WAITING_CHECK">Waiting Check</option>
                  <option value="WAITING_APPROVAL_1">Waiting Approval L1</option>
                  <option value="WAITING_APPROVAL_2">Waiting Final Approval</option>
                  <option value="CHECK_REJECTED">Check Rejected</option>
                  <option value="APPROVAL_1_REJECTED">Approval L1 Rejected</option>
                  <option value="APPROVAL_2_REJECTED">Final Approval Rejected</option>
                  <option value="COMPLETED">Completed</option>
                </Select>
              </FilterField>
            </div>
            <div className="xl:col-span-3">
              <FilterField label="Drafter">
                <Select
                  onChange={(event) => onFiltersChange({ ...filters, drawnBy: event.target.value })}
                  value={filters.drawnBy}
                >
                  <option value="">Semua Drafter</option>
                  {drafters.map((drafter) => (
                    <option key={drafter.id} value={drafter.id}>
                      {drafter.name}
                    </option>
                  ))}
                </Select>
              </FilterField>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
            <div className="md:col-span-2 xl:col-span-6">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.7fr)_minmax(0,0.85fr)]">
                <FilterField label="Area">
                  <Input
                    onChange={(event) => onFiltersChange({ ...filters, area: event.target.value })}
                    placeholder="Semua area"
                    value={filters.area}
                  />
                </FilterField>
                <FilterField label="Revisi">
                  <Input
                    onChange={(event) => onFiltersChange({ ...filters, revision: event.target.value })}
                    placeholder="Contoh A / B / C"
                    value={filters.revision}
                  />
                </FilterField>
              </div>
            </div>
            <div className="xl:col-span-3">
              <FilterField label="Dari tanggal">
                <Input
                  onChange={(event) => onFiltersChange({ ...filters, dateFrom: event.target.value })}
                  type="date"
                  value={filters.dateFrom}
                />
              </FilterField>
            </div>
            <div className="xl:col-span-3">
              <FilterField label="Sampai tanggal">
                <Input
                  onChange={(event) => onFiltersChange({ ...filters, dateTo: event.target.value })}
                  type="date"
                  value={filters.dateTo}
                />
              </FilterField>
            </div>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <DrawingsLoadingState />
      ) : items.length === 0 ? (
        <EmptyState
          actionHref={canCreateDrawing(role) ? "/drawings/new" : undefined}
          actionLabel={canCreateDrawing(role) ? "Create Drawing" : undefined}
          description="Tidak ada hasil yang cocok dengan kombinasi filter saat ini. Coba longgarkan filter atau cari dengan kata kunci lain."
          title="Belum ada drawing yang sesuai"
        />
      ) : viewMode === "card" ? (
        <div className="grid gap-4">
          {items.map((drawing) => {
            const currentRevision = drawing.currentRevision;

            return (
              <Card key={drawing.id}>
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">
                          {drawing.drawingNumber}
                        </p>
                        <StatusBadge status={drawing.currentStatus} />
                      </div>
                      <h3 className="mt-3 text-xl font-semibold text-text">{drawing.drawingName}</h3>
                      <p className="mt-2 text-sm text-muted">
                        {drawing.sacCode} / {drawing.area} / {drawing.discipline}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <ActionButtons
                        drawing={drawing}
                        isDeleting={deletingId === drawing.id}
                        onDelete={handleDelete}
                        role={role}
                      />
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-muted">
                    {drawing.description || "Belum ada deskripsi tambahan untuk drawing ini."}
                  </p>

                  <div className="grid gap-3 md:grid-cols-3">
                    <CompactInfoCard
                      label="Drafter"
                      value={drawing.drawnByName ?? drawing.drawnByUsername ?? "-"}
                    />
                    <CompactInfoCard
                      label="Current Revision"
                      value={currentRevision?.revisionNo ?? "-"}
                    />
                    <CompactInfoCard
                      label="Updated At"
                      value={formatDateTime(drawing.updatedAt)}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="hidden grid-cols-[minmax(0,1.22fr)_minmax(0,0.62fr)_minmax(168px,0.9fr)_minmax(132px,0.74fr)_184px] gap-4 border-b border-border bg-panel/55 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-muted lg:grid">
            <div>Drawing</div>
            <div>Info</div>
            <div>Status</div>
            <div>Updated At</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="divide-y divide-border/80">
            {items.map((drawing) => (
              <div
                className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1.22fr)_minmax(0,0.62fr)_minmax(168px,0.9fr)_minmax(132px,0.74fr)_184px] lg:items-start"
                key={drawing.id}
              >
                <div className="min-w-0 self-start">
                  <p className="break-words text-[11px] font-bold uppercase tracking-[0.14em] leading-5 text-brand">
                    {drawing.drawingNumber}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-text">{drawing.drawingName}</p>
                  <p className="truncate text-sm text-muted">
                    {drawing.sacCode} / {drawing.area} / {drawing.discipline}
                  </p>
                </div>

                <div className="min-w-0 self-start pt-[2px] text-sm text-muted">
                  <p className="truncate font-medium leading-6 text-text/88">
                    Rev {drawing.currentRevision?.revisionNo ?? "-"}
                  </p>
                  <p className="truncate leading-6">
                    Drafter: {drawing.drawnByName ?? drawing.drawnByUsername ?? "-"}
                  </p>
                </div>

                <div className="min-w-0 self-start pt-[2px]">
                  <StatusBadge
                    compact
                    label={getCompactStatusLabel(drawing.currentStatus)}
                    status={drawing.currentStatus}
                  />
                </div>

                <div className="self-start pt-[4px] text-sm text-muted">
                  <p className="leading-6">{formatDateTime(drawing.updatedAt)}</p>
                </div>

                <div className="self-start pt-[2px] lg:pl-2">
                  <ActionButtons
                    compact
                    drawing={drawing}
                    isDeleting={deletingId === drawing.id}
                    onDelete={handleDelete}
                    role={role}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ActionButtons({
  drawing,
  onDelete,
  role,
  compact,
  isDeleting
}: {
  drawing: DrawingListItem;
  onDelete: (drawing: DrawingListItem) => void;
  role: UserRole;
  compact?: boolean;
  isDeleting?: boolean;
}) {
  const currentRevision = drawing.currentRevision;
  const actions: ReactNode[] = [];

  actions.push(
    <Link className={compact ? "block" : undefined} href={`/drawings/${drawing.id}`} key="detail">
      <Button className={compact ? "w-full px-3 py-2 text-xs" : undefined} variant="secondary">
        Detail
      </Button>
    </Link>
  );

  if (currentRevision && canEditRevision(role, currentRevision.status)) {
    actions.push(
      <Link
        className={compact ? "block" : undefined}
        href={`/drawings/${drawing.id}/edit`}
        key="edit"
      >
        <Button className={compact ? "w-full px-3 py-2 text-xs" : undefined} variant="secondary">
          Edit
        </Button>
      </Link>
    );
  }

  if (currentRevision && canCheckRevision(role, currentRevision.status)) {
    actions.push(
      <Link
        className={compact ? "block" : undefined}
        href={`/drawings/${drawing.id}/check`}
        key="check"
      >
        <Button className={compact ? "w-full px-3 py-2 text-xs" : undefined}>Check</Button>
      </Link>
    );
  }

  if (currentRevision && canApproveRevision(role, currentRevision.status)) {
    actions.push(
      <Link
        className={compact ? "block" : undefined}
        href={`/drawings/${drawing.id}/approve`}
        key="approve"
      >
        <Button className={compact ? "w-full px-3 py-2 text-xs" : undefined}>Approve</Button>
      </Link>
    );
  }

  if (canDeleteDrawing(role)) {
    actions.push(
      <Button
        className={compact ? "w-full px-3 py-2 text-xs" : undefined}
        disabled={isDeleting}
        key="delete"
        onClick={() => void onDelete(drawing)}
        variant="danger"
      >
        {isDeleting ? "Menghapus..." : "Hapus"}
      </Button>
    );
  }

  if (!compact) {
    return <>{actions}</>;
  }

  const firstRow = actions.slice(0, 2);
  const secondRow = actions.slice(2);

  return (
    <div className="w-[184px] space-y-2">
      <div className="grid grid-cols-2 gap-2">{firstRow}</div>
      {secondRow.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">{secondRow}</div>
      ) : null}
    </div>
  );
}

function DrawingsLoadingState() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card className="h-44 animate-pulse bg-white/70" key={index} />
      ))}
    </div>
  );
}

function getCompactStatusLabel(status: RevisionStatus) {
  const compactLabels: Record<RevisionStatus, string> = {
    DRAFT: "Draft",
    WAITING_CHECK: "Waiting Check",
    CHECK_REJECTED: "Check Rejected",
    WAITING_APPROVAL_1: "Waiting Approval L1",
    APPROVAL_1_REJECTED: "Rejected L1",
    WAITING_APPROVAL_2: "Waiting Final",
    APPROVAL_2_REJECTED: "Final Rejected",
    COMPLETED: "Completed",
    OBSOLETE: "Obsolete"
  };

  return compactLabels[status];
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-text">{label}</span>
      {children}
    </label>
  );
}

function OverviewStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/75 bg-white px-4 py-3">
      <p className="text-sm font-semibold text-text">{label}</p>
      <p className="text-sm text-muted">{value}</p>
    </div>
  );
}

function CompactInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-panel/22 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function getActiveFilterCount(filters: DrawingFilters) {
  return [
    filters.search,
    filters.area,
    filters.drawnBy,
    filters.revision,
    filters.dateFrom,
    filters.dateTo,
    filters.status !== "ALL" ? filters.status : ""
  ].filter(Boolean).length;
}

function getDrawingSummary(items: DrawingListItem[]) {
  return {
    total: items.length,
    drafts: items.filter((item) => item.currentStatus === "DRAFT").length,
    waiting: items.filter((item) =>
      ["WAITING_CHECK", "WAITING_APPROVAL_1", "WAITING_APPROVAL_2"].includes(item.currentStatus)
    ).length,
    completed: items.filter((item) => item.currentStatus === "COMPLETED").length
  };
}

function getDrawingsCopy(role: UserRole) {
  if (role === "DRAFTER") {
    return {
      title: "Drawing Workspace",
      description:
        "Kelola draft Anda, cari revisi yang perlu diteruskan, dan buka item yang dikembalikan tanpa membuang waktu di daftar panjang.",
      heroTitle: "Browse drawing dengan konteks yang lebih cepat dipahami.",
      heroDescription:
        "Gunakan daftar ini sebagai meja kerja utama untuk melihat status, pemilik, revisi aktif, dan aksi yang tersedia dalam satu pandangan."
    };
  }

  if (role === "CONSUMER") {
    return {
      title: "Final Drawing Library",
      description:
        "Cari drawing final yang siap digunakan berdasarkan nomor, area, disiplin, maupun revisi tanpa terganggu item yang belum selesai.",
      heroTitle: "Temukan dokumen completed dengan lebih cepat dan lebih bersih.",
      heroDescription:
        "Filter dan tampilan ringkas disusun agar consumer bisa fokus ke final drawing yang benar-benar siap dipakai."
    };
  }

  return {
    title: "Operational Drawing List",
    description:
      "Telusuri seluruh drawing dengan filter yang lebih terarah, lihat konteks status secara cepat, dan masuk ke aksi berikutnya tanpa banyak klik.",
    heroTitle: "Satu daftar untuk memantau status, konteks, dan tindak lanjut.",
    heroDescription:
      "Halaman ini dipoles agar pencarian, pemindaian cepat, dan perpindahan ke halaman kerja terasa lebih ringan dan profesional."
  };
}
