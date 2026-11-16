import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Silakan login sebagai admin." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid." }, { status: 403 });
  if (Number(request.headers.get("content-length")) > MAX_BYTES + 65536) {
    return NextResponse.json({ error: "Maksimal 10 MB per foto." }, { status: 413 });
  }
  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Data upload tidak valid." }, { status: 400 });
  }
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Pilih foto terlebih dahulu." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Maksimal 10 MB per foto." }, { status: 413 });

  let data: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const image = sharp(input, { limitInputPixels: 40_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format) || (metadata.pages ?? 1) > 1) {
      return NextResponse.json({ error: "Gunakan foto JPG, PNG, atau WebP tanpa animasi." }, { status: 415 });
    }
    data = await image.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  } catch {
    return NextResponse.json({ error: "Foto tidak dapat dibaca. Gunakan JPG, PNG, atau WebP yang valid (maksimal 40 megapiksel)." }, { status: 415 });
  }
  try {
    const photo = await prisma.uploadedPhoto.create({ data: { data: new Uint8Array(data) }, select: { id: true } });
    return NextResponse.json({ url: `/api/photos/${photo.id}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Foto gagal disimpan. Silakan coba lagi." }, { status: 500 });
  }
}
