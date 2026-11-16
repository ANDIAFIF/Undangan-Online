import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/** Only registered guest links may personalize an invitation. */
export async function getInvitationGuest(invitationId: string, token: string | string[] | undefined) {
  if (token === undefined) return null;
  if (typeof token !== "string" || !token.trim()) redirect("/url-tidak-valid");

  const guest = await prisma.guest.findFirst({ where: { invitationId, slug: token } });
  if (!guest) redirect("/url-tidak-valid");
  return guest;
}
