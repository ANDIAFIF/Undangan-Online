import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({ slug: z.string().min(1), invitationId: z.string().min(1) });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const now = new Date();
  const guest = await prisma.guest.findFirst({
    where: { invitationId: parsed.data.invitationId, slug: parsed.data.slug },
    select: { id: true, firstOpenedAt: true },
  });

  if (!guest) return NextResponse.json({ ok: false }, { status: 404 });

  await prisma.guest.update({
    where: { id: guest.id },
    data: {
      openCount: { increment: 1 },
      lastOpenedAt: now,
      ...(guest.firstOpenedAt ? {} : { firstOpenedAt: now }),
    },
  });

  return NextResponse.json({ ok: true });
}
