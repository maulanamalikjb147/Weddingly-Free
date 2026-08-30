import Link from "next/link";
import AdminGuard from "@/components/admin/AdminGuard";
import Icon from "@/components/admin/Icon";
import Scanner from "@/components/admin/Scanner";

export default function AdminScannerPage() {
  return (
    <AdminGuard>
      <div style={{ position: "fixed", left: 18, top: 18, zIndex: 20 }}>
        <Link href="/admin" className="btn-pearl-capsule" style={{ textDecoration: "none" }}>
          <Icon name="arrowLeft" size={14} /> Dashboard
        </Link>
      </div>
      <Scanner />
    </AdminGuard>
  );
}
