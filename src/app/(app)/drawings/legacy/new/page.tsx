"use client";

import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { LegacyDrawingForm } from "@/components/drawings/legacy-drawing-form";
import { useDemoApp } from "@/components/providers/demo-app-provider";

export default function NewLegacyDrawingPage() {
  const { currentUser } = useDemoApp();

  return (
    <AuthGuard allowedRoles={["DRAFT_LEADER", "ADMIN"]}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Upload Old Drawing"
          title="Upload Old Drawing"
          description="Import drawing lama yang approval wet sign-nya sudah selesai sebelum sistem ini digunakan. Dokumen akan langsung masuk completed tanpa melewati check dan approval digital."
        />
        <LegacyDrawingForm uploaderName={currentUser?.name ?? "-"} />
      </div>
    </AuthGuard>
  );
}
