import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getInvitation } from "@/lib/invitation";

const schema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(60),
  attendance: z.enum(["HADIR", "RAGU", "TIDAK_HADIR"]),
  guestCount: z.coerce.number().int().min(1).max(10).default(1),
  message: z.string().trim().min(2, "Ucapan terlalu pendek").max(500),
  token: z.string().optional().nullable(),
});

// Rate limit sederhana per IP: 5 kiriman / 10 menit
const buckets = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000;
const LIMIT = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW);
  if (arr.length >= LIMIT) {
    buckets.set(ip, arr);
    return true;
  }
  arr.push(now);
  buckets.set(ip, arr);
  if (buckets.size > 5000) buckets.clear();
  return false;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Terlalu banyak kiriman. Coba lagi beberapa menit." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Format tidak valid" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Data tidak valid" },
      { status: 400 },
    );
  }

  const invitation = await getInvitation();
  if (!invitation) {
    return NextResponse.json({ ok: false, error: "Undangan tidak ditemukan" }, { status: 404 });
  }

  const { name, attendance, guestCount, message, token } = parsed.data;

  let guest = null;
  if (token) {
    guest = await prisma.guest.findFirst({
      where: { invitationId: invitation.id, slug: token },
    });
  }

  const resolvedName = guest ? guest.name : name;
  const resolvedCount = attendance === "HADIR" ? guestCount : 1;

  // Tamu dengan link unik: satu ucapan per tamu (kirim ulang = update).
  // Pengunjung tanpa token: selalu buat ucapan baru.
  const existing = guest ? await prisma.wish.findUnique({ where: { guestId: guest.id } }) : null;

  const wish = existing
    ? await prisma.wish.update({
        where: { id: existing.id },
        data: {
          name: resolvedName,
          attendance,
          guestCount: resolvedCount,
          message,
          isVisible: true,
          createdAt: new Date(),
        },
      })
    : await prisma.wish.create({
        data: {
          invitationId: invitation.id,
          guestId: guest?.id ?? null,
          name: resolvedName,
          attendance,
          guestCount: resolvedCount,
          message,
        },
      });

  return NextResponse.json({
    ok: true,
    item: {
      id: wish.id,
      name: wish.name,
      attendance: wish.attendance,
      guestCount: wish.guestCount,
      message: wish.message,
      createdAt: wish.createdAt.toISOString(),
    },
  });
}
