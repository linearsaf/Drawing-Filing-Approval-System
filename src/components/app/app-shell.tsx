"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import { getNavigation } from "@/lib/config/navigation";
import { appBrand } from "@/lib/config/brand";
import { cn } from "@/lib/utils/cn";
import { getRoleLabel } from "@/lib/utils/permissions";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { BrandLogo } from "@/components/app/brand-logo";
import { NotificationBell } from "@/components/app/notification-bell";
import { RoleSwitcher } from "@/components/app/role-switcher";
import { Card } from "@/components/ui/card";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useDemoApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };
    if (isSidebarOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (!currentUser) {
    return <>{children}</>;
  }

  const navigation = getNavigation(currentUser.role);

  return (
    <div className="min-h-screen app-grid">
      <div className="mx-auto flex min-h-screen max-w-[1540px] flex-col xl:flex-row xl:gap-5 xl:px-6 xl:py-4">

        {/* Mobile Header */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/40 bg-white/95 px-3 shadow-sm backdrop-blur-md xl:hidden">
          <div className="flex items-center gap-2.5">
            <button
              aria-label="Open navigation menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-text hover:bg-panel/60 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[1.2rem] w-[1.2rem] xl:h-[1.15rem] xl:w-[1.15rem]"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M9 3v18"></path></svg>
            </button>
            <BrandLogo className="-mb-1 h-auto w-[128px] sm:w-[138px]" height={30} width={138} />
          </div>
          <div className="flex items-center gap-0.5">
            <NotificationBell />
            <RoleSwitcher />
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 xl:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-[80%] max-w-[300px] transform transition-transform duration-300 ease-in-out xl:static xl:block xl:w-[19rem] xl:max-w-none xl:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <Card className="sticky top-0 flex h-full xl:h-auto flex-col overflow-y-auto overflow-x-hidden border-transparent bg-graphite rounded-none shadow-none xl:top-4 xl:rounded-xl xl:shadow-[0_8px_20px_rgba(17,24,39,0.08)] p-6 text-white">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand" />

            {/* Close button inside sidebar for mobile */}
            <button
              className="absolute right-4 top-4 p-2 text-white/70 hover:text-white xl:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-[1.2rem] w-[1.2rem] xl:h-[1.15rem] xl:w-[1.15rem]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M15 3v18"></path><path d="m10 15-3-3 3-3"></path></svg>
            </button>

            <div className="mb-8 mt-2 xl:mt-0">
              <BrandLogo
                className="h-auto w-[188px] sm:w-[206px] xl:w-[220px]"
                height={48}
                priority
                variant="dark"
                width={220}
              />
              <h1 className="mt-4 text-[1.75rem] font-semibold tracking-[-0.02em]">
                Drawing Control Console
              </h1>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Kelola drawing, approval, revisi, dan distribusi dokumen dalam satu alur kerja.
              </p>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.24em] text-white/52">
                {appBrand.tagline}
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

          </Card>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex min-h-[calc(100vh-2rem)] flex-col xl:rounded-[28px] xl:border xl:border-border/70 xl:bg-white/72 xl:shadow-panel xl:backdrop-blur-sm">
            <div className="hidden mb-7 xl:flex flex-col gap-4 border-b border-border/75 pb-5 p-5 xl:flex-row xl:items-center xl:justify-between">
              <div><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand">Workspace</p></div>
              <div className="flex items-center gap-3">
                <NotificationBell />
                <RoleSwitcher />
              </div>
            </div>
            <main className="flex-1 px-3 py-3 sm:px-4 xl:px-5 xl:pb-5">{children}</main>
            <footer className="mt-8 border-t border-border/50 px-1 pb-1 pt-2 text-right sm:px-2">
              <p className="text-[11px] text-muted/80">
                Pengembang app{" "}
                <a
                  className="font-semibold text-brand/90 transition hover:text-brand"
                  href="https://linearsaf.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  {appBrand.owner}
                </a>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
