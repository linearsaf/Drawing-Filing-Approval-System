import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/15",
        className
      )}
      {...props}
    />
  );
}

