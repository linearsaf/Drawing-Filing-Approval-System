"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { DrawingForm } from "@/components/drawings/drawing-form";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { Drawing, DrawingRevision, UserRole } from "@/lib/types";
import { canEditRevision } from "@/lib/utils/permissions";

interface DrawingDetailResponse {
  drawing: Drawing;
  currentRevision: DrawingRevision | null;
}

export default function EditDrawingPage() {
  const params = useParams<{ id: string }>();
  const { currentUser } = useDemoApp();

  return (
    <AuthGuard allowedRoles={["DRAFTER", "ADMIN"]}>
      {currentUser ? <EditContent drawingId={params.id} role={currentUser.role} /> : null}
    </AuthGuard>
  );
}

function EditContent({
  drawingId,
  role
}: {
  drawingId: string;
  role: UserRole;
}) {
  const [data, setData] = useState<DrawingDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiFetch<DrawingDetailResponse>(`/api/drawings/${drawingId}`);

        if (!cancelled) {
          setData(response);
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
      <Card>
        <p className="text-sm text-muted">Memuat data drawing...</p>
      </Card>
    );
  }

  if (error || !data?.drawing) {
    return (
      <Card className="border-danger/15">
        <p className="text-sm font-medium text-danger">{error || "Drawing tidak ditemukan."}</p>
      </Card>
    );
  }

  const { drawing, currentRevision } = data;

  if (!currentRevision || !canEditRevision(role, currentRevision.status)) {
    return (
      <EmptyState
        actionHref={`/drawings/${drawing.id}`}
        actionLabel="Buka detail drawing"
        description="Hanya draft atau drawing yang dikembalikan yang bisa diedit."
        title="Drawing tidak bisa diedit"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={drawing.drawingNumber}
        title="Edit drawing"
        description="Perbarui metadata, revisi aktif, dan file PDF sesuai kebutuhan perubahan dokumen."
      />
      <DrawingForm
        drawingId={drawing.id}
        initialValues={{
          drawingNumber: drawing.drawingNumber,
          drawingName: drawing.drawingName,
          sacCode: drawing.sacCode,
          area: drawing.area,
          discipline: drawing.discipline,
          description: drawing.description ?? "",
          revisionNo: currentRevision.revisionNo,
          fileName: currentRevision.fileName,
          changeNote: currentRevision.changeNote
        }}
        mode="edit"
      />
    </div>
  );
}
