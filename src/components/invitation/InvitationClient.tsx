"use client";

import { useEffect, useRef, useState } from "react";
import Cover from "./Cover";
import MusicPlayer, { type MusicHandle } from "./MusicPlayer";
import { InvitationState } from "./InvitationState";

/**
 * Pembungkus halaman: menangani cover, autoplay musik setelah dibuka,
 * dan mencatat kunjungan tamu sekali per sesi.
 */
export default function InvitationClient({
  coverProps,
  musicUrl,
  invitationId,
  guestToken,
  children,
}: {
  coverProps: {
    guestName: string | null;
    firstNick: string;
    secondNick: string;
    coverDate: string;
    coverSalam: string | null;
  };
  musicUrl: string | null;
  invitationId: string;
  guestToken: string | null;
  children: React.ReactNode;
}) {
  const [opened, setOpened] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  useEffect(() => {
    const hero = document.getElementById("beranda");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting));
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  const tracked = useRef(false);
  const music = useRef<MusicHandle>(null);

  useEffect(() => {
    if (!opened || tracked.current || !guestToken) return;
    tracked.current = true;
    const key = `opened:${guestToken}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode: tetap kirim */
    }
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: guestToken, invitationId }),
      keepalive: true,
    }).catch(() => {});
  }, [opened, guestToken, invitationId]);

  return (
    <InvitationState.Provider value={opened}>
      <Cover
        guestName={coverProps.guestName}
        firstNick={coverProps.firstNick}
        secondNick={coverProps.secondNick}
        coverDate={coverProps.coverDate}
        coverSalam={coverProps.coverSalam}
        onOpen={() => { music.current?.play(); setOpened(true); }}
      />
      <MusicPlayer ref={music} src={musicUrl} shouldPlay={opened} />
      <div id="invitation-content" aria-hidden={!opened} inert={!opened} tabIndex={-1}>
        <aside className="desktop-cover" aria-label="Undangan pernikahan">
          <div className="desktop-cover-inner">
            <p className="eyebrow">The Wedding Of</p>
            <p className="desktop-names">{coverProps.firstNick}<span>&amp;</span>{coverProps.secondNick}</p>
            <img src="/ornaments/divider.svg" alt="" className="divider-ornament" />
            <p className="desktop-date">{coverProps.coverDate}</p>
            <p className="desktop-note">Dengan bahagia, kami mengundang Anda<br />merayakan awal perjalanan kami.</p>
          </div>
        </aside>
        {children}
        {opened && !heroVisible ? <nav className="invitation-nav" aria-label="Navigasi undangan">
          <a href="#beranda"><span aria-hidden>⌂</span>Beranda</a>
          <a href="#mempelai"><span aria-hidden>♡</span>Mempelai</a>
          <a href="#acara"><span aria-hidden>▦</span>Acara</a>
          <a href="#galeri"><span aria-hidden>▧</span>Galeri</a>
          <a href="#ucapan"><span aria-hidden>✉</span>Ucapan</a>
        </nav> : null}
      </div>
    </InvitationState.Provider>
  );
}
