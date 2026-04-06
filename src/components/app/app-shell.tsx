"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { getNavigation } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import { getRoleLabel } from "@/lib/utils/permissions";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { NotificationBell } from "@/components/app/notification-bell";
import { RoleSwitcher } from "@/components/app/role-switcher";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { currentUser, logout } = useDemoApp();

  if (!currentUser) {
    return <>{children}</>;
  }

  const navigation = getNavigation(currentUser.role);

  return (
    <div className="min-h-screen app-grid">
      <div className="mx-auto flex min-h-screen max-w-[1540px] flex-col gap-5 px-4 py-4 xl:flex-row xl:px-6">
        <aside className="xl:w-[19rem]">
          <Card className="sticky top-4 overflow-hidden border-transparent bg-graphite text-white shadow-[0_8px_20px_rgba(17,24,39,0.08)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
            <div className="mb-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-white/60">
                Drawing Management
              </p>
              <h1 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.02em]">
                Filing & Approval Console
              </h1>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Kelola drawing, approval, revisi, dan distribusi dokumen dalam satu alur kerja.
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Pengguna Aktif</p>
              <p className="mt-2 text-lg font-semibold">{currentUser.name}</p>
              <p className="text-sm text-white/65">{getRoleLabel(currentUser.role)}</p>
            </div>

            <nav className="mt-8 space-y-2">
              {navigation.map((item) => {
                const active =
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    className={cn(
                      "block rounded-[20px] border px-4 py-3 transition",
                      active
                        ? "border-brand/70 bg-brand text-white shadow-[0_10px_30px_rgba(53,85,154,0.24)]"
                        : "border-white/10 bg-white/0 text-white/78 hover:border-white/20 hover:bg-white/6 hover:text-white"
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-inherit/80">{item.description}</p>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 grid gap-3">
              <Button className="w-full bg-white/10 hover:bg-white/15" onClick={() => void logout()}>
                Keluar
              </Button>
              <Link
                className={cn(
                  "text-center text-xs text-white/58 transition hover:text-white/82",
                  pathname === "/account/password" ? "text-white/88" : undefined
                )}
                href="/account/password"
              >
                Ubah password
              </Link>
            </div>
          </Card>
        </aside>

        <div className="flex-1">
          <div className="flex min-h-[calc(100vh-2rem)] flex-col rounded-[28px] border border-border/70 bg-white/72 p-5 shadow-panel backdrop-blur-sm">
            <div className="mb-7 flex flex-col gap-4 border-b border-border/75 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand">Workspace</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Akses menu dan informasi disesuaikan dengan peran aktif.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <NotificationBell />
                <RoleSwitcher />
              </div>
            </div>
            <main className="flex-1">{children}</main>
            <footer className="mt-8 border-t border-border/50 pt-3 text-right">
              <p className="text-[11px] text-muted/80">
                Pengembang app{" "}
                <a
                  className="font-semibold text-brand/90 transition hover:text-brand"
                  href="https://linearsaf.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  LinearSAF
                </a>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
