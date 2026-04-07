import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DemoAppProvider } from "@/components/providers/demo-app-provider";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Datum Signet",
  description: "Workspace pengelolaan drawing, approval, dan distribusi dokumen final.",
  icons: {
    icon: "/logo.png"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="font-sans" suppressHydrationWarning>
        <DemoAppProvider>{children}</DemoAppProvider>
      </body>
    </html>
  );
}
