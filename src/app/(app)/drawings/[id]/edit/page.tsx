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
      <div className="space-y-8">
        <PageHeader
          eyebrow="Edit Drawing"
          title="Memuat data drawing"
          description="Menyiapkan metadata dan current revision sebelum form ditampilkan."
        />
        <div className="space-y-4 animate-pulse">
          <Card className="h-56 bg-graphite/95" />
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="h-[540px] bg-white/70" />
            <div className="space-y-4">
              <Card className="h-72 bg-white/70" />
              <Card className="h-72 bg-white/70" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.drawing) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Edit Drawing"
          title="Data drawing belum tersedia"
          description="Terjadi kendala saat mengambil data untuk proses edit."
        />
        <Card className="border-danger/15 bg-white/70">
          <p className="text-sm font-medium text-danger">{error || "Drawing tidak ditemukan."}</p>
        </Card>
      </div>
    );
  }

  const { drawing, currentRevision } = data;

  if (!currentRevision || !canEditRevision(role, currentRevision.status)) {
    return (
      <EmptyState
        actionHref={`/drawings/${drawing.id}`}
        actionLabel="Open Drawing Detail"
        description="Hanya draft atau drawing yang dikembalikan yang bisa diedit."
        title="Drawing tidak bisa diedit"
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={drawing.drawingNumber}
        title="Edit Drawing"
        description="Perbarui metadata, current revision, dan file PDF dengan struktur form yang lebih jelas agar perubahan tetap rapi dan mudah ditelusuri."
      />
      <DrawingForm
        drawingId={drawing.id}
        drawnByName={drawing.drawnByName ?? drawing.drawnByUsername ?? "-"}
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
