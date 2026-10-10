import type { Metadata } from "next";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import "@/styles/admin-design-system.css";

export const metadata: Metadata = {
  title: "EFSW Admin Console",
  description: "Administrative control centre for Eurasia Forum South-West",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="admin-console">
        <AdminLayoutClient>{children}</AdminLayoutClient>
      </body>
    </html>
  );
}
