import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";

import "./globals.css";
import { ClientShell } from "@/components/shared/client-shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ROVIK Operations Console",
  description: "AI-powered delivery route optimization platform"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#05080d]`}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
