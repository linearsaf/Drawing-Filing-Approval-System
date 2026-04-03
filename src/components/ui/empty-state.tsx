import Link from "next/link";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon
}: EmptyStateProps) {
  return (
    <Card className="border-dashed border-border/80 bg-white/70 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        {icon ?? <span className="text-xl font-bold">DM</span>}
      </div>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">{description}</p>
      {actionLabel && actionHref ? (
        <div className="mt-5">
          <Link href={actionHref}>
            <Button>{actionLabel}</Button>
          </Link>
        </div>
      ) : null}
    </Card>
  );
}

