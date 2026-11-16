import { buildIcs } from "@/lib/ics";
import { getInvitation } from "@/lib/invitation";

export const dynamic = "force-dynamic";

export async function GET() {
  const inv = await getInvitation();
  if (!inv) return new Response("Not found", { status: 404 });

  const events = [
    { title: "Akad Nikah", start: inv.akadAt, end: inv.akadEndAt ?? inv.akadAt },
    { title: "Resepsi", start: inv.resepsiAt, end: inv.resepsiEndAt ?? inv.resepsiAt },
  ].filter((e) => e.start);

  const ics = buildIcs(
    events.map((e) => ({
      title: `${e.title} — ${inv.brideNick} & ${inv.groomNick}`,
      description:
        [inv.venueName, inv.venueAddress].filter(Boolean).join(", ") +
        (inv.mapsUrl ? `\n${inv.mapsUrl}` : ""),
      location: [inv.venueName, inv.venueAddress].filter(Boolean).join(", "),
      start: e.start as Date,
      end: (e.end as Date) ?? (e.start as Date),
    })),
  );

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="undangan-${inv.slug}.ics"`,
    },
  });
}
