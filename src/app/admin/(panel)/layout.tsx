import Link from "next/link";
import { isAdmin, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import "./admin.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ok = await isAdmin();
  if (!ok) redirect("/admin/login");

  async function logout() {
    "use server";
    await destroySession();
    redirect("/admin/login");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand-mark">◆</span>
          <span>
            Undangan
            <small>Panel Admin</small>
          </span>
        </Link>

        <AdminNav />

        <form action={logout} className="admin-logout">
          <button type="submit">Keluar</button>
        </form>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
