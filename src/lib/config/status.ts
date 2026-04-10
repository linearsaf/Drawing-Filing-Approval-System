import { RevisionStatus } from "@/lib/types";

export const statusToneMap: Record<
  RevisionStatus,
  {
    badgeClassName?: string;
    badgeStyle: {
      backgroundColor: string;
      borderColor: string;
      color: string;
    };
    dotColor: string;
    watermark: string;
  }
> = {
  DRAFT: {
    badgeClassName: "md:min-w-max whitespace-nowrap",
    badgeStyle: {
      backgroundColor: "rgba(153,153,153,0.15)",
      borderColor: "rgba(153,153,153,0.3)",
      color: "#404040"
    },
    dotColor: "rgba(153,153,153,1)",
    watermark: "DRAFT"
  },
  WAITING_CHECK: {
    badgeClassName: "md:min-w-max whitespace-nowrap",
    badgeStyle: {
      backgroundColor: "rgba(53,85,154,0.1)",
      borderColor: "rgba(53,85,154,0.22)",
      color: "#35559a"
    },
    dotColor: "#35559a",
    watermark: "LEAD CHECK"
  },
  CHECK_REJECTED: {
    badgeClassName: "md:min-w-max whitespace-nowrap",
    badgeStyle: {
      backgroundColor: "rgba(220,49,54,0.1)",
      borderColor: "rgba(220,49,54,0.22)",
      color: "#dc3136"
    },
    dotColor: "#dc3136",
    watermark: "REJECTED"
  },
  WAITING_APPROVAL_1: {
    badgeClassName: "md:min-w-max whitespace-nowrap",
    badgeStyle: {
      backgroundColor: "rgba(93,92,188,0.1)",
      borderColor: "rgba(93,92,188,0.24)",
      color: "#4d4ca6"
    },
    dotColor: "rgba(93,92,188,1)",
    watermark: "APPROVAL LEVEL 1"
  },
  APPROVAL_1_REJECTED: {
    badgeClassName: "md:min-w-max whitespace-nowrap",
    badgeStyle: {
      backgroundColor: "rgba(220,49,54,0.1)",
      borderColor: "rgba(220,49,54,0.22)",
      color: "#dc3136"
    },
    dotColor: "#dc3136",
    watermark: "REJECTED"
  },
  WAITING_APPROVAL_2: {
    badgeClassName: "md:min-w-max whitespace-nowrap",
    badgeStyle: {
      backgroundColor: "rgba(185,133,38,0.11)",
      borderColor: "rgba(185,133,38,0.24)",
      color: "#8a6214"
    },
    dotColor: "rgba(185,133,38,1)",
    watermark: "FINAL APPROVAL"
  },
  APPROVAL_2_REJECTED: {
    badgeClassName: "md:min-w-max whitespace-nowrap",
    badgeStyle: {
      backgroundColor: "rgba(220,49,54,0.1)",
      borderColor: "rgba(220,49,54,0.22)",
      color: "#dc3136"
    },
    dotColor: "#dc3136",
    watermark: "REJECTED"
  },
  COMPLETED: {
    badgeClassName: "md:min-w-max whitespace-nowrap",
    badgeStyle: {
      backgroundColor: "rgba(95,140,115,0.12)",
      borderColor: "rgba(95,140,115,0.26)",
      color: "#476a58"
    },
    dotColor: "rgba(95,140,115,1)",
    watermark: "COMPLETED"
  },
  OBSOLETE: {
    badgeClassName: "md:min-w-max whitespace-nowrap",
    badgeStyle: {
      backgroundColor: "rgba(102,102,102,0.15)",
      borderColor: "rgba(102,102,102,0.25)",
      color: "#404040"
    },
    dotColor: "rgba(102,102,102,1)",
    watermark: "OBSOLETE"
  }
};
