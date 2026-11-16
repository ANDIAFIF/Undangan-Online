import { NextRequest, NextResponse } from "next/server";
import { checkPassword, createSession } from "@/lib/auth";

// batasi percobaan login
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW = 10 * 60 * 1000;
const MAX = 8;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && now - rec.first < WINDOW && rec.count >= MAX) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Tunggu 10 menit." },
      { status: 429 },
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 });
  }

  if (!body.password || !checkPassword(body.password)) {
    if (rec && now - rec.first < WINDOW) rec.count += 1;
    else attempts.set(ip, { count: 1, first: now });
    return NextResponse.json({ error: "Password salah" }, { status: 401 });
  }

  attempts.delete(ip);
  await createSession();
  return NextResponse.json({ ok: true });
}
