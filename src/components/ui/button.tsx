import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantMap: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-[0_10px_24px_rgba(53,85,154,0.18)] hover:bg-[#2f4b88] focus-visible:ring-brand/25",
  secondary:
    "border border-border/90 bg-surface/92 text-text shadow-inset hover:border-brand/35 hover:bg-brand/5 hover:text-brand focus-visible:ring-brand/18",
  danger:
    "bg-danger text-white shadow-[0_10px_24px_rgba(220,49,54,0.18)] hover:bg-danger-strong focus-visible:ring-danger/25",
  ghost: "text-text hover:bg-brand/8 hover:text-brand focus-visible:ring-brand/18"
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
        variantMap[variant],
        className
      )}
      type={type}
      {...props}
    />
  );
}
