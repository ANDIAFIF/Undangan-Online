import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getInvitationGuest } from "@/lib/invitation-guest";
import { getInvitation, parseGiftAccounts, parseStoryItems, parseStringArray } from "@/lib/invitation";
import { formatDateID, formatTime } from "@/lib/format";
import Carnival from "@/components/invitation/karnaval/Carnival";
import type { WishItem } from "@/components/invitation/Guestbook";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string | string[] }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { to } = await searchParams;
  const inv = await getInvitation();
  if (!inv || inv.slug !== slug) return { title: "Undangan" };

  const guest = await getInvitationGuest(inv.id, to);
  const guestName = guest?.name ?? null;
  const couple = `${inv.brideNick} & ${inv.groomNick}`;
  const title = guestName ? `Undangan untuk ${guestName} — ${couple}` : `The Wedding Of ${couple}`;

  return {
    title,
    description: `${formatDateID(inv.mainDate)} · ${[inv.venueName, inv.venueAddress].filter(Boolean).join(", ")}`,
    openGraph: { title, description: "Kami mengundang Anda untuk hadir di hari bahagia kami.", type: "website" },
  };
}

export default async function InvitationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { to } = await searchParams;

  const inv = await getInvitation();
  if (!inv || inv.slug !== slug || !inv.isPublished) notFound();

  const guest = await getInvitationGuest(inv.id, to);
  const guestName = guest?.name ?? null;

  const wishes = await prisma.wish.findMany({
    where: { invitationId: inv.id, isVisible: true },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { id: true, name: true, attendance: true, guestCount: true, message: true, voiceId:true, sticker:true, createdAt: true },
  });

  const initialWishes: WishItem[] = wishes.map((w) => ({
    id: w.id,
    name: w.name,
    attendance: w.attendance as WishItem["attendance"],
    guestCount: w.guestCount,
    message: w.message, voiceId:w.voiceId, sticker:w.sticker,
    createdAt: w.createdAt.toISOString(),
  }));

  const gifts = parseGiftAccounts(inv.giftAccounts);
  const stories = parseStoryItems(inv.storyItems);
  const gallery = parseStringArray(inv.gallery);
  const invitedBy = parseStringArray(inv.invitedBy);

  const brideFirst = inv.coupleOrder !== "groom-first";
  const first = brideFirst
    ? { nick: inv.brideNick, full: inv.brideName, parents: inv.brideParents, ig: inv.brideInstagram, photo: inv.bridePhoto, role: "Mempelai Wanita" }
    : { nick: inv.groomNick, full: inv.groomName, parents: inv.groomParents, ig: inv.groomInstagram, photo: inv.groomPhoto, role: "Mempelai Pria" };
  const second = brideFirst
    ? { nick: inv.groomNick, full: inv.groomName, parents: inv.groomParents, ig: inv.groomInstagram, photo: inv.groomPhoto, role: "Mempelai Pria" }
    : { nick: inv.brideNick, full: inv.brideName, parents: inv.brideParents, ig: inv.brideInstagram, photo: inv.bridePhoto, role: "Mempelai Wanita" };

  const events = [
    { name: "Akad Nikah", start: inv.akadAt, end: inv.akadEndAt },
    { name: "Resepsi", start: inv.resepsiAt, end: inv.resepsiEndAt },
  ].filter((e) => e.start).map(e => ({name:e.name, date:formatDateID(e.start), time:`${formatTime(e.start)}${e.end ? ` – ${formatTime(e.end)}` : ""} WITA`}));
  const maps = inv.mapsUrl || (inv.venueAddress ? `https://maps.google.com/?q=${encodeURIComponent(inv.venueAddress)}` : null);
  return <Carnival data={{
    id:inv.id, slug:inv.slug, guestName, guestToken:guest?.slug ?? null, note:[inv.openingSalam, inv.invitationText].filter(Boolean).join("\n\n") || null,
    first, second, date:formatDateID(inv.mainDate), dateISO:inv.mainDate?.toISOString() ?? null, music:inv.musicUrl,
    opening:inv.openingSalam, introduction:inv.invitationText, quote:inv.quoteText, quoteSource:inv.quoteSource, closing:inv.closingText,
    events, venue:inv.venueName, address:inv.venueAddress, maps, gallery, stories,
    gifts, giftText:inv.giftText, giftAddress:inv.giftAddress, invitedBy, wishes:initialWishes,
  }}/>;
}
