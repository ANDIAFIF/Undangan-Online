import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getInvitation } from "@/lib/invitation";
import { guestSlug, slugify, randomSuffix } from "@/lib/slug";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(80),
  phone: z.string().trim().max(30).optional().nullable(),
  note: z.string().trim().max(200).optional().nullable(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(30).optional().nullable(),
  note: z.string().trim().max(200).optional().nullable(),
});

async function guard() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const inv = await getInvitation();
  if (!inv) return NextResponse.json({ error: "Undangan belum ada" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid" }, { status: 400 });
  }

  // buat slug unik di dalam undangan ini
  let slug = guestSlug(parsed.data.name);
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.guest.findFirst({ where: { invitationId: inv.id, slug } });
    if (!exists) break;
    slug = `${slugify(parsed.data.name)}-${randomSuffix(6)}`;
  }

  const guest = await prisma.guest.create({
    data: {
      invitationId: inv.id,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      note: parsed.data.note || null,
      slug,
    },
  });

  return NextResponse.json({ ok: true, guest });
}

export async function PATCH(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const { id, ...rest } = parsed.data;
  const guest = await prisma.guest.update({
    where: { id },
    data: {
      ...(rest.name !== undefined ? { name: rest.name } : {}),
      ...(rest.phone !== undefined ? { phone: rest.phone || null } : {}),
      ...(rest.note !== undefined ? { note: rest.note || null } : {}),
    },
  });

  return NextResponse.json({ ok: true, guest });
}

export async function DELETE(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });

  await prisma.guest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
