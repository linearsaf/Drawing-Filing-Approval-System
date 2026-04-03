"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useDemoApp } from "@/components/providers/demo-app-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserRole } from "@/lib/types";

export function AuthGuard({
  children,
  allowedRoles
}: {
  children: ReactNode;
  allowedRoles?: UserRole[];
}) {
  const { ready, session, currentUser } = useDemoApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, ready, router, session]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Card className="max-w-md text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-brand">Memuat Sesi</p>
          <h2 className="mt-3 text-xl font-semibold text-text">Menyiapkan akses pengguna...</h2>
        </Card>
      </div>
    );
  }

  if (!session || !currentUser) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return (
      <Card className="max-w-2xl border-danger/15">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-danger">Access Limited</p>
        <h2 className="mt-3 text-2xl font-semibold text-text">Role ini tidak punya akses ke halaman ini</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Session aktif Anda tidak memenuhi izin yang dibutuhkan untuk membuka halaman ini.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard">
            <Button variant="secondary">Kembali ke Dashboard</Button>
          </Link>
          <Link href="/drawings">
            <Button>Lihat Daftar Drawing</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}
