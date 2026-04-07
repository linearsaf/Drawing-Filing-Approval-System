import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-full border border-border/90 bg-white/96 px-4 py-3 text-base md:text-sm text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/12",
        className
      )}
      {...props}
    />
  );
}
