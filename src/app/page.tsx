import { redirect } from "next/navigation";
import { getInvitation } from "@/lib/invitation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const inv = await getInvitation();
  if (!inv) {
    return (
      <main style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ fontFamily: "Georgia, serif" }}>Undangan belum disiapkan</h1>
        <p style={{ color: "#556" }}>Jalankan seed database dulu: <code>npm run db:seed</code></p>
      </main>
    );
  }
  redirect(`/${inv.slug}`);
}
