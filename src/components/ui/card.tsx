import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[26px] border border-white/70 bg-surface/90 p-6 shadow-panel backdrop-blur",
        className
      )}
      {...props}
    />
  );
}

