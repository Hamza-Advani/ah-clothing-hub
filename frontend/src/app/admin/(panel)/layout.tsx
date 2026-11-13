"use client";
import { AdminGuard } from "@/components/admin/guard";
import { AdminDataProvider } from "@/components/admin/admin-data";
import { AdminShell } from "@/components/admin/shell";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminDataProvider>
        <AdminShell>{children}</AdminShell>
      </AdminDataProvider>
    </AdminGuard>
  );
}
