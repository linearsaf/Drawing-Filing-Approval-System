import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantMap: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-[#314582]",
  secondary:
    "border border-border bg-surface text-text shadow-inset hover:border-brand/40 hover:text-brand",
  danger: "bg-danger text-white hover:bg-danger-strong",
  ghost: "text-text hover:bg-brand/10 hover:text-brand"
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
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variantMap[variant],
        className
      )}
      type={type}
      {...props}
    />
  );
}

