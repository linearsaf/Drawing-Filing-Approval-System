"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RevisionStatus } from "@/lib/types";

interface PdfPreviewProps {
  title: string;
  drawingNumber: string;
  revisionNo: string;
  fileName: string;
  status: RevisionStatus;
  previewUrl?: string | null;
  printUrl?: string | null;
  downloadUrl?: string | null;
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
  downloadUrl,
  showFullscreenAction = true
}: PdfPreviewProps) {
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
        <div className="mb-2 flex flex-col gap-2 rounded-[16px] border border-border/75 bg-panel/18 px-2.5 py-2 sm:mb-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:rounded-[18px] sm:px-3">
          <div className="rounded-full border border-border/75 bg-white px-3 py-1.5 text-xs font-semibold leading-5 text-text sm:px-3.5 sm:text-sm">
            {drawingNumber} / Rev {revisionNo}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {status === "COMPLETED" && downloadUrl ? (
              <Button
                aria-label="Download PDF"
                className="h-9 w-9 !px-0 !py-0 sm:h-10 sm:w-10"
                onClick={() => window.open(downloadUrl, "_blank", "noopener,noreferrer")}
                title="Download PDF"
                variant="secondary"
              >
                <DownloadIcon />
              </Button>
            ) : null}
            {showFullscreenAction ? (
              mode === "panel" ? (
                <Button
                  aria-label="Full View"
                  className="h-9 w-9 !px-0 !py-0 sm:h-10 sm:w-10"
                  onClick={() => setIsFullscreen(true)}
                  title="Full View"
                  variant="secondary"
                >
                  <ExpandIcon />
                </Button>
              ) : null
            ) : null}
            {showFullscreenAction && isFullscreen && isMounted
            ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  aria-label="Close Full View"
                  className="h-9 w-9 !px-0 !py-0 sm:h-10 sm:w-10"
                  onClick={() => setIsFullscreen(false)}
                  title="Close Full View"
                  variant="secondary"
                >
                  <ShrinkIcon />
                </Button>
              </div>)
            : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-[18px] border border-border/75 bg-white sm:rounded-[20px]">
          <iframe
            className={
              mode === "fullscreen"
                ? "h-full min-h-[calc(100vh-8rem)] w-full bg-white"
                : "h-full min-h-[440px] w-full bg-white sm:min-h-[540px]"
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
      <Card className="flex flex-col border-border bg-white p-3 sm:p-4 md:p-6">
        <div className="mb-3 flex flex-col gap-2 border-b border-border/75 pb-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Preview Drawing</p>
            <h3 className="mt-1.5 text-base font-semibold text-text sm:mt-2 sm:text-lg">{title}</h3>
          </div>
          <div className="w-fit rounded-full border border-brand/18 bg-brand/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand sm:text-xs sm:tracking-[0.18em]">
            Rev {revisionNo}
          </div>
        </div>

        <div className="min-h-[420px] flex-1 rounded-[18px] border border-border/75 bg-[#fbfcfe] p-2 sm:min-h-[520px] sm:rounded-[22px] sm:p-3 md:p-4">
          {renderViewer("panel")}
        </div>
      </Card>

      {showFullscreenAction && isFullscreen && isMounted
        ? createPortal(
            <div className="fixed inset-0 z-[9999] h-screen w-screen bg-graphite/92 backdrop-blur-sm">
              <div className="flex h-screen w-screen flex-col bg-[#f8f9fb] p-2 md:p-3">
                {/* <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-border px-2 pb-3 md:px-3">
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
                </div> */}

                <div className="min-h-0 flex-1 px-2 pb-2 md:px-3 md:pb-3">{renderViewer("fullscreen")}</div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function ExpandIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[15px] w-[15px] sm:h-4 sm:w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m15 15 6 6" />
      <path d="m15 9 6-6" />
      <path d="M21 16v5h-5" />
      <path d="M21 8V3h-5" />
      <path d="M3 16v5h5" />
      <path d="m3 21 6-6" />
      <path d="M3 8V3h5" />
      <path d="M9 9 3 3" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[15px] w-[15px] sm:h-4 sm:w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 15V3" />
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

function ShrinkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[15px] w-[15px] sm:h-4 sm:w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8" />
      <path d="M9 19.8V15m0 0H4.2M9 15l-6 6" />
      <path d="M15 4.2V9m0 0h4.8M15 9l6-6" />
      <path d="M9 4.2V9m0 0H4.2M9 9 3 3" />
    </svg>
  );
}
