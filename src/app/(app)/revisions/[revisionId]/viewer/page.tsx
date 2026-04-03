"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { PdfPreview } from "@/components/drawings/pdf-preview";
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
          setError(getErrorMessage(loadError, "Data revisi tidak dapat dimuat."));
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
      <Card>
        <p className="text-sm text-muted">Memuat viewer revisi...</p>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-danger/15">
        <p className="text-sm font-medium text-danger">{error || "Revisi tidak ditemukan."}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={data.drawing.drawingNumber}
        title={`${data.drawing.drawingName} • Viewer`}
        description={`Revisi ${data.revision.revisionNo} • ${data.revision.fileName}`}
        actions={
          <Link href={`/drawings/${data.drawing.id}`}>
            <Button variant="secondary">Kembali ke Detail</Button>
          </Link>
        }
      />

      <PdfPreview
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
