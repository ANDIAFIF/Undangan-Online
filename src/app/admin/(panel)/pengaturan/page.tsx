import { getInvitation, parseGiftAccounts, parseStoryItems, parseStringArray } from "@/lib/invitation";
import { toDatetimeLocal } from "@/lib/format";
import SettingsForm, { type SettingsData } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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

  const initial: SettingsData = {
    slug: inv.slug,
    title: inv.title,
    theme: inv.theme,
    musicUrl: inv.musicUrl ?? "",
    musicTitle: inv.musicTitle ?? "",
    openingSalam: inv.openingSalam ?? "",
    invitationText: inv.invitationText ?? "",
    quoteText: inv.quoteText ?? "",
    quoteSource: inv.quoteSource ?? "",
    closingText: inv.closingText ?? "",
    brideName: inv.brideName,
    brideNick: inv.brideNick,
    brideParents: inv.brideParents,
    brideInstagram: inv.brideInstagram ?? "",
    bridePhoto: inv.bridePhoto ?? "",
    groomName: inv.groomName,
    groomNick: inv.groomNick,
    groomParents: inv.groomParents,
    groomInstagram: inv.groomInstagram ?? "",
    groomPhoto: inv.groomPhoto ?? "",
    coupleOrder: inv.coupleOrder,
    mainDate: toDatetimeLocal(inv.mainDate),
    akadAt: toDatetimeLocal(inv.akadAt),
    akadEndAt: toDatetimeLocal(inv.akadEndAt),
    resepsiAt: toDatetimeLocal(inv.resepsiAt),
    resepsiEndAt: toDatetimeLocal(inv.resepsiEndAt),
    venueName: inv.venueName ?? "",
    venueAddress: inv.venueAddress ?? "",
    mapsUrl: inv.mapsUrl ?? "",
    giftText: inv.giftText ?? "",
    giftAddress: inv.giftAddress ?? "",
    gallery: parseStringArray(inv.gallery),
    giftAccounts: parseGiftAccounts(inv.giftAccounts),
    storyItems: parseStoryItems(inv.storyItems),
    invitedBy: parseStringArray(inv.invitedBy),
  };

  return <SettingsForm initial={initial} />;
}
