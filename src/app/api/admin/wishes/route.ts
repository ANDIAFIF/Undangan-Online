import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().min(1),
  isVisible: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const { id, isVisible } = parsed.data;
  const wish = await prisma.wish.update({
    where: { id },
    data: { ...(isVisible !== undefined ? { isVisible } : {}) },
  });
  return NextResponse.json({ ok: true, wish });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });

  await prisma.wish.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
