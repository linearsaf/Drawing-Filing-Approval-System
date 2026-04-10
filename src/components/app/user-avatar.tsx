"use client";

import { cn } from "@/lib/utils/cn";

function getInitials(name: string, username?: string | null) {
  const source = name.trim() || username?.trim() || "U";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export function UserAvatar({
  name,
  username,
  image,
  className,
  labelClassName,
  imageClassName
}: {
  name: string;
  username?: string | null;
  image?: string | null;
  className?: string;
  labelClassName?: string;
  imageClassName?: string;
}) {
  const initials = getInitials(name, username);

  return (
    <div
      aria-label={`Avatar ${name}`}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-full border border-border/85 bg-brand/10 text-brand",
        className
      )}
    >
      {image ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img alt={name} className={cn("h-full w-full object-cover", imageClassName)} src={image} />
      ) : (
        <span className={cn("text-sm font-bold uppercase tracking-[0.08em]", labelClassName)}>
          {initials}
        </span>
      )}
    </div>
  );
}
