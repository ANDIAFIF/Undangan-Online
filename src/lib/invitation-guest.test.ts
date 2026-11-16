import assert from "node:assert/strict";
import { test } from "node:test";
import { prisma } from "./prisma";
import { getInvitationGuest } from "./invitation-guest";

test("guest links accept registered tokens and redirect tampered values", async (t) => {
  const registeredGuest = { name: "Nama dari database", slug: "tamu-abcd" };
  const originalLookup = prisma.guest.findFirst;
  const lookup = t.mock.fn(async ({ where }: { where: { invitationId: string; slug: string } }) =>
    where.invitationId === "invitation-1" && where.slug === registeredGuest.slug ? registeredGuest : null,
  );
  prisma.guest.findFirst = lookup as unknown as typeof originalLookup;
  t.after(() => { prisma.guest.findFirst = originalLookup; });

  assert.equal(await getInvitationGuest("invitation-1", undefined), null);
  assert.equal(lookup.mock.callCount(), 0);
  assert.equal(await getInvitationGuest("invitation-1", "tamu-abcd"), registeredGuest);

  for (const token of ["nama-asal", "Nama dari database", "", " ", "tamu-abcd ", ["tamu-abcd", "nama-asal"]]) {
    await assert.rejects(getInvitationGuest("invitation-1", token), (error: unknown) => {
      assert.equal((error as { digest: string }).digest, "NEXT_REDIRECT;replace;/url-tidak-valid;307;");
      return true;
    });
  }
  await assert.rejects(getInvitationGuest("different-invitation", "tamu-abcd"), /NEXT_REDIRECT/);
});
