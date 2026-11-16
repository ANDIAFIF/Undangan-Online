"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "▤" },
  { href: "/admin/tamu", label: "Daftar Tamu", icon: "☺" },
  { href: "/admin/ucapan", label: "Ucapan & RSVP", icon: "✉" },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: "⚙" },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="admin-nav">
      {ITEMS.map((it) => {
        const active = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={active ? "active" : ""}>
            <span aria-hidden>{it.icon}</span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
