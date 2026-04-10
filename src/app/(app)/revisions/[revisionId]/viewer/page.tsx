"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { PdfPreview } from "@/components/drawings/pdf-preview";
import { WorkflowSourceBadge } from "@/components/drawings/workflow-source-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { Drawing, DrawingRevision } from "@/lib/types";

interface RevisionDetailResponse {
  drawing: Drawing;
  revision: DrawingRevision;
}

export default function RevisionViewerPage() {
  const params = useParams<{ revisionId: string }>();

  return (
    <AuthGuard>
      <RevisionViewerContent revisionId={params.revisionId} />
    </AuthGuard>
  );
}

function RevisionViewerContent({ revisionId }: { revisionId: string }) {
  const [data, setData] = useState<RevisionDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadRevision = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await apiFetch<RevisionDetailResponse>(`/api/revisions/${revisionId}`);

        if (!cancelled) {
          setData(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, "Data revision tidak dapat dimuat."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadRevision();

    return () => {
      cancelled = true;
    };
  }, [revisionId]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Viewer"
          title="Memuat Revision Viewer"
          description="Menyiapkan dokumen dan metadata revision aktif."
        />
        <Card className="h-[620px] animate-pulse bg-white/70" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Viewer"
          title="Revision Viewer belum tersedia"
          description="Terjadi kendala saat mengambil data revision."
        />
        <Card className="border-danger/15 bg-white/70">
          <p className="text-sm font-medium text-danger">{error || "Revision tidak ditemukan."}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={data.drawing.drawingNumber}
        title={`${data.drawing.drawingName} / Viewer`}
        description={`Revision ${data.revision.revisionNo} / ${data.revision.fileName}`}
        actions={
          <Link href={`/drawings/${data.drawing.id}`}>
            <Button variant="secondary">Kembali ke Detail Drawing</Button>
          </Link>
        }
      />

      {data.drawing.workflowSource === "LEGACY_READY" ? (
        <Card className="bg-white/75">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3">
                <WorkflowSourceBadge source={data.drawing.workflowSource} />
              </div>
              <h2 className="text-xl font-semibold text-text">Dokumen legacy ready</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Drawing ini diunggah sebagai final document karena approval historisnya sudah selesai sebelum sistem ini digunakan.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Drawn by: {data.drawing.drawnByName ?? data.drawing.drawnByUsername ?? "-"} / Uploaded by:{" "}
                {data.drawing.uploadedByName ?? data.drawing.uploadedByUsername ?? "-"}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <PdfPreview
        downloadUrl={`/api/revisions/${data.revision.id}/preview?download=1`}
        drawingNumber={data.drawing.drawingNumber}
        fileName={data.revision.fileName}
        previewUrl={`/api/revisions/${data.revision.id}/preview`}
        printUrl={`/api/revisions/${data.revision.id}/print`}
        revisionNo={data.revision.revisionNo}
        showFullscreenAction={false}
        status={data.revision.status}
        title={data.drawing.drawingName}
      />
    </div>
  );
}
