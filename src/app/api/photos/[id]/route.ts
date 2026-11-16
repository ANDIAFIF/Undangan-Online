import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{20,40}$/.test(id)) return new Response("Foto tidak ditemukan", { status: 404 });
  const photo = await prisma.uploadedPhoto.findUnique({ where: { id }, select: { data: true } });
  if (!photo) return new Response("Foto tidak ditemukan", { status: 404 });
  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(photo.data.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
