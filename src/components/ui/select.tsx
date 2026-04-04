import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full appearance-none rounded-full border border-border/90 bg-white/96 px-4 py-3 pr-11 text-sm text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12",
          className
        )}
        {...props}
      />
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-muted">
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6.5L8 10.5L12 6.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      </span>
    </div>
  );
}
