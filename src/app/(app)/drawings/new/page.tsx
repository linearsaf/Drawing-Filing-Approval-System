"use client";

import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { DrawingForm } from "@/components/drawings/drawing-form";

export default function NewDrawingPage() {
  return (
    <AuthGuard allowedRoles={["DRAFTER", "ADMIN"]}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Input Drawing"
          title="Buat drawing baru"
          description="Lengkapi metadata utama, nomor revisi, dan unggah file PDF untuk membuat drawing baru."
        />
        <DrawingForm mode="create" />
      </div>
    </AuthGuard>
  );
}
