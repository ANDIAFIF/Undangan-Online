import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getInvitation } from "@/lib/invitation";
import GuestTable, { type GuestRow } from "@/components/admin/GuestTable";

export const dynamic = "force-dynamic";

export default async function GuestsPage() {
  const inv = await getInvitation();
  if (!inv) {
    return (
      <div className="panel">
        <div className="panel-body">
          <h1>Belum ada undangan</h1>
          <p className="b-hint">Jalankan seed dulu: <code>npm run db:seed</code></p>
          <Link className="b-btn b-primary" href="/admin">
            Kembali
          </Link>
        </div>
      </div>
    );
  }

  const guests = await prisma.guest.findMany({
    where: { invitationId: inv.id },
    orderBy: { createdAt: "desc" },
    include: { wish: { select: { attendance: true, guestCount: true } } },
  });

  const rows: GuestRow[] = guests.map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    phone: g.phone,
    note: g.note,
    openCount: g.openCount,
    firstOpenedAt: g.firstOpenedAt?.toISOString() ?? null,
    lastOpenedAt: g.lastOpenedAt?.toISOString() ?? null,
    createdAt: g.createdAt.toISOString(),
    wish: g.wish
      ? {
          attendance: g.wish.attendance as "HADIR" | "RAGU" | "TIDAK_HADIR",
          guestCount: g.wish.guestCount,
        }
      : null,
  }));

  return <GuestTable guests={rows} invitationSlug={inv.slug} />;
}
