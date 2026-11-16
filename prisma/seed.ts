import { PrismaClient } from "@prisma/client";
import { guestSlug } from "../src/lib/slug";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.invitation.findFirst();
  if (existing) {
    console.log("Undangan sudah ada, seed dilewati:", existing.slug);
    return;
  }

  const inv = await prisma.invitation.create({
    data: {
      slug: "demo-makassar",
      title: "The Wedding Of",
      theme: "hijau-emas",
      musicUrl: "",
      musicTitle: "Instrumental",

      brideName: "Mempelai Wanita Demo",
      brideNick: "Wanita",
      brideParents: "Putri dari Bapak Contoh dan Ibu Contoh",
      brideInstagram: "",
      groomName: "Mempelai Pria Demo",
      groomNick: "Pria",
      groomParents: "Putra dari Bapak Demo dan Ibu Demo",
      groomInstagram: "",

      openingSalam: "بسم الله الرحمن الرحيم",
      invitationText:
        "Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i serta kerabat sekalian untuk menghadiri acara pernikahan kami.",
      quoteText:
        "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.",
      quoteSource: "QS. Ar-Rum: 21",
      closingText:
        "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restunya. Terima kasih.",

      mainDate: new Date("2026-12-12T10:00:00+08:00"),
      akadAt: new Date("2026-12-12T10:00:00+08:00"),
      akadEndAt: new Date("2026-12-12T11:30:00+08:00"),
      resepsiAt: new Date("2026-12-12T11:30:00+08:00"),
      resepsiEndAt: new Date("2026-12-12T16:00:00+08:00"),
      venueName: "Gedung Contoh (Dummy)",
      venueAddress: "Alamat contoh, Makassar (bukan lokasi acara nyata)",
      mapsUrl: "https://maps.google.com/?q=Makassar",

      storyItems: [
        { title: "Pertama Bertemu", date: "Januari 2020", text: "Ceritakan awal pertemuan kalian di sini." },
        { title: "Menjalin Hubungan", date: "Maret 2023", text: "Ceritakan perjalanan hubungan kalian di sini." },
        { title: "Lamaran", date: "September 2026", text: "Ceritakan momen lamaran kalian di sini." },
        { title: "Menikah", date: "12 Desember 2026", text: "Petualangan tidak berakhir di sini, justru baru dimulai." },
      ],
      gallery: [],
      giftAccounts: [],
      giftText:
        "Bagi Bapak/Ibu/Saudara/i yang ingin mengirimkan hadiah pernikahan dapat melalui virtual account atau e-wallet di bawah ini:",
      giftAddress: "",
      invitedBy: ["Keluarga Besar Kedua Mempelai"],
    },
  });

  const guests = [
    { name: "Tamu Contoh Satu", phone: "" },
    { name: "Tamu Contoh Dua", phone: "" },
    { name: "Tamu Contoh Tiga", phone: "" },
  ];

  for (const g of guests) {
    const guest = await prisma.guest.create({
      data: { invitationId: inv.id, name: g.name, phone: g.phone || null, slug: guestSlug(g.name) },
    });
    console.log("tamu:", guest.name, "->", `/${inv.slug}?to=${guest.slug}`);
  }

  const inv2 = await prisma.guest.findFirst({ where: { invitationId: inv.id } });
  if (inv2) {
    await prisma.wish.create({
      data: {
        invitationId: inv.id,
        guestId: inv2.id,
        name: inv2.name,
        attendance: "HADIR",
        guestCount: 2,
        message: "Selamat menempuh hidup baru, semoga menjadi keluarga yang sakinah, mawaddah, warahmah.",
      },
    });
  }
  console.log("Seed selesai. Undangan:", `/${inv.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
