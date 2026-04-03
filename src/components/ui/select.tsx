import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15",
        className
      )}
      {...props}
    />
  );
}

