import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DemoAppProvider } from "@/components/providers/demo-app-provider";
import { appBrand } from "@/lib/config/brand";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: appBrand.name,
  description: appBrand.description,
  icons: {
    icon: appBrand.assets.favicon,
    shortcut: appBrand.assets.favicon,
    apple: appBrand.assets.favicon
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
