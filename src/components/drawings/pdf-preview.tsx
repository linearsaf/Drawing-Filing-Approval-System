"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { statusToneMap } from "@/lib/config/status";
import { RevisionStatus } from "@/lib/types";

interface PdfPreviewProps {
  title: string;
  drawingNumber: string;
  revisionNo: string;
  fileName: string;
  status: RevisionStatus;
  previewUrl?: string | null;
  printUrl?: string | null;
  showFullscreenAction?: boolean;
}

export function PdfPreview({
  title,
  drawingNumber,
  revisionNo,
  fileName,
  status,
  previewUrl,
  printUrl,
  showFullscreenAction = true
}: PdfPreviewProps) {
  const watermark = statusToneMap[status].watermark;
  const [isMounted, setIsMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isFullscreen]);

  const viewerFrameUrl = useMemo(() => {
    if (!previewUrl) {
      return null;
    }

    const params = new URLSearchParams({
      file: previewUrl
    });

    if (status === "COMPLETED" && printUrl) {
      params.set("print", "1");
      params.set("printFile", printUrl);
    }

    return `/pdfjs-viewer.html?${params.toString()}`;
  }, [previewUrl, printUrl, status]);

  const renderViewer = (mode: "panel" | "fullscreen") => {
    if (!previewUrl || !viewerFrameUrl) {
      return (
        <div className="relative grid h-full min-h-[400px] place-items-center p-8">
          <div className="max-w-md space-y-4 text-center">
            <div className="mx-auto flex h-20 w-16 items-center justify-center rounded-2xl border border-border bg-white shadow-sm">
              <span className="text-xs font-bold uppercase tracking-[0.26em] text-brand">PDF</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-muted">Dokumen Aktif</p>
              <p className="mt-2 text-xl font-semibold text-text">{drawingNumber}</p>
              <p className="mt-1 text-sm text-muted">{fileName}</p>
            </div>
            <p className="text-sm leading-6 text-muted">
              Pratinjau PDF belum tersedia untuk dokumen ini.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-[400px] flex-col">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/85 px-3 py-2">
          <div className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-text">
            {drawingNumber} / Rev {revisionNo}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {showFullscreenAction ? (
              mode === "panel" ? (
                <Button onClick={() => setIsFullscreen(true)} variant="secondary">
                  Full View
                </Button>
              ) : null
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-[18px] border border-border bg-white/90">
          <iframe
            className={
              mode === "fullscreen"
                ? "h-full min-h-[calc(100vh-8rem)] w-full bg-white"
                : "h-full min-h-[540px] w-full bg-white"
            }
            src={viewerFrameUrl}
            title={`${drawingNumber} preview`}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="relative overflow-hidden border-border bg-[#fcfcfc]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(58,80,151,0.05),transparent_45%,rgba(33,37,41,0.06))]" />
        <div className="relative rounded-[22px] border border-dashed border-border bg-white p-6">
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Preview Dokumen</p>
              <h3 className="mt-2 text-lg font-semibold text-text">{title}</h3>
            </div>
            <div className="rounded-full border border-brand/20 bg-brand/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              Rev {revisionNo}
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden rounded-[24px] border border-border bg-panel/35 p-4">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="rotate-[-28deg] text-4xl font-bold uppercase tracking-[0.55em] text-brand/10 md:text-6xl">
                {watermark}
              </span>
            </div>
            <div className="relative h-full">{renderViewer("panel")}</div>
          </div>
        </div>
      </Card>

      {showFullscreenAction && isFullscreen && isMounted
        ? createPortal(
            <div className="fixed inset-0 z-[9999] h-screen w-screen bg-graphite/92 backdrop-blur-sm">
              <div className="flex h-screen w-screen flex-col bg-[#f8f9fb] p-2 md:p-3">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-border px-2 pb-3 md:px-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Full Document View</p>
                    <h3 className="mt-2 text-2xl font-semibold text-text">{title}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {drawingNumber} / {fileName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setIsFullscreen(false)}>Tutup</Button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 px-2 pb-2 md:px-3 md:pb-3">{renderViewer("fullscreen")}</div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
