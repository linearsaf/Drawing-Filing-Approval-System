import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-full border border-border/90 bg-white/96 px-4 py-3 text-sm text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12",
        className
      )}
      {...props}
    />
  );
}
