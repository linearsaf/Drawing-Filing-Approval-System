"use client";

import { useDemoApp } from "@/components/providers/demo-app-provider";
import { getRoleLabel } from "@/lib/utils/permissions";

export function RoleSwitcher() {
  const { currentUser } = useDemoApp();

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-w-52 rounded-[20px] border border-border/90 bg-surface/92 px-4 py-3 shadow-inset">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Peran Aktif</p>
      <p className="mt-2 text-sm font-semibold text-text">{getRoleLabel(currentUser.role)}</p>
      <p className="mt-1 text-xs text-muted">{currentUser.username}</p>
    </div>
  );
}
