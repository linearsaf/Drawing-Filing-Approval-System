"use client";

import { AuthGuard } from "@/components/app/auth-guard";
import { PageHeader } from "@/components/app/page-header";
import { DrawingForm } from "@/components/drawings/drawing-form";
import { useDemoApp } from "@/components/providers/demo-app-provider";

export default function NewDrawingPage() {
  const { currentUser } = useDemoApp();

  return (
    <AuthGuard allowedRoles={["DRAFTER", "ADMIN"]}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Create Drawing"
          title="Create Drawing"
          description="Siapkan metadata, revisi awal, dan PDF dokumen dari satu form."
        />
        <DrawingForm drawnByName={currentUser?.name ?? "-"} mode="create" />
      </div>
    </AuthGuard>
  );
}
