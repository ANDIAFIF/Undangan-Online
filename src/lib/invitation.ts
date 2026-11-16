import { prisma } from "./prisma";

/** Ambil undangan utama (satu baris). Null kalau belum di-seed. */
export async function getInvitation() {
  return prisma.invitation.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function getInvitationBySlug(slug: string) {
  return prisma.invitation.findUnique({ where: { slug } });
}

export type GiftAccount = { bank: string; number: string; holder: string };
export type StoryItem = { title: string; date: string; text: string };

export function parseGiftAccounts(v: unknown): GiftAccount[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({
      bank: String(x.bank ?? ""),
      number: String(x.number ?? ""),
      holder: String(x.holder ?? ""),
    }))
    .filter((g) => g.bank || g.number);
}

export function parseStoryItems(v: unknown): StoryItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({
      title: String(x.title ?? ""),
      date: String(x.date ?? ""),
      text: String(x.text ?? ""),
    }));
}

export function parseStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}
