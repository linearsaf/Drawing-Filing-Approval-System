import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[20px] sm:rounded-[24px] border border-border/80 bg-surface/94 p-4 sm:p-6 shadow-panel backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
