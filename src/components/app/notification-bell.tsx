"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { NotificationUnreadSummary } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export function NotificationBell() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadUnreadCount = async () => {
      try {
        const response = await apiFetch<NotificationUnreadSummary>("/api/notifications/unread-count");

        if (!cancelled) {
          setUnreadCount(response.unreadCount);
        }
      } catch {
        if (!cancelled) {
          setUnreadCount(0);
        }
      }
    };

    void loadUnreadCount();

    const intervalId = window.setInterval(() => {
      void loadUnreadCount();
    }, 30_000);
    const handleFocus = () => {
      void loadUnreadCount();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadUnreadCount();
      }
    };
    const handleNotificationsChanged = () => {
      void loadUnreadCount();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("notifications:changed", handleNotificationsChanged);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("notifications:changed", handleNotificationsChanged);
    };
  }, [pathname]);

  return (
    <Link
      className={cn(
        "relative inline-flex h-12 w-12 items-center justify-center rounded-full border transition",
        pathname === "/notifications"
          ? "border-brand/40 bg-brand/10 text-brand"
          : "border-border/85 bg-surface/94 text-text hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
      )}
      href="/notifications"
    >
      <BellIcon />
      {unreadCount > 0 ? (
        <span className="pointer-events-none absolute right-0 top-0 z-10 inline-flex min-w-[1.5rem] translate-x-1/3 -translate-y-1/3 items-center justify-center rounded-full bg-danger px-1.5 py-1 text-[10px] font-bold text-white shadow-md">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
      <span className="sr-only">Open notifications</span>
    </Link>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[1.15rem] w-[1.15rem]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V10a6 6 0 1 0-12 0v4.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M10 17a2 2 0 0 0 4 0" />
    </svg>
  );
}
