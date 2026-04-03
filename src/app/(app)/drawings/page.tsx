"use client";

import Link from "next/link";
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
import { DrawingFilters, RevisionStatus, UserRole } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import {
  canApproveRevision,
  canCheckRevision,
  canCreateDrawing,
  canDeleteDrawing,
  canEditRevision
} from "@/lib/utils/permissions";

const defaultFilters: DrawingFilters = {
  search: "",
  status: "ALL",
  area: "",
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getDrawings = async (activeFilters: DrawingFilters) => {
    const query = buildQuery({
      search: activeFilters.search,
      status: activeFilters.status,
      area: activeFilters.area,
      revision: activeFilters.revision,
      dateFrom: activeFilters.dateFrom,
      dateTo: activeFilters.dateTo
    });

    const response = await apiFetch<{ items: DrawingListItem[] }>(`/api/drawings${query}`);
    return response.items;
  };

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

  const handleDelete = async (drawing: DrawingListItem) => {
    const confirmed = window.confirm(
      `Hapus drawing ${drawing.drawingNumber} - ${drawing.drawingName}? Aksi ini tidak bisa dibatalkan.`
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
        eyebrow="Daftar Drawing"
        title="Searchable & filterable drawing list"
        description="Telusuri drawing berdasarkan metadata, status, revisi, dan rentang tanggal."
        actions={
          canCreateDrawing(role) ? (
            <Link href="/drawings/new">
              <Button>Input Drawing Baru</Button>
            </Link>
          ) : null
        }
      />

      {success ? (
        <Card className="border-brand/15">
          <p className="text-sm font-medium text-brand">{success}</p>
        </Card>
      ) : null}

      <Card>
        <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Filter Panel</p>
            <p className="mt-2 text-sm text-muted">
              Gunakan filter tanggal from - to dengan date picker browser dan pilih compact
              list bila ingin melihat lebih banyak drawing sekaligus.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Input
            onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
            placeholder="Cari drawing number, name, SAC, area"
            value={filters.search}
          />
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
            <option value="WAITING_APPROVAL_2">Waiting Approval Head</option>
            <option value="CHECK_REJECTED">Check Rejected</option>
            <option value="APPROVAL_1_REJECTED">Approval L1 Rejected</option>
            <option value="APPROVAL_2_REJECTED">Approval Head Rejected</option>
            <option value="COMPLETED">Completed</option>
          </Select>
          <Input
            onChange={(event) => onFiltersChange({ ...filters, area: event.target.value })}
            placeholder="Filter area"
            value={filters.area}
          />
          <Input
            onChange={(event) => onFiltersChange({ ...filters, revision: event.target.value })}
            placeholder="Revision"
            value={filters.revision}
          />
          <Input
            onChange={(event) => onFiltersChange({ ...filters, dateFrom: event.target.value })}
            placeholder="From date"
            type="date"
            value={filters.dateFrom}
          />
          <Input
            onChange={(event) => onFiltersChange({ ...filters, dateTo: event.target.value })}
            placeholder="To date"
            type="date"
            value={filters.dateTo}
          />
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <p className="text-sm text-muted">Memuat daftar drawing...</p>
        </Card>
      ) : error ? (
        <Card className="border-danger/15">
          <p className="text-sm font-medium text-danger">{error}</p>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          actionHref={canCreateDrawing(role) ? "/drawings/new" : undefined}
          actionLabel={canCreateDrawing(role) ? "Tambah Drawing" : undefined}
          description="Coba ubah kata kunci atau filter untuk melihat data yang tersedia pada role aktif."
          title="Tidak ada drawing yang cocok"
        />
      ) : viewMode === "card" ? (
        <div className="grid gap-4">
          {items.map((drawing) => {
            const currentRevision = drawing.currentRevision;

            return (
              <Card className="p-0" key={drawing.id}>
                <div className="grid gap-4 p-5 lg:grid-cols-[1.2fr_0.8fr_0.5fr] lg:items-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">
                      {drawing.drawingNumber}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-text">{drawing.drawingName}</h3>
                    <p className="mt-2 text-sm text-muted">
                      {drawing.sacCode} • {drawing.area} • {drawing.discipline}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">{drawing.description || "-"}</p>
                  </div>
                  <div className="space-y-3">
                    <StatusBadge status={drawing.currentStatus} />
                    <p className="text-sm text-muted">
                      Revisi aktif:{" "}
                      <span className="font-semibold text-text">
                        {currentRevision?.revisionNo ?? "-"}
                      </span>
                    </p>
                    <p className="text-sm text-muted">
                      Update terakhir:{" "}
                      <span className="font-semibold text-text">
                        {formatDateTime(drawing.updatedAt)}
                      </span>
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
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="hidden grid-cols-[1.15fr_0.8fr_0.6fr_0.7fr_0.95fr] gap-4 border-b border-border bg-panel/55 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-muted lg:grid">
            <div>Drawing</div>
            <div>Metadata</div>
            <div>Status</div>
            <div>Updated</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="divide-y divide-border/80">
            {items.map((drawing) => (
              <div
                className="grid gap-3 px-4 py-3 lg:grid-cols-[1.15fr_0.8fr_0.6fr_0.7fr_0.95fr] lg:items-center"
                key={drawing.id}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
                    {drawing.drawingNumber}
                  </p>
                  <p className="truncate text-sm font-semibold text-text">{drawing.drawingName}</p>
                </div>

                <div className="min-w-0 text-sm text-muted">
                  <p className="truncate">
                    {drawing.sacCode} • {drawing.area}
                  </p>
                  <p className="truncate">
                    {drawing.discipline} • Rev {drawing.currentRevision?.revisionNo ?? "-"}
                  </p>
                </div>

                <div>
                  <StatusBadge status={drawing.currentStatus} />
                </div>

                <div className="text-sm text-muted">
                  <p>{formatDateTime(drawing.updatedAt)}</p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
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
  const className = compact ? "px-3 py-2 text-xs" : undefined;

  return (
    <>
      <Link href={`/drawings/${drawing.id}`}>
        <Button className={className} variant="secondary">
          Detail
        </Button>
      </Link>
      {currentRevision && canEditRevision(role, currentRevision.status) ? (
        <Link href={`/drawings/${drawing.id}/edit`}>
          <Button className={className} variant="secondary">
            Edit
          </Button>
        </Link>
      ) : null}
      {currentRevision && canCheckRevision(role, currentRevision.status) ? (
        <Link href={`/drawings/${drawing.id}/check`}>
          <Button className={className}>Check</Button>
        </Link>
      ) : null}
      {currentRevision && canApproveRevision(role, currentRevision.status) ? (
        <Link href={`/drawings/${drawing.id}/approve`}>
          <Button className={className}>Approve</Button>
        </Link>
      ) : null}
      {canDeleteDrawing(role) ? (
        <Button
          className={className}
          disabled={isDeleting}
          onClick={() => void onDelete(drawing)}
          variant="danger"
        >
          {isDeleting ? "Menghapus..." : "Hapus"}
        </Button>
      ) : null}
    </>
  );
}
