import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getInvitation } from "@/lib/invitation";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const isoish = z.string().trim().optional().nullable();

const schema = z.object({
  title: z.string().max(80).optional(),
  musicUrl: z.string().max(500).optional(),
  musicTitle: z.string().max(120).optional(),
  openingSalam: z.string().max(200).optional(),
  invitationText: z.string().max(2000).optional(),
  quoteText: z.string().max(1200).optional(),
  quoteSource: z.string().max(120).optional(),
  closingText: z.string().max(1200).optional(),
  brideName: z.string().max(120).optional(),
  brideNick: z.string().max(60).optional(),
  brideParents: z.string().max(400).optional(),
  brideInstagram: z.string().max(60).optional(),
  bridePhoto: z.string().max(500).optional(),
  groomName: z.string().max(120).optional(),
  groomNick: z.string().max(60).optional(),
  groomParents: z.string().max(400).optional(),
  groomInstagram: z.string().max(60).optional(),
  groomPhoto: z.string().max(500).optional(),
  coupleOrder: z.enum(["bride-first", "groom-first"]).optional(),
  mainDate: isoish,
  akadAt: isoish,
  akadEndAt: isoish,
  resepsiAt: isoish,
  resepsiEndAt: isoish,
  venueName: z.string().max(200).optional(),
  venueAddress: z.string().max(500).optional(),
  mapsUrl: z.string().max(500).optional(),
  giftText: z.string().max(800).optional(),
  giftAddress: z.string().max(800).optional(),
  gallery: z.array(z.string().max(500)).max(40).optional(),
  giftAccounts: z
    .array(z.object({ bank: z.string().max(60), number: z.string().max(40), holder: z.string().max(80) }))
    .max(10)
    .optional(),
  storyItems: z
    .array(z.object({ title: z.string().max(120), date: z.string().max(60), text: z.string().max(800) }))
    .max(20)
    .optional(),
  invitedBy: z.array(z.string().max(200)).max(30).optional(),
});

function toDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  // datetime-local: "2026-12-12T10:00" -> anggap waktu lokal Asia/Makassar
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inv = await getInvitation();
  if (!inv) return NextResponse.json({ error: "Undangan belum ada" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid" }, { status: 400 });
  }

  const d = parsed.data;
  const data: Record<string, unknown> = {};

  const strings = [
    "title", "musicUrl", "musicTitle", "openingSalam", "invitationText", "quoteText", "quoteSource",
    "closingText", "brideName", "brideNick", "brideParents", "brideInstagram", "bridePhoto",
    "groomName", "groomNick", "groomParents", "groomInstagram", "groomPhoto", "coupleOrder",
    "venueName", "venueAddress", "mapsUrl", "giftText", "giftAddress",
  ] as const;

  for (const key of strings) {
    if (d[key] !== undefined) data[key] = d[key];
  }

  const dates = ["mainDate", "akadAt", "akadEndAt", "resepsiAt", "resepsiEndAt"] as const;
  for (const key of dates) {
    if (d[key] !== undefined) data[key] = toDate(d[key]);
  }

  if (d.gallery !== undefined) data.gallery = d.gallery.filter(Boolean);
  if (d.giftAccounts !== undefined) data.giftAccounts = d.giftAccounts;
  if (d.storyItems !== undefined) data.storyItems = d.storyItems;
  if (d.invitedBy !== undefined) data.invitedBy = d.invitedBy.filter(Boolean);

  const updated = await prisma.invitation.update({ where: { id: inv.id }, data });

  return NextResponse.json({ ok: true, slug: updated.slug });
}
