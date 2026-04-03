import { UserRole } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  description: string;
}

const sharedItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", description: "Ringkasan pekerjaan" },
  { href: "/drawings", label: "Daftar Drawing", description: "Cari dan telusuri drawing" }
];

export function getNavigation(role: UserRole): NavItem[] {
  const items = [...sharedItems];

  if (role === "DRAFTER" || role === "ADMIN") {
    items.push({
      href: "/drawings/new",
      label: "Input Drawing",
      description: "Buat drawing baru"
    });
  }

  if (role === "ADMIN") {
    items.push({
      href: "/admin/users",
      label: "User Management",
      description: "Kelola user dan hak akses"
    });
  }

  return items;
}
