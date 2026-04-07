"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { WorkflowSourceBadge } from "@/components/drawings/workflow-source-badge";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiFetch, buildQuery, getErrorMessage } from "@/lib/api-client";
import { DrafterOption, DrawingFilters, RevisionStatus, UserRole, WorkflowSource } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import {
  canApproveRevision,
  canCheckRevision,
  canCreateDrawing,
  canDeleteDrawing,
  canEditRevision,
  canUploadOldDrawing,
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
  uploadedByName: string | null;
  uploadedByUsername: string | null;
  workflowSource: WorkflowSource;
  legacyReadyNote: string | null;
  currentStatus: RevisionStatus;
  activeApprovalLevel: 1 | 2 | null;
  canCurrentUserApprove: boolean;
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

interface DrawingPageSummary {
  total: number;
  drafts: number;
  waiting: number;
  completed: number;
}

interface DrawingListResponse {
  items: DrawingListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: DrawingPageSummary;
}

async function fetchDrawings(
  activeFilters: DrawingFilters,
  activePage: number,
  activePageSize: number
) {
  const query = buildQuery({
    search: activeFilters.search,
    status: activeFilters.status,
    area: activeFilters.area,
    drawnBy: activeFilters.drawnBy,
    revision: activeFilters.revision,
    dateFrom: activeFilters.dateFrom,
    dateTo: activeFilters.dateTo,
    page: activePage,
    pageSize: activePageSize
  });

  return apiFetch<DrawingListResponse>(`/api/drawings${query}`);
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<DrawingPageSummary>({
    total: 0,
    drafts: 0,
    waiting: 0,
    completed: 0
  });
  const [drafters, setDrafters] = useState<DrafterOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const pageCopy = getDrawingsCopy(role);
  const activeFilterCount = getActiveFilterCount(filters);

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
        const response = await fetchDrawings(filters, page, pageSize);

        if (!cancelled) {
          setItems(response.items);
          setSummary(response.summary);
          setTotal(response.total);
          setTotalPages(response.totalPages);

          if (response.page !== page) {
            setPage(response.page);
          }
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
  }, [filters, page, pageSize]);

  const resetFilters = () => {
    onFiltersChange(defaultFilters);
    setPage(1);
  };

  const updateFilters = (nextFilters: DrawingFilters) => {
    onFiltersChange(nextFilters);
    setPage(1);
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

      const response = await fetchDrawings(filters, page, pageSize);

      if (response.items.length === 0 && response.total > 0 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        setItems(response.items);
        setSummary(response.summary);
        setTotal(response.total);
        setTotalPages(response.totalPages);
      }

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
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button className="w-full sm:w-auto" onClick={resetFilters} variant="secondary">
              Reset Filter
            </Button>
            {canCreateDrawing(role) ? (
              <Link className="w-full sm:w-auto" href="/drawings/new">
                <Button className="w-full">Create Drawing</Button>
              </Link>
            ) : null}
            {canUploadOldDrawing(role) ? (
              <Link className="w-full sm:w-auto" href="/drawings/legacy/new">
                <Button className="w-full" variant="secondary">Upload Old Drawing</Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="relative overflow-hidden border-transparent bg-graphite text-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
          <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
          <div className="relative space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/55">
                  Workspace {getRoleLabel(role)}
                </p>
                <h2 className="mt-2 max-w-2xl text-lg md:text-2xl xl:text-3xl font-semibold tracking-tight leading-snug">
                  {pageCopy.heroTitle}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72 line-clamp-3">
                  {pageCopy.heroDescription}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-col sm:items-end sm:text-right sm:rounded-3xl sm:px-5 sm:py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
                  Active Filter
                </p>
                <p className="text-3xl sm:text-5xl font-semibold sm:mt-2">{activeFilterCount}</p>
                <p className="text-xs sm:text-sm text-white/65 sm:mt-1">
                  {activeFilterCount === 0 ? "Tidak ada filter" : "filter aktif"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <OverviewStat label="Visible" value={summary.total} />
              <OverviewStat label="Draft" value={summary.drafts} />
              <OverviewStat label="Need Review" value={summary.waiting} />
              <OverviewStat label="Completed" value={summary.completed} />
            </div>
          </div>
        </Card>

        <Card className="bg-white/75">
          <div className="flex items-start gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">View & Summary</p>
              <h2 className="mt-1 text-lg md:text-2xl font-semibold text-text">Browse lebih cepat</h2>
              <p className="mt-1 hidden sm:block text-sm leading-6 text-muted">
                Gunakan card view atau compact list untuk menyapu banyak item sekaligus.
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              className="whitespace-nowrap flex-1 sm:flex-none"
              onClick={() => onViewModeChange("card")}
              variant={viewMode === "card" ? "primary" : "secondary"}
            >
              Card View
            </Button>
            <Button
              className="whitespace-nowrap flex-1 sm:flex-none"
              onClick={() => onViewModeChange("list")}
              variant={viewMode === "list" ? "primary" : "secondary"}
            >
              Compact List
            </Button>
          </div>

          <div className="mt-4 space-y-2">
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
              {total} drawing visible
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
                  onChange={(event) => updateFilters({ ...filters, search: event.target.value })}
                  placeholder="Nomor drawing, nama, SAC, atau area"
                  value={filters.search}
                />
              </FilterField>
            </div>
            <div className="xl:col-span-3">
              <FilterField label="Status">
                <Select
                  onChange={(event) =>
                    updateFilters({ ...filters, status: event.target.value as RevisionStatus | "ALL" })
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
                  onChange={(event) => updateFilters({ ...filters, drawnBy: event.target.value })}
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
                    onChange={(event) => updateFilters({ ...filters, area: event.target.value })}
                    placeholder="Semua area"
                    value={filters.area}
                  />
                </FilterField>
                <FilterField label="Revisi">
                  <Input
                    onChange={(event) => updateFilters({ ...filters, revision: event.target.value })}
                    placeholder="Contoh A / B / C"
                    value={filters.revision}
                  />
                </FilterField>
              </div>
            </div>
            <div className="xl:col-span-3">
              <FilterField label="Dari tanggal">
                <Input
                  onChange={(event) => updateFilters({ ...filters, dateFrom: event.target.value })}
                  type="date"
                  value={filters.dateFrom}
                />
              </FilterField>
            </div>
            <div className="xl:col-span-3">
              <FilterField label="Sampai tanggal">
                <Input
                  onChange={(event) => updateFilters({ ...filters, dateTo: event.target.value })}
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
                        <WorkflowSourceBadge source={drawing.workflowSource} />
                        <StatusBadge status={drawing.currentStatus} />
                      </div>
                      <h3 className="mt-3 text-xl font-semibold text-text">{drawing.drawingName}</h3>
                      <p className="mt-2 text-sm text-muted">
                        {drawing.sacCode} / {drawing.area} / {drawing.discipline}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 justify-end lg:mt-0">
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

                  <div className="grid grid-cols-3 gap-2">
                    <CompactInfoCard
                      label="Drafter"
                      value={drawing.drawnByName ?? drawing.drawnByUsername ?? "-"}
                    />
                    <CompactInfoCard
                      label="Revision"
                      value={currentRevision?.revisionNo ?? "-"}
                    />
                    <CompactInfoCard
                      label="Updated"
                      value={formatDateTime(drawing.updatedAt)}
                    />
                  </div>
                  {drawing.workflowSource === "LEGACY_READY" ? (
                    <p className="text-sm leading-6 text-muted">
                      Uploaded by: {drawing.uploadedByName ?? drawing.uploadedByUsername ?? "-"} / Note:{" "}
                      {drawing.legacyReadyNote ?? "-"}
                    </p>
                  ) : null}
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
                  <div className="mt-1">
                    <WorkflowSourceBadge source={drawing.workflowSource} />
                  </div>
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
                  {drawing.workflowSource === "LEGACY_READY" ? (
                    <p className="truncate leading-6">
                      Uploaded by: {drawing.uploadedByName ?? drawing.uploadedByUsername ?? "-"}
                    </p>
                  ) : null}
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

      {!isLoading && items.length > 0 ? (
        <PaginationBar
          currentPage={page}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
        />
      ) : null}
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
      <Button className={compact ? "w-full px-3 py-2 text-xs" : "min-h-[44px] md:min-h-0"} variant="secondary">
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
        <Button className={compact ? "w-full px-3 py-2 text-xs" : "min-h-[44px] md:min-h-0"} variant="secondary">
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
        <Button className={compact ? "w-full px-3 py-2 text-xs" : "min-h-[44px] md:min-h-0"}>Check</Button>
      </Link>
    );
  }

  if (currentRevision && canApproveRevision(role, currentRevision.status, drawing.canCurrentUserApprove)) {
    actions.push(
      <Link
        className={compact ? "block" : undefined}
        href={`/drawings/${drawing.id}/approve`}
        key="approve"
      >
        <Button className={compact ? "w-full px-3 py-2 text-xs" : "min-h-[44px] md:min-h-0"}>Approve</Button>
      </Link>
    );
  }

  if (canDeleteDrawing(role)) {
    actions.push(
      <Button
        className={compact ? "w-full px-3 py-2 text-xs" : "min-h-[44px] md:min-h-0"}
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

function PaginationBar({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  return (
    <Card className="border-border/80 bg-white/78">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-text">
            Menampilkan {startItem}-{endItem} dari {total} drawing
          </p>
          <p className="mt-1 text-sm text-muted">
            Page {currentPage} dari {totalPages}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-text">Per page</span>
            <Select
              className="min-w-[112px]"
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              value={String(pageSize)}
            >
              <option value="12">12 item</option>
              <option value="24">24 item</option>
              <option value="48">48 item</option>
            </Select>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <Button
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              variant="secondary"
            >
              Previous
            </Button>
            <div className="rounded-full border border-border bg-panel/30 px-4 py-2 text-sm font-semibold text-text">
              {currentPage} / {totalPages}
            </div>
            <Button
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              variant="secondary"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </Card>
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
    <div className="flex items-center justify-between rounded-xl border border-border/75 bg-white px-3 py-2">
      <p className="text-xs font-semibold text-text">{label}</p>
      <p className="text-xs text-muted truncate ml-2 max-w-[55%] text-right">{value}</p>
    </div>
  );
}

function CompactInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel/22 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted leading-none">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text truncate">{value}</p>
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

function getDrawingsCopy(role: UserRole) {
  if (role === "DRAFTER") {
    return {
      title: "Drawing Workspace",
      description:
        "Kelola draft, lanjutkan revisi, dan buka item yang dikembalikan dari satu daftar.",
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
