import { Badge } from "@/components/ui/badge";
import { statusToneMap } from "@/lib/config/status";
import { RevisionStatus } from "@/lib/types";
import { getStatusLabel } from "@/lib/utils/permissions";

export function StatusBadge({ status }: { status: RevisionStatus }) {
  const tone = statusToneMap[status];

  return (
    <Badge className={tone.badge}>
      <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
      {getStatusLabel(status)}
    </Badge>
  );
}

