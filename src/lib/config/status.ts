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
    badge: "bg-brand/10 text-brand border-brand/25",
    dot: "bg-brand",
    watermark: "LEAD CHECK"
  },
  CHECK_REJECTED: {
    badge: "bg-danger/10 text-danger border-danger/25",
    dot: "bg-danger",
    watermark: "REJECTED"
  },
  WAITING_APPROVAL_1: {
    badge: "bg-brand/10 text-brand border-brand/25",
    dot: "bg-brand",
    watermark: "APPROVAL LEVEL 1"
  },
  APPROVAL_1_REJECTED: {
    badge: "bg-danger/10 text-danger border-danger/25",
    dot: "bg-danger",
    watermark: "REJECTED"
  },
  WAITING_APPROVAL_2: {
    badge: "bg-brand/10 text-brand border-brand/25",
    dot: "bg-brand",
    watermark: "HEAD APPROVAL"
  },
  APPROVAL_2_REJECTED: {
    badge: "bg-danger/10 text-danger border-danger/25",
    dot: "bg-danger",
    watermark: "REJECTED"
  },
  COMPLETED: {
    badge: "bg-sage/15 text-[#49605a] border-sage/30",
    dot: "bg-sage",
    watermark: "COMPLETED"
  },
  OBSOLETE: {
    badge: "bg-[#666666]/15 text-[#404040] border-[#666666]/25",
    dot: "bg-[#666666]",
    watermark: "OBSOLETE"
  }
};

