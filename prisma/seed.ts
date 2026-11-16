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
      slug: "AFIFoundPutri",
      title: "The Wedding Of",
      theme: "hijau-emas",
      musicUrl: "",
      musicTitle: "Instrumental",

      brideName: "Putri Indriwayti",
      brideNick: "Putri",
      brideParents: "Putri dari Bapak Iskandar dan Ibu Darwiyah",
      brideInstagram: "",
      groomName: "Putra Kamilsyah",
      groomNick: "Putra",
      groomParents: "Putra dari Bapak Iskandar dan Ibu Darwiyah",
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
      venueName: "Gedung Serbaguna",
      venueAddress: "Jl. Contoh No. 1, Kecamatan, Kota",
      mapsUrl: "https://maps.google.com/?q=Makassar",

      storyItems: [
        { title: "Pertama Bertemu", date: "Januari 2020", text: "Ceritakan awal pertemuan kalian di sini." },
        { title: "Menjalin Hubungan", date: "Maret 2023", text: "Ceritakan perjalanan hubungan kalian di sini." },
        { title: "Lamaran", date: "September 2026", text: "Ceritakan momen lamaran kalian di sini." },
        { title: "Menikah", date: "12 Desember 2026", text: "Petualangan tidak berakhir di sini, justru baru dimulai." },
      ],
      gallery: [],
      giftAccounts: [
        { bank: "BCA", number: "1234567890", holder: "Putri Indriwayti" },
        { bank: "DANA / e-wallet", number: "081234567890", holder: "Putra Kamilsyah" },
      ],
      giftText:
        "Bagi Bapak/Ibu/Saudara/i yang ingin mengirimkan hadiah pernikahan dapat melalui virtual account atau e-wallet di bawah ini:",
      giftAddress: "",
      invitedBy: ["Keluarga Besar Kedua Mempelai"],
    },
  });

  const guests = [
    { name: "Bapak Andi Fitra Furqan", phone: "081234567890" },
    { name: "Bapak Ahmad Yusuf", phone: "081298765432" },
    { name: "Ibu Ratna Sari", phone: "" },
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
