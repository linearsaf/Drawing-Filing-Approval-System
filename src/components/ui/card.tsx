import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-border/80 bg-surface/94 p-6 shadow-panel backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
