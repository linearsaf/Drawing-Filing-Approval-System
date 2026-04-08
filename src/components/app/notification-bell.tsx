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
        "relative inline-flex h-10 w-10 items-center justify-center rounded-none border-0 bg-transparent transition xl:h-12 xl:w-12 xl:rounded-full xl:border",
        pathname === "/notifications"
          ? "text-brand xl:border-brand/40 xl:bg-brand/10"
          : "text-text hover:text-brand xl:border-border/85 xl:bg-surface/94 xl:hover:border-brand/30 xl:hover:bg-brand/5"
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
      className="h-[1.2rem] w-[1.2rem] xl:h-[1.15rem] xl:w-[1.15rem]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </svg>
  );
}
