import { prisma } from "@/lib/prisma";
import { getInvitation } from "@/lib/invitation";
import WishList, { type WishRow } from "@/components/admin/WishList";

export const dynamic = "force-dynamic";

export default async function WishesPage() {
  const inv = await getInvitation();
  if (!inv) {
    return (
      <div className="panel">
        <div className="panel-body">
          <h1>Belum ada undangan</h1>
          <p className="b-hint">Jalankan seed dulu: <code>npm run db:seed</code></p>
        </div>
      </div>
    );
  }

  const wishes = await prisma.wish.findMany({
    where: { invitationId: inv.id },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const rows: WishRow[] = wishes.map((w) => ({
    id: w.id,
    name: w.name,
    attendance: w.attendance as WishRow["attendance"],
    guestCount: w.guestCount,
    message: w.message,
    isVisible: w.isVisible,
    createdAt: w.createdAt.toISOString(),
  }));

  return <WishList wishes={rows} />;
}
