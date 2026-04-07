"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDemoApp } from "@/components/providers/demo-app-provider";
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
          "relative flex h-12 w-12 items-center justify-center rounded-full border transition",
          isOpen
            ? "border-brand/40 bg-brand/10 text-brand shadow-inset"
            : "border-border/85 bg-surface/94 text-text hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
        )}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <UserIcon />
        <span className="sr-only">Menu pengguna</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-64 origin-top-right rounded-[24px] border border-border/85 bg-white p-5 shadow-xl animate-in fade-in zoom-in duration-150">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Peran</p>
            <p className="mt-2.5 text-sm font-semibold text-text">{getRoleLabel(currentUser.role)}</p>
            <p className="mt-1 text-xs text-muted">{currentUser.username}</p>
          </div>

          <div className="mt-5 border-t border-border/60 pt-4">
            <Link
              className={cn(
                "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition",
                pathname === "/account/password"
                  ? "bg-brand/8 text-brand"
                  : "text-text/80 hover:bg-surface/80 hover:text-text"
              )}
              href="/account/password"
            >
              <span>Ubah password</span>
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

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[1.2rem] w-[1.2rem]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
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
