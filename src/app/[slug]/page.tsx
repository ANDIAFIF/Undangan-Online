import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getInvitationGuest } from "@/lib/invitation-guest";
import { getInvitation, parseGiftAccounts, parseStoryItems, parseStringArray } from "@/lib/invitation";
import { formatDateID, formatTime } from "@/lib/format";
import MotionHero from "@/components/invitation/MotionHero";
import Reveal from "@/components/invitation/Reveal";
import InvitationClient from "@/components/invitation/InvitationClient";
import Countdown from "@/components/invitation/Countdown";
import Gallery from "@/components/invitation/Gallery";
import CopyButton from "@/components/invitation/CopyButton";
import Guestbook, { type WishItem } from "@/components/invitation/Guestbook";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string | string[] }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { to } = await searchParams;
  const inv = await getInvitation();
  if (!inv || inv.slug !== slug) return { title: "Undangan" };

  const guest = await getInvitationGuest(inv.id, to);
  const guestName = guest?.name ?? null;
  const couple = `${inv.brideNick} & ${inv.groomNick}`;
  const title = guestName ? `Undangan untuk ${guestName} — ${couple}` : `The Wedding Of ${couple}`;

  return {
    title,
    description: `${formatDateID(inv.mainDate)} · ${[inv.venueName, inv.venueAddress].filter(Boolean).join(", ")}`,
    openGraph: { title, description: "Kami mengundang Anda untuk hadir di hari bahagia kami.", type: "website" },
  };
}

export default async function InvitationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { to } = await searchParams;

  const inv = await getInvitation();
  if (!inv || inv.slug !== slug || !inv.isPublished) notFound();

  const guest = await getInvitationGuest(inv.id, to);
  const guestName = guest?.name ?? null;

  const wishes = await prisma.wish.findMany({
    where: { invitationId: inv.id, isVisible: true },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { id: true, name: true, attendance: true, guestCount: true, message: true, createdAt: true },
  });

  const initialWishes: WishItem[] = wishes.map((w) => ({
    id: w.id,
    name: w.name,
    attendance: w.attendance as WishItem["attendance"],
    guestCount: w.guestCount,
    message: w.message,
    createdAt: w.createdAt.toISOString(),
  }));

  const gifts = parseGiftAccounts(inv.giftAccounts);
  const stories = parseStoryItems(inv.storyItems);
  const gallery = parseStringArray(inv.gallery);
  const invitedBy = parseStringArray(inv.invitedBy);

  const brideFirst = inv.coupleOrder !== "groom-first";
  const first = brideFirst
    ? { nick: inv.brideNick, full: inv.brideName, parents: inv.brideParents, ig: inv.brideInstagram, photo: inv.bridePhoto, role: "Mempelai Wanita" }
    : { nick: inv.groomNick, full: inv.groomName, parents: inv.groomParents, ig: inv.groomInstagram, photo: inv.groomPhoto, role: "Mempelai Pria" };
  const second = brideFirst
    ? { nick: inv.groomNick, full: inv.groomName, parents: inv.groomParents, ig: inv.groomInstagram, photo: inv.groomPhoto, role: "Mempelai Pria" }
    : { nick: inv.brideNick, full: inv.brideName, parents: inv.brideParents, ig: inv.brideInstagram, photo: inv.bridePhoto, role: "Mempelai Wanita" };

  const photoFirst = first.photo || "/img/placeholder-portrait.svg";
  const photoSecond = second.photo || "/img/placeholder-portrait.svg";

  const events = [
    { name: "Akad Nikah", start: inv.akadAt, end: inv.akadEndAt },
    { name: "Resepsi", start: inv.resepsiAt, end: inv.resepsiEndAt },
  ].filter((e) => e.start);

  const mapsUrl = inv.mapsUrl || (inv.venueAddress ? `https://maps.google.com/?q=${encodeURIComponent(inv.venueAddress)}` : null);

  return (
    <InvitationClient
      coverProps={{
        guestName,
        firstNick: first.nick,
        secondNick: second.nick,
        coverDate: formatDateID(inv.mainDate),
        coverSalam: inv.openingSalam,
      }}
      musicUrl={inv.musicUrl || null}
      invitationId={inv.id}
      guestToken={guest?.slug ?? null}
    >
      <main className="invitation">
        {/* ── HERO ─────────────────────────────── */}
        <MotionHero firstNick={first.nick} secondNick={second.nick} date={formatDateID(inv.mainDate)} />

        {/* ── MEMPELAI ─────────────────────────── */}
        <section className="section section--light" id="mempelai">
          <div className="section-inner">
            <Reveal>
              <p className="eyebrow">Bride &amp; Groom</p>
              <h2 className="section-title">Kedua Mempelai</h2>
              {inv.openingSalam ? <p className="section-text" style={{ marginTop: "1rem" }}>{inv.openingSalam}</p> : null}
              {inv.invitationText ? <p className="section-text" style={{ marginTop: "1rem" }}>{inv.invitationText}</p> : null}
            </Reveal>

            <div className="couple-wrap">
              <Reveal variant="zoom-out">
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="person-photo" src={photoFirst} alt={first.nick} />
                  <div className="person-details">
                    <h3 className="person-name">{first.nick}</h3>
                    <p className="person-full">{first.full}</p>
                    <p className="person-parents">{first.parents}</p>
                  </div>
                  {first.ig ? (
                    <a
                      className="btn-ig"
                      href={`https://instagram.com/${first.ig.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Instagram
                    </a>
                  ) : null}
                </div>
              </Reveal>

              <Reveal variant="zoom-in" delay={120}>
                <span className="couple-and">&</span>
              </Reveal>

              <Reveal variant="zoom-out" delay={180}>
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="person-photo" src={photoSecond} alt={second.nick} />
                  <div className="person-details">
                    <h3 className="person-name">{second.nick}</h3>
                    <p className="person-full">{second.full}</p>
                    <p className="person-parents">{second.parents}</p>
                  </div>
                  {second.ig ? (
                    <a
                      className="btn-ig"
                      href={`https://instagram.com/${second.ig.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Instagram
                    </a>
                  ) : null}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── COUNTDOWN ────────────────────────── */}
        <section className="section section--dark">
          <div className="section-inner">
            <Reveal>
              <p className="eyebrow">Save The Date</p>
              <h2 className="section-title">Menuju Hari Bahagia</h2>
              <Countdown dateISO={(inv.mainDate ?? new Date()).toISOString()} />
              <p className="section-text" style={{ marginTop: "1.4rem" }}>
                {formatDateID(inv.mainDate)}
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── QUOTE ────────────────────────────── */}
        {inv.quoteText ? (
          <section className="section section--dark" style={{ paddingTop: 0 }}>
            <div className="section-inner">
              <Reveal>
                <span className="quote-mark" aria-hidden>
                  &ldquo;
                </span>
                <p className="quote-text">{inv.quoteText}</p>
                {inv.quoteSource ? <p className="quote-source">{inv.quoteSource}</p> : null}
                {inv.invitationText ? (
                  <p className="section-text" style={{ marginTop: "1.6rem" }}>
                    {inv.invitationText}
                  </p>
                ) : null}
              </Reveal>
            </div>
          </section>
        ) : null}

        {/* ── ACARA ────────────────────────────── */}
        <section className="section section--light" id="acara">
          <div className="section-inner">
            <Reveal>
              <p className="eyebrow">Wedding Event</p>
              <h2 className="section-title">Detail Acara</h2>
              <img src="/ornaments/divider.svg" alt="" aria-hidden className="divider-ornament" />
            </Reveal>

            {events.length === 0 ? (
              <p className="section-text">Detail acara akan segera diumumkan.</p>
            ) : (
              events.map((e, i) => (
                <Reveal variant="zoom-out" key={e.name} delay={i * 100} className="event-reveal">
                  <div className="event-card">
                    <div className="event-name">{e.name}</div>
                    <div className="event-date">{formatDateID(e.start)}</div>
                    <div className="event-time">
                      {formatTime(e.start)}
                      {e.end ? ` – ${formatTime(e.end)} WITA` : ""}
                    </div>
                    {inv.venueName ? (
                      <div className="event-venue">
                        <strong style={{ color: "#22463b" }}>{inv.venueName}</strong>
                        {inv.venueAddress ? <div>{inv.venueAddress}</div> : null}
                      </div>
                    ) : null}
                  </div>
                </Reveal>
              ))
            )}

            <Reveal delay={80}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".55rem", justifyContent: "center", marginTop: "1.5rem" }}>
                {mapsUrl ? (
                  <a className="btn-solid" href={mapsUrl} target="_blank" rel="noreferrer noopener">
                    Lihat Lokasi
                  </a>
                ) : null}
                <a className="btn-ghost" href="/api/calendar">
                  Simpan ke Kalender
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── LOVE STORY ───────────────────────── */}
        {stories.length > 0 ? (
          <section className="section section--light" id="story" style={{ paddingTop: 0 }}>
            <div className="section-inner">
              <Reveal>
                <p className="eyebrow">Our Journey</p>
                <h2 className="section-title">Love Story</h2>
              </Reveal>
              <div className="timeline">
                {stories.map((s, i) => (
                  <Reveal key={`${s.title}-${i}`} delay={i * 80}>
                    <div className="tl-item">
                      <p className="tl-date">{s.date}</p>
                      <h3 className="tl-title">{s.title}</h3>
                      <p className="tl-text">{s.text}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* ── GALERI ───────────────────────────── */}
        <section className="section section--light" id="galeri" style={{ paddingTop: 0 }}>
          <div className="section-inner">
            <Reveal>
              <p className="eyebrow">Our Moments</p>
              <h2 className="section-title">Galeri Foto</h2>
              <img src="/ornaments/divider.svg" alt="" aria-hidden className="divider-ornament" />
            </Reveal>
            <Reveal variant="zoom-out" delay={80}>
              <Gallery images={gallery} />
            </Reveal>
          </div>
        </section>

        {/* ── GIFT ─────────────────────────────── */}
        {gifts.length > 0 || inv.giftAddress ? (
          <section className="section section--light" id="gift" style={{ paddingTop: 0 }}>
            <div className="section-inner">
              <Reveal>
                <p className="eyebrow">Wedding Gift</p>
                <h2 className="section-title">Tanda Kasih</h2>
                <p className="section-text" style={{ marginTop: ".6rem" }}>
                  {inv.giftText ||
                    "Bagi Bapak/Ibu/Saudara/i yang ingin mengirimkan hadiah pernikahan dapat melalui virtual account atau e-wallet di bawah ini:"}
                </p>
              </Reveal>

              <div style={{ marginTop: "1.4rem" }}>
                {gifts.map((g, i) => (
                  <Reveal variant="zoom-out" key={`${g.bank}-${i}`} delay={i * 70} className="gift-reveal">
                    <div className="gift-card">
                      <div style={{ minWidth: 0 }}>
                        <div className="gift-bank">{g.bank}</div>
                        <div className="gift-number">{g.number}</div>
                        <div className="gift-holder">{g.holder}</div>
                      </div>
                      <CopyButton value={g.number.replace(/\s+/g, "")} />
                    </div>
                  </Reveal>
                ))}

                {inv.giftAddress ? (
                  <Reveal delay={90}>
                    <div className="gift-address">
                      <div className="gift-bank" style={{ marginBottom: ".3rem" }}>
                        Alamat Lengkap Tujuan
                      </div>
                      <p style={{ whiteSpace: "pre-line" }}>{inv.giftAddress}</p>
                      <div style={{ marginTop: ".6rem" }}>
                        <CopyButton value={inv.giftAddress} label="Salin Alamat" />
                      </div>
                    </div>
                  </Reveal>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {/* ── RSVP + UCAPAN ────────────────────── */}
        <section className="section section--dark" id="ucapan">
          <div className="section-inner">
            <Reveal>
              <p className="eyebrow">Wishes</p>
              <h2 className="section-title">Ucapan &amp; Doa</h2>
              <p className="section-text" style={{ marginTop: ".5rem" }}>
                Kehadiran dan doa Anda sangat berarti bagi kami.
              </p>
            </Reveal>
            <Guestbook initial={initialWishes} guestName={guestName} guestToken={guest?.slug ?? null} />
          </div>
        </section>

        {/* ── TURUT MENGUNDANG + CLOSING ───────── */}
        <section className="section section--light" id="closing">
          <div className="section-inner">
            <Reveal>
              {inv.closingText ? <p className="section-text">{inv.closingText}</p> : null}
              <p className="script" style={{ fontSize: "2.1rem", color: "#22463b", marginTop: "1rem" }}>
                {first.nick} &amp; {second.nick}
              </p>
            </Reveal>

            {invitedBy.length > 0 ? (
              <Reveal delay={90}>
                <div style={{ marginTop: "2.4rem" }}>
                  <p className="eyebrow">Turut Mengundang</p>
                  <p className="invited-line" style={{ marginTop: ".4rem", whiteSpace: "pre-line" }}>
                    {invitedBy.join("\n")}
                  </p>
                </div>
              </Reveal>
            ) : null}
          </div>
        </section>

        <footer className="section--dark footer-credit" style={{ padding: "2.2rem 1rem" }}>
          Digital Invitation · {first.nick} &amp; {second.nick}
        </footer>
      </main>
    </InvitationClient>
  );
}
