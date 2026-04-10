"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { UserAvatar } from "@/components/app/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { getRoleLabel } from "@/lib/utils/permissions";

export function RoleSwitcher() {
  const pathname = usePathname();
  const { currentUser, logout } = useDemoApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-none border-0 bg-transparent transition xl:h-12 xl:w-12 xl:rounded-full xl:border",
          isOpen
            ? "text-brand xl:border-brand/40 xl:bg-brand/10 xl:shadow-inset"
            : "text-text hover:text-brand xl:border-border/85 xl:bg-surface/94 xl:hover:border-brand/30 xl:hover:bg-brand/5"
        )}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <UserAvatar
          className="h-10 w-10 border-transparent bg-brand/10 text-brand xl:h-12 xl:w-12"
          image={currentUser.image}
          imageClassName="h-full w-full object-cover"
          labelClassName="text-sm xl:text-base"
          name={currentUser.name}
          username={currentUser.username}
        />
        <span className="sr-only">Menu pengguna</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-64 origin-top-right rounded-[24px] border border-border/85 bg-white p-5 shadow-xl animate-in fade-in zoom-in duration-150">
          <div className="flex items-center gap-3">
            <UserAvatar
              className="h-12 w-12"
              image={currentUser.image}
              name={currentUser.name}
              username={currentUser.username}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">{currentUser.name}</p>
              <p className="mt-0.5 text-xs text-muted">{getRoleLabel(currentUser.role)}</p>
              <p className="mt-0.5 truncate text-xs text-muted">@{currentUser.username}</p>
            </div>
          </div>

          <div className="mt-5 border-t border-border/60 pt-4">
            <Link
              className={cn(
                "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition",
                pathname === "/account" || pathname === "/account/password"
                  ? "bg-brand/8 text-brand"
                  : "text-text/80 hover:bg-surface/80 hover:text-text"
              )}
              href="/account"
            >
              <span>Account Settings</span>
              <ArrowRightIcon />
            </Link>
            <Button
              className="mt-2 w-full rounded-xl bg-surface text-text hover:bg-surface/80"
              onClick={() => void logout()}
              variant="ghost"
            >
              Keluar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 opacity-50"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
