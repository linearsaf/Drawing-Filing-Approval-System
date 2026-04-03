import { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/15",
        className
      )}
      {...props}
    />
  );
}

