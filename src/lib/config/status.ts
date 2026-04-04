import { RevisionStatus } from "@/lib/types";

export const statusToneMap: Record<
  RevisionStatus,
  { badge: string; dot: string; watermark: string }
> = {
  DRAFT: {
    badge: "bg-[#999999]/15 text-[#404040] border-[#999999]/30",
    dot: "bg-[#999999]",
    watermark: "DRAFT"
  },
  WAITING_CHECK: {
    badge: "border-[#35559a]/22 bg-[#35559a]/10 text-[#35559a]",
    dot: "bg-brand",
    watermark: "LEAD CHECK"
  },
  CHECK_REJECTED: {
    badge: "bg-danger/10 text-danger border-danger/25",
    dot: "bg-danger",
    watermark: "REJECTED"
  },
  WAITING_APPROVAL_1: {
    badge: "border-[#5d5cbc]/22 bg-[#5d5cbc]/10 text-[#4d4ca6]",
    dot: "bg-[#5d5cbc]",
    watermark: "APPROVAL LEVEL 1"
  },
  APPROVAL_1_REJECTED: {
    badge: "bg-danger/10 text-danger border-danger/25",
    dot: "bg-danger",
    watermark: "REJECTED"
  },
  WAITING_APPROVAL_2: {
    badge: "border-[#b98526]/24 bg-[#b98526]/11 text-[#8a6214]",
    dot: "bg-[#b98526]",
    watermark: "FINAL APPROVAL"
  },
  APPROVAL_2_REJECTED: {
    badge: "bg-danger/10 text-danger border-danger/25",
    dot: "bg-danger",
    watermark: "REJECTED"
  },
  COMPLETED: {
    badge: "border-[#5f8c73]/26 bg-[#5f8c73]/12 text-[#476a58]",
    dot: "bg-[#5f8c73]",
    watermark: "COMPLETED"
  },
  OBSOLETE: {
    badge: "bg-[#666666]/15 text-[#404040] border-[#666666]/25",
    dot: "bg-[#666666]",
    watermark: "OBSOLETE"
  }
};
