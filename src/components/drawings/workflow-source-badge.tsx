"use client";

import { WorkflowSource } from "@/lib/types";

export function WorkflowSourceBadge({ source }: { source: WorkflowSource }) {
  if (source !== "LEGACY_READY") {
    return null;
  }

  return (
    <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
      Legacy Ready
    </span>
  );
}
