/** Ubah nama jadi slug aman: "Bapak Andi Fitra, S.Kom" -> "bapak-andi-fitra-s-kom" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "tamu";
}

/** Suffix acak pendek supaya link tamu tidak bisa ditebak */
export function randomSuffix(len = 4): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function guestSlug(name: string): string {
  return `${slugify(name)}-${randomSuffix()}`;
}
