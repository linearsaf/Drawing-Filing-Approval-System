import { Badge } from "@/components/ui/badge";
import { statusToneMap } from "@/lib/config/status";
import { RevisionStatus } from "@/lib/types";
import { getStatusLabel } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils/cn";

export function StatusBadge({
  status,
  compact,
  label
}: {
  status: RevisionStatus;
  compact?: boolean;
  label?: string;
}) {
  const tone = statusToneMap[status];

  return (
    <Badge
      className={cn(
        tone.badge,
        compact ? "w-fit max-w-full gap-1.5 px-3 py-1 text-[11px] tracking-[0.12em] whitespace-nowrap" : undefined
      )}
    >
      <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
      {label ?? getStatusLabel(status)}
    </Badge>
  );
}
