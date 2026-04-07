import { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  showDescription?: boolean;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  showDescription = false
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2.5">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand">{eyebrow}</p>
        ) : null}
        <div>
          <h1 className="text-[2rem] font-semibold tracking-[-0.02em] text-text lg:text-[2.2rem]">
            {title}
          </h1>
          {showDescription && description ? (
            <p className="mt-2.5 max-w-3xl text-sm leading-7 text-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
